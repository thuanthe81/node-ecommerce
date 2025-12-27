/**
 * Enhanced Error Handling Service
 *
 * Provides comprehensive error classification, detailed error codes,
 * graceful degradation, and comprehensive logging for debugging.
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorDetails {
  code: string;
  message: string;
  statusCode: number;
  isRetryable: boolean;
  retryAfter?: number; // seconds
  context?: any;
  technicalDetails?: any;
}

export interface ErrorContext {
  userId?: string;
  userRole?: string;
  orderId?: string;
  orderNumber?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  timestamp?: Date;
}

export enum ErrorCodes {
  // Order-related errors
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_NOT_CANCELLABLE = 'ORDER_NOT_CANCELLABLE',
  ORDER_ALREADY_CANCELLED = 'ORDER_ALREADY_CANCELLED',
  ORDER_ALREADY_SHIPPED = 'ORDER_ALREADY_SHIPPED',
  ORDER_ACCESS_DENIED = 'ORDER_ACCESS_DENIED',

  // Authentication/Authorization errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Rate limiting errors
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_CANCELLATION_REQUESTS = 'TOO_MANY_CANCELLATION_REQUESTS',

  // Service errors
  EMAIL_SERVICE_UNAVAILABLE = 'EMAIL_SERVICE_UNAVAILABLE',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',

  // Generic errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);

  /**
   * Classify and enhance error information
   */
  classifyError(error: any, context?: ErrorContext): ErrorDetails {
    const timestamp = new Date();

    // Log the original error for debugging
    this.logger.error('Error classification requested:', {
      error: error.message || error,
      stack: error.stack,
      context,
      timestamp,
    });

    // Handle known NestJS exceptions
    if (error instanceof HttpException) {
      return this.handleHttpException(error, context);
    }

    // Handle Prisma errors
    if (error.code && error.code.startsWith('P')) {
      return this.handlePrismaError(error, context);
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return {
        code: ErrorCodes.TIMEOUT_ERROR,
        message: 'Request timed out',
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        isRetryable: true,
        context,
        technicalDetails: error,
      };
    }

    // Handle network/connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
        message: 'External service unavailable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        isRetryable: true,
        retryAfter: 60,
        context,
        technicalDetails: error,
      };
    }

    // Default to internal server error
    return {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      isRetryable: false,
      context,
      technicalDetails: error,
    };
  }

  /**
   * Handle NestJS HTTP exceptions
   */
  private handleHttpException(error: HttpException, context?: ErrorContext): ErrorDetails {
    const status = error.getStatus();
    const response = error.getResponse() as any;
    const message = typeof response === 'string' ? response : response.message || error.message;

    let code: string;
    let isRetryable = false;
    let retryAfter: number | undefined;

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        code = this.determineValidationErrorCode(message);
        break;
      case HttpStatus.UNAUTHORIZED:
        code = ErrorCodes.SESSION_EXPIRED;
        break;
      case HttpStatus.FORBIDDEN:
        code = ErrorCodes.ACCESS_DENIED;
        break;
      case HttpStatus.NOT_FOUND:
        code = ErrorCodes.ORDER_NOT_FOUND;
        break;
      case HttpStatus.TOO_MANY_REQUESTS:
        code = ErrorCodes.RATE_LIMITED;
        isRetryable = true;
        retryAfter = 60; // Default retry after 60 seconds
        break;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        code = ErrorCodes.INTERNAL_SERVER_ERROR;
        isRetryable = true;
        break;
      case HttpStatus.SERVICE_UNAVAILABLE:
        code = ErrorCodes.SERVICE_UNAVAILABLE;
        isRetryable = true;
        retryAfter = 120;
        break;
      default:
        code = ErrorCodes.INTERNAL_SERVER_ERROR;
        isRetryable = status >= 500;
    }

    return {
      code,
      message,
      statusCode: status,
      isRetryable,
      retryAfter,
      context,
      technicalDetails: response,
    };
  }

  /**
   * Handle Prisma database errors
   */
  private handlePrismaError(error: any, context?: ErrorContext): ErrorDetails {
    let code: string;
    let message: string;
    let statusCode: number;
    let isRetryable = false;

    switch (error.code) {
      case 'P2002': // Unique constraint violation
        code = ErrorCodes.INVALID_INPUT;
        message = 'A record with this information already exists';
        statusCode = HttpStatus.CONFLICT;
        break;
      case 'P2025': // Record not found
        code = ErrorCodes.ORDER_NOT_FOUND;
        message = 'The requested record was not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;
      case 'P1001': // Can't reach database server
      case 'P1002': // Database server timeout
        code = ErrorCodes.DATABASE_CONNECTION_ERROR;
        message = 'Database connection error';
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        isRetryable = true;
        break;
      default:
        code = ErrorCodes.INTERNAL_SERVER_ERROR;
        message = 'A database error occurred';
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        isRetryable = true;
    }

    return {
      code,
      message,
      statusCode,
      isRetryable,
      context,
      technicalDetails: error,
    };
  }

  /**
   * Determine specific validation error codes based on message content
   */
  private determineValidationErrorCode(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('cannot be cancelled')) {
      if (lowerMessage.includes('already cancelled')) {
        return ErrorCodes.ORDER_ALREADY_CANCELLED;
      }
      if (lowerMessage.includes('shipped')) {
        return ErrorCodes.ORDER_ALREADY_SHIPPED;
      }
      return ErrorCodes.ORDER_NOT_CANCELLABLE;
    }

    if (lowerMessage.includes('status')) {
      return ErrorCodes.INVALID_ORDER_STATUS;
    }

    return ErrorCodes.INVALID_INPUT;
  }

  /**
   * Create a standardized HTTP exception with enhanced error details
   */
  createHttpException(errorDetails: ErrorDetails): HttpException {
    const response = {
      statusCode: errorDetails.statusCode,
      message: errorDetails.message,
      error: this.getErrorName(errorDetails.statusCode),
      code: errorDetails.code,
      isRetryable: errorDetails.isRetryable,
      retryAfter: errorDetails.retryAfter,
      timestamp: new Date().toISOString(),
    };

    // Add retry-after header for rate limited requests
    const headers: any = {};
    if (errorDetails.retryAfter) {
      headers['Retry-After'] = errorDetails.retryAfter.toString();
    }

    return new HttpException(response, errorDetails.statusCode);
  }

  /**
   * Handle email service failures with graceful degradation
   */
  handleEmailServiceFailure(error: any, context?: ErrorContext): ErrorDetails {
    this.logger.warn('Email service failure detected:', {
      error: error.message,
      context,
      timestamp: new Date(),
    });

    return {
      code: ErrorCodes.EMAIL_SERVICE_UNAVAILABLE,
      message: 'Email notification service is temporarily unavailable',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      isRetryable: true,
      retryAfter: 300, // Retry after 5 minutes
      context,
      technicalDetails: error,
    };
  }

  /**
   * Log comprehensive error information for debugging
   */
  logError(error: any, context?: ErrorContext, additionalInfo?: any): void {
    const errorDetails = this.classifyError(error, context);

    const logData = {
      errorCode: errorDetails.code,
      message: errorDetails.message,
      statusCode: errorDetails.statusCode,
      isRetryable: errorDetails.isRetryable,
      context: errorDetails.context,
      additionalInfo,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    };

    // Use appropriate log level based on error severity
    if (errorDetails.statusCode >= 500) {
      this.logger.error('Server error occurred:', logData);
    } else if (errorDetails.statusCode >= 400) {
      this.logger.warn('Client error occurred:', logData);
    } else {
      this.logger.log('Error handled:', logData);
    }

    // In production, this could also:
    // - Send to external monitoring services (Sentry, DataDog, etc.)
    // - Trigger alerts for critical errors
    // - Store in dedicated error tracking database
    // - Generate error reports for analysis
  }

  /**
   * Get human-readable error name from HTTP status code
   */
  private getErrorName(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too Many Requests';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }

  /**
   * Check if an error should trigger a retry mechanism
   */
  shouldRetry(error: any): boolean {
    const errorDetails = this.classifyError(error);
    return errorDetails.isRetryable;
  }

  /**
   * Get retry delay for retryable errors
   */
  getRetryDelay(error: any, attemptNumber: number = 1): number {
    const errorDetails = this.classifyError(error);

    if (!errorDetails.isRetryable) {
      return 0;
    }

    if (errorDetails.retryAfter) {
      return errorDetails.retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }
}