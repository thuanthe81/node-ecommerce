import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, ConnectionOptions } from 'bullmq';
import { EmailEvent, EmailEventType } from '../types/email-event.types';
import { EmailOptions, EmailAttachmentOptions } from '../../notifications/services/email.service';
import { EmailQueueConfigService } from './email-queue-config.service';
import { EmailFlowLogger } from '../utils/email-flow-logger';
import Redis from 'ioredis';

/**
 * Email Event Publisher Service
 *
 * Publishes email events to a Redis-backed queue for asynchronous processing.
 * Provides validation, priority handling, and monitoring capabilities.
 */
@Injectable()
export class EmailEventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(EmailEventPublisher.name);
  private emailQueue: Queue;
  private monitoringService: any; // Will be injected after module initialization
  private redisConnection: Redis;
  private isShuttingDown = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectBaseDelay: number;
  private reconnectMaxDelay: number;

  constructor(private configService: EmailQueueConfigService) {
    // Get reconnection configuration from centralized config service
    const resilienceConfig = this.configService.getResilienceConfig();
    this.maxReconnectAttempts = resilienceConfig.maxReconnectAttempts;
    this.reconnectBaseDelay = resilienceConfig.reconnectBaseDelay;
    this.reconnectMaxDelay = resilienceConfig.reconnectMaxDelay;

    this.initializeQueueWithResilience();
  }

  /**
   * Set monitoring service (called by module after initialization to avoid circular dependency)
   */
  setMonitoringService(monitoringService: any): void {
    this.monitoringService = monitoringService;
  }

  /**
   * Initialize BullMQ queue with Redis connection and enhanced retry configuration
   * Enhanced with resilience features for crash recovery and reconnection
   */
  private initializeQueueWithResilience(): void {
    // Get configuration from centralized config service
    const redisConfig = this.configService.getRedisConfig();
    const queueConfig = this.configService.getQueueConfig();
    const resilienceConfig = this.configService.getResilienceConfig();

    // Create resilient Redis connection options
    const connectionOptions: ConnectionOptions = {
      host: redisConfig.host,
      port: redisConfig.port,
      // Enhanced Redis connection options for resilience
      enableReadyCheck: false,
      maxRetriesPerRequest: null, // Required by BullMQ
      lazyConnect: false, // Connect immediately for queue
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

    this.emailQueue = new Queue('email-events', {
      connection: connectionOptions,
      defaultJobOptions: {
        attempts: queueConfig.maxAttempts, // Maximum retry attempts (configurable)
        backoff: {
          type: 'exponential',
          delay: queueConfig.initialDelay, // Start delay (configurable)
        },
        removeOnComplete: {
          age: queueConfig.completedRetentionAge, // Keep completed jobs (configurable)
          count: queueConfig.completedRetentionCount, // Keep last N completed jobs (configurable)
        },
        removeOnFail: {
          age: queueConfig.failedRetentionAge, // Keep failed jobs (configurable)
          count: queueConfig.failedRetentionCount, // Keep last N failed jobs for analysis (configurable)
        },
        // Job deduplication for exactly-once processing
        // jobId will be set per job for deduplication when needed
      },
    });

    this.setupQueueEventHandlers();

    this.logger.log('Email queue initialized with resilience features');
  }

  /**
   * Setup Redis connection event handlers for resilience
   */
  private setupRedisConnectionHandlers(): void {
    this.redisConnection.on('connect', () => {
      this.logger.log('Redis connection established for queue');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });

    this.redisConnection.on('ready', () => {
      this.logger.log('Redis connection ready for queue operations');
    });

    this.redisConnection.on('error', (error) => {
      this.logger.error(`Redis queue connection error: ${error.message}`);
      this.handleRedisConnectionError(error);
    });

    this.redisConnection.on('close', () => {
      if (!this.isShuttingDown) {
        this.logger.warn('Redis queue connection closed unexpectedly');
        this.attemptRedisReconnection();
      } else {
        this.logger.log('Redis queue connection closed during shutdown');
      }
    });

    this.redisConnection.on('reconnecting', (delay: number) => {
      this.logger.log(`Redis queue reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    });

    this.redisConnection.on('end', () => {
      if (!this.isShuttingDown) {
        this.logger.warn('Redis queue connection ended unexpectedly');
      }
    });
  }

  /**
   * Setup queue event handlers for monitoring
   */
  private setupQueueEventHandlers(): void {
    // Enhanced queue event listeners for monitoring
    this.emailQueue.on('error', (error) => {
      this.logger.error('Queue error:', error instanceof Error ? error.stack : error);

      // Log structured error for monitoring
      if (this.monitoringService) {
        this.monitoringService.logEventLifecycle('queue_error', {
          error,
          metadata: {
            timestamp: new Date(),
            queueName: 'email-events',
          },
        });
      }
    });

    this.emailQueue.on('waiting', (jobId) => {
      this.logger.debug(`Job ${jobId} is waiting in queue`);
    });

    this.emailQueue.on('removed', (jobId) => {
      this.logger.debug(`Job ${jobId} removed from queue`);
    });

    this.emailQueue.on('cleaned', (jobs, type) => {
      this.logger.log(`Queue cleaned: ${jobs.length} ${type} jobs removed`);
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
        `Redis queue connection failed after ${this.maxReconnectAttempts} attempts. ` +
        `Manual intervention required.`
      );
      return;
    }

    const delay = this.calculateReconnectDelay(this.reconnectAttempts);
    this.logger.warn(
      `Redis queue connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}). ` +
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
        `Redis queue reconnection failed after ${this.maxReconnectAttempts} attempts. ` +
        `Queue will continue to retry automatically via BullMQ.`
      );
      return;
    }

    const delay = this.calculateReconnectDelay(this.reconnectAttempts);

    this.logger.log(
      `Attempting Redis queue reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) ` +
      `in ${delay}ms`
    );

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.redisConnection.connect();
      this.logger.log('Redis queue reconnection successful');
      this.reconnectAttempts = 0;
    } catch (error) {
      this.logger.error(
        `Redis queue reconnection attempt ${this.reconnectAttempts} failed:`,
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
   * Publish email event to queue with resilience features
   * Enhanced with exactly-once processing and crash recovery
   * @param event - Email event to publish
   * @returns Job ID for tracking
   */
  async publishEvent(event: EmailEvent): Promise<string> {
    // Check if we're shutting down
    if (this.isShuttingDown) {
      throw new Error('Cannot publish events during shutdown');
    }

    try {
      // Validate event before publishing
      this.validateEvent(event);

      // Generate deterministic job ID for exactly-once processing
      // This prevents duplicate events if the same event is published multiple times
      const jobId = this.generateJobId(event);
      const contentHash = this.hashEventContent(event);

      // Log deduplication attempt before publishing
      EmailFlowLogger.logDeduplicationStatus(
        event.type,
        (event as any).orderId || 'N/A',
        jobId,
        contentHash,
        false, // Will be determined after job creation
        Math.floor(event.timestamp.getTime() / this.getDeduplicationWindowSize(event.type))
      );

      // Add job to queue with priority and deduplication
      const job = await this.emailQueue.add(
        event.type,
        event,
        {
          priority: this.getEventPriority(event.type),
          jobId, // Ensures exactly-once processing
          // Additional resilience options
          delay: 0, // No delay for immediate processing
          removeOnComplete: {
            age: 24 * 60 * 60 * 1000, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 60 * 60 * 1000, // Keep failed jobs for 7 days
            count: 500, // Keep last 500 failed jobs for analysis
          },
        }
      );

      // Check if job was deduplicated (BullMQ returns existing job if jobId exists)
      const wasDeduped = job.id !== jobId;
      const actualJobId = job.id!;

      // Enhanced logging with deduplication status
      this.logger.log(
        `Email event published: ${event.type} (Job ID: ${actualJobId}) | ` +
        `Priority: ${this.getEventPriority(event.type)} | ` +
        `Locale: ${event.locale} | ` +
        `Deduped: ${wasDeduped} | ` +
        `Hash: ${contentHash} | ` +
        `Window: ${this.getDeduplicationWindowSize(event.type)}ms`
      );

      // Log structured event creation for monitoring
      if (this.monitoringService) {
        this.monitoringService.logEventLifecycle('created', {
          jobId: actualJobId,
          eventType: event.type,
          locale: event.locale,
          metadata: {
            priority: this.getEventPriority(event.type),
            timestamp: event.timestamp,
            isDuplicate: wasDeduped,
            contentHash,
            deduplicationWindow: this.getDeduplicationWindowSize(event.type),
            originalJobId: jobId,
          },
        });
      }

      // Log duplicate detection if event was deduplicated
      if (wasDeduped) {
        EmailFlowLogger.logDuplicateEventDetection(
          event.type,
          (event as any).orderId || 'N/A',
          (event as any).orderNumber || 'N/A',
          actualJobId,
          jobId,
          contentHash
        );

        this.logger.warn(
          `Duplicate event detected and deduplicated: ${event.type} | ` +
          `Original Job: ${actualJobId} | ` +
          `Duplicate Job: ${jobId} | ` +
          `Hash: ${contentHash}`
        );
      }

      // Update deduplication status log with final result
      EmailFlowLogger.logDeduplicationStatus(
        event.type,
        (event as any).orderId || 'N/A',
        actualJobId,
        contentHash,
        wasDeduped,
        Math.floor(event.timestamp.getTime() / this.getDeduplicationWindowSize(event.type))
      );

      return actualJobId;
    } catch (error) {
      this.logger.error(
        `Failed to publish email event: ${event.type}`,
        error instanceof Error ? error.stack : error
      );

      // Enhanced error handling for resilience
      if (this.isConnectionError(error)) {
        this.logger.warn(
          `Connection error while publishing ${event.type} - will be retried automatically`
        );
        // BullMQ will handle retries automatically
      }

      // Log structured event creation failure for monitoring
      if (this.monitoringService) {
        this.monitoringService.logEventLifecycle('failed', {
          eventType: event.type,
          locale: event.locale,
          error,
          metadata: {
            phase: 'creation',
            timestamp: event.timestamp,
            isConnectionError: this.isConnectionError(error),
          },
        });
      }

      throw error;
    }
  }

  /**
   * Generate deterministic job ID for exactly-once processing
   * Enhanced with improved deduplication logic and extended time windows
   * @param event - Email event
   * @returns Unique job ID based on event content
   */
  private generateJobId(event: EmailEvent): string {
    // Create a deterministic ID based on event content
    // This ensures the same event content always gets the same ID
    const contentHash = this.hashEventContent(event);
    const timestamp = event.timestamp.getTime();

    // Enhanced deduplication time windows based on event type
    let timeWindow: number;
    if (event.type === EmailEventType.ORDER_CONFIRMATION_RESEND) {
      // Extended window for resend events to prevent multiple resends
      timeWindow = Math.floor(timestamp / (15 * 60 * 1000)); // 15-minute windows
    } else if (event.type === EmailEventType.ORDER_CONFIRMATION) {
      // Extended window for order confirmations to handle duplicate order creation calls
      timeWindow = Math.floor(timestamp / (5 * 60 * 1000)); // 5-minute windows
    } else if (event.type === EmailEventType.ADMIN_ORDER_NOTIFICATION) {
      // Extended window for admin notifications
      timeWindow = Math.floor(timestamp / (3 * 60 * 1000)); // 3-minute windows
    } else {
      // Standard window for other event types
      timeWindow = Math.floor(timestamp / (2 * 60 * 1000)); // 2-minute windows
    }

    const jobId = `${event.type}-${contentHash}-${timeWindow}`;

    // Log deduplication parameters for debugging
    this.logger.debug(
      `Generated job ID: ${jobId} | ` +
      `Event: ${event.type} | ` +
      `Hash: ${contentHash} | ` +
      `Time window: ${timeWindow} | ` +
      `Window size: ${this.getDeduplicationWindowSize(event.type)}ms`
    );

    return jobId;
  }

  /**
   * Create a simple hash of event content for deduplication
   * Enhanced with more unique fields for better deduplication accuracy
   * @param event - Email event
   * @returns Content hash
   */
  private hashEventContent(event: EmailEvent): string {
    // Create a comprehensive hash based on key event properties
    const keyContent = {
      type: event.type,
      locale: event.locale,
      // Include timestamp minute for additional uniqueness while allowing deduplication
      timestampMinute: Math.floor(event.timestamp.getTime() / (60 * 1000)),
      // Include type-specific identifiers with more fields
      ...(event.type.includes('ORDER') && {
        orderId: (event as any).orderId,
        orderNumber: (event as any).orderNumber,
        customerEmail: (event as any).customerEmail
      }),
      ...(event.type.includes('USER') && {
        userId: (event as any).userId,
        userEmail: (event as any).userEmail
      }),
      ...(event.type === EmailEventType.CONTACT_FORM && {
        senderEmail: (event as any).senderEmail,
        senderName: (event as any).senderName,
        // Include first 200 chars of message for better uniqueness
        messageHash: this.simpleStringHash((event as any).message?.substring(0, 200) || '')
      }),
      ...(event.type === EmailEventType.PASSWORD_RESET && {
        userId: (event as any).userId,
        userEmail: (event as any).userEmail,
        // Include partial reset token for uniqueness (first 8 chars)
        resetTokenPrefix: (event as any).resetToken?.substring(0, 8)
      }),
      ...(event.type === EmailEventType.SHIPPING_NOTIFICATION && {
        orderId: (event as any).orderId,
        orderNumber: (event as any).orderNumber,
        trackingNumber: (event as any).trackingNumber
      }),
      ...(event.type === EmailEventType.ORDER_STATUS_UPDATE && {
        orderId: (event as any).orderId,
        orderNumber: (event as any).orderNumber,
        newStatus: (event as any).newStatus
      })
    };

    // Enhanced hash function with better distribution
    const str = JSON.stringify(keyContent, Object.keys(keyContent).sort());
    return this.simpleStringHash(str);
  }

  /**
   * Simple but effective string hash function
   * @param str - String to hash
   * @returns Hash string
   */
  private simpleStringHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return '0';

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive base36 string for readability
    return Math.abs(hash).toString(36);
  }

  /**
   * Get deduplication window size for an event type
   * @param eventType - Email event type
   * @returns Window size in milliseconds
   */
  private getDeduplicationWindowSize(eventType: EmailEventType): number {
    const windowSizes = {
      [EmailEventType.ORDER_CONFIRMATION_RESEND]: 15 * 60 * 1000, // 15 minutes
      [EmailEventType.INVOICE_EMAIL]: 10 * 60 * 1000, // 10 minutes
      [EmailEventType.ORDER_CONFIRMATION]: 5 * 60 * 1000, // 5 minutes
      [EmailEventType.ADMIN_ORDER_NOTIFICATION]: 3 * 60 * 1000, // 3 minutes
      [EmailEventType.SHIPPING_NOTIFICATION]: 2 * 60 * 1000, // 2 minutes
      [EmailEventType.ORDER_STATUS_UPDATE]: 2 * 60 * 1000, // 2 minutes
      [EmailEventType.ORDER_CANCELLATION]: 3 * 60 * 1000, // 3 minutes
      [EmailEventType.ADMIN_CANCELLATION_NOTIFICATION]: 3 * 60 * 1000, // 3 minutes
      [EmailEventType.PAYMENT_STATUS_UPDATE]: 2 * 60 * 1000, // 2 minutes
      [EmailEventType.WELCOME_EMAIL]: 2 * 60 * 1000, // 2 minutes
      [EmailEventType.PASSWORD_RESET]: 2 * 60 * 1000, // 2 minutes
      [EmailEventType.CONTACT_FORM]: 2 * 60 * 1000, // 2 minutes
    };

    return windowSizes[eventType] || 2 * 60 * 1000; // Default 2 minutes
  }

  /**
   * Check if error is a connection-related error
   * @param error - Error to check
   * @returns true if connection error
   */
  private isConnectionError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const connectionErrors = [
      'connection',
      'redis',
      'timeout',
      'network',
      'econnreset',
      'enotfound',
      'etimedout',
      'econnrefused',
    ];

    return connectionErrors.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Validate email event structure and required fields
   * @param event - Email event to validate
   * @throws Error if validation fails
   */
  private validateEvent(event: EmailEvent): void {
    // Validate event type
    if (!event.type || !Object.values(EmailEventType).includes(event.type)) {
      throw new Error(`Invalid email event type: ${event.type}`);
    }

    // Validate locale
    if (!event.locale || !['en', 'vi'].includes(event.locale)) {
      throw new Error(`Invalid locale: ${event.locale}`);
    }

    // Validate timestamp
    if (!event.timestamp || !(event.timestamp instanceof Date)) {
      throw new Error('Invalid or missing timestamp');
    }

    // Type-specific validation
    switch (event.type) {
      case EmailEventType.ORDER_CONFIRMATION:
        this.validateOrderConfirmationEvent(event);
        break;

      case EmailEventType.ORDER_CONFIRMATION_RESEND:
        this.validateOrderConfirmationResendEvent(event);
        break;

      case EmailEventType.INVOICE_EMAIL:
        this.validateInvoiceEmailEvent(event);
        break;

      case EmailEventType.ADMIN_ORDER_NOTIFICATION:
        this.validateAdminOrderNotificationEvent(event);
        break;

      case EmailEventType.SHIPPING_NOTIFICATION:
        this.validateShippingNotificationEvent(event);
        break;

      case EmailEventType.ORDER_STATUS_UPDATE:
        this.validateOrderStatusUpdateEvent(event);
        break;

      case EmailEventType.PAYMENT_STATUS_UPDATE:
        this.validatePaymentStatusUpdateEvent(event);
        break;

      case EmailEventType.WELCOME_EMAIL:
        this.validateWelcomeEmailEvent(event);
        break;

      case EmailEventType.PASSWORD_RESET:
        this.validatePasswordResetEvent(event);
        break;

      case EmailEventType.CONTACT_FORM:
        this.validateContactFormEvent(event);
        break;

      case EmailEventType.ORDER_CANCELLATION:
        this.validateOrderCancellationEvent(event);
        break;

      case EmailEventType.ADMIN_CANCELLATION_NOTIFICATION:
        this.validateAdminCancellationNotificationEvent(event);
        break;

      default:
        throw new Error(`Unknown email event type: ${(event as any).type}`);
    }
  }

  /**
   * Validate order confirmation event fields
   */
  private validateOrderConfirmationEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Order confirmation events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Order confirmation events require valid orderNumber');
    }
    if (!event.customerEmail || !this.isValidEmail(event.customerEmail)) {
      throw new Error('Order confirmation events require valid customerEmail');
    }
    if (!event.customerName || typeof event.customerName !== 'string') {
      throw new Error('Order confirmation events require valid customerName');
    }
  }

  /**
   * Validate order confirmation resend event fields
   */
  private validateOrderConfirmationResendEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Order confirmation resend events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Order confirmation resend events require valid orderNumber');
    }
    if (!event.customerEmail || !this.isValidEmail(event.customerEmail)) {
      throw new Error('Order confirmation resend events require valid customerEmail');
    }
    if (!event.customerName || typeof event.customerName !== 'string') {
      throw new Error('Order confirmation resend events require valid customerName');
    }
  }

  /**
   * Validate invoice email event fields
   */
  private validateInvoiceEmailEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Invoice email events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Invoice email events require valid orderNumber');
    }
    if (!event.customerEmail || !this.isValidEmail(event.customerEmail)) {
      throw new Error('Invoice email events require valid customerEmail');
    }
    if (!event.customerName || typeof event.customerName !== 'string') {
      throw new Error('Invoice email events require valid customerName');
    }
    // adminUserId is optional
    if (event.adminUserId && typeof event.adminUserId !== 'string') {
      throw new Error('Invoice email events require valid adminUserId if provided');
    }
  }

  /**
   * Validate admin order notification event fields
   */
  private validateAdminOrderNotificationEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Admin order notification events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Admin order notification events require valid orderNumber');
    }
  }

  /**
   * Validate shipping notification event fields
   */
  private validateShippingNotificationEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Shipping notification events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Shipping notification events require valid orderNumber');
    }
    // trackingNumber is optional
  }

  /**
   * Validate order status update event fields
   */
  private validateOrderStatusUpdateEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Order status update events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Order status update events require valid orderNumber');
    }
    if (!event.newStatus || typeof event.newStatus !== 'string') {
      throw new Error('Order status update events require valid newStatus');
    }
  }

  /**
   * Validate payment status update event fields
   */
  private validatePaymentStatusUpdateEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Payment status update events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Payment status update events require valid orderNumber');
    }
    if (!event.customerEmail || !this.isValidEmail(event.customerEmail)) {
      throw new Error('Payment status update events require valid customerEmail');
    }
    if (!event.customerName || typeof event.customerName !== 'string') {
      throw new Error('Payment status update events require valid customerName');
    }
    if (!event.paymentStatus || typeof event.paymentStatus !== 'string') {
      throw new Error('Payment status update events require valid paymentStatus');
    }
  }

  /**
   * Validate welcome email event fields
   */
  private validateWelcomeEmailEvent(event: any): void {
    if (!event.userId || typeof event.userId !== 'string') {
      throw new Error('Welcome email events require valid userId');
    }
    if (!event.userEmail || !this.isValidEmail(event.userEmail)) {
      throw new Error('Welcome email events require valid userEmail');
    }
    if (!event.userName || typeof event.userName !== 'string') {
      throw new Error('Welcome email events require valid userName');
    }
  }

  /**
   * Validate password reset event fields
   */
  private validatePasswordResetEvent(event: any): void {
    if (!event.userId || typeof event.userId !== 'string') {
      throw new Error('Password reset events require valid userId');
    }
    if (!event.userEmail || !this.isValidEmail(event.userEmail)) {
      throw new Error('Password reset events require valid userEmail');
    }
    if (!event.resetToken || typeof event.resetToken !== 'string') {
      throw new Error('Password reset events require valid resetToken');
    }
  }

  /**
   * Validate contact form event fields
   */
  private validateContactFormEvent(event: any): void {
    if (!event.senderName || typeof event.senderName !== 'string') {
      throw new Error('Contact form events require valid senderName');
    }
    if (!event.senderEmail || !this.isValidEmail(event.senderEmail)) {
      throw new Error('Contact form events require valid senderEmail');
    }
    if (!event.message || typeof event.message !== 'string') {
      throw new Error('Contact form events require valid message');
    }
  }

  /**
   * Validate order cancellation event fields
   */
  private validateOrderCancellationEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Order cancellation events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Order cancellation events require valid orderNumber');
    }
    if (!event.customerEmail || !this.isValidEmail(event.customerEmail)) {
      throw new Error('Order cancellation events require valid customerEmail');
    }
    if (!event.customerName || typeof event.customerName !== 'string') {
      throw new Error('Order cancellation events require valid customerName');
    }
  }

  /**
   * Validate admin cancellation notification event fields
   */
  private validateAdminCancellationNotificationEvent(event: any): void {
    if (!event.orderId || typeof event.orderId !== 'string') {
      throw new Error('Admin cancellation notification events require valid orderId');
    }
    if (!event.orderNumber || typeof event.orderNumber !== 'string') {
      throw new Error('Admin cancellation notification events require valid orderNumber');
    }
  }

  /**
   * Validate email address format
   * @param email - Email address to validate
   * @returns true if email is valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // RFC 5322 compliant email regex (simplified but robust)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email);
  }

  /**
   * Get priority for event type
   * Lower number = higher priority
   * @param type - Email event type
   * @returns Priority number
   */
  private getEventPriority(type: EmailEventType): number {
    const priorities = {
      [EmailEventType.PASSWORD_RESET]: 1, // Highest priority
      [EmailEventType.ORDER_CONFIRMATION]: 2,
      [EmailEventType.ORDER_CONFIRMATION_RESEND]: 2, // Same priority as original confirmation
      [EmailEventType.INVOICE_EMAIL]: 2, // Same priority as order confirmation
      [EmailEventType.ADMIN_ORDER_NOTIFICATION]: 2,
      [EmailEventType.ORDER_CANCELLATION]: 3, // High priority for cancellations
      [EmailEventType.ADMIN_CANCELLATION_NOTIFICATION]: 3, // High priority for admin notifications
      [EmailEventType.PAYMENT_STATUS_UPDATE]: 4, // Important payment updates
      [EmailEventType.SHIPPING_NOTIFICATION]: 4,
      [EmailEventType.ORDER_STATUS_UPDATE]: 5,
      [EmailEventType.WELCOME_EMAIL]: 6,
      [EmailEventType.CONTACT_FORM]: 7, // Lowest priority
    };

    return priorities[type] || 10;
  }

  /**
   * Get queue metrics for monitoring
   * @returns Queue statistics
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  // ========================================
  // JOB MANAGEMENT METHODS FOR ADMIN
  // ========================================

  /**
   * Get failed jobs for admin interface
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns Array of failed jobs with details
   */
  async getFailedJobs(start: number = 0, end: number = 50) {
    try {
      const failedJobs = await this.emailQueue.getFailed(start, end);

      return failedJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
        opts: {
          attempts: job.opts.attempts,
          backoff: job.opts.backoff,
          priority: job.opts.priority,
        },
        stacktrace: job.stacktrace,
        timestamp: job.timestamp,
      }));
    } catch (error) {
      this.logger.error('Failed to get failed jobs:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Get completed jobs for admin interface
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns Array of completed jobs with details
   */
  async getCompletedJobs(start: number = 0, end: number = 50) {
    try {
      const completedJobs = await this.emailQueue.getCompleted(start, end);

      return completedJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        returnvalue: job.returnvalue,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
        opts: {
          attempts: job.opts.attempts,
          priority: job.opts.priority,
        },
        timestamp: job.timestamp,
      }));
    } catch (error) {
      this.logger.error('Failed to get completed jobs:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Get waiting jobs for admin interface
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns Array of waiting jobs with details
   */
  async getWaitingJobs(start: number = 0, end: number = 50) {
    try {
      const waitingJobs = await this.emailQueue.getWaiting(start, end);

      return waitingJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        opts: {
          attempts: job.opts.attempts,
          backoff: job.opts.backoff,
          priority: job.opts.priority,
          delay: job.opts.delay,
        },
        timestamp: job.timestamp,
      }));
    } catch (error) {
      this.logger.error('Failed to get waiting jobs:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Get active jobs for admin interface
   * @param start - Start index for pagination
   * @param end - End index for pagination
   * @returns Array of active jobs with details
   */
  async getActiveJobs(start: number = 0, end: number = 50) {
    try {
      const activeJobs = await this.emailQueue.getActive(start, end);

      return activeJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
        opts: {
          attempts: job.opts.attempts,
          priority: job.opts.priority,
        },
        timestamp: job.timestamp,
      }));
    } catch (error) {
      this.logger.error('Failed to get active jobs:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Get a specific job by ID
   * @param jobId - Job ID to retrieve
   * @returns Job details or null if not found
   */
  async getJob(jobId: string) {
    try {
      const job = await this.emailQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        attemptsMade: job.attemptsMade,
        stacktrace: job.stacktrace,
        timestamp: job.timestamp,
      };
    } catch (error) {
      this.logger.error(`Failed to get job ${jobId}:`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Retry a failed job
   * @param jobId - Job ID to retry
   * @returns Success status and message
   */
  async retryJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const job = await this.emailQueue.getJob(jobId);

      if (!job) {
        return {
          success: false,
          message: `Job ${jobId} not found`,
        };
      }

      if (job.finishedOn && !job.failedReason) {
        return {
          success: false,
          message: `Job ${jobId} is already completed successfully`,
        };
      }

      await job.retry();

      this.logger.log(`Job ${jobId} queued for retry`);

      return {
        success: true,
        message: `Job ${jobId} has been queued for retry`,
      };
    } catch (error) {
      this.logger.error(`Failed to retry job ${jobId}:`, error instanceof Error ? error.stack : error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove a job from the queue
   * @param jobId - Job ID to remove
   * @returns Success status and message
   */
  async removeJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const job = await this.emailQueue.getJob(jobId);

      if (!job) {
        return {
          success: false,
          message: `Job ${jobId} not found`,
        };
      }

      await job.remove();

      this.logger.log(`Job ${jobId} removed from queue`);

      return {
        success: true,
        message: `Job ${jobId} has been removed from the queue`,
      };
    } catch (error) {
      this.logger.error(`Failed to remove job ${jobId}:`, error instanceof Error ? error.stack : error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clean completed jobs older than specified age
   * @param olderThan - Age in milliseconds (default: 24 hours)
   * @param limit - Maximum number of jobs to clean (default: 100)
   * @returns Number of jobs cleaned
   */
  async cleanCompletedJobs(olderThan: number = 24 * 60 * 60 * 1000, limit: number = 100): Promise<number> {
    try {
      const cleaned = await this.emailQueue.clean(olderThan, limit, 'completed');
      this.logger.log(`Cleaned ${cleaned.length} completed jobs older than ${olderThan}ms`);
      return cleaned.length;
    } catch (error) {
      this.logger.error('Failed to clean completed jobs:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Clean failed jobs older than specified age
   * @param olderThan - Age in milliseconds (default: 7 days)
   * @param limit - Maximum number of jobs to clean (default: 100)
   * @returns Number of jobs cleaned
   */
  async cleanFailedJobs(olderThan: number = 7 * 24 * 60 * 60 * 1000, limit: number = 100): Promise<number> {
    try {
      const cleaned = await this.emailQueue.clean(olderThan, limit, 'failed');
      this.logger.log(`Cleaned ${cleaned.length} failed jobs older than ${olderThan}ms`);
      return cleaned.length;
    } catch (error) {
      this.logger.error('Failed to clean failed jobs:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Pause the queue (stop processing new jobs)
   * @returns Success status and message
   */
  async pauseQueue(): Promise<{ success: boolean; message: string }> {
    try {
      await this.emailQueue.pause();
      this.logger.log('Email queue paused');
      return {
        success: true,
        message: 'Email queue has been paused',
      };
    } catch (error) {
      this.logger.error('Failed to pause queue:', error instanceof Error ? error.stack : error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Resume the queue (start processing jobs again)
   * @returns Success status and message
   */
  async resumeQueue(): Promise<{ success: boolean; message: string }> {
    try {
      await this.emailQueue.resume();
      this.logger.log('Email queue resumed');
      return {
        success: true,
        message: 'Email queue has been resumed',
      };
    } catch (error) {
      this.logger.error('Failed to resume queue:', error instanceof Error ? error.stack : error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get queue status (paused/active)
   * @returns Queue status information
   */
  async getQueueStatus() {
    try {
      const isPaused = await this.emailQueue.isPaused();
      return {
        isPaused,
        status: isPaused ? 'paused' : 'active',
      };
    } catch (error) {
      this.logger.error('Failed to get queue status:', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  /**
   * Graceful shutdown - close queue connections
   * Enhanced with comprehensive cleanup and timeout handling
   */
  async onModuleDestroy() {
    this.logger.log('Initiating graceful email publisher shutdown...');
    this.isShuttingDown = true;

    const startTime = Date.now();

    try {
      // Step 1: Close the queue gracefully
      if (this.emailQueue) {
        this.logger.log('Closing email queue...');
        await Promise.race([
          this.emailQueue.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Queue close timeout')), 10000)
          )
        ]);
        this.logger.log('Email queue closed successfully');
      }

      // Step 2: Close Redis connection
      if (this.redisConnection) {
        this.logger.log('Closing Redis connection...');
        await this.redisConnection.quit();
        this.logger.log('Redis connection closed successfully');
      }

      const shutdownTime = Date.now() - startTime;
      this.logger.log(`Email publisher shutdown completed successfully in ${shutdownTime}ms`);

    } catch (error) {
      const shutdownTime = Date.now() - startTime;
      this.logger.error(
        `Error during graceful publisher shutdown (${shutdownTime}ms):`,
        error instanceof Error ? error.stack : error
      );

      // Force close if graceful shutdown fails
      await this.forceShutdown();
    }
  }

  /**
   * Force shutdown when graceful shutdown fails
   */
  private async forceShutdown(): Promise<void> {
    this.logger.warn('Attempting force shutdown of email publisher...');

    try {
      if (this.emailQueue) {
        // Force close queue
        await Promise.race([
          this.emailQueue.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Force close timeout')), 3000)
          )
        ]);
        this.logger.warn('Email queue force-closed');
      }

      if (this.redisConnection) {
        // Force disconnect Redis
        this.redisConnection.disconnect();
        this.logger.warn('Redis connection force-disconnected');
      }

    } catch (forceError) {
      this.logger.error(
        'Failed to force-close email publisher:',
        forceError instanceof Error ? forceError.stack : forceError
      );
    }
  }

  /**
   * Get publisher health status for monitoring
   * Enhanced with resilience status information
   * @returns Comprehensive publisher health information
   */
  async getPublisherHealth() {
    try {
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

      // Get queue metrics
      const queueMetrics = await this.getQueueMetrics();

      return {
        status: this.isShuttingDown ? 'shutting_down' : 'healthy',
        connection: redisStatus,
        queue: queueMetrics,
        resilience: {
          isShuttingDown: this.isShuttingDown,
          reconnectAttempts: this.reconnectAttempts,
          maxReconnectAttempts: this.maxReconnectAttempts,
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
        connection: 'error',
        error: error instanceof Error ? error.message : String(error),
        resilience: {
          isShuttingDown: this.isShuttingDown,
          reconnectAttempts: this.reconnectAttempts,
        },
      };
    }
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
      this.logger.log('Manual publisher reconnection triggered');
      await this.redisConnection.disconnect();
      await this.redisConnection.connect();

      this.reconnectAttempts = 0;

      return {
        success: true,
        message: 'Publisher reconnection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ========================================
  // BACKWARD COMPATIBILITY METHODS
  // ========================================
  // These methods provide the same interface as EmailService
  // to maintain compatibility with existing code

  /**
   * Send email using the queue system (backward compatibility)
   * Maps to the existing EmailService.sendEmail interface
   * @param options - Email options matching EmailService interface
   * @returns Promise<boolean> - Always returns true for compatibility (actual result handled by worker)
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // This is a generic email send that we need to map to a specific event type
      // Since we can't determine the exact type from the interface alone,
      // we'll create a generic contact form event as a fallback
      // In practice, existing services should be updated to use specific event methods

      this.logger.warn(
        'Using generic sendEmail method - consider using specific event methods for better categorization'
      );

      const event: EmailEvent = {
        type: EmailEventType.CONTACT_FORM,
        locale: options.locale || 'en',
        timestamp: new Date(),
        senderName: 'System', // Default for generic emails
        senderEmail: options.to,
        message: `Subject: ${options.subject}\n\nContent: ${this.extractTextFromHtml(options.html)}`,
      };

      await this.publishEvent(event);

      // Return true immediately for backward compatibility
      // The actual email sending will be handled asynchronously by the worker
      return true;
    } catch (error) {
      this.logger.error('Failed to queue generic email:', error instanceof Error ? error.stack : error);
      // Return false to maintain EmailService behavior
      return false;
    }
  }

  /**
   * Send email with attachment using the queue system (backward compatibility)
   * Maps to the existing EmailService.sendEmailWithAttachment interface
   * @param options - Email options with attachments
   * @returns Promise<boolean> - Always returns true for compatibility
   */
  async sendEmailWithAttachment(options: EmailAttachmentOptions): Promise<boolean> {
    try {
      this.logger.warn(
        'Email attachments not yet supported in queue system - falling back to contact form event'
      );

      // For now, we'll send the email content without attachments
      // TODO: Implement attachment support in the queue system
      const event: EmailEvent = {
        type: EmailEventType.CONTACT_FORM,
        locale: options.locale || 'en',
        timestamp: new Date(),
        senderName: 'System',
        senderEmail: options.to,
        message: `Subject: ${options.subject}\n\nContent: ${this.extractTextFromHtml(options.html)}\n\nNote: ${options.attachments?.length || 0} attachment(s) were requested but not supported in queue mode`,
      };

      await this.publishEvent(event);
      return true;
    } catch (error) {
      this.logger.error('Failed to queue email with attachment:', error instanceof Error ? error.stack : error);
      return false;
    }
  }

  // ========================================
  // SPECIFIC EMAIL EVENT METHODS
  // ========================================
  // These methods provide a more structured way to send emails
  // and should be preferred over the generic sendEmail method

  /**
   * Send order confirmation email
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param customerEmail - Customer email
   * @param customerName - Customer name
   * @param locale - Email locale
   * @returns Job ID for tracking
   */
  async sendOrderConfirmation(
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.ORDER_CONFIRMATION,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
      customerEmail,
      customerName,
    };

    // Log email event publication for flow tracking
    EmailFlowLogger.logEmailEventPublication(
      event.type,
      orderId,
      orderNumber,
      customerEmail,
      'pending', // Will be updated after publishing
      locale
    );

    const publishedJobId = await this.publishEvent(event);

    // Update the log with actual job ID
    EmailFlowLogger.logEmailEventPublication(
      event.type,
      orderId,
      orderNumber,
      customerEmail,
      publishedJobId,
      locale
    );

    return publishedJobId;
  }

  /**
   * Send invoice email with PDF attachment
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param customerEmail - Customer email
   * @param customerName - Customer name
   * @param locale - Email locale
   * @param adminUserId - Optional admin user ID who triggered the invoice
   * @returns Job ID for tracking
   */
  async sendInvoiceEmail(
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    locale: 'en' | 'vi' = 'en',
    adminUserId?: string
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.INVOICE_EMAIL,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      adminUserId,
    };

    // Log email event publication for flow tracking
    EmailFlowLogger.logEmailEventPublication(
      event.type,
      orderId,
      orderNumber,
      customerEmail,
      'pending', // Will be updated after publishing
      locale
    );

    const publishedJobId = await this.publishEvent(event);

    // Update the log with actual job ID
    EmailFlowLogger.logEmailEventPublication(
      event.type,
      orderId,
      orderNumber,
      customerEmail,
      publishedJobId,
      locale
    );

    return publishedJobId;
  }

  /**
   * Send admin order notification
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param locale - Email locale
   * @returns Job ID for tracking
   */
  async sendAdminOrderNotification(
    orderId: string,
    orderNumber: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.ADMIN_ORDER_NOTIFICATION,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
    };

    return this.publishEvent(event);
  }

  /**
   * Send shipping notification
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param trackingNumber - Optional tracking number
   * @param locale - Email locale
   * @returns Job ID for tracking
   */
  async sendShippingNotification(
    orderId: string,
    orderNumber: string,
    trackingNumber?: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.SHIPPING_NOTIFICATION,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
      trackingNumber,
    };

    return this.publishEvent(event);
  }

  /**
   * Send order status update
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param newStatus - New order status
   * @param locale - Email locale
   * @returns Job ID for tracking
   */
  async sendOrderStatusUpdate(
    orderId: string,
    orderNumber: string,
    newStatus: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.ORDER_STATUS_UPDATE,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
      newStatus,
    };

    return this.publishEvent(event);
  }

  /**
   * Send welcome email
   * @param userId - User ID
   * @param userEmail - User email
   * @param userName - User name
   * @param locale - Email locale
   * @returns Job ID for tracking
   */
  async sendWelcomeEmail(
    userId: string,
    userEmail: string,
    userName: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.WELCOME_EMAIL,
      locale,
      timestamp: new Date(),
      userId,
      userEmail,
      userName,
    };

    return this.publishEvent(event);
  }

  /**
   * Send password reset email
   * @param userId - User ID
   * @param userEmail - User email
   * @param resetToken - Password reset token
   * @param locale - Email locale
   * @returns Job ID for tracking
   */
  async sendPasswordReset(
    userId: string,
    userEmail: string,
    resetToken: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.PASSWORD_RESET,
      locale,
      timestamp: new Date(),
      userId,
      userEmail,
      resetToken,
    };

    return this.publishEvent(event);
  }

  /**
   * Send contact form notification
   * @param senderName - Sender name
   * @param senderEmail - Sender email
   * @param message - Contact message
   * @param locale - Email locale
   * @returns Job ID for tracking
   */
  async sendContactForm(
    senderName: string,
    senderEmail: string,
    message: string,
    locale: 'en' | 'vi' = 'en'
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.CONTACT_FORM,
      locale,
      timestamp: new Date(),
      senderName,
      senderEmail,
      message,
    };

    return this.publishEvent(event);
  }

  /**
   * Send order cancellation notification to customer
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param customerEmail - Customer email address
   * @param customerName - Customer name
   * @param locale - Language locale
   * @param reason - Cancellation reason
   * @returns Job ID for tracking
   */
  async sendOrderCancellation(
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    locale: 'en' | 'vi' = 'en',
    reason?: string
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.ORDER_CANCELLATION,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      cancellationReason: reason,
    };

    return this.publishEvent(event);
  }

  /**
   * Send order cancellation notification to admin
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param locale - Language locale
   * @param reason - Cancellation reason
   * @returns Job ID for tracking
   */
  async sendAdminCancellationNotification(
    orderId: string,
    orderNumber: string,
    locale: 'en' | 'vi' = 'en',
    reason?: string
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.ADMIN_CANCELLATION_NOTIFICATION,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
      cancellationReason: reason,
    };

    return this.publishEvent(event);
  }

  /**
   * Send payment status update notification to customer
   * @param orderId - Order ID
   * @param orderNumber - Order number
   * @param customerEmail - Customer email address
   * @param customerName - Customer name
   * @param paymentStatus - New payment status
   * @param locale - Language locale
   * @param statusMessage - Optional status message
   * @returns Job ID for tracking
   */
  async sendPaymentStatusUpdate(
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    paymentStatus: string,
    locale: 'en' | 'vi' = 'en',
    statusMessage?: string
  ): Promise<string> {
    const event: EmailEvent = {
      type: EmailEventType.PAYMENT_STATUS_UPDATE,
      locale,
      timestamp: new Date(),
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      paymentStatus,
      statusMessage,
    };

    return this.publishEvent(event);
  }

  /**
   * Extract plain text from HTML content
   * @param html - HTML content
   * @returns Plain text
   */
  private extractTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}