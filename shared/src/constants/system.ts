/**
 * System Constants
 *
 * System-level constants including MIME types, email configuration,
 * and API settings used throughout the application.
 */

/**
 * MIME Types Interface
 */
export interface MimeTypes {
  /** PDF document MIME type */
  PDF: string;
  /** JPEG image MIME type */
  JPEG: string;
  /** PNG image MIME type */
  PNG: string;
  /** WebP image MIME type */
  WEBP: string;
  /** JSON data MIME type */
  JSON: string;
  /** Plain text MIME type */
  TEXT: string;
  /** HTML content MIME type */
  HTML: string;
  /** CSV data MIME type */
  CSV: string;
  /** XML data MIME type */
  XML: string;
}

/**
 * Email Configuration Interface
 */
export interface EmailConfig {
  /** Default sender email address */
  DEFAULT_FROM: string;
  /** Default SMTP port */
  SMTP_PORT: string;
  /** Default SMTP server */
  SMTP_SERVER: string;
  /** Email template identifiers */
  TEMPLATES: {
    /** Order confirmation email template */
    ORDER_CONFIRMATION: string;
    /** Order status update email template */
    ORDER_STATUS_UPDATE: string;
    /** Password reset email template */
    PASSWORD_RESET: string;
    /** Welcome email template */
    WELCOME: string;
  };
}

/**
 * API Configuration Interface
 */
export interface ApiConfig {
  /** Default pagination page size */
  DEFAULT_PAGE_SIZE: number;
  /** Maximum allowed page size */
  MAX_PAGE_SIZE: number;
  /** Default request timeout in milliseconds */
  DEFAULT_TIMEOUT: number;
  /** Rate limiting constants */
  RATE_LIMIT: {
    /** Default rate limit window in milliseconds */
    WINDOW_MS: number;
    /** Default maximum requests per window */
    MAX_REQUESTS: number;
  };
}

/**
 * System Constants Object
 *
 * Consolidated system constants including MIME types, email configuration,
 * and API settings.
 */
export const SYSTEM = {
  /**
   * MIME Type Constants
   *
   * Standard MIME type definitions for file validation and content type headers.
   */
  MIME_TYPES: {
    /** PDF document MIME type */
    PDF: 'application/pdf',
    /** JPEG image MIME type */
    JPEG: 'image/jpeg',
    /** PNG image MIME type */
    PNG: 'image/png',
    /** WebP image MIME type */
    WEBP: 'image/webp',
    /** JSON data MIME type */
    JSON: 'application/json',
    /** Plain text MIME type */
    TEXT: 'text/plain',
    /** HTML content MIME type */
    HTML: 'text/html',
    /** CSV data MIME type */
    CSV: 'text/csv',
    /** XML data MIME type */
    XML: 'application/xml',
  } as const,

  /**
   * Email Configuration Constants
   *
   * Default email settings and template identifiers for the notification system.
   */
  EMAIL: {
    /** Default sender email address */
    DEFAULT_FROM: 'noreply@gmail.com',
    /** Default SMTP port */
    SMTP_PORT: '587',
    /** Default SMTP server */
    SMTP_SERVER: 'smtp.gmail.com',
    /**
     * Email Template Identifiers
     *
     * Standardized template names for the email notification system.
     */
    TEMPLATES: {
      /** Order confirmation email template */
      ORDER_CONFIRMATION: 'order-confirmation',
      /** Order status update email template */
      ORDER_STATUS_UPDATE: 'order-status-update',
      /** Password reset email template */
      PASSWORD_RESET: 'password-reset',
      /** Welcome email template */
      WELCOME: 'welcome',
    } as const,
  } as const,

  /**
   * API Configuration Constants
   *
   * Default API settings for pagination, timeouts, and rate limiting.
   */
  API: {
    /** Default pagination page size */
    DEFAULT_PAGE_SIZE: 20,
    /** Maximum allowed page size */
    MAX_PAGE_SIZE: 100,
    /** Default request timeout in milliseconds */
    DEFAULT_TIMEOUT: 30000,
    /**
     * Rate Limiting Constants
     *
     * Default rate limiting configuration for API endpoints.
     */
    RATE_LIMIT: {
      /** Default rate limit window in milliseconds (15 minutes) */
      WINDOW_MS: 900000,
      /** Default maximum requests per window */
      MAX_REQUESTS: 100,
    } as const,
  } as const,
} as const;

/**
 * Type Exports for System Constants
 */
export type MimeType =
  (typeof SYSTEM.MIME_TYPES)[keyof typeof SYSTEM.MIME_TYPES];
export type EmailTemplate =
  (typeof SYSTEM.EMAIL.TEMPLATES)[keyof typeof SYSTEM.EMAIL.TEMPLATES];
export type ApiConfigType = typeof SYSTEM.API;
export type RateLimitConfig = typeof SYSTEM.API.RATE_LIMIT;
