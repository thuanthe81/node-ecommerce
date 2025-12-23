import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EmailService } from '../../notifications/services/email.service';
import { EmailTemplateService } from '../../notifications/services/email-template.service';
import { EmailEventPublisher } from '../../email-queue/services/email-event-publisher.service';
import { EmailEventType } from '../../email-queue/types/email-event.types';
import { PDFGeneratorService } from '../pdf-generator.service';
import { DocumentStorageService } from './document-storage.service';
import { PDFErrorHandlerService } from './pdf-error-handler.service';
import { PDFMonitoringService } from './pdf-monitoring.service';
import { PDFAuditService } from './pdf-audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FooterSettingsService } from '../../footer-settings/footer-settings.service';
import { BusinessInfoService } from '../../common/services/business-info.service';
import { EmailTestingUtils } from '../../common/utils/email-testing.utils';
import {
  OrderPDFData,
  SimplifiedEmailTemplate,
  EmailSendResult,
  ResendResult,
  RateLimitResult, BusinessInfoData,
} from '../types/pdf.types';
import * as fs from 'fs';
import { SYSTEM } from '../../common/constants';

interface DeliveryAttempt {
  timestamp: Date;
  success: boolean;
  error?: string;
  retryCount: number;
}

interface EmailDeliveryLog {
  orderNumber: string;
  customerEmail: string;
  attempts: DeliveryAttempt[];
  finalStatus: 'delivered' | 'failed' | 'pending';
  lastAttempt: Date;
}

@Injectable()
export class EmailAttachmentService {
  private readonly logger = new Logger(EmailAttachmentService.name);
  private readonly rateLimitMap = new Map<
    string,
    { count: number; resetTime: Date }
  >();
  private readonly deliveryLogs = new Map<string, EmailDeliveryLog>();
  private readonly MAX_RESEND_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW_HOURS = 1;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds

  constructor(
    private emailService: EmailService,
    private emailTemplateService: EmailTemplateService,
    @Inject(forwardRef(() => EmailEventPublisher))
    private emailEventPublisher: EmailEventPublisher,
    private pdfGeneratorService: PDFGeneratorService,
    private documentStorageService: DocumentStorageService,
    @Inject(forwardRef(() => PDFErrorHandlerService))
    private errorHandlerService: PDFErrorHandlerService,
    private monitoringService: PDFMonitoringService,
    private auditService: PDFAuditService,
    private prismaService: PrismaService,
    private footerSettingsService: FooterSettingsService,
    private businessInfoService: BusinessInfoService,
  ) {}

  /**
   * Send order confirmation email with PDF attachment
   * @param customerEmail - Customer's email address
   * @param orderData - Complete order data for PDF generation
   * @param locale - Language locale for email and PDF
   * @returns Promise<EmailSendResult> - Result of email sending operation
   */
  async sendOrderConfirmationWithPDF(
    customerEmail: string,
    orderData: OrderPDFData,
    locale: 'en' | 'vi' = 'en',
  ): Promise<EmailSendResult> {
    const startTime = Date.now();
    let auditId: string | undefined;

    try {
      this.logger.log(
        `Sending order confirmation with PDF for order ${orderData.orderNumber} to ${customerEmail}`,
      );

      // Start audit logging
      auditId = await this.auditService.logEmailSending(
        orderData.orderNumber,
        customerEmail,
        locale,
        'started',
        {
          emailTemplate: 'simplified',
          deliveryAttempts: 1,
          finalDeliveryStatus: 'queued',
        },
      );

      // Generate PDF first
      const pdfResult = await this.pdfGeneratorService.generateOrderPDF(
        orderData,
        locale,
      );

      if (!pdfResult.success) {
        const duration = Date.now() - startTime;
        const error = `PDF generation failed: ${pdfResult.error}`;

        // Log PDF generation failure
        if (auditId) {
          await this.auditService.logEmailSending(
            orderData.orderNumber,
            customerEmail,
            locale,
            'failed',
            {
              emailTemplate: 'simplified',
              deliveryAttempts: 1,
              finalDeliveryStatus: 'failed',
            },
            duration,
            error,
          );
        }

        // Record performance metric
        this.monitoringService.recordPerformanceMetric(
          'email_delivery',
          duration,
          false,
          {
            error: 'pdf_generation_failed',
            orderNumber: orderData.orderNumber,
          },
        );

        this.logger.error(
          `PDF generation failed for order ${orderData.orderNumber}: ${pdfResult.error}`,
        );
        return {
          success: false,
          error,
          deliveryStatus: 'failed',
          timestamp: new Date(),
        };
      }

      // Generate email template using the proper template service
      const orderEmailData = this.mapOrderPDFDataToEmailData(orderData);
      const emailTemplate = await this.emailTemplateService.getOrderConfirmationTemplate(
        orderEmailData,
        locale,
      );

      // Convert to SimplifiedEmailTemplate format for compatibility
      const simplifiedTemplate: SimplifiedEmailTemplate = {
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.html,
        textContent: this.extractTextFromHtml(emailTemplate.html), // Extract text version from HTML
      };

      // Verify email content formatting if testing utilities are enabled
      if (EmailTestingUtils.isTestModeEnabled()) {
        const verificationResult = EmailTestingUtils.verifyEmailContentFormatting(
          simplifiedTemplate.htmlContent,
          simplifiedTemplate.textContent,
          simplifiedTemplate.subject,
          orderData.orderNumber,
        );

        if (!verificationResult.isValid) {
          this.logger.warn(
            `Email content verification failed for order ${orderData.orderNumber}: ${verificationResult.errors.join(', ')}`,
          );
        }

        if (verificationResult.warnings.length > 0) {
          this.logger.warn(
            `Email content verification warnings for order ${orderData.orderNumber}: ${verificationResult.warnings.join(', ')}`,
          );
        }
      }

      // Send email with PDF attachment
      const emailResult = await this.sendEmailWithAttachment(
        customerEmail,
        simplifiedTemplate,
        pdfResult.filePath!,
        pdfResult.fileName!,
      );

      // Track email count for testing
      if (emailResult.success) {
        EmailTestingUtils.incrementEmailCount(orderData.orderNumber, 'order_confirmation');
      }

      if (emailResult.success) {
        // Schedule PDF cleanup after successful email
        await this.documentStorageService.schedulePDFCleanup(
          pdfResult.filePath!,
          24,
        ); // 24 hours retention
      }

      return {
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
        attachmentSize: pdfResult.fileSize,
        deliveryStatus: emailResult.success ? 'sent' : 'failed',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation with PDF: ${error.message}`,
        error,
      );
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        deliveryStatus: 'failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Resend order confirmation email with PDF using async email queue
   * @param orderNumber - Order number to resend
   * @param customerEmail - Customer's email address
   * @param locale - Language locale
   * @returns Promise<ResendResult> - Result of resend operation
   */
  async resendOrderConfirmation(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi' = 'vi',
  ): Promise<ResendResult> {
    const startTime = Date.now();
    let auditId: string | undefined;

    try {
      this.logger.log(
        `Processing async resend request for order ${orderNumber} to ${customerEmail}`,
      );

      // Check rate limiting first
      const rateLimitResult = await this.checkRateLimit(customerEmail);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          message:
            locale === 'vi'
              ? `Bạn đã vượt quá giới hạn gửi lại. Vui lòng thử lại sau ${rateLimitResult.resetTime.toLocaleTimeString()}`
              : `Rate limit exceeded. Please try again after ${rateLimitResult.resetTime.toLocaleTimeString()}`,
          rateLimited: true,
        };
      }

      // Increment rate limit counter before processing
      this.incrementRateLimitCounter(customerEmail);

      // Start audit logging
      auditId = await this.auditService.logEmailSending(
        orderNumber,
        customerEmail,
        locale,
        'started',
        {
          emailTemplate: 'async_queue',
          deliveryAttempts: 1,
          finalDeliveryStatus: 'queued',
        },
      );

      // Validate order exists and email matches
      const order = await this.prismaService.order.findUnique({
        where: { orderNumber },
        select: {
          id: true,
          email: true,
          orderNumber: true,
          status: true,
          createdAt: true,
          shippingAddress: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!order) {
        const error = 'Order not found';
        if (auditId) {
          await this.auditService.logEmailSending(
            orderNumber,
            customerEmail,
            locale,
            'failed',
            {
              emailTemplate: 'async_queue',
              deliveryAttempts: 1,
              finalDeliveryStatus: 'failed',
            },
            Date.now() - startTime,
            error,
          );
        }

        return {
          success: false,
          message:
            locale === 'vi'
              ? 'Không tìm thấy đơn hàng'
              : 'Order not found',
          error,
        };
      }

      // Verify email matches order email (case-insensitive)
      if (order.email.toLowerCase() !== customerEmail.toLowerCase()) {
        const error = 'Email address does not match order email';
        if (auditId) {
          await this.auditService.logEmailSending(
            orderNumber,
            customerEmail,
            locale,
            'failed',
            {
              emailTemplate: 'async_queue',
              deliveryAttempts: 1,
              finalDeliveryStatus: 'failed',
            },
            Date.now() - startTime,
            error,
          );
        }

        return {
          success: false,
          message:
            locale === 'vi'
              ? 'Email không khớp với email đơn hàng'
              : 'Email address does not match order email',
          error,
        };
      }

      // Check if order is recent enough to resend (within 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (order.createdAt < thirtyDaysAgo) {
        const error = 'Order is too old to resend email';
        if (auditId) {
          await this.auditService.logEmailSending(
            orderNumber,
            customerEmail,
            locale,
            'failed',
            {
              emailTemplate: 'async_queue',
              deliveryAttempts: 1,
              finalDeliveryStatus: 'failed',
            },
            Date.now() - startTime,
            error,
          );
        }

        return {
          success: false,
          message:
            locale === 'vi'
              ? 'Đơn hàng quá cũ để gửi lại email'
              : 'Order is too old to resend email',
          error,
        };
      }

      // Instead of sending PDF directly, queue an ORDER_CONFIRMATION_RESEND event
      // This will be processed asynchronously by the EmailWorker with PDF attachment
      this.logger.log(`[resendOrderConfirmation] Queuing ORDER_CONFIRMATION_RESEND event for order: ${orderNumber}`);

      const customerName = order.shippingAddress?.fullName || 'Customer';

      const jobId = await this.emailEventPublisher.publishEvent({
        type: EmailEventType.ORDER_CONFIRMATION_RESEND,
        locale,
        timestamp: new Date(),
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        customerName,
      });

      // Log successful queuing
      if (auditId) {
        await this.auditService.logEmailSending(
          orderNumber,
          customerEmail,
          locale,
          'completed',
          {
            emailTemplate: 'async_queue',
            deliveryAttempts: 1,
            finalDeliveryStatus: 'queued',
          },
          Date.now() - startTime,
        );
      }

      this.logger.log(
        `Resend email event queued successfully for order ${orderNumber} to ${customerEmail} (Job ID: ${jobId})`,
      );

      return {
        success: true,
        message:
          locale === 'vi'
            ? 'Email xác nhận đã được đưa vào hàng đợi và sẽ được gửi sớm'
            : 'Order confirmation email has been queued and will be sent shortly',
      };

    } catch (error) {
      this.logger.error(
        `Failed to queue resend order confirmation for ${orderNumber}:`,
        error,
      );

      if (auditId) {
        await this.auditService.logEmailSending(
          orderNumber,
          customerEmail,
          locale,
          'failed',
          {
            emailTemplate: 'async_queue',
            deliveryAttempts: 1,
            finalDeliveryStatus: 'failed',
          },
          Date.now() - startTime,
          error.message,
        );
      }

      return {
        success: false,
        message:
          locale === 'vi'
            ? 'Đã xảy ra lỗi khi đưa email vào hàng đợi. Vui lòng thử lại sau.'
            : 'An error occurred while queuing the email. Please try again later.',
        error: error.message,
      };
    }
  }

  /**
   * Map OrderPDFData to OrderEmailData format
   * @param orderData - Order PDF data
   * @returns OrderEmailData - Data formatted for email templates
   */
  private mapOrderPDFDataToEmailData(orderData: OrderPDFData): any {
    return {
      orderNumber: orderData.orderNumber,
      customerName: orderData.customerInfo.name,
      orderDate: orderData.orderDate,
      items: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.totalPrice,
        sku: item.sku,
        nameEn: item.name, // For template compatibility
        nameVi: item.name, // For template compatibility
      })),
      subtotal: orderData.pricing.subtotal,
      shippingCost: orderData.pricing.shippingCost,
      taxAmount: orderData.pricing.taxAmount,
      discountAmount: orderData.pricing.discountAmount,
      total: orderData.pricing.total,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod.displayName,
      paymentStatus: orderData.paymentMethod.status,
      shippingMethod: orderData.shippingMethod.name,
      customerEmail: orderData.customerInfo.email,
      customerPhone: orderData.customerInfo.phone,
      notes: '', // Add if needed
    };
  }

  /**
   * Extract plain text from HTML content
   * @param html - HTML content
   * @returns Plain text version
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
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Send email with PDF attachment using swaks
   * @param to - Recipient email address
   * @param template - Email template
   * @param pdfFilePath - Path to PDF file
   * @param pdfFileName - Name of PDF file
   * @returns Promise<EmailSendResult> - Result of email sending
   */
  private async sendEmailWithAttachment(
    to: string,
    template: SimplifiedEmailTemplate,
    pdfFilePath: string,
    pdfFileName: string,
  ): Promise<EmailSendResult> {
    try {
      // Check if PDF file exists
      if (!fs.existsSync(pdfFilePath)) {
        throw new Error(`PDF file not found: ${pdfFilePath}`);
      }

      const pdfBuffer = fs.readFileSync(pdfFilePath);

      // Validate attachment size and compress if needed
      const maxSize = 25 * 1024 * 1024; // 25MB
      let finalPdfPath = pdfFilePath;
      let finalPdfFileName = pdfFileName;

      if (pdfBuffer.length > maxSize) {
        this.logger.warn(
          `PDF attachment is large (${Math.round(pdfBuffer.length / 1024 / 1024)}MB), attempting compression`,
        );

        // In a real implementation, you would compress the PDF here
        // For now, we'll just log a warning and proceed
        this.logger.warn('PDF compression not implemented, sending large file');
      }

      // Test email client compatibility
      const compatibilityResult = this.testEmailClientCompatibility(
        template.htmlContent,
      );
      if (compatibilityResult.warnings.length > 0) {
        this.logger.warn(
          'Email client compatibility warnings:',
          compatibilityResult.warnings,
        );
      }

      // Use the email service with attachment support
      const emailResult = await this.emailService.sendEmailWithAttachment({
        to,
        subject: template.subject,
        html: template.htmlContent,
        attachments: [
          {
            filename: finalPdfFileName,
            path: finalPdfPath,
            contentType: SYSTEM.MIME_TYPES.PDF,
          },
        ],
      });

      return {
        success: emailResult,
        messageId: emailResult ? `msg-${Date.now()}` : undefined,
        error: emailResult ? undefined : 'Email sending failed',
        attachmentSize: pdfBuffer.length,
        deliveryStatus: emailResult ? 'sent' : 'failed',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email with attachment: ${error.message}`,
        error,
      );
      return {
        success: false,
        error: error.message,
        deliveryStatus: 'failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test email client compatibility for HTML content
   * @param htmlContent - HTML content to test
   * @returns Compatibility test result
   */
  private testEmailClientCompatibility(htmlContent: string): {
    isCompatible: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for potentially problematic HTML elements
    if (htmlContent.includes('<script')) {
      warnings.push('Script tags are not supported in most email clients');
    }

    if (htmlContent.includes('<link')) {
      warnings.push(
        'External stylesheets may not be supported in all email clients',
      );
    }

    if (
      htmlContent.includes('position: absolute') ||
      htmlContent.includes('position: fixed')
    ) {
      warnings.push(
        'Absolute/fixed positioning may not work in all email clients',
      );
    }

    if (htmlContent.includes('background-image')) {
      warnings.push('Background images may not display in all email clients');
    }

    // Check for overly complex CSS
    const cssComplexityScore = (htmlContent.match(/style="/g) || []).length;
    if (cssComplexityScore > 50) {
      warnings.push(
        'High CSS complexity may cause rendering issues in some email clients',
      );
    }

    // Check for very long lines that might cause issues
    const lines = htmlContent.split('\n');
    const longLines = lines.filter((line) => line.length > 1000);
    if (longLines.length > 0) {
      warnings.push(
        'Very long HTML lines may cause issues in some email clients',
      );
    }

    return {
      isCompatible: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Check rate limiting for resend requests
   * @param email - Customer email address
   * @returns Promise<RateLimitResult> - Rate limit check result
   */
  private async checkRateLimit(email: string): Promise<RateLimitResult> {
    const now = new Date();
    const rateLimitData = this.rateLimitMap.get(email);

    if (!rateLimitData) {
      return {
        allowed: true,
        remainingAttempts: this.MAX_RESEND_ATTEMPTS - 1,
        resetTime: new Date(
          now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
        ),
      };
    }

    // Check if rate limit window has expired
    if (now > rateLimitData.resetTime) {
      this.rateLimitMap.delete(email);
      return {
        allowed: true,
        remainingAttempts: this.MAX_RESEND_ATTEMPTS - 1,
        resetTime: new Date(
          now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
        ),
      };
    }

    // Check if limit exceeded
    if (rateLimitData.count >= this.MAX_RESEND_ATTEMPTS) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: rateLimitData.resetTime,
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.MAX_RESEND_ATTEMPTS - rateLimitData.count - 1,
      resetTime: rateLimitData.resetTime,
    };
  }

  /**
   * Increment rate limit counter for email
   * @param email - Customer email address
   */
  private incrementRateLimitCounter(email: string): void {
    const now = new Date();
    const resetTime = new Date(
      now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const existing = this.rateLimitMap.get(email);
    if (existing && now <= existing.resetTime) {
      existing.count += 1;
    } else {
      this.rateLimitMap.set(email, { count: 1, resetTime });
    }
  }







  /**
   * Generate order link for customer to view order details
   * @param orderId - Order ID to generate link for
   * @returns Direct link to order details page
   */
  private generateOrderLink(orderId: string): string {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Remove trailing slash if present
      const baseUrl = frontendUrl.replace(/\/$/, '');

      // Generate direct link to order details page using order ID
      // Using English locale as default for order links
      const orderLink = `${baseUrl}/en/orders/${encodeURIComponent(orderId)}`;

      this.logger.debug(`Generated order link for order ID ${orderId}: ${orderLink}`);

      return orderLink;
    } catch (error) {
      this.logger.error(`Error generating order link for order ID ${orderId}:`, error);

      // Return fallback link
      const fallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return `${fallbackUrl}/en/account/orders`;
    }
  }





  /**
   * Send email with retry logic and delivery verification
   * @param to - Recipient email address
   * @param template - Email template
   * @param pdfFilePath - Path to PDF file
   * @param pdfFileName - Name of PDF file
   * @param orderNumber - Order number for logging
   * @returns Promise<EmailSendResult & { retryCount?: number }> - Result with retry count
   */
  private async sendEmailWithRetry(
    to: string,
    template: SimplifiedEmailTemplate,
    pdfFilePath: string,
    pdfFileName: string,
    orderNumber: string,
  ): Promise<EmailSendResult & { retryCount?: number }> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        this.logger.log(
          `Email delivery attempt ${attempt + 1}/${this.MAX_RETRY_ATTEMPTS} for order ${orderNumber}`,
        );

        const result = await this.sendEmailWithAttachment(
          to,
          template,
          pdfFilePath,
          pdfFileName,
        );

        if (result.success) {
          this.logger.log(
            `Email delivered successfully on attempt ${attempt + 1} for order ${orderNumber}`,
          );
          return { ...result, retryCount: attempt };
        }

        lastError = result.error;
        this.logger.warn(
          `Email delivery attempt ${attempt + 1} failed for order ${orderNumber}: ${result.error}`,
        );

        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          await this.delay(this.RETRY_DELAY_MS * (attempt + 1)); // Exponential backoff
        }
      } catch (error) {
        lastError = error.message;
        this.logger.error(
          `Email delivery attempt ${attempt + 1} threw error for order ${orderNumber}:`,
          error,
        );

        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
          await this.delay(this.RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    this.logger.error(
      `All email delivery attempts failed for order ${orderNumber}. Last error: ${lastError}`,
    );

    return {
      success: false,
      error: `All ${this.MAX_RETRY_ATTEMPTS} delivery attempts failed. Last error: ${lastError}`,
      deliveryStatus: 'failed',
      timestamp: new Date(),
      retryCount: this.MAX_RETRY_ATTEMPTS,
    };
  }

  /**
   * Initialize delivery log for an order
   * @param orderNumber - Order number
   * @param customerEmail - Customer email address
   */
  private initializeDeliveryLog(
    orderNumber: string,
    customerEmail: string,
  ): void {
    const logKey = `${orderNumber}-${customerEmail}`;

    if (!this.deliveryLogs.has(logKey)) {
      this.deliveryLogs.set(logKey, {
        orderNumber,
        customerEmail,
        attempts: [],
        finalStatus: 'pending',
        lastAttempt: new Date(),
      });
    }
  }

  /**
   * Update delivery log with attempt result
   * @param logKey - Log key (orderNumber-email)
   * @param success - Whether the attempt was successful
   * @param error - Error message if failed
   * @param retryCount - Number of retries attempted
   */
  private updateDeliveryLog(
    logKey: string,
    success: boolean,
    error?: string,
    retryCount: number = 0,
  ): void {
    const log = this.deliveryLogs.get(logKey);
    if (!log) return;

    const attempt: DeliveryAttempt = {
      timestamp: new Date(),
      success,
      error,
      retryCount,
    };

    log.attempts.push(attempt);
    log.finalStatus = success ? 'delivered' : 'failed';
    log.lastAttempt = new Date();

    this.deliveryLogs.set(logKey, log);

    // Log comprehensive delivery status
    this.logger.log(
      `Delivery log updated for ${logKey}: ${success ? 'SUCCESS' : 'FAILED'} (${retryCount} retries)`,
    );
  }





  /**
   * Get delivery status for an order
   * @param orderNumber - Order number
   * @param customerEmail - Customer email address
   * @returns Delivery log or undefined if not found
   */
  getDeliveryStatus(
    orderNumber: string,
    customerEmail: string,
  ): EmailDeliveryLog | undefined {
    const logKey = `${orderNumber}-${customerEmail}`;
    return this.deliveryLogs.get(logKey);
  }

  /**
   * Get delivery statistics
   * @returns Delivery statistics summary
   */
  getDeliveryStatistics(): {
    totalAttempts: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  } {
    const logs = Array.from(this.deliveryLogs.values());
    const totalAttempts = logs.length;
    const successfulDeliveries = logs.filter(
      (log) => log.finalStatus === 'delivered',
    ).length;
    const failedDeliveries = logs.filter(
      (log) => log.finalStatus === 'failed',
    ).length;
    const successRate =
      totalAttempts > 0 ? (successfulDeliveries / totalAttempts) * 100 : 0;

    return {
      totalAttempts,
      successfulDeliveries,
      failedDeliveries,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Fetch order data for resend functionality
   * @param orderNumber - Order number to fetch
   * @param customerEmail - Customer email to validate
   * @returns Promise<OrderPDFData | null> - Order data or null if not found/invalid
   */
  private async fetchOrderDataForResend(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi',
  ): Promise<OrderPDFData | null> {
    try {
      const order = await this.prismaService.order.findUnique({
        where: { orderNumber },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  nameEn: true,
                  nameVi: true,
                  descriptionEn: true,
                  descriptionVi: true,
                  sku: true,
                  price: true,
                  images: true,
                  category: {
                    select: {
                      nameEn: true,
                      nameVi: true,
                    },
                  },
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
          promotion: {
            select: {
              code: true,
              type: true,
              value: true,
            },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Order not found for resend: ${orderNumber}`);
        return null;
      }

      // Verify email matches order email (case-insensitive)
      if (order.email.toLowerCase() !== customerEmail.toLowerCase()) {
        this.logger.warn(
          `Email mismatch for resend order ${orderNumber}: ${customerEmail} vs ${order.email}`,
        );
        return null;
      }

      // Check if order is recent enough to resend (within 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (order.createdAt < thirtyDaysAgo) {
        this.logger.warn(
          `Order too old for resend: ${orderNumber} (${order.createdAt})`,
        );
        return null;
      }

      // Convert order to PDF data format
      const orderPDFData: OrderPDFData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt.toISOString().split('T')[0],
        customerInfo: {
          name:
            order.shippingAddress?.fullName ||
            order.billingAddress?.fullName ||
            'Customer',
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
              fullName: 'Not provided',
              addressLine1: 'Not provided',
              city: 'Not provided',
              state: 'Not provided',
              postalCode: 'Not provided',
              country: 'Not provided',
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
              country: 'Not provided',
            },
        items: order.items.map((item: any) => {
          // Extract image URL properly
          let imageUrl: string | undefined;
          if (
            item.product?.images &&
            Array.isArray(item.product.images) &&
            item.product.images.length > 0
          ) {
            imageUrl = item.product.images[0].url || item.product.images[0];
          }

          return {
            id: item.product.id,
            name: item.product.nameEn, // Will be localized in PDF generation
            description: item.product.descriptionEn,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: Number(item.price),
            totalPrice: Number(item.total),
            imageUrl,
            category: item.product.category?.nameEn,
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
          type: order.paymentMethod as
            | 'bank_transfer'
            | 'cash_on_delivery'
            | 'qr_code',
          displayName: this.getPaymentMethodDisplayName(
            order.paymentMethod,
            'en',
          ), // Will be localized in PDF
          status: order.paymentStatus as 'pending' | 'completed' | 'failed',
          details:
            order.paymentMethod === 'bank_transfer'
              ? 'Bank transfer payment'
              : undefined,
        },
        shippingMethod: {
          name: order.shippingMethod || 'Standard',
          description: this.getShippingMethodDescription(
            order.shippingMethod || 'standard',
            'en',
          ), // Will be localized in PDF
        },
        businessInfo: await this.businessInfoService.getBusinessInfo(locale), // Will be overridden by the locale parameter
        locale, // Will be overridden by the locale parameter
      };

      return orderPDFData;
    } catch (error) {
      this.logger.error(
        `Error fetching order data for resend ${orderNumber}:`,
        error,
      );
      return null;
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
   * Convert Prisma order data to PDF data format
   * @param order - Prisma order object with relations
   * @param locale - Language locale
   * @returns Promise<OrderPDFData> - Order data formatted for PDF generation
   */
  private async mapOrderToPDFData(order: any, locale: 'en' | 'vi'): Promise<OrderPDFData> {
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
   * Delay execution for specified milliseconds
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}