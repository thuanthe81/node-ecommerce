import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailEventPublisher } from '../../email-queue/services/email-event-publisher.service';
import { RateLimitResult } from '../types/pdf.types';
import { hasQuoteItems, validateAllItemsPriced } from '@alacraft/shared';

interface InvoiceRequestLog {
  orderNumber: string;
  customerEmail: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  rateLimited: boolean;
  adminUserId?: string;
}

interface InvoiceResult {
  success: boolean;
  message: string;
  rateLimited?: boolean;
  error?: string;
  pdfGenerated?: boolean;
}

@Injectable()
export class InvoiceEmailHandlerService {
  private readonly logger = new Logger(InvoiceEmailHandlerService.name);
  private readonly rateLimitMap = new Map<string, { count: number; resetTime: Date }>();
  private readonly invoiceLogs: InvoiceRequestLog[] = [];
  private readonly MAX_INVOICE_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW_HOURS = 1;

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EmailEventPublisher))
    private emailEventPublisher: EmailEventPublisher,
  ) {}

  /**
   * Handle invoice email request with comprehensive validation and rate limiting
   * @param orderNumber - Order number to send invoice for
   * @param customerEmail - Customer's email address
   * @param locale - Language locale for email content
   * @param adminUserId - ID of admin user triggering the invoice
   * @returns Promise<InvoiceResult> - Result of invoice operation
   */
  async handleInvoiceRequest(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi' = 'vi',
    adminUserId?: string
  ): Promise<InvoiceResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Processing invoice request for order ${orderNumber} to ${customerEmail} by admin ${adminUserId}`);

      // Get order with items to validate and check quote items
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: {
            include: {
              product: {
                select: {
                  nameEn: true,
                  nameVi: true,
                }
              }
            }
          },
          shippingAddress: {
            select: { fullName: true }
          },
          billingAddress: {
            select: { fullName: true }
          }
        },
      });

      if (!order) {
        this.logInvoiceRequest(orderNumber, customerEmail, false, 'Order not found', false, adminUserId);
        return {
          success: false,
          message: locale === 'vi' ? 'Không tìm thấy đơn hàng' : 'Order not found',
          error: 'Order not found',
        };
      }

      // Validate email matches order email (case-insensitive)
      if (order.email.toLowerCase() !== customerEmail.toLowerCase()) {
        this.logInvoiceRequest(orderNumber, customerEmail, false, 'Email address does not match order email', false, adminUserId);
        return {
          success: false,
          message: this.getLocalizedErrorMessage('Email address does not match order email', locale),
          error: 'Email address does not match order email',
        };
      }

      // Convert order items to the format expected by quote item utilities
      const orderData = {
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          id: item.id,
          name: locale === 'vi' ? item.product.nameVi : item.product.nameEn,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
        })),
      };

      // Check if order has quote items using the utility
      const hasQuotes = hasQuoteItems(orderData);
      const allItemsPriced = validateAllItemsPriced(orderData);

      // Only allow invoice email if all items are priced
      if (hasQuotes && !allItemsPriced) {
        this.logInvoiceRequest(orderNumber, customerEmail, false, 'Order contains items without prices set', false, adminUserId);
        return {
          success: false,
          message: locale === 'vi'
            ? 'Đơn hàng chứa sản phẩm chưa có giá. Vui lòng đặt giá cho tất cả sản phẩm trước khi gửi hóa đơn.'
            : 'Order contains items without prices set. Please set all item prices before sending invoice.',
          error: 'Order contains items without prices set',
        };
      }

      // Check if order is recent enough to send invoice (within 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      if (order.createdAt < ninetyDaysAgo) {
        this.logInvoiceRequest(orderNumber, customerEmail, false, 'Order is too old to send invoice email', false, adminUserId);
        return {
          success: false,
          message: locale === 'vi'
            ? 'Đơn hàng quá cũ để gửi email hóa đơn'
            : 'Order is too old to send invoice email',
          error: 'Order is too old to send invoice email',
        };
      }

      // Check rate limiting
      const rateLimitResult = await this.checkRateLimit(customerEmail);
      if (!rateLimitResult.allowed) {
        this.logInvoiceRequest(orderNumber, customerEmail, false, 'Rate limit exceeded', true, adminUserId);
        return {
          success: false,
          message: this.getLocalizedRateLimitMessage(rateLimitResult, locale),
          rateLimited: true,
        };
      }

      // Increment rate limit counter before processing
      this.incrementRateLimitCounter(customerEmail);

      // Get customer name from addresses
      const customerName = order.shippingAddress?.fullName ||
                          order.billingAddress?.fullName ||
                          'Customer';

      // Use EmailEventPublisher to queue invoice email event
      // The EmailWorker will handle the actual email sending and PDF generation logic
      const jobId = await this.emailEventPublisher.sendInvoiceEmail(
        order.id,
        orderNumber,
        customerEmail,
        customerName,
        locale,
        adminUserId
      );

      // Log the result as successful (event was queued)
      this.logInvoiceRequest(orderNumber, customerEmail, true, undefined, false, adminUserId);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Invoice email event queued successfully in ${processingTime}ms for order ${orderNumber} (Job ID: ${jobId})`);

      return {
        success: true,
        message: locale === 'vi'
          ? 'Email hóa đơn đã được xếp hàng để gửi'
          : 'Invoice email has been queued for sending',
        pdfGenerated: false, // Will be generated by worker
      };

    } catch (error) {
      this.logger.error(`Failed to handle invoice request for order ${orderNumber}:`, error);
      this.logInvoiceRequest(orderNumber, customerEmail, false, error.message, false, adminUserId);

      return {
        success: false,
        message: locale === 'vi'
          ? 'Đã xảy ra lỗi khi gửi email hóa đơn. Vui lòng thử lại sau.'
          : 'An error occurred while sending the invoice email. Please try again later.',
        error: error.message,
      };
    }
  }

  /**
   * Check rate limiting for invoice requests
   * @param email - Customer email address
   * @returns Promise<RateLimitResult> - Rate limit check result
   */
  async checkRateLimit(email: string): Promise<RateLimitResult> {
    const now = new Date();
    const rateLimitData = this.rateLimitMap.get(email.toLowerCase());

    if (!rateLimitData) {
      return {
        allowed: true,
        remainingAttempts: this.MAX_INVOICE_ATTEMPTS - 1,
        resetTime: new Date(now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000),
      };
    }

    // Check if rate limit window has expired
    if (now > rateLimitData.resetTime) {
      this.rateLimitMap.delete(email.toLowerCase());
      return {
        allowed: true,
        remainingAttempts: this.MAX_INVOICE_ATTEMPTS - 1,
        resetTime: new Date(now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000),
      };
    }

    // Check if limit exceeded
    if (rateLimitData.count >= this.MAX_INVOICE_ATTEMPTS) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: rateLimitData.resetTime,
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.MAX_INVOICE_ATTEMPTS - rateLimitData.count - 1,
      resetTime: rateLimitData.resetTime,
    };
  }

  /**
   * Increment rate limit counter for email
   * @param email - Customer email address
   */
  private incrementRateLimitCounter(email: string): void {
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const emailKey = email.toLowerCase();

    const existing = this.rateLimitMap.get(emailKey);
    if (existing && now <= existing.resetTime) {
      existing.count += 1;
    } else {
      this.rateLimitMap.set(emailKey, { count: 1, resetTime });
    }
  }

  /**
   * Log invoice request for monitoring and audit
   * @param orderNumber - Order number
   * @param customerEmail - Customer email
   * @param success - Whether the request was successful
   * @param error - Error message if failed
   * @param rateLimited - Whether the request was rate limited
   * @param adminUserId - ID of admin user who triggered the request
   */
  private logInvoiceRequest(
    orderNumber: string,
    customerEmail: string,
    success: boolean,
    error?: string,
    rateLimited: boolean = false,
    adminUserId?: string
  ): void {
    const logEntry: InvoiceRequestLog = {
      orderNumber,
      customerEmail,
      timestamp: new Date(),
      success,
      error,
      rateLimited,
      adminUserId,
    };

    this.invoiceLogs.push(logEntry);

    // Keep only last 1000 log entries to prevent memory issues
    if (this.invoiceLogs.length > 1000) {
      this.invoiceLogs.splice(0, this.invoiceLogs.length - 1000);
    }

    // Log to console for monitoring
    const status = success ? 'SUCCESS' : 'FAILED';
    const rateLimitInfo = rateLimited ? ' (RATE LIMITED)' : '';
    const adminInfo = adminUserId ? ` by admin ${adminUserId}` : '';
    this.logger.log(`Invoice request ${status}${rateLimitInfo}: ${orderNumber} -> ${customerEmail}${adminInfo}${error ? ` - ${error}` : ''}`);
  }

  /**
   * Get localized error message
   * @param error - Error code or message
   * @param locale - Language locale
   * @returns Localized error message
   */
  private getLocalizedErrorMessage(error: string, locale: 'en' | 'vi'): string {
    const translations = {
      'Invalid order number format': {
        en: 'Invalid order number format',
        vi: 'Định dạng mã đơn hàng không hợp lệ',
      },
      'Invalid email address format': {
        en: 'Invalid email address format',
        vi: 'Định dạng địa chỉ email không hợp lệ',
      },
      'Order not found': {
        en: 'Order not found',
        vi: 'Không tìm thấy đơn hàng',
      },
      'Email address does not match order email': {
        en: 'Email address does not match order email',
        vi: 'Địa chỉ email không khớp với email đơn hàng',
      },
      'Order contains items without prices set. Please set all item prices before sending invoice.': {
        en: 'Order contains items without prices set. Please set all item prices before sending invoice.',
        vi: 'Đơn hàng chứa sản phẩm chưa có giá. Vui lòng đặt giá cho tất cả sản phẩm trước khi gửi hóa đơn.',
      },
      'Order is too old to send invoice email': {
        en: 'Order is too old to send invoice email',
        vi: 'Đơn hàng quá cũ để gửi email hóa đơn',
      },
      'Validation error occurred': {
        en: 'Validation error occurred',
        vi: 'Đã xảy ra lỗi xác thực',
      },
    };

    return translations[error as keyof typeof translations]?.[locale] || error;
  }

  /**
   * Get localized rate limit message
   * @param rateLimitResult - Rate limit result
   * @param locale - Language locale
   * @returns Localized rate limit message
   */
  private getLocalizedRateLimitMessage(rateLimitResult: RateLimitResult, locale: 'en' | 'vi'): string {
    const resetTimeString = rateLimitResult.resetTime.toLocaleTimeString();

    if (locale === 'vi') {
      return `Bạn đã vượt quá giới hạn gửi email hóa đơn. Vui lòng thử lại sau ${resetTimeString}`;
    } else {
      return `You have exceeded the invoice email limit. Please try again after ${resetTimeString}`;
    }
  }

  /**
   * Get invoice statistics for monitoring
   * @returns Invoice statistics summary
   */
  getInvoiceStatistics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitedRequests: number;
    successRate: number;
  } {
    const totalRequests = this.invoiceLogs.length;
    const successfulRequests = this.invoiceLogs.filter(log => log.success).length;
    const failedRequests = this.invoiceLogs.filter(log => !log.success).length;
    const rateLimitedRequests = this.invoiceLogs.filter(log => log.rateLimited).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      rateLimitedRequests,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Get recent invoice logs for monitoring
   * @param limit - Maximum number of logs to return
   * @returns Recent invoice logs
   */
  getRecentInvoiceLogs(limit: number = 50): InvoiceRequestLog[] {
    return this.invoiceLogs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear rate limit for a specific email (admin function)
   * @param email - Email address to clear rate limit for
   */
  clearRateLimit(email: string): void {
    this.rateLimitMap.delete(email.toLowerCase());
    this.logger.log(`Invoice rate limit cleared for ${email}`);
  }

  /**
   * Get current rate limit status for an email
   * @param email - Email address to check
   * @returns Current rate limit status
   */
  getRateLimitStatus(email: string): { count: number; resetTime: Date } | null {
    return this.rateLimitMap.get(email.toLowerCase()) || null;
  }
}