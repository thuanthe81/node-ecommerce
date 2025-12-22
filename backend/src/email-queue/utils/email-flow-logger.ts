import { Logger } from '@nestjs/common';

/**
 * Email Flow Logger Utility
 *
 * Provides comprehensive logging for email flow investigation.
 * Tracks email events from order creation through delivery.
 * Enhanced with detailed logging for duplicate detection and debugging.
 */
export class EmailFlowLogger {
  private static readonly logger = new Logger('EmailFlowLogger');

  /**
   * Log order creation email trigger
   */
  static logOrderCreationEmailTrigger(
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    locale: string,
    source: string = 'OrdersService'
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'ORDER_CREATION_EMAIL_TRIGGER',
      source,
      orderId,
      orderNumber,
      customerEmail,
      locale,
      stackTrace: this.getCallStack()
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email event publication with enhanced details
   */
  static logEmailEventPublication(
    eventType: string,
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    jobId: string,
    locale: string,
    isDuplicate: boolean = false,
    metadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_EVENT_PUBLICATION',
      eventType,
      orderId,
      orderNumber,
      customerEmail,
      jobId,
      locale,
      isDuplicate,
      metadata,
      stackTrace: this.getCallStack()
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email event processing start
   */
  static logEmailEventProcessingStart(
    jobId: string,
    eventType: string,
    orderId: string,
    attemptNumber: number,
    processingStartTime?: Date
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_EVENT_PROCESSING_START',
      jobId,
      eventType,
      orderId,
      attemptNumber,
      processingStartTime: processingStartTime?.toISOString() || timestamp,
      stackTrace: this.getCallStack()
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email delivery attempt with enhanced details
   */
  static logEmailDeliveryAttempt(
    jobId: string,
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    emailService: string = 'EmailAttachmentService',
    deliveryMetadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_DELIVERY_ATTEMPT',
      jobId,
      orderId,
      orderNumber,
      customerEmail,
      emailService,
      deliveryMetadata,
      stackTrace: this.getCallStack()
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email delivery success with enhanced details
   */
  static logEmailDeliverySuccess(
    jobId: string,
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    deliveryTime: number,
    deliveryMetadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_DELIVERY_SUCCESS',
      jobId,
      orderId,
      orderNumber,
      customerEmail,
      deliveryTime,
      deliveryMetadata,
      stackTrace: this.getCallStack()
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email delivery failure with enhanced error details
   */
  static logEmailDeliveryFailure(
    jobId: string,
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    error: string,
    attemptNumber: number,
    errorMetadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_DELIVERY_FAILURE',
      jobId,
      orderId,
      orderNumber,
      customerEmail,
      error,
      attemptNumber,
      errorMetadata,
      stackTrace: this.getCallStack()
    };

    this.logger.error(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log duplicate event detection with enhanced details
   */
  static logDuplicateEventDetection(
    eventType: string,
    orderId: string,
    orderNumber: string,
    originalJobId: string,
    duplicateJobId: string,
    deduplicationKey: string,
    timeWindow?: number,
    windowSize?: number
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'DUPLICATE_EVENT_DETECTION',
      eventType,
      orderId,
      orderNumber,
      originalJobId,
      duplicateJobId,
      deduplicationKey,
      timeWindow,
      windowSize,
      stackTrace: this.getCallStack()
    };

    this.logger.warn(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log deduplication status with enhanced details
   */
  static logDeduplicationStatus(
    eventType: string,
    orderId: string,
    jobId: string,
    deduplicationKey: string,
    wasDeduped: boolean,
    timeWindow: number,
    windowSize?: number,
    metadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'DEDUPLICATION_STATUS',
      eventType,
      orderId,
      jobId,
      deduplicationKey,
      wasDeduped,
      timeWindow,
      windowSize,
      metadata,
      stackTrace: this.getCallStack()
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email queue job lifecycle events
   */
  static logJobLifecycle(
    jobId: string,
    eventType: string,
    orderId: string,
    lifecycle: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying',
    metadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'JOB_LIFECYCLE',
      jobId,
      eventType,
      orderId,
      lifecycle,
      metadata,
      stackTrace: this.getCallStack()
    };

    const logLevel = lifecycle === 'failed' ? 'error' : 'log';
    this.logger[logLevel](`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email template generation
   */
  static logEmailTemplateGeneration(
    jobId: string,
    orderId: string,
    templateType: string,
    locale: string,
    generationTime?: number,
    templateSize?: number
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_TEMPLATE_GENERATION',
      jobId,
      orderId,
      templateType,
      locale,
      generationTime,
      templateSize,
      stackTrace: this.getCallStack()
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log PDF attachment generation
   */
  static logPDFAttachmentGeneration(
    jobId: string,
    orderId: string,
    orderNumber: string,
    pdfSize?: number,
    generationTime?: number,
    error?: string
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'PDF_ATTACHMENT_GENERATION',
      jobId,
      orderId,
      orderNumber,
      pdfSize,
      generationTime,
      error,
      stackTrace: this.getCallStack()
    };

    const logLevel = error ? 'error' : 'log';
    this.logger[logLevel](`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email service provider response
   */
  static logEmailServiceResponse(
    jobId: string,
    orderId: string,
    provider: string,
    responseStatus: string,
    responseTime: number,
    messageId?: string,
    error?: string
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_SERVICE_RESPONSE',
      jobId,
      orderId,
      provider,
      responseStatus,
      responseTime,
      messageId,
      error,
      stackTrace: this.getCallStack()
    };

    const logLevel = error ? 'error' : 'log';
    this.logger[logLevel](`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email flow summary for an order with enhanced metrics
   */
  static logEmailFlowSummary(
    orderId: string,
    orderNumber: string,
    totalEvents: number,
    totalDeliveries: number,
    duplicatesDetected: number,
    totalProcessingTime?: number,
    errors?: string[]
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_FLOW_SUMMARY',
      orderId,
      orderNumber,
      totalEvents,
      totalDeliveries,
      duplicatesDetected,
      totalProcessingTime,
      errors,
      status: totalDeliveries === 1 ? 'SUCCESS' : 'DUPLICATE_ISSUE'
    };

    if (totalDeliveries > 1 || (errors && errors.length > 0)) {
      this.logger.error(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
    } else {
      this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
    }
  }

  /**
   * Log email queue health and metrics
   */
  static logQueueHealth(
    queueName: string,
    metrics: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    },
    connectionStatus: string
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'QUEUE_HEALTH',
      queueName,
      metrics,
      connectionStatus,
      totalJobs: Object.values(metrics).reduce((sum, count) => sum + count, 0)
    };

    this.logger.log(`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Log email worker startup and shutdown
   */
  static logWorkerLifecycle(
    workerId: string,
    action: 'startup' | 'shutdown' | 'error',
    metadata?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'WORKER_LIFECYCLE',
      workerId,
      action,
      metadata,
      stackTrace: this.getCallStack()
    };

    const logLevel = action === 'error' ? 'error' : 'log';
    this.logger[logLevel](`[EMAIL_FLOW] ${JSON.stringify(logData)}`);
  }

  /**
   * Get simplified call stack for debugging
   */
  private static getCallStack(): string[] {
    const stack = new Error().stack;
    if (!stack) return [];

    return stack
      .split('\n')
      .slice(3, 8) // Skip first 3 lines (Error, this method, caller)
      .map(line => line.trim())
      .filter(line => line.includes('at '))
      .map(line => {
        // Extract just the function name and file
        const match = line.match(/at\s+(.+?)\s+\((.+?)\)/);
        if (match) {
          const [, functionName, filePath] = match;
          const fileName = filePath.split('/').pop() || filePath;
          return `${functionName} (${fileName})`;
        }
        return line.replace('at ', '');
      });
  }

  /**
   * Create a test mode logger that logs everything with extra detail
   */
  static createTestModeLogger(orderId: string) {
    return {
      logStep: (step: string, data: any) => {
        const timestamp = new Date().toISOString();
        const logData = {
          timestamp,
          event: 'TEST_MODE_STEP',
          orderId,
          step,
          data,
          stackTrace: this.getCallStack()
        };
        this.logger.log(`[EMAIL_FLOW_TEST] ${JSON.stringify(logData)}`);
      },

      logDebugging: (message: string, data: any) => {
        const timestamp = new Date().toISOString();
        const logData = {
          timestamp,
          event: 'TEST_MODE_DEBUG',
          orderId,
          message,
          data,
          stackTrace: this.getCallStack()
        };
        this.logger.debug(`[EMAIL_FLOW_TEST] ${JSON.stringify(logData)}`);
      },

      logError: (error: string, data: any) => {
        const timestamp = new Date().toISOString();
        const logData = {
          timestamp,
          event: 'TEST_MODE_ERROR',
          orderId,
          error,
          data,
          stackTrace: this.getCallStack()
        };
        this.logger.error(`[EMAIL_FLOW_TEST] ${JSON.stringify(logData)}`);
      }
    };
  }

  /**
   * Log comprehensive email flow analysis
   */
  static logFlowAnalysis(
    orderId: string,
    analysis: {
      timelineEvents: Array<{
        timestamp: string;
        event: string;
        details: any;
      }>;
      duplicateAnalysis: {
        totalDuplicates: number;
        deduplicationEffectiveness: number;
        duplicatePatterns: string[];
      };
      performanceMetrics: {
        averageProcessingTime: number;
        totalFlowTime: number;
        bottlenecks: string[];
      };
      recommendations: string[];
    }
  ): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event: 'EMAIL_FLOW_ANALYSIS',
      orderId,
      analysis
    };

    this.logger.log(`[EMAIL_FLOW_ANALYSIS] ${JSON.stringify(logData)}`);
  }
}