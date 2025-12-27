/**
 * Enhanced error handling utilities for order operations
 * Provides comprehensive error classification, retry mechanisms, and user-friendly messaging
 */

export interface ErrorDetails {
  code: string;
  message: string;
  isRetryable: boolean;
  retryAfter?: number; // seconds
  userMessage: string;
  technicalDetails?: any;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export class EnhancedError extends Error {
  public readonly code: string;
  public readonly isRetryable: boolean;
  public readonly retryAfter?: number;
  public readonly userMessage: string;
  public readonly technicalDetails?: any;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'EnhancedError';
    this.code = details.code;
    this.isRetryable = details.isRetryable;
    this.retryAfter = details.retryAfter;
    this.userMessage = details.userMessage;
    this.technicalDetails = details.technicalDetails;
  }
}

/**
 * Classifies errors and provides appropriate handling strategies
 */
export function classifyError(error: any, locale: 'en' | 'vi' = 'en'): ErrorDetails {
  // Network errors
  if (!navigator.onLine) {
    return {
      code: 'NETWORK_OFFLINE',
      message: 'No internet connection',
      isRetryable: true,
      userMessage: locale === 'vi'
        ? 'Không có kết nối internet. Vui lòng kiểm tra mạng và thử lại.'
        : 'No internet connection. Please check your network and try again.',
    };
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      code: 'REQUEST_TIMEOUT',
      message: 'Request timed out',
      isRetryable: true,
      userMessage: locale === 'vi'
        ? 'Yêu cầu hết thời gian. Vui lòng thử lại.'
        : 'Request timed out. Please try again.',
    };
  }

  // HTTP errors
  if (error.response?.status) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;

    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: serverMessage || 'Invalid request',
          isRetryable: false,
          userMessage: serverMessage || (locale === 'vi'
            ? 'Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.'
            : 'Invalid request. Please check your information and try again.'),
          technicalDetails: error.response.data,
        };

      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Session expired',
          isRetryable: false,
          userMessage: locale === 'vi'
            ? 'Phiên làm việc đã hết hạn. Vui lòng làm mới trang.'
            : 'Your session has expired. Please refresh the page.',
        };

      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied',
          isRetryable: false,
          userMessage: locale === 'vi'
            ? 'Bạn không có quyền thực hiện hành động này.'
            : 'You do not have permission to perform this action.',
        };

      case 404:
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          isRetryable: false,
          userMessage: locale === 'vi'
            ? 'Không tìm thấy thông tin yêu cầu.'
            : 'The requested information was not found.',
        };

      case 429:
        const retryAfter = parseInt(error.response.headers?.['retry-after']) || 60;
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          isRetryable: true,
          retryAfter,
          userMessage: locale === 'vi'
            ? `Quá nhiều yêu cầu. Vui lòng đợi ${retryAfter} giây trước khi thử lại.`
            : `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVER_ERROR',
          message: 'Server error',
          isRetryable: true,
          userMessage: locale === 'vi'
            ? 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau ít phút.'
            : 'A server error occurred. Please try again in a few minutes.',
          technicalDetails: error.response.data,
        };

      default:
        return {
          code: 'HTTP_ERROR',
          message: serverMessage || `HTTP ${status}`,
          isRetryable: status >= 500,
          userMessage: serverMessage || (locale === 'vi'
            ? 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
            : 'An unexpected error occurred. Please try again.'),
          technicalDetails: error.response.data,
        };
    }
  }

  // Generic errors
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Unknown error',
    isRetryable: true,
    userMessage: locale === 'vi'
      ? 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
      : 'An unexpected error occurred. Please try again or contact support.',
    technicalDetails: error,
  };
}

/**
 * Implements exponential backoff retry mechanism
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const errorDetails = classifyError(error);

      // Don't retry if error is not retryable
      if (!errorDetails.isRetryable) {
        throw new EnhancedError(errorDetails);
      }

      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  // All attempts failed
  const errorDetails = classifyError(lastError);
  throw new EnhancedError(errorDetails);
}

/**
 * Creates a retry function with specific configuration
 */
export function createRetryFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config?: Partial<RetryConfig>
) {
  const retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    ...config,
  };

  return async (...args: T): Promise<R> => {
    return retryWithBackoff(() => fn(...args), retryConfig);
  };
}

/**
 * Checks if the current environment supports retry (online, not rate limited)
 */
export function canRetry(error: EnhancedError): boolean {
  if (!navigator.onLine) {
    return false;
  }

  if (error.code === 'RATE_LIMITED' && error.retryAfter && error.retryAfter > 300) {
    return false; // Don't auto-retry if rate limit is too long
  }

  return error.isRetryable;
}

/**
 * Gets user-friendly error message with retry information
 */
export function getErrorMessage(error: any, locale: 'en' | 'vi' = 'en'): string {
  if (error instanceof EnhancedError) {
    return error.userMessage;
  }

  const errorDetails = classifyError(error, locale);
  return errorDetails.userMessage;
}

/**
 * Determines if an error should show a retry button
 */
export function shouldShowRetry(error: any): boolean {
  if (error instanceof EnhancedError) {
    return canRetry(error);
  }

  const errorDetails = classifyError(error);
  return errorDetails.isRetryable && navigator.onLine;
}