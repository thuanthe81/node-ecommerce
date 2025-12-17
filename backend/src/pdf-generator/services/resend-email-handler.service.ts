import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailAttachmentService } from './email-attachment.service';
import { ResendResult, RateLimitResult, ValidationResult } from '../types/pdf.types';

interface ResendRequestLog {
  orderNumber: string;
  customerEmail: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  rateLimited: boolean;
}

@Injectable()
export class ResendEmailHandlerService {
  private readonly logger = new Logger(ResendEmailHandlerService.name);
  private readonly rateLimitMap = new Map<string, { count: number; resetTime: Date }>();
  private readonly resendLogs: ResendRequestLog[] = [];
  private readonly MAX_RESEND_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW_HOURS = 1;

  constructor(
    private prisma: PrismaService,
    private emailAttachmentService: EmailAttachmentService,
  ) {}

  /**
   * Handle resend email request with comprehensive validation and rate limiting
   * @param orderNumber - Order number to resend
   * @param customerEmail - Customer's email address
   * @param locale - Language locale for email content
   * @returns Promise<ResendResult> - Result of resend operation
   */
  async handleResendRequest(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi' = 'vi'
  ): Promise<ResendResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`Processing resend request for order ${orderNumber} to ${customerEmail}`);

      // Validate the resend request
      const validationResult = await this.validateResendRequest(orderNumber, customerEmail);
      if (!validationResult.isValid) {
        this.logResendRequest(orderNumber, customerEmail, false, validationResult.errors.join(', '), false);
        return {
          success: false,
          message: this.getLocalizedErrorMessage(validationResult.errors.join(', '), locale),
          error: validationResult.errors.join(', '),
        };
      }

      // Check rate limiting
      const rateLimitResult = await this.checkRateLimit(customerEmail);
      if (!rateLimitResult.allowed) {
        this.logResendRequest(orderNumber, customerEmail, false, 'Rate limit exceeded', true);
        return {
          success: false,
          message: this.getLocalizedRateLimitMessage(rateLimitResult, locale),
          rateLimited: true,
        };
      }

      // Increment rate limit counter before processing
      this.incrementRateLimitCounter(customerEmail);

      // Use EmailAttachmentService to resend the email (it handles order fetching and validation internally)
      const resendResult = await this.emailAttachmentService.resendOrderConfirmation(
        orderNumber,
        customerEmail,
        locale
      );

      // Log the result
      this.logResendRequest(orderNumber, customerEmail, resendResult.success, resendResult.error, false);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Resend request processed in ${processingTime}ms for order ${orderNumber}`);

      return resendResult;

    } catch (error) {
      this.logger.error(`Failed to handle resend request for order ${orderNumber}:`, error);
      this.logResendRequest(orderNumber, customerEmail, false, error.message, false);

      return {
        success: false,
        message: locale === 'vi'
          ? 'Đã xảy ra lỗi khi gửi lại email. Vui lòng thử lại sau.'
          : 'An error occurred while resending the email. Please try again later.',
        error: error.message,
      };
    }
  }

  /**
   * Validate resend request with comprehensive checks
   * @param orderNumber - Order number to validate
   * @param customerEmail - Customer email to validate
   * @returns Promise<ValidationResult> - Validation result
   */
  async validateResendRequest(
    orderNumber: string,
    customerEmail: string
  ): Promise<ValidationResult> {
    try {
      // Validate order number format
      if (!orderNumber || typeof orderNumber !== 'string') {
        return {
          isValid: false,
          errors: ['Invalid order number format'],
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!customerEmail || !emailRegex.test(customerEmail)) {
        return {
          isValid: false,
          errors: ['Invalid email address format'],
        };
      }

      // Check if order exists
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        select: {
          id: true,
          email: true,
          orderNumber: true,
          status: true,
          createdAt: true
        },
      });

      if (!order) {
        return {
          isValid: false,
          errors: ['Order not found'],
        };
      }

      // Verify email matches order email (case-insensitive)
      if (order.email.toLowerCase() !== customerEmail.toLowerCase()) {
        return {
          isValid: false,
          errors: ['Email address does not match order email'],
        };
      }

      // Check if order is recent enough to resend (within 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (order.createdAt < thirtyDaysAgo) {
        return {
          isValid: false,
          errors: ['Order is too old to resend email'],
        };
      }

      return {
        isValid: true,
        errors: [],
      };

    } catch (error) {
      this.logger.error('Error validating resend request:', error);
      return {
        isValid: false,
        errors: ['Validation error occurred'],
      };
    }
  }

  /**
   * Check rate limiting for resend requests
   * @param email - Customer email address
   * @returns Promise<RateLimitResult> - Rate limit check result
   */
  async checkRateLimit(email: string): Promise<RateLimitResult> {
    const now = new Date();
    const rateLimitData = this.rateLimitMap.get(email.toLowerCase());

    if (!rateLimitData) {
      return {
        allowed: true,
        remainingAttempts: this.MAX_RESEND_ATTEMPTS - 1,
        resetTime: new Date(now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000),
      };
    }

    // Check if rate limit window has expired
    if (now > rateLimitData.resetTime) {
      this.rateLimitMap.delete(email.toLowerCase());
      return {
        allowed: true,
        remainingAttempts: this.MAX_RESEND_ATTEMPTS - 1,
        resetTime: new Date(now.getTime() + this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000),
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
   * Log resend request for monitoring and audit
   * @param orderNumber - Order number
   * @param customerEmail - Customer email
   * @param success - Whether the request was successful
   * @param error - Error message if failed
   * @param rateLimited - Whether the request was rate limited
   */
  private logResendRequest(
    orderNumber: string,
    customerEmail: string,
    success: boolean,
    error?: string,
    rateLimited: boolean = false
  ): void {
    const logEntry: ResendRequestLog = {
      orderNumber,
      customerEmail,
      timestamp: new Date(),
      success,
      error,
      rateLimited,
    };

    this.resendLogs.push(logEntry);

    // Keep only last 1000 log entries to prevent memory issues
    if (this.resendLogs.length > 1000) {
      this.resendLogs.splice(0, this.resendLogs.length - 1000);
    }

    // Log to console for monitoring
    const status = success ? 'SUCCESS' : 'FAILED';
    const rateLimitInfo = rateLimited ? ' (RATE LIMITED)' : '';
    this.logger.log(`Resend request ${status}${rateLimitInfo}: ${orderNumber} -> ${customerEmail}${error ? ` - ${error}` : ''}`);
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
      'Order is too old to resend email': {
        en: 'Order is too old to resend email',
        vi: 'Đơn hàng quá cũ để gửi lại email',
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
      return `Bạn đã vượt quá giới hạn gửi lại email. Vui lòng thử lại sau ${resetTimeString}`;
    } else {
      return `You have exceeded the email resend limit. Please try again after ${resetTimeString}`;
    }
  }

  /**
   * Get resend statistics for monitoring
   * @returns Resend statistics summary
   */
  getResendStatistics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitedRequests: number;
    successRate: number;
  } {
    const totalRequests = this.resendLogs.length;
    const successfulRequests = this.resendLogs.filter(log => log.success).length;
    const failedRequests = this.resendLogs.filter(log => !log.success).length;
    const rateLimitedRequests = this.resendLogs.filter(log => log.rateLimited).length;
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
   * Get recent resend logs for monitoring
   * @param limit - Maximum number of logs to return
   * @returns Recent resend logs
   */
  getRecentResendLogs(limit: number = 50): ResendRequestLog[] {
    return this.resendLogs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear rate limit for a specific email (admin function)
   * @param email - Email address to clear rate limit for
   */
  clearRateLimit(email: string): void {
    this.rateLimitMap.delete(email.toLowerCase());
    this.logger.log(`Rate limit cleared for ${email}`);
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