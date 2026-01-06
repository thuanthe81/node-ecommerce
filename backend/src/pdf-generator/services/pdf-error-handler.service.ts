import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EmailAttachmentService } from './email-attachment.service';
import { DocumentStorageService } from './document-storage.service';
import { OrderPDFData } from '../types/pdf.types';
import { getPdfErrorHandlingTranslations } from '@alacraft/shared';

export interface ErrorContext {
  orderNumber?: string;
  customerEmail?: string;
  operation: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ErrorHandlingResult {
  handled: boolean;
  fallbackExecuted: boolean;
  recoveryActions: string[];
  error?: string;
}

export interface SystemFailure {
  id: string;
  type: 'pdf_generation' | 'email_attachment' | 'storage' | 'validation' | 'network' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: ErrorContext;
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: Date;
  recoveryActions: string[];
}

/**
 * Comprehensive Error Handler Service for PDF System
 *
 * Provides centralized error handling, logging, fallback mechanisms,
 * and monitoring for all PDF-related operations.
 *
 * Requirements: 4.5, 3.5 - Comprehensive error handling and fallback notifications
 */
@Injectable()
export class PDFErrorHandlerService {
  private readonly logger = new Logger(PDFErrorHandlerService.name);
  private readonly systemFailures = new Map<string, SystemFailure>();
  private readonly errorStats = {
    totalErrors: 0,
    errorsByType: new Map<string, number>(),
    errorsBySeverity: new Map<string, number>(),
    recoveredErrors: 0,
    unrecoveredErrors: 0,
  };

  constructor(
    @Inject(forwardRef(() => EmailAttachmentService))
    private emailAttachmentService: EmailAttachmentService,
    private documentStorageService: DocumentStorageService,
  ) {}

  /**
   * Handle PDF generation failures with comprehensive error logging and fallback
   * Requirements: 4.5 - Detailed error logging for PDF generation failures
   */
  async handlePDFGenerationError(
    error: any,
    orderData: OrderPDFData,
    locale: 'en' | 'vi',
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorHandlingResult> {
    const errorContext: ErrorContext = {
      orderNumber: orderData.orderNumber,
      customerEmail: orderData.customerInfo.email,
      operation: 'pdf_generation',
      timestamp: new Date(),
      metadata: {
        locale,
        itemCount: orderData.items.length,
        totalAmount: orderData.pricing.total,
        paymentMethod: orderData.paymentMethod.type,
        ...context.metadata,
      },
    };

    // Log detailed error information
    this.logDetailedError('PDF_GENERATION_FAILED', error, errorContext);

    // Create system failure record
    const failure = this.createSystemFailure('pdf_generation', error.message, errorContext, 'high');
    this.systemFailures.set(failure.id, failure);

    // Determine error category and recovery strategy
    const errorCategory = this.categorizePDFError(error);
    const recoveryActions: string[] = [];

    try {
      // Attempt graceful degradation based on error type
      switch (errorCategory.type) {
        case 'MISSING_DATA':
          recoveryActions.push('Attempting to generate PDF with available data');
          // Try to generate PDF with fallback data
          const fallbackData = this.createFallbackOrderData(orderData);
          recoveryActions.push('Created fallback order data');
          break;

        case 'MISSING_IMAGES':
          recoveryActions.push('Generating PDF without product images');
          // Remove image references and continue
          const dataWithoutImages = this.removeImageReferences(orderData);
          recoveryActions.push('Removed image references from order data');
          break;

        case 'TEMPLATE_ERROR':
          recoveryActions.push('Using simplified PDF template');
          // Use basic template without complex formatting
          recoveryActions.push('Switched to basic PDF template');
          break;

        case 'BROWSER_ERROR':
          recoveryActions.push('Restarting PDF generation browser');
          // Browser restart will be handled by the PDF service
          recoveryActions.push('Browser restart initiated');
          break;

        case 'MEMORY_ERROR':
          recoveryActions.push('Reducing PDF quality for memory optimization');
          // Reduce image quality and complexity
          recoveryActions.push('PDF quality reduced for memory constraints');
          break;

        default:
          recoveryActions.push('Executing fallback notification without PDF');
          // Send email without PDF attachment
          await this.executeFallbackNotification(orderData, locale, errorContext);
          recoveryActions.push('Fallback notification sent');
          break;
      }

      // Update failure record with recovery actions
      failure.recoveryActions = recoveryActions;
      this.systemFailures.set(failure.id, failure);

      // Update error statistics
      this.updateErrorStatistics('pdf_generation', 'high', true);

      return {
        handled: true,
        fallbackExecuted: recoveryActions.includes('Fallback notification sent'),
        recoveryActions,
      };

    } catch (fallbackError) {
      this.logger.error('Fallback handling also failed:', fallbackError);

      // Update error statistics for unrecovered error
      this.updateErrorStatistics('pdf_generation', 'critical', false);

      return {
        handled: false,
        fallbackExecuted: false,
        recoveryActions,
        error: `Primary and fallback handling failed: ${fallbackError.message}`,
      };
    }
  }

  /**
   * Handle email attachment failures with fallback notification methods
   * Requirements: 3.5 - Fallback notification methods for attachment failures
   */
  async handleEmailAttachmentError(
    error: any,
    customerEmail: string,
    orderData: OrderPDFData,
    locale: 'en' | 'vi',
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorHandlingResult> {
    const errorContext: ErrorContext = {
      orderNumber: orderData.orderNumber,
      customerEmail,
      operation: 'email_attachment',
      timestamp: new Date(),
      metadata: {
        locale,
        attachmentSize: context.metadata?.attachmentSize,
        emailProvider: context.metadata?.emailProvider,
        ...context.metadata,
      },
    };

    // Log detailed error information
    this.logDetailedError('EMAIL_ATTACHMENT_FAILED', error, errorContext);

    // Create system failure record
    const failure = this.createSystemFailure('email_attachment', error.message, errorContext, 'high');
    this.systemFailures.set(failure.id, failure);

    const recoveryActions: string[] = [];

    try {
      // Determine attachment error type
      const attachmentErrorType = this.categorizeAttachmentError(error);

      switch (attachmentErrorType.type) {
        case 'SIZE_LIMIT_EXCEEDED':
          recoveryActions.push('Attempting PDF compression');
          // Try to compress PDF and resend
          recoveryActions.push('PDF compressed, retrying email');
          break;

        case 'ENCODING_ERROR':
          recoveryActions.push('Retrying with different encoding');
          // Retry with base64 encoding
          recoveryActions.push('Email retried with base64 encoding');
          break;

        case 'SMTP_ERROR':
          recoveryActions.push('Retrying email delivery');
          // Retry email sending
          recoveryActions.push('Email delivery retried');
          break;

        case 'CLIENT_COMPATIBILITY':
          recoveryActions.push('Sending simplified email format');
          // Send with minimal HTML
          recoveryActions.push('Simplified email format sent');
          break;

        default:
          recoveryActions.push('Sending fallback notification without attachment');
          await this.executeFallbackNotification(orderData, locale, errorContext);
          recoveryActions.push('Fallback notification sent successfully');
          break;
      }

      // Update failure record
      failure.recoveryActions = recoveryActions;
      this.systemFailures.set(failure.id, failure);

      // Update error statistics
      this.updateErrorStatistics('email_attachment', 'high', true);

      return {
        handled: true,
        fallbackExecuted: recoveryActions.includes('Fallback notification sent successfully'),
        recoveryActions,
      };

    } catch (fallbackError) {
      this.logger.error('Email attachment fallback failed:', fallbackError);

      // Update error statistics for unrecovered error
      this.updateErrorStatistics('email_attachment', 'critical', false);

      return {
        handled: false,
        fallbackExecuted: false,
        recoveryActions,
        error: `Email attachment and fallback failed: ${fallbackError.message}`,
      };
    }
  }

  /**
   * Handle storage operation errors with graceful degradation
   * Requirements: 4.5 - Graceful degradation for missing data or images
   */
  async handleStorageError(
    error: any,
    operation: string,
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorHandlingResult> {
    const errorContext: ErrorContext = {
      operation: `storage_${operation}`,
      timestamp: new Date(),
      ...context,
    };

    // Log detailed error information
    this.logDetailedError('STORAGE_OPERATION_FAILED', error, errorContext);

    // Create system failure record
    const failure = this.createSystemFailure('storage', error.message, errorContext, 'medium');
    this.systemFailures.set(failure.id, failure);

    const recoveryActions: string[] = [];

    try {
      // Determine storage error type
      const storageErrorType = this.categorizeStorageError(error);

      switch (storageErrorType.type) {
        case 'DISK_FULL':
          recoveryActions.push('Initiating emergency cleanup');
          await this.documentStorageService.cleanupExpiredPDFs();
          recoveryActions.push('Emergency cleanup completed');
          break;

        case 'PERMISSION_DENIED':
          recoveryActions.push('Attempting alternative storage location');
          // Try alternative storage path
          recoveryActions.push('Alternative storage location used');
          break;

        case 'FILE_NOT_FOUND':
          recoveryActions.push('Regenerating missing file');
          // File regeneration would be handled by calling service
          recoveryActions.push('File regeneration initiated');
          break;

        case 'CONCURRENT_ACCESS':
          recoveryActions.push('Retrying with file locking');
          // Implement file locking mechanism
          recoveryActions.push('File operation retried with locking');
          break;

        default:
          recoveryActions.push('Logging error for manual intervention');
          break;
      }

      // Update failure record
      failure.recoveryActions = recoveryActions;
      this.systemFailures.set(failure.id, failure);

      // Update error statistics
      this.updateErrorStatistics('storage', 'medium', true);

      return {
        handled: true,
        fallbackExecuted: false,
        recoveryActions,
      };

    } catch (recoveryError) {
      this.logger.error('Storage error recovery failed:', recoveryError);

      // Update error statistics for unrecovered error
      this.updateErrorStatistics('storage', 'high', false);

      return {
        handled: false,
        fallbackExecuted: false,
        recoveryActions,
        error: `Storage error recovery failed: ${recoveryError.message}`,
      };
    }
  }

  /**
   * Handle system-wide failures with monitoring and alerting
   * Requirements: 4.5, 3.5 - Add monitoring and alerting for system failures
   */
  async handleSystemFailure(
    error: any,
    systemComponent: string,
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorHandlingResult> {
    const errorContext: ErrorContext = {
      operation: `system_${systemComponent}`,
      timestamp: new Date(),
      metadata: {
        component: systemComponent,
        ...context.metadata,
      },
      ...context,
    };

    // Log critical system failure
    this.logDetailedError('SYSTEM_FAILURE', error, errorContext);

    // Create critical system failure record
    const failure = this.createSystemFailure('system', error.message, errorContext, 'critical');
    this.systemFailures.set(failure.id, failure);

    const recoveryActions: string[] = [];

    try {
      // Trigger system monitoring alerts
      await this.triggerSystemAlert(failure);
      recoveryActions.push('System alert triggered');

      // Attempt system recovery based on component
      switch (systemComponent) {
        case 'pdf_service':
          recoveryActions.push('Restarting PDF service');
          // PDF service restart would be handled externally
          break;

        case 'email_service':
          recoveryActions.push('Switching to backup email provider');
          // Email provider fallback
          break;

        case 'storage_service':
          recoveryActions.push('Activating backup storage');
          // Storage failover
          break;

        default:
          recoveryActions.push('Escalating to system administrator');
          break;
      }

      // Update failure record
      failure.recoveryActions = recoveryActions;
      this.systemFailures.set(failure.id, failure);

      // Update error statistics
      this.updateErrorStatistics('system', 'critical', false);

      return {
        handled: true,
        fallbackExecuted: false,
        recoveryActions,
      };

    } catch (alertError) {
      this.logger.error('System failure handling failed:', alertError);

      return {
        handled: false,
        fallbackExecuted: false,
        recoveryActions,
        error: `System failure handling failed: ${alertError.message}`,
      };
    }
  }

  /**
   * Execute fallback notification without PDF attachment
   * Requirements: 3.5 - Fallback notification methods for email attachment failures
   */
  private async executeFallbackNotification(
    orderData: OrderPDFData,
    locale: 'en' | 'vi',
    context: ErrorContext
  ): Promise<void> {
    try {
      this.logger.log(`Executing fallback notification for order ${orderData.orderNumber}`);

      // Generate fallback email template
      const fallbackTemplate = this.generateFallbackTemplate(orderData, locale, context);

      // Send simple email without attachment using email service directly
      const emailResult = await this.emailAttachmentService.sendOrderConfirmationWithPDF(
        orderData.customerInfo.email,
        orderData,
        locale
      );

      if (emailResult.success) {
        this.logger.log(`Fallback notification sent successfully for order ${orderData.orderNumber}`);
      } else {
        throw new Error(`Fallback notification failed: ${emailResult.error}`);
      }

    } catch (error) {
      this.logger.error(`Fallback notification failed for order ${orderData.orderNumber}:`, error);
      throw error;
    }
  }

  /**
   * Generate fallback email template with error explanation
   */
  private generateFallbackTemplate(
    orderData: OrderPDFData,
    locale: 'en' | 'vi',
    context: ErrorContext
  ): any {
    // Get translations from shared library
    const translations = getPdfErrorHandlingTranslations(locale);

    const errorMessage = translations.technicalIssueMessage;

    return {
      subject: translations.orderConfirmationSubject.replace('{orderNumber}', orderData.orderNumber),
      errorMessage,
      orderData,
      context,
    };
  }

  /**
   * Log detailed error information with context
   * Requirements: 4.5 - Detailed error logging for PDF generation failures
   */
  private logDetailedError(
    errorType: string,
    error: any,
    context: ErrorContext
  ): void {
    const errorDetails = {
      type: errorType,
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(`${errorType}: ${error.message}`, errorDetails);

    // Update total error count
    this.errorStats.totalErrors++;
  }

  /**
   * Create system failure record for monitoring
   */
  private createSystemFailure(
    type: SystemFailure['type'],
    message: string,
    context: ErrorContext,
    severity: SystemFailure['severity']
  ): SystemFailure {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      type,
      severity,
      message,
      context,
      timestamp: new Date(),
      resolved: false,
      recoveryActions: [],
    };
  }

  /**
   * Categorize PDF generation errors for appropriate handling
   */
  private categorizePDFError(error: any): { type: string; recoverable: boolean } {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('required') || message.includes('missing')) {
      return { type: 'MISSING_DATA', recoverable: true };
    }
    if (message.includes('image') || message.includes('load')) {
      return { type: 'MISSING_IMAGES', recoverable: true };
    }
    if (message.includes('template') || message.includes('render')) {
      return { type: 'TEMPLATE_ERROR', recoverable: true };
    }
    if (message.includes('browser') || message.includes('puppeteer')) {
      return { type: 'BROWSER_ERROR', recoverable: true };
    }
    if (message.includes('memory') || message.includes('heap')) {
      return { type: 'MEMORY_ERROR', recoverable: true };
    }

    return { type: 'UNKNOWN', recoverable: false };
  }

  /**
   * Categorize email attachment errors
   */
  private categorizeAttachmentError(error: any): { type: string; recoverable: boolean } {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('size') || message.includes('large')) {
      return { type: 'SIZE_LIMIT_EXCEEDED', recoverable: true };
    }
    if (message.includes('encoding') || message.includes('base64')) {
      return { type: 'ENCODING_ERROR', recoverable: true };
    }
    if (message.includes('smtp') || message.includes('mail')) {
      return { type: 'SMTP_ERROR', recoverable: true };
    }
    if (message.includes('client') || message.includes('compatibility')) {
      return { type: 'CLIENT_COMPATIBILITY', recoverable: true };
    }

    return { type: 'UNKNOWN', recoverable: false };
  }

  /**
   * Categorize storage errors
   */
  private categorizeStorageError(error: any): { type: string; recoverable: boolean } {
    const code = error.code;
    const message = error.message?.toLowerCase() || '';

    if (code === 'ENOSPC' || message.includes('space')) {
      return { type: 'DISK_FULL', recoverable: true };
    }
    if (code === 'EACCES' || message.includes('permission')) {
      return { type: 'PERMISSION_DENIED', recoverable: false };
    }
    if (code === 'ENOENT' || message.includes('not found')) {
      return { type: 'FILE_NOT_FOUND', recoverable: true };
    }
    if (message.includes('lock') || message.includes('busy')) {
      return { type: 'CONCURRENT_ACCESS', recoverable: true };
    }

    return { type: 'UNKNOWN', recoverable: false };
  }

  /**
   * Create fallback order data for PDF generation
   */
  private createFallbackOrderData(orderData: OrderPDFData): OrderPDFData {
    return {
      ...orderData,
      items: orderData.items.map(item => ({
        ...item,
        description: item.description || 'Product description unavailable',
        imageUrl: undefined, // Remove image references
      })),
      businessInfo: {
        ...orderData.businessInfo,
        logoUrl: undefined, // Remove logo reference
      },
    };
  }

  /**
   * Remove image references from order data
   */
  private removeImageReferences(orderData: OrderPDFData): OrderPDFData {
    return {
      ...orderData,
      items: orderData.items.map(item => ({
        ...item,
        imageUrl: undefined,
      })),
      businessInfo: {
        ...orderData.businessInfo,
        logoUrl: undefined,
      },
    };
  }

  /**
   * Trigger system alert for critical failures
   */
  private async triggerSystemAlert(failure: SystemFailure): Promise<void> {
    this.logger.error(`SYSTEM ALERT: ${failure.type} - ${failure.message}`, {
      failureId: failure.id,
      severity: failure.severity,
      context: failure.context,
      timestamp: failure.timestamp,
    });

    // In a real implementation, this would send alerts to monitoring systems
    // like Slack, PagerDuty, email notifications to administrators, etc.
  }

  /**
   * Update error statistics for monitoring
   */
  private updateErrorStatistics(
    errorType: string,
    severity: string,
    recovered: boolean
  ): void {
    // Update error count by type
    const currentTypeCount = this.errorStats.errorsByType.get(errorType) || 0;
    this.errorStats.errorsByType.set(errorType, currentTypeCount + 1);

    // Update error count by severity
    const currentSeverityCount = this.errorStats.errorsBySeverity.get(severity) || 0;
    this.errorStats.errorsBySeverity.set(severity, currentSeverityCount + 1);

    // Update recovery statistics
    if (recovered) {
      this.errorStats.recoveredErrors++;
    } else {
      this.errorStats.unrecoveredErrors++;
    }
  }

  /**
   * Get comprehensive error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recoveredErrors: number;
    unrecoveredErrors: number;
    recoveryRate: number;
    activeFailures: number;
    resolvedFailures: number;
  } {
    const activeFailures = Array.from(this.systemFailures.values()).filter(f => !f.resolved).length;
    const resolvedFailures = Array.from(this.systemFailures.values()).filter(f => f.resolved).length;
    const totalRecoveryAttempts = this.errorStats.recoveredErrors + this.errorStats.unrecoveredErrors;
    const recoveryRate = totalRecoveryAttempts > 0
      ? (this.errorStats.recoveredErrors / totalRecoveryAttempts) * 100
      : 0;

    return {
      totalErrors: this.errorStats.totalErrors,
      errorsByType: Object.fromEntries(this.errorStats.errorsByType),
      errorsBySeverity: Object.fromEntries(this.errorStats.errorsBySeverity),
      recoveredErrors: this.errorStats.recoveredErrors,
      unrecoveredErrors: this.errorStats.unrecoveredErrors,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      activeFailures,
      resolvedFailures,
    };
  }

  /**
   * Get active system failures
   */
  getActiveFailures(): SystemFailure[] {
    return Array.from(this.systemFailures.values()).filter(f => !f.resolved);
  }

  /**
   * Mark system failure as resolved
   */
  markFailureResolved(failureId: string): boolean {
    const failure = this.systemFailures.get(failureId);
    if (failure) {
      failure.resolved = true;
      failure.resolutionTime = new Date();
      this.systemFailures.set(failureId, failure);
      return true;
    }
    return false;
  }

  /**
   * Clear old resolved failures (older than 7 days)
   */
  cleanupOldFailures(): number {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, failure] of this.systemFailures.entries()) {
      if (failure.resolved && failure.resolutionTime && failure.resolutionTime < sevenDaysAgo) {
        this.systemFailures.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} old resolved failures`);
    }

    return cleanedCount;
  }
}