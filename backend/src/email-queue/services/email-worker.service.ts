import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import { EmailEvent, EmailEventType } from '../types/email-event.types';
import { EmailService } from '../../notifications/services/email.service';
import { EmailTemplateService } from '../../notifications/services/email-template.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FooterSettingsService } from '../../footer-settings/footer-settings.service';
import { EmailQueueConfigService } from './email-queue-config.service';
import { EmailAttachmentService } from '../../pdf-generator/services/email-attachment.service';
import { BusinessInfoService } from '../../common/services/business-info.service';
import { CONSTANTS, OrderStatus, PaymentStatus, getOrderStatusMessage, getPaymentStatusMessage } from '@alacraft/shared';
import Redis from 'ioredis';

/**
 * Email Worker Service
 *
 * Background worker that processes email events from the queue.
 * Handles different email types, retry logic, and error classification.
 */
@Injectable()
export class EmailWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailWorker.name);
  private worker: Worker;
  private monitoringService: any; // Will be injected after module initialization
  private redisConnection: Redis;
  private isShuttingDown = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectBaseDelay: number;
  private reconnectMaxDelay: number;
  private gracefulShutdownTimeout: number;
  private processingJobs = new Set<string>(); // Track jobs being processed for exactly-once guarantee
  private deliveredEmails = new Map<string, { timestamp: Date; messageId?: string }>(); // Track delivered emails to prevent duplicates
  private readonly deliveryTrackingTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    private queueConfigService: EmailQueueConfigService,
    private configService: ConfigService,
    private emailService: EmailService,
    private emailTemplateService: EmailTemplateService,
    private prisma: PrismaService,
    private footerSettingsService: FooterSettingsService,
    @Inject(forwardRef(() => EmailAttachmentService))
    private emailAttachmentService: EmailAttachmentService,
    private businessInfoService: BusinessInfoService,
  ) {
    // Get configuration from centralized config service
    const resilienceConfig = this.queueConfigService.getResilienceConfig();
    this.maxReconnectAttempts = resilienceConfig.maxReconnectAttempts;
    this.reconnectBaseDelay = resilienceConfig.reconnectBaseDelay;
    this.reconnectMaxDelay = resilienceConfig.reconnectMaxDelay;
    this.gracefulShutdownTimeout = resilienceConfig.shutdownTimeout;
  }

  /**
   * Set monitoring service (called by module after initialization to avoid circular dependency)
   */
  setMonitoringService(monitoringService: any): void {
    this.monitoringService = monitoringService;
  }

  /**
   * Initialize the BullMQ worker with enhanced error handling and resilience
   * Implements requirements 7.2, 7.3, 7.4, 7.5 for crash recovery and resilience
   */
  onModuleInit() {
    this.initializeWorkerWithResilience();
  }

  /**
   * Initialize worker with comprehensive resilience features
   */
  private async initializeWorkerWithResilience(): Promise<void> {
    // Get configuration from centralized config service
    const redisConfig = this.queueConfigService.getRedisConfig();
    const workerConfig = this.queueConfigService.getWorkerConfig();
    const resilienceConfig = this.queueConfigService.getResilienceConfig();

    // Create resilient Redis connection with exponential backoff
    const connectionOptions: ConnectionOptions = {
      host: redisConfig.host,
      port: redisConfig.port,
      // Enhanced Redis connection options for resilience
      enableReadyCheck: false,
      maxRetriesPerRequest: null, // Required by BullMQ
      lazyConnect: true,
      // Connection timeout and keepalive - configurable for reliability
      connectTimeout: resilienceConfig.connectTimeout,
      commandTimeout: resilienceConfig.commandTimeout,
      // Automatic reconnection with exponential backoff
      reconnectOnError: (err) => {
        this.logger.warn(`Redis connection error, attempting reconnect: ${err.message}`);
        return true; // Always attempt to reconnect
      },
    };

    // Initialize dedicated Redis connection for monitoring
    // Use a separate connection to avoid interfering with BullMQ's connection management
    this.redisConnection = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      lazyConnect: true, // Lazy connect for monitoring connection
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      connectTimeout: resilienceConfig.connectTimeout,
      commandTimeout: resilienceConfig.commandTimeout,
      reconnectOnError: (err) => {
        this.logger.warn(`Redis connection error, attempting reconnect: ${err.message}`);
        return true;
      },
    });
    this.setupRedisConnectionHandlers();

    // Initialize BullMQ worker with enhanced configuration
    this.worker = new Worker(
      'email-events',
      async (job: Job<EmailEvent>) => {
        return this.processEmailEventWithResilience(job);
      },
      {
        connection: connectionOptions,
        concurrency: workerConfig.concurrency, // Configurable concurrency
        limiter: {
          max: workerConfig.rateLimitMax, // Configurable rate limiting
          duration: workerConfig.rateLimitDuration, // Per minute
        },
        // Enhanced worker options for resilience
        stalledInterval: 30000, // Check for stalled jobs every 30 seconds
        maxStalledCount: 1, // Max times a job can be stalled before failed
        // Exactly-once processing settings (configurable)
        removeOnComplete: {
          age: this.queueConfigService.getQueueConfig().completedRetentionAge, // Keep completed jobs (configurable)
          count: this.queueConfigService.getQueueConfig().completedRetentionCount, // Keep last N completed jobs (configurable)
        },
        removeOnFail: {
          age: this.queueConfigService.getQueueConfig().failedRetentionAge, // Keep failed jobs (configurable)
          count: this.queueConfigService.getQueueConfig().failedRetentionCount, // Keep last N failed jobs (configurable)
        },
      }
    );

    this.setupWorkerEventHandlers();

    this.logger.log(
      `Email worker initialized with resilience features | ` +
      `Concurrency: ${workerConfig.concurrency} | ` +
      `Rate limit: ${workerConfig.rateLimitMax}/${workerConfig.rateLimitDuration}ms | ` +
      `Graceful shutdown timeout: ${this.gracefulShutdownTimeout}ms`
    );
  }

  /**
   * Setup Redis connection event handlers for resilience
   */
  private setupRedisConnectionHandlers(): void {
    this.redisConnection.on('connect', () => {
      this.logger.log('Redis connection established');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });

    this.redisConnection.on('ready', () => {
      this.logger.log('Redis connection ready for commands');
    });

    this.redisConnection.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
      this.handleRedisConnectionError(error);
    });

    this.redisConnection.on('close', () => {
      if (!this.isShuttingDown) {
        this.logger.warn('Redis connection closed unexpectedly');
        this.attemptRedisReconnection();
      } else {
        this.logger.log('Redis connection closed during shutdown');
      }
    });

    this.redisConnection.on('reconnecting', (delay: number) => {
      this.logger.log(`Redis reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    });

    this.redisConnection.on('end', () => {
      if (!this.isShuttingDown) {
        this.logger.warn('Redis connection ended unexpectedly');
      }
    });
  }

  /**
   * Setup worker event handlers for comprehensive monitoring and resilience
   */
  private setupWorkerEventHandlers(): void {
    // Enhanced event listeners for comprehensive monitoring
    this.worker.on('completed', (job) => {
      const processingTime = job.finishedOn ? job.finishedOn - job.processedOn! : 'unknown';

      this.logger.log(
        `[${job.id}] Email completed: ${job.data.type} | ` +
        `Processing time: ${processingTime}ms | ` +
        `Attempts: ${job.attemptsMade + 1}`
      );

      // Log structured completion event for monitoring
      if (this.monitoringService) {
        this.monitoringService.logEventLifecycle('completed', {
          jobId: job.id,
          eventType: job.data.type,
          locale: job.data.locale,
          attemptNumber: job.attemptsMade + 1,
          processingTime: typeof processingTime === 'number' ? processingTime : undefined,
          metadata: {
            finishedOn: job.finishedOn,
            processedOn: job.processedOn,
          },
        });
      }
    });

    this.worker.on('failed', (job, error) => {
      const isMaxRetries = job && job.attemptsMade >= (job.opts.attempts || 5) - 1;
      const isPermanent = error?.message?.startsWith('PERMANENT_ERROR:');

      this.logger.error(
        `[${job?.id}] Email failed: ${job?.data?.type} | ` +
        `Error: ${error instanceof Error ? error.message : error} | ` +
        `Attempts: ${job ? job.attemptsMade + 1 : 'unknown'} | ` +
        `Status: ${isPermanent ? 'PERMANENT' : isMaxRetries ? 'MAX_RETRIES' : 'WILL_RETRY'}`
      );

      // Log structured failure event for monitoring
      if (this.monitoringService && job) {
        const phase = isPermanent || isMaxRetries ? 'dead_letter' : 'failed';
        this.monitoringService.logEventLifecycle(phase, {
          jobId: job.id,
          eventType: job.data?.type || 'unknown',
          locale: job.data?.locale,
          attemptNumber: job.attemptsMade + 1,
          error,
          metadata: {
            isPermanent,
            isMaxRetries,
            maxAttempts: job.opts.attempts || 5,
          },
        });
      }
    });

    this.worker.on('stalled', (jobId) => {
      this.logger.warn(
        `[${jobId}] Job stalled - will be retried by another worker | ` +
        `This ensures exactly-once processing in multi-worker scenarios`
      );
      // Job cleanup is handled in processEmailEventWithResilience finally block
    });

    this.worker.on('error', (error) => {
      this.logger.error('Worker error:', error instanceof Error ? error.stack : error);
      // Worker errors don't necessarily mean the worker is down, but we should monitor
      if (this.monitoringService) {
        this.monitoringService.logEventLifecycle('error', {
          error,
          metadata: {
            workerStatus: this.worker?.isRunning() ? 'running' : 'stopped',
            timestamp: new Date(),
          },
        });
      }
    });

    this.worker.on('active', (job) => {
      // Job tracking is handled in processEmailEventWithResilience
      this.logger.debug(`[${job.id}] Job active - processing started`);
    });

    this.worker.on('drained', () => {
      this.logger.debug('Queue drained - all jobs processed');
    });

    this.worker.on('paused', () => {
      this.logger.warn('Worker paused');
    });

    this.worker.on('resumed', () => {
      this.logger.log('Worker resumed');
    });
  }

  /**
   * Handle Redis connection errors with exponential backoff
   */
  private handleRedisConnectionError(error: Error): void {
    if (this.isShuttingDown) {
      return; // Don't attempt reconnection during shutdown
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `Redis connection failed after ${this.maxReconnectAttempts} attempts. ` +
        `Manual intervention required.`
      );
      // In production, this should trigger alerts
      return;
    }

    const delay = this.calculateReconnectDelay(this.reconnectAttempts);
    this.logger.warn(
      `Redis connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}). ` +
      `Retrying in ${delay}ms`
    );
  }

  /**
   * Attempt Redis reconnection with exponential backoff
   */
  private async attemptRedisReconnection(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error(
        `Redis reconnection failed after ${this.maxReconnectAttempts} attempts. ` +
        `Worker will continue to retry automatically via BullMQ.`
      );
      return;
    }

    const delay = this.calculateReconnectDelay(this.reconnectAttempts);

    this.logger.log(
      `Attempting Redis reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) ` +
      `in ${delay}ms`
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.redisConnection.connect();
      this.logger.log('Redis reconnection successful');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error(
        `Redis reconnection attempt ${this.reconnectAttempts} failed:`,
        error instanceof Error ? error.message : error
      );
      // Will retry on next connection error
    }
  }

  /**
   * Calculate reconnection delay with exponential backoff
   * @param attempt - Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateReconnectDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, attempt - 1),
      this.reconnectMaxDelay
    );
    return delay;
  }

  /**
   * Process email event with resilience features
   * Wraps the main processing logic with exactly-once guarantees and delivery tracking
   */
  private async processEmailEventWithResilience(job: Job<EmailEvent>): Promise<void> {
    this.logger.log(`[${job.id}] processEmailEventWithResilience started`);
    this.logger.log(`[${job.id}] Current processing jobs: [${Array.from(this.processingJobs).join(', ')}]`);

    // Check if we're shutting down
    if (this.isShuttingDown) {
      this.logger.warn(
        `[${job.id}] Rejecting job during shutdown - will be retried after restart`
      );
      throw new Error('Worker shutting down - job will be retried');
    }

    // Exactly-once processing check
    if (this.processingJobs.has(job.id!)) {
      this.logger.warn(
        `[${job.id}] Job already being processed - skipping duplicate (exactly-once guarantee)`
      );
      this.logger.warn(`[${job.id}] Processing jobs set contains: [${Array.from(this.processingJobs).join(', ')}]`);
      return; // Skip duplicate processing
    }

    // Check if email has already been delivered recently
    if (this.hasEmailBeenDelivered(job.data)) {
      this.logger.warn(
        `[${job.id}] Email already delivered recently - skipping duplicate delivery | ` +
        `Event: ${job.data.type} | ` +
        `Key: ${this.generateDeliveryTrackingKey(job.data)}`
      );
      return; // Skip duplicate delivery
    }

    // Mark job as being processed
    this.logger.log(`[${job.id}] Adding job to processing set`);
    this.processingJobs.add(job.id!);
    this.logger.log(`[${job.id}] Processing jobs set now contains: [${Array.from(this.processingJobs).join(', ')}]`);

    try {
      // Process the email event
      this.logger.log(`[${job.id}] Calling processEmailEvent`);
      await this.processEmailEvent(job);
      this.logger.log(`[${job.id}] processEmailEvent completed successfully`);
    } finally {
      // Ensure job is removed from processing set even if processing fails
      // (BullMQ will handle retries)
      this.logger.log(`[${job.id}] Removing job from processing set`);
      this.processingJobs.delete(job.id!);
      this.logger.log(`[${job.id}] Processing jobs set now contains: [${Array.from(this.processingJobs).join(', ')}]`);
    }
  }

  /**
   * Process email event based on type
   * Enhanced with comprehensive error logging and dead letter queue handling
   * @param job - BullMQ job containing email event data
   */
  private async processEmailEvent(job: Job<EmailEvent>): Promise<void> {
    const event = job.data;
    const jobId = job.id;
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 5;

    // Log processing start with comprehensive context
    this.logger.log(
      `[${jobId}] Processing email event: ${event.type} | ` +
      `Attempt: ${attemptNumber}/${maxAttempts} | ` +
      `Locale: ${event.locale} | ` +
      `Timestamp: ${event.timestamp}`
    );

    // Log structured processing start for monitoring
    if (this.monitoringService) {
      this.monitoringService.logEventLifecycle('processing', {
        jobId,
        eventType: event.type,
        locale: event.locale,
        attemptNumber,
        metadata: {
          maxAttempts,
          eventTimestamp: event.timestamp,
        },
      });
    }

    const startTime = Date.now();

    try {
      // Validate event structure before processing
      this.validateEventStructure(event);

      // Process based on event type
      switch (event.type) {
        case EmailEventType.ORDER_CONFIRMATION:
          await this.sendOrderConfirmation(event);
          break;

        case EmailEventType.ORDER_CONFIRMATION_RESEND:
          await this.sendOrderConfirmationResend(event);
          break;

        case EmailEventType.ADMIN_ORDER_NOTIFICATION:
          await this.sendAdminOrderNotification(event);
          break;

        case EmailEventType.SHIPPING_NOTIFICATION:
          await this.sendShippingNotification(event);
          break;

        case EmailEventType.ORDER_STATUS_UPDATE:
          await this.sendOrderStatusUpdate(event);
          break;

        case EmailEventType.ORDER_CANCELLATION:
          await this.sendOrderCancellation(event);
          break;

        case EmailEventType.ADMIN_CANCELLATION_NOTIFICATION:
          await this.sendAdminCancellationNotification(event);
          break;

        case EmailEventType.PAYMENT_STATUS_UPDATE:
          await this.sendPaymentStatusUpdate(event);
          break;

        case EmailEventType.WELCOME_EMAIL:
          await this.sendWelcomeEmail(event);
          break;

        case EmailEventType.PASSWORD_RESET:
          await this.sendPasswordReset(event);
          break;

        case EmailEventType.CONTACT_FORM:
          await this.sendContactForm(event);
          break;

        default:
          throw new Error(`Unknown email event type: ${(event as any).type}`);
      }

      // Log successful processing
      const processingTime = Date.now() - startTime;
      this.logger.log(
        `[${jobId}] Email sent successfully: ${event.type} | ` +
        `Processing time: ${processingTime}ms | ` +
        `Attempt: ${attemptNumber}/${maxAttempts}`
      );

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Comprehensive error logging
      this.logger.error(
        `[${jobId}] Email processing failed: ${event.type} | ` +
        `Error: ${errorMessage} | ` +
        `Attempt: ${attemptNumber}/${maxAttempts} | ` +
        `Processing time: ${processingTime}ms | ` +
        `Locale: ${event.locale}`,
        errorStack
      );

      // Check if error is permanent
      if (this.isPermanentError(error)) {
        // Log permanent error details for dead letter queue
        this.logger.error(
          `[${jobId}] PERMANENT ERROR - Moving to Dead Letter Queue | ` +
          `Event: ${event.type} | ` +
          `Error: ${errorMessage} | ` +
          `Event Data: ${JSON.stringify(event, null, 2)}`
        );

        // Add metadata for dead letter queue analysis
        await this.logDeadLetterEvent(jobId, event, error, attemptNumber);

        // Throw with PERMANENT_ERROR prefix to signal BullMQ
        throw new Error(`PERMANENT_ERROR: ${errorMessage}`);
      }

      // Temporary error - log retry information
      if (attemptNumber < maxAttempts) {
        const nextRetryDelay = this.calculateNextRetryDelay(attemptNumber);
        this.logger.warn(
          `[${jobId}] TEMPORARY ERROR - Will retry | ` +
          `Event: ${event.type} | ` +
          `Next retry in: ${Math.round(nextRetryDelay / 1000)}s | ` +
          `Remaining attempts: ${maxAttempts - attemptNumber}`
        );

        // Log structured retry event for monitoring
        if (this.monitoringService) {
          this.monitoringService.logEventLifecycle('retry', {
            jobId,
            eventType: event.type,
            locale: event.locale,
            attemptNumber,
            error,
            metadata: {
              nextRetryDelay,
              remainingAttempts: maxAttempts - attemptNumber,
              processingTime: Date.now() - startTime,
            },
          });
        }
      } else {
        this.logger.error(
          `[${jobId}] MAX RETRIES EXCEEDED - Moving to Dead Letter Queue | ` +
          `Event: ${event.type} | ` +
          `Final error: ${errorMessage}`
        );

        // Log to dead letter queue for max retries exceeded
        await this.logDeadLetterEvent(jobId, event, error, attemptNumber);
      }

      // Re-throw for BullMQ retry handling
      throw error;
    }
  }

  /**
   * Validate event structure during processing
   * @param event - Email event to validate
   */
  private validateEventStructure(event: EmailEvent): void {
    if (!event || typeof event !== 'object') {
      throw new Error('Invalid event structure: event must be an object');
    }

    if (!event.type || !Object.values(EmailEventType).includes(event.type)) {
      throw new Error(`Invalid event type: ${event.type}`);
    }

    if (!event.locale || !['en', 'vi'].includes(event.locale)) {
      throw new Error(`Invalid locale: ${event.locale}`);
    }

    if (!event.timestamp) {
      throw new Error('Missing event timestamp');
    }
  }

  /**
   * Calculate next retry delay based on exponential backoff
   * @param attemptNumber - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateNextRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1min, 5min, 15min, 1hr, 4hr
    const baseDelay = 60000; // 1 minute
    const multiplier = 5;
    const maxDelay = 4 * 60 * 60 * 1000; // 4 hours

    const delay = Math.min(baseDelay * Math.pow(multiplier, attemptNumber - 1), maxDelay);
    return delay;
  }



  /**
   * Send order confirmation email with PDF attachment
   */
  private async sendOrderConfirmation(event: any): Promise<void> {
    this.logger.log(`[sendOrderConfirmation] Starting for order: ${event.orderId}`);

    // Fetch full order data from database
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              }
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      this.logger.error(`[sendOrderConfirmation] Order not found: ${event.orderId}`);
      throw new Error(`Order not found: ${event.orderId}`);
    }

    this.logger.log(`[sendOrderConfirmation] Order found: ${order.orderNumber}, email: ${order.email}`);

    // Convert order to PDF data format
    const orderPDFData = await this.mapOrderToPDFData(order, event.locale);

    // Use EmailAttachmentService to send order confirmation with PDF attachment
    this.logger.log(`[sendOrderConfirmation] Using EmailAttachmentService to send email with PDF attachment`);

    const result = await this.emailAttachmentService.sendOrderConfirmationWithPDF(
      order.email,
      orderPDFData,
      event.locale
    );

    if (!result.success) {
      this.logger.error(`[sendOrderConfirmation] EmailAttachmentService failed: ${result.error}`);
      throw new Error(`Failed to send order confirmation with PDF: ${result.error}`);
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event, result.messageId);

    this.logger.log(`[sendOrderConfirmation] Completed successfully with PDF for order: ${event.orderId} | MessageId: ${result.messageId || 'none'}`);
  }

  /**
   * Send order confirmation resend email with PDF attachment
   */
  private async sendOrderConfirmationResend(event: any): Promise<void> {
    this.logger.log(`[sendOrderConfirmationResend] Starting for order: ${event.orderId}`);

    // Fetch full order data from database including all necessary relations for PDF generation
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              }
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      this.logger.error(`[sendOrderConfirmationResend] Order not found: ${event.orderId}`);
      throw new Error(`Order not found: ${event.orderId}`);
    }

    this.logger.log(`[sendOrderConfirmationResend] Order found: ${order.orderNumber}, email: ${order.email}`);

    // Convert order to PDF data format
    const orderPDFData = await this.mapOrderToPDFData(order, event.locale);

    // Use EmailAttachmentService to send order confirmation with PDF attachment
    // This ensures consistent PDF generation and email formatting with the original order confirmation
    this.logger.log(`[sendOrderConfirmationResend] Using EmailAttachmentService to send email with PDF attachment`);

    const result = await this.emailAttachmentService.sendOrderConfirmationWithPDF(
      order.email,
      orderPDFData,
      event.locale
    );

    if (!result.success) {
      this.logger.error(`[sendOrderConfirmationResend] EmailAttachmentService failed: ${result.error}`);
      throw new Error(`Failed to send order confirmation resend with PDF: ${result.error}`);
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event, result.messageId);

    this.logger.log(`[sendOrderConfirmationResend] Completed successfully with PDF for order: ${event.orderId} | MessageId: ${result.messageId || 'none'}`);
  }

  /**
   * Send admin order notification
   */
  private async sendAdminOrderNotification(event: any): Promise<void> {
    // Get admin email from footer settings
    const footerSettings = await this.footerSettingsService.getFooterSettings();
    // Send to admin always in vietnamese
    const locale = 'vi';

    if (!footerSettings.contactEmail) {
      this.logger.warn('Admin email not configured, skipping notification');
      return; // Don't fail the job
    }

    // Fetch full order data
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              }
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    // Generate email template
    const template = await this.emailTemplateService.getAdminOrderNotificationTemplate(
      this.mapOrderToAdminEmailData(order, locale),
      locale
    );

    // Send email
    const success = await this.emailService.sendEmail({
      to: footerSettings.contactEmail,
      subject: template.subject,
      html: template.html,
      locale: locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendAdminOrderNotification] Completed successfully for order: ${event.orderId}`);
  }

  /**
   * Send shipping notification
   */
  private async sendShippingNotification(event: any): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    const template = await this.emailTemplateService.getShippingNotificationTemplate(
      {
        ...this.mapOrderToEmailData(order, event.locale),
        trackingNumber: event.trackingNumber,
      },
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendShippingNotification] Completed successfully for order: ${event.orderId}`);
  }

  /**
   * Send order status update
   */
  private async sendOrderStatusUpdate(event: any): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }
    this.logger.debug("Loaded order ", order.user);
    const template = await this.emailTemplateService.getOrderStatusUpdateTemplate(
      this.mapOrderToEmailData(order, event.locale),
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendOrderStatusUpdate] Completed successfully for order: ${event.orderId}`);
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(event: any): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: event.userId },
    });

    if (!user) {
      throw new Error(`User not found: ${event.userId}`);
    }

    const template = await this.emailTemplateService.getWelcomeEmailTemplate(
      {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendWelcomeEmail] Completed successfully for user: ${event.userId}`);
  }

  /**
   * Send password reset email
   */
  private async sendPasswordReset(event: any): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: event.userId },
    });

    if (!user) {
      throw new Error(`User not found: ${event.userId}`);
    }

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const template = await this.emailTemplateService.getPasswordResetTemplate(
      {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        resetToken: event.resetToken,
      },
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendPasswordReset] Completed successfully for user: ${event.userId}`);
  }

  /**
   * Send contact form notification
   */
  private async sendContactForm(event: any): Promise<void> {
    const footerSettings = await this.footerSettingsService.getFooterSettings();

    if (!footerSettings.contactEmail) {
      this.logger.warn('Admin email not configured, skipping contact form notification');
      return;
    }

    // Create a simple contact form email template
    const subject = event.locale === 'vi'
      ? `Liên hệ mới từ ${event.senderName}`
      : `New Contact Form Submission from ${event.senderName}`;

    const html = `
      <h2>${event.locale === 'vi' ? 'Liên hệ mới' : 'New Contact Form Submission'}</h2>
      <p><strong>${event.locale === 'vi' ? 'Tên' : 'Name'}:</strong> ${event.senderName}</p>
      <p><strong>Email:</strong> ${event.senderEmail}</p>
      <p><strong>${event.locale === 'vi' ? 'Tin nhắn' : 'Message'}:</strong></p>
      <p>${event.message}</p>
    `;

    const template = { subject, html };

    const success = await this.emailService.sendEmail({
      to: footerSettings.contactEmail,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendContactForm] Completed successfully from: ${event.senderEmail}`);
  }

  /**
   * Send order cancellation email to customer
   */
  private async sendOrderCancellation(event: any): Promise<void> {
    this.logger.log(`[sendOrderCancellation] Starting for order: ${event.orderId}`);

    // Fetch order details
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    // Prepare cancellation email data
    const cancellationData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: event.customerName,
      customerEmail: event.customerEmail,
      customerPhone: order.shippingAddress?.phone || order.billingAddress?.phone,
      orderDate: order.createdAt.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString() || new Date().toISOString(),
      cancellationReason: event.cancellationReason,
      items: order.items.map((item: any) => ({
        nameEn: item.product.nameEn,
        nameVi: item.product.nameVi || item.product.nameEn,
        sku: item.product.sku,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total || item.price * item.quantity),
      })),
      orderTotal: Number(order.total),
      refundRequired: order.paymentStatus === CONSTANTS.STATUS.PAYMENT_STATUS.PAID,
      refundAmount: order.paymentStatus === CONSTANTS.STATUS.PAYMENT_STATUS.PAID ? Number(order.total) : 0,
      refundMethod: order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Original Payment Method',
      estimatedRefundDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      paymentStatus: order.paymentStatus,
    };

    // Generate email template
    const template = await this.emailTemplateService.getOrderCancellationTemplate(
      cancellationData,
      event.locale,
    );

    // Send email
    const success = await this.emailService.sendEmail({
      to: event.customerEmail,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendOrderCancellation] Completed successfully for order: ${event.orderNumber}`);
  }

  /**
   * Send admin cancellation notification email
   */
  private async sendAdminCancellationNotification(event: any): Promise<void> {
    this.logger.log(`[sendAdminCancellationNotification] Starting for order: ${event.orderId}`);

    // Get admin email from footer settings
    const footerSettings = await this.footerSettingsService.getFooterSettings();

    if (!footerSettings.contactEmail) {
      this.logger.warn('Admin email not configured, skipping admin cancellation notification');
      return;
    }

    // Fetch order details
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    // Prepare admin cancellation email data
    const cancellationData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.shippingAddress?.fullName || order.billingAddress?.fullName || order.email || 'Customer',
      customerEmail: order.email,
      customerPhone: order.shippingAddress?.phone || order.billingAddress?.phone,
      orderDate: order.createdAt.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString() || new Date().toISOString(),
      cancellationReason: event.cancellationReason,
      items: order.items.map((item: any) => ({
        nameEn: item.product.nameEn,
        nameVi: item.product.nameVi || item.product.nameEn,
        sku: item.product.sku,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total || item.price * item.quantity),
      })),
      orderTotal: Number(order.total),
      refundRequired: order.paymentStatus === CONSTANTS.STATUS.PAYMENT_STATUS.PAID,
      refundAmount: order.paymentStatus === CONSTANTS.STATUS.PAYMENT_STATUS.PAID ? Number(order.total) : 0,
      refundMethod: order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Original Payment Method',
      estimatedRefundDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      paymentStatus: order.paymentStatus,
    };

    // Generate email template
    const template = await this.emailTemplateService.getAdminOrderCancellationTemplate(
      cancellationData,
      event.locale,
    );

    // Send email
    const success = await this.emailService.sendEmail({
      to: footerSettings.contactEmail,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendAdminCancellationNotification] Completed successfully for order: ${event.orderNumber}`);
  }

  /**
   * Send payment status update email to customer
   */
  private async sendPaymentStatusUpdate(event: any): Promise<void> {
    this.logger.log(`[sendPaymentStatusUpdate] Starting for order: ${event.orderId}`);

    // Fetch order details
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        total: true,
        paymentStatus: true,
        email: true,
        shippingAddress: {
          select: {
            fullName: true,
          },
        },
        billingAddress: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    // Prepare payment status update email data
    const paymentData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: event.customerName,
      orderDate: order.createdAt.toISOString(),
      orderTotal: Number(order.total),
      paymentStatus: event.paymentStatus,
      statusMessage: event.statusMessage || getPaymentStatusMessage(event.paymentStatus, event.locale),
    };

    // Generate email template
    const template = await this.emailTemplateService.getPaymentStatusUpdateTemplate(
      paymentData,
      event.locale,
    );

    // Send email
    const success = await this.emailService.sendEmail({
      to: event.customerEmail,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }

    // Mark email as delivered to prevent duplicates
    this.markEmailAsDelivered(event);

    this.logger.log(`[sendPaymentStatusUpdate] Completed successfully for order: ${event.orderNumber}`);
  }

  /**
   * Convert Prisma order data to PDF data format
   */
  private async mapOrderToPDFData(order: any, locale: 'en' | 'vi'): Promise<any> {
    // Get business info for the specified locale
    const businessInfo = await this.businessInfoService.getBusinessInfo(locale);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString().split('T')[0],
      customerInfo: {
        name: order.shippingAddress?.fullName || order.billingAddress?.fullName || 'Customer',
        email: order.email,
        phone: order.shippingAddress?.phone || order.billingAddress?.phone,
      },
      billingAddress: order.billingAddress
        ? {
            fullName: order.billingAddress.fullName,
            addressLine1: order.billingAddress.addressLine1,
            addressLine2: order.billingAddress.addressLine2 || undefined,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            postalCode: order.billingAddress.postalCode,
            country: order.billingAddress.country,
            phone: order.billingAddress.phone || undefined,
          }
        : {
            fullName: order.shippingAddress?.fullName || 'Not provided',
            addressLine1: order.shippingAddress?.addressLine1 || 'Not provided',
            addressLine2: order.shippingAddress?.addressLine2 || undefined,
            city: order.shippingAddress?.city || 'Not provided',
            state: order.shippingAddress?.state || 'Not provided',
            postalCode: order.shippingAddress?.postalCode || 'Not provided',
            country: order.shippingAddress?.country || 'VN',
            phone: order.shippingAddress?.phone || undefined,
          },
      shippingAddress: order.shippingAddress
        ? {
            fullName: order.shippingAddress.fullName,
            addressLine1: order.shippingAddress.addressLine1,
            addressLine2: order.shippingAddress.addressLine2 || undefined,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
            phone: order.shippingAddress.phone || undefined,
          }
        : {
            fullName: 'Not provided',
            addressLine1: 'Not provided',
            city: 'Not provided',
            state: 'Not provided',
            postalCode: 'Not provided',
            country: 'VN',
          },
      items: order.items.map((item: any) => {
        // Extract image URL properly
        let imageUrl: string | undefined;
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = item.product.images[0].url;
        }

        return {
          id: item.product.id,
          name: locale === 'vi' ? (item.product.nameVi || item.product.nameEn) : item.product.nameEn,
          description: locale === 'vi' ? (item.product.descriptionVi || item.product.descriptionEn) : item.product.descriptionEn,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          totalPrice: Number(item.total || item.price * item.quantity),
          imageUrl,
          category: locale === 'vi' ? (item.product.category?.nameVi || item.product.category?.nameEn) : item.product.category?.nameEn,
        };
      }),
      pricing: {
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        taxAmount: Number(order.taxAmount || 0),
        discountAmount: Number(order.discountAmount || 0),
        total: Number(order.total),
      },
      paymentMethod: {
        type: order.paymentMethod as 'bank_transfer' | 'cash_on_delivery' | 'qr_code',
        displayName: this.getPaymentMethodDisplayName(order.paymentMethod, locale),
        status: order.paymentStatus as 'pending' | 'completed' | 'failed',
        details: order.paymentMethod === 'bank_transfer' ? 'Bank transfer payment' : undefined,
      },
      shippingMethod: {
        name: order.shippingMethod || 'Standard',
        description: this.getShippingMethodDescription(order.shippingMethod || 'standard', locale),
        estimatedDelivery: order.estimatedDelivery,
        trackingNumber: order.trackingNumber,
      },
      businessInfo,
      locale,
    };
  }

  /**
   * Check if error is permanent (validation) or temporary (network)
   * Enhanced error classification for better retry handling
   * @param error - Error to classify
   * @returns true if error is permanent, false if temporary
   */
  private isPermanentError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code;
    const errorStatus = error?.status || error?.statusCode;

    // Database/Business Logic Errors (Permanent)
    const permanentDataErrors = [
      'Order not found',
      'User not found',
      'Invalid email address',
      'Invalid event type',
      'require valid',
      'validation failed',
      'does not exist',
      'not found',
      'invalid format',
      'malformed',
      'unauthorized',
      'forbidden',
      'bad request',
    ];

    // Email Service Errors (Permanent)
    const permanentEmailErrors = [
      'invalid recipient',
      'recipient rejected',
      'mailbox unavailable',
      'user unknown',
      'domain not found',
      'permanent failure',
      'blacklisted',
      'spam detected',
      'message too large',
      'quota exceeded',
    ];

    // HTTP Status Codes (Permanent)
    const permanentStatusCodes = [400, 401, 403, 404, 410, 422, 451];

    // SMTP Error Codes (Permanent)
    const permanentSmtpCodes = [
      '5.0.0', // Permanent failure
      '5.1.0', // Bad destination mailbox address
      '5.1.1', // Bad destination mailbox address
      '5.1.2', // Bad destination system address
      '5.1.3', // Bad destination mailbox address syntax
      '5.2.1', // Mailbox disabled
      '5.2.2', // Mailbox full
      '5.3.0', // Other or undefined mail system status
      '5.4.1', // No answer from host
      '5.5.0', // Protocol error
      '5.7.1', // Delivery not authorized
    ];

    // Check for permanent data/validation errors
    if (permanentDataErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
      this.logger.warn(`Classified as permanent error (data/validation): ${errorMessage}`);
      return true;
    }

    // Check for permanent email errors
    if (permanentEmailErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
      this.logger.warn(`Classified as permanent error (email service): ${errorMessage}`);
      return true;
    }

    // Check for permanent HTTP status codes
    if (errorStatus && permanentStatusCodes.includes(errorStatus)) {
      this.logger.warn(`Classified as permanent error (HTTP ${errorStatus}): ${errorMessage}`);
      return true;
    }

    // Check for permanent SMTP codes
    if (permanentSmtpCodes.some(code => errorMessage.includes(code))) {
      this.logger.warn(`Classified as permanent error (SMTP): ${errorMessage}`);
      return true;
    }

    // Network/Temporary Errors (should be retried)
    const temporaryErrors = [
      'timeout',
      'connection refused',
      'connection reset',
      'network error',
      'dns error',
      'temporary failure',
      'service unavailable',
      'rate limit',
      'too many requests',
      'server error',
      'internal error',
      'redis',
      'database connection',
      'econnreset',
      'enotfound',
      'etimedout',
    ];

    // Check for temporary errors
    if (temporaryErrors.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()))) {
      this.logger.log(`Classified as temporary error (will retry): ${errorMessage}`);
      return false;
    }

    // Default to temporary for unknown errors (safer to retry)
    this.logger.log(`Unknown error type, defaulting to temporary (will retry): ${errorMessage}`);
    return false;
  }

  /**
   * Log event to dead letter queue for analysis
   * Enhanced with comprehensive error metadata
   * @param jobId - Job ID
   * @param event - Email event
   * @param error - Error that caused failure
   * @param attemptNumber - Final attempt number
   */
  private async logDeadLetterEvent(
    jobId: string | undefined,
    event: EmailEvent,
    error: any,
    attemptNumber: number
  ): Promise<void> {
    try {
      const errorAnalysis = this.analyzeError(error);

      const deadLetterEntry = {
        jobId: jobId || 'unknown',
        eventType: event.type,
        eventData: {
          ...event,
          // Sanitize sensitive data for logging
          ...(event.type === EmailEventType.PASSWORD_RESET && {
            resetToken: '[REDACTED]'
          }),
        },
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          code: error?.code,
          status: error?.status || error?.statusCode,
          name: error?.name,
          ...errorAnalysis,
        },
        failureTimestamp: new Date(),
        attemptNumber,
        isPermanentError: this.isPermanentError(error),
        retryHistory: this.getRetryHistory(attemptNumber),
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
        },
      };

      // Log structured data for monitoring systems
      this.logger.error(
        `DEAD_LETTER_QUEUE_ENTRY: ${JSON.stringify(deadLetterEntry, null, 2)}`
      );

      // Additional logging for specific error types
      if (errorAnalysis.category === 'email_service') {
        this.logger.error(
          `EMAIL_SERVICE_FAILURE: ${event.type} failed due to email service issue: ${error.message}`
        );
      } else if (errorAnalysis.category === 'database') {
        this.logger.error(
          `DATABASE_FAILURE: ${event.type} failed due to database issue: ${error.message}`
        );
      } else if (errorAnalysis.category === 'validation') {
        this.logger.error(
          `VALIDATION_FAILURE: ${event.type} failed validation: ${error.message}`
        );
      }

      // TODO: In production, consider:
      // 1. Storing this in a database table for analysis
      // 2. Sending alerts to monitoring service (e.g., Sentry, DataDog)
      // 3. Creating tickets for permanent errors
      // 4. Generating metrics for dashboard

    } catch (logError) {
      this.logger.error(
        `Failed to log dead letter entry for job ${jobId}:`,
        logError instanceof Error ? logError.stack : logError
      );
    }
  }

  /**
   * Analyze error to categorize and extract metadata
   * @param error - Error to analyze
   * @returns Error analysis metadata
   */
  private analyzeError(error: any): {
    category: string;
    severity: string;
    retryable: boolean;
    actionRequired: string;
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code;
    const errorStatus = error?.status || error?.statusCode;

    // Database errors
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return {
        category: 'database',
        severity: 'high',
        retryable: false,
        actionRequired: 'Check data integrity and business logic',
      };
    }

    // Email service errors
    if (errorMessage.includes('Email service returned false') ||
        errorMessage.includes('smtp') ||
        errorMessage.includes('mail')) {
      return {
        category: 'email_service',
        severity: 'medium',
        retryable: !this.isPermanentError(error),
        actionRequired: this.isPermanentError(error)
          ? 'Check email configuration and recipient validity'
          : 'Monitor email service health',
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('require valid')) {
      return {
        category: 'validation',
        severity: 'high',
        retryable: false,
        actionRequired: 'Fix data validation logic or input sanitization',
      };
    }

    // Network errors
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('network')) {
      return {
        category: 'network',
        severity: 'low',
        retryable: true,
        actionRequired: 'Monitor network connectivity and service health',
      };
    }

    // System errors
    if (errorMessage.includes('memory') ||
        errorMessage.includes('resource') ||
        errorCode === 'EMFILE') {
      return {
        category: 'system',
        severity: 'high',
        retryable: true,
        actionRequired: 'Check system resources and scaling',
      };
    }

    // Default unknown error
    return {
      category: 'unknown',
      severity: 'medium',
      retryable: !this.isPermanentError(error),
      actionRequired: 'Investigate error pattern and add specific handling',
    };
  }

  /**
   * Generate retry history for analysis
   * @param attemptNumber - Current attempt number
   * @returns Retry timing information
   */
  private getRetryHistory(attemptNumber: number): Array<{ attempt: number; delay: number }> {
    const history = [];
    for (let i = 1; i < attemptNumber; i++) {
      history.push({
        attempt: i,
        delay: this.calculateNextRetryDelay(i),
      });
    }
    return history;
  }

  /**
   * Helper to map order to email data
   * @param order - Prisma order object with relations
   * @param locale - Language locale for status message
   * @returns Email template data
   */
  private mapOrderToEmailData(order: any, locale: 'en' | 'vi' = 'en'): any {
    // Implementation matches existing OrdersService mapping
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString().split('T')[0],
      customerName: order.user ? `${order.user.firstName}` : order.email,
      customerEmail: order.email,
      items: order.items.map((item: any) => ({
        productName: item.product.name,
        productNameVi: item.product.nameVi,
        quantity: item.quantity,
        price: item.price,
        total: item.total || (item.quantity * item.price), // Use item.total if available, otherwise calculate
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      tax: order.taxAmount || order.tax, // Support both field names
      taxAmount: order.taxAmount || order.tax,
      discount: order.discountAmount || order.discount, // Support both field names
      discountAmount: order.discountAmount || order.discount,
      total: order.total, // Keep for backward compatibility, but template will use calculated total
      shippingAddress: order.shippingAddress,
      status: order.status,
      paymentStatus: order.paymentStatus,
      statusMessage: getOrderStatusMessage(order.status, locale),
    };
  }

  /**
   * Helper to map order to admin email data
   * @param order - Prisma order object with relations
   * @param locale - Language locale for status message
   * @returns Admin email template data
   */
  private mapOrderToAdminEmailData(order: any, locale: 'en' | 'vi' = 'en'): any {
    return {
      ...this.mapOrderToEmailData(order, locale),
      billingAddress: order.billingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      notes: order.notes,
    };
  }

  /**
   * Graceful shutdown - complete current jobs before closing
   * Implements requirement 7.4: graceful shutdown completion
   * Enhanced with comprehensive cleanup and timeout handling
   */
  async onModuleDestroy() {
    this.logger.log('Initiating graceful email worker shutdown...');
    this.isShuttingDown = true;

    const startTime = Date.now();
    let shutdownSuccess = false;

    try {
      // Step 1: Stop accepting new jobs
      if (this.worker) {
        this.logger.log('Pausing worker to stop accepting new jobs...');
        await this.worker.pause();
      }

      // Step 2: Wait for current jobs to complete with timeout
      await this.waitForJobsToComplete();

      // Step 3: Close worker gracefully
      if (this.worker) {
        this.logger.log('Closing worker gracefully...');
        await Promise.race([
          this.worker.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Worker close timeout')), this.gracefulShutdownTimeout)
          )
        ]);
        shutdownSuccess = true;
      }

      // Step 4: Close Redis connection
      if (this.redisConnection) {
        this.logger.log('Closing Redis connection...');
        await this.redisConnection.quit();
      }

      const shutdownTime = Date.now() - startTime;
      this.logger.log(
        `Email worker shutdown completed successfully in ${shutdownTime}ms | ` +
        `Jobs processed during shutdown: ${this.processingJobs.size}`
      );

    } catch (error) {
      const shutdownTime = Date.now() - startTime;
      this.logger.error(
        `Error during graceful shutdown (${shutdownTime}ms):`,
        error instanceof Error ? error.stack : error
      );

      // Force close if graceful shutdown fails
      await this.forceShutdown();
    }

    // Final cleanup
    this.processingJobs.clear();
    this.deliveredEmails.clear();
    this.logger.log('Email worker shutdown sequence completed');
  }

  /**
   * Wait for current jobs to complete with timeout
   */
  private async waitForJobsToComplete(): Promise<void> {
    if (this.processingJobs.size === 0) {
      this.logger.log('No active jobs to wait for');
      return;
    }

    this.logger.log(
      `Waiting for ${this.processingJobs.size} active jobs to complete ` +
      `(timeout: ${this.gracefulShutdownTimeout}ms)...`
    );

    const startTime = Date.now();
    const checkInterval = 1000; // Check every second

    return new Promise((resolve, reject) => {
      const checkJobs = () => {
        const elapsed = Date.now() - startTime;

        if (this.processingJobs.size === 0) {
          this.logger.log(`All jobs completed in ${elapsed}ms`);
          resolve();
          return;
        }

        if (elapsed >= this.gracefulShutdownTimeout) {
          this.logger.warn(
            `Shutdown timeout reached with ${this.processingJobs.size} jobs still processing. ` +
            `Jobs: [${Array.from(this.processingJobs).join(', ')}]`
          );
          reject(new Error(`Shutdown timeout with ${this.processingJobs.size} jobs remaining`));
          return;
        }

        this.logger.debug(
          `Still waiting for ${this.processingJobs.size} jobs ` +
          `(${elapsed}ms elapsed, ${this.gracefulShutdownTimeout - elapsed}ms remaining)`
        );

        setTimeout(checkJobs, checkInterval);
      };

      checkJobs();
    });
  }

  /**
   * Force shutdown when graceful shutdown fails
   */
  private async forceShutdown(): Promise<void> {
    this.logger.warn('Attempting force shutdown...');

    try {
      if (this.worker) {
        // Force close worker without waiting for jobs
        await Promise.race([
          this.worker.close(true), // Force close
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Force close timeout')), 5000)
          )
        ]);
        this.logger.warn('Worker force-closed');
      }

      if (this.redisConnection) {
        // Force disconnect Redis
        this.redisConnection.disconnect();
        this.logger.warn('Redis connection force-disconnected');
      }

    } catch (forceError) {
      this.logger.error(
        'Failed to force-close worker:',
        forceError instanceof Error ? forceError.stack : forceError
      );
    }
  }

  /**
   * Get worker health status for monitoring
   * Enhanced with resilience and recovery status information
   * @returns Comprehensive worker health information
   */
  async getWorkerHealth() {
    if (!this.worker) {
      return {
        status: 'not_initialized',
        isRunning: false,
        connection: 'disconnected',
        resilience: {
          isShuttingDown: this.isShuttingDown,
          reconnectAttempts: this.reconnectAttempts,
          processingJobs: this.processingJobs.size,
        },
      };
    }

    try {
      const isRunning = this.worker.isRunning();

      // Check Redis connection status
      let redisStatus = 'unknown';
      try {
        if (this.redisConnection && this.redisConnection.status === 'ready') {
          await this.redisConnection.ping();
          redisStatus = 'connected';
        } else if (this.redisConnection) {
          redisStatus = this.redisConnection.status;
        }
      } catch (redisError) {
        redisStatus = 'disconnected';
      }

      return {
        status: this.isShuttingDown ? 'shutting_down' : (isRunning ? 'healthy' : 'stopped'),
        isRunning,
        connection: redisStatus,
        concurrency: this.worker.opts.concurrency,
        stalledInterval: this.worker.opts.stalledInterval,
        maxStalledCount: this.worker.opts.maxStalledCount,
        resilience: {
          isShuttingDown: this.isShuttingDown,
          reconnectAttempts: this.reconnectAttempts,
          maxReconnectAttempts: this.maxReconnectAttempts,
          processingJobs: this.processingJobs.size,
          activeJobIds: Array.from(this.processingJobs),
          gracefulShutdownTimeout: this.gracefulShutdownTimeout,
          reconnectBaseDelay: this.reconnectBaseDelay,
          reconnectMaxDelay: this.reconnectMaxDelay,
        },
        timestamps: {
          lastHealthCheck: new Date(),
        },
      };
    } catch (error) {
      return {
        status: 'error',
        isRunning: false,
        connection: 'error',
        error: error instanceof Error ? error.message : String(error),
        resilience: {
          isShuttingDown: this.isShuttingDown,
          reconnectAttempts: this.reconnectAttempts,
          processingJobs: this.processingJobs.size,
        },
      };
    }
  }

  /**
   * Get detailed resilience status for monitoring and debugging
   * @returns Detailed resilience information
   */
  async getResilienceStatus() {
    return {
      worker: {
        isInitialized: !!this.worker,
        isRunning: this.worker?.isRunning() || false,
        isShuttingDown: this.isShuttingDown,
      },
      redis: {
        isConnected: this.redisConnection?.status === 'ready',
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.maxReconnectAttempts,
        status: this.redisConnection?.status || 'unknown',
      },
      processing: {
        activeJobs: this.processingJobs.size,
        activeJobIds: Array.from(this.processingJobs),
      },
      configuration: {
        gracefulShutdownTimeout: this.gracefulShutdownTimeout,
        reconnectBaseDelay: this.reconnectBaseDelay,
        reconnectMaxDelay: this.reconnectMaxDelay,
      },
      timestamps: {
        statusCheck: new Date(),
      },
    };
  }

  /**
   * Manually trigger reconnection (for admin/debugging purposes)
   * @returns Reconnection result
   */
  async triggerReconnection(): Promise<{ success: boolean; message: string }> {
    if (this.isShuttingDown) {
      return {
        success: false,
        message: 'Cannot reconnect during shutdown',
      };
    }

    try {
      this.logger.log('Manual reconnection triggered');
      await this.redisConnection.disconnect();
      await this.redisConnection.connect();

      this.reconnectAttempts = 0;

      return {
        success: true,
        message: 'Reconnection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get payment method display name
   * @param paymentMethod - Payment method code
   * @param locale - Language locale
   * @returns Localized payment method name
   */
  private getPaymentMethodDisplayName(
    paymentMethod: string,
    locale: 'en' | 'vi',
  ): string {
    const translations = {
      bank_transfer: {
        en: 'Bank Transfer',
        vi: 'Chuyển khoản ngân hàng',
      },
      cash_on_delivery: {
        en: 'Cash on Delivery',
        vi: 'Thanh toán khi nhận hàng',
      },
      qr_code: {
        en: 'QR Code Payment',
        vi: 'Thanh toán QR Code',
      },
    };

    return (
      translations[paymentMethod as keyof typeof translations]?.[locale] ||
      paymentMethod
    );
  }

  /**
   * Get shipping method description
   * @param shippingMethod - Shipping method code
   * @param locale - Language locale
   * @returns Localized shipping method description
   */
  private getShippingMethodDescription(
    shippingMethod: string,
    locale: 'en' | 'vi',
  ): string {
    const translations = {
      standard: {
        en: 'Standard Delivery (3-5 business days)',
        vi: 'Giao hàng tiêu chuẩn (3-5 ngày làm việc)',
      },
      express: {
        en: 'Express Delivery (1-2 business days)',
        vi: 'Giao hàng nhanh (1-2 ngày làm việc)',
      },
      pickup: {
        en: 'Store Pickup',
        vi: 'Nhận tại cửa hàng',
      },
    };

    return (
      translations[shippingMethod as keyof typeof translations]?.[locale] ||
      shippingMethod
    );
  }

  /**
   * Generate a unique delivery tracking key for an email event
   * This key is used to prevent duplicate email deliveries
   */
  private generateDeliveryTrackingKey(event: EmailEvent): string {
    // Create a unique key based on event type, recipient, and relevant identifiers
    const keyParts: string[] = [event.type, event.locale];

    // Add event-specific identifiers
    switch (event.type) {
      case EmailEventType.ORDER_CONFIRMATION:
      case EmailEventType.ORDER_CONFIRMATION_RESEND:
        keyParts.push(event.orderId, event.customerEmail);
        break;
      case EmailEventType.ADMIN_ORDER_NOTIFICATION:
        keyParts.push(event.orderId, 'admin');
        break;
      case EmailEventType.SHIPPING_NOTIFICATION:
        keyParts.push(event.orderId, event.trackingNumber || 'no-tracking');
        break;
      case EmailEventType.ORDER_STATUS_UPDATE:
        keyParts.push(event.orderId, event.newStatus || 'status-update');
        break;
      case EmailEventType.ORDER_CANCELLATION:
        keyParts.push(event.orderId, event.customerEmail, 'cancellation');
        break;
      case EmailEventType.ADMIN_CANCELLATION_NOTIFICATION:
        keyParts.push(event.orderId, 'admin', 'cancellation');
        break;
      case EmailEventType.PAYMENT_STATUS_UPDATE:
        keyParts.push(event.orderId, event.customerEmail, event.paymentStatus);
        break;
      case EmailEventType.WELCOME_EMAIL:
        keyParts.push(event.userId, event.userEmail);
        break;
      case EmailEventType.PASSWORD_RESET:
        keyParts.push(event.userId, event.userEmail, event.resetToken);
        break;
      case EmailEventType.CONTACT_FORM:
        keyParts.push(event.senderEmail, event.senderName, event.timestamp.toISOString());
        break;
      default:
        // This should never happen with proper typing, but adding for safety
        keyParts.push('unknown');
    }

    return keyParts.join('|');
  }

  /**
   * Check if an email has already been delivered recently
   * This prevents duplicate email deliveries within the TTL window
   */
  private hasEmailBeenDelivered(event: EmailEvent): boolean {
    const deliveryKey = this.generateDeliveryTrackingKey(event);
    const deliveryRecord = this.deliveredEmails.get(deliveryKey);

    if (!deliveryRecord) {
      return false;
    }

    // Check if the delivery record is still within TTL
    const now = new Date();
    const timeSinceDelivery = now.getTime() - deliveryRecord.timestamp.getTime();

    if (timeSinceDelivery > this.deliveryTrackingTTL) {
      // Record is expired, remove it and allow delivery
      this.deliveredEmails.delete(deliveryKey);
      return false;
    }

    // Email was delivered recently, prevent duplicate
    this.logger.warn(
      `Email delivery prevented - already delivered within TTL | ` +
      `Key: ${deliveryKey} | ` +
      `Delivered: ${deliveryRecord.timestamp.toISOString()} | ` +
      `TTL: ${this.deliveryTrackingTTL}ms`
    );

    return true;
  }

  /**
   * Mark an email as delivered to prevent future duplicates
   */
  private markEmailAsDelivered(event: EmailEvent, messageId?: string): void {
    const deliveryKey = this.generateDeliveryTrackingKey(event);
    const deliveryRecord = {
      timestamp: new Date(),
      messageId
    };

    this.deliveredEmails.set(deliveryKey, deliveryRecord);

    this.logger.log(
      `Email marked as delivered | ` +
      `Key: ${deliveryKey} | ` +
      `MessageId: ${messageId || 'none'} | ` +
      `Timestamp: ${deliveryRecord.timestamp.toISOString()}`
    );

    // Clean up expired records periodically
    this.cleanupExpiredDeliveryRecords();
  }

  /**
   * Clean up expired delivery tracking records to prevent memory leaks
   */
  private cleanupExpiredDeliveryRecords(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, record] of this.deliveredEmails.entries()) {
      const timeSinceDelivery = now.getTime() - record.timestamp.getTime();
      if (timeSinceDelivery > this.deliveryTrackingTTL) {
        this.deliveredEmails.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired delivery records`);
    }
  }

  /**
   * Get delivery tracking information for monitoring and debugging
   * @returns Comprehensive delivery tracking status
   */
  getDeliveryTrackingStatus(): {
    totalTrackedDeliveries: number;
    recentDeliveries: Array<{
      key: string;
      timestamp: Date;
      messageId?: string;
      age: number;
    }>;
    oldestDelivery?: Date;
    newestDelivery?: Date;
    ttlHours: number;
  } {
    const now = new Date();
    const recentDeliveries = Array.from(this.deliveredEmails.entries()).map(([key, record]) => ({
      key,
      timestamp: record.timestamp,
      messageId: record.messageId,
      age: now.getTime() - record.timestamp.getTime(),
    }));

    // Sort by timestamp (newest first)
    recentDeliveries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const timestamps = recentDeliveries.map(d => d.timestamp);
    const oldestDelivery = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined;
    const newestDelivery = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined;

    return {
      totalTrackedDeliveries: this.deliveredEmails.size,
      recentDeliveries: recentDeliveries.slice(0, 10), // Return last 10 deliveries
      oldestDelivery,
      newestDelivery,
      ttlHours: this.deliveryTrackingTTL / (60 * 60 * 1000),
    };
  }

  /**
   * Verify if a specific email delivery was successful
   * @param event - Email event to verify
   * @returns Delivery verification result
   */
  verifyEmailDelivery(event: EmailEvent): {
    wasDelivered: boolean;
    deliveryTimestamp?: Date;
    messageId?: string;
    deliveryKey: string;
    timeSinceDelivery?: number;
  } {
    const deliveryKey = this.generateDeliveryTrackingKey(event);
    const deliveryRecord = this.deliveredEmails.get(deliveryKey);

    if (!deliveryRecord) {
      return {
        wasDelivered: false,
        deliveryKey,
      };
    }

    const now = new Date();
    const timeSinceDelivery = now.getTime() - deliveryRecord.timestamp.getTime();

    return {
      wasDelivered: true,
      deliveryTimestamp: deliveryRecord.timestamp,
      messageId: deliveryRecord.messageId,
      deliveryKey,
      timeSinceDelivery,
    };
  }
}