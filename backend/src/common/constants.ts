/**
 * Centralized Application Constants
 *
 * This file contains all common string constants used throughout the backend application.
 * It provides a single source of truth for status values, cache keys, role names, MIME types,
 * and other repeated string literals to ensure consistency and maintainability.
 *
 * @fileoverview Centralized constants for the NestJS backend application
 * @version 1.0.0
 */

/**
 * Status Constants Interface
 *
 * Defines the structure for all status-related constants including
 * order status, payment status, and user roles.
 */
export interface StatusConstants {
  /** Order status values mapping to Prisma OrderStatus enum */
  ORDER_STATUS: {
    /** Order is pending and awaiting processing */
    PENDING: 'PENDING';
    /** Order is pending quote approval */
    PENDING_QUOTE: 'PENDING_QUOTE';
    /** Order is being processed */
    PROCESSING: 'PROCESSING';
    /** Order has been shipped */
    SHIPPED: 'SHIPPED';
    /** Order has been delivered */
    DELIVERED: 'DELIVERED';
    /** Order has been cancelled */
    CANCELLED: 'CANCELLED';
    /** Order has been refunded */
    REFUNDED: 'REFUNDED';
  };
  /** Payment status values mapping to Prisma PaymentStatus enum */
  PAYMENT_STATUS: {
    /** Payment is pending */
    PENDING: 'PENDING';
    /** Payment has been completed */
    PAID: 'PAID';
    /** Payment has failed */
    FAILED: 'FAILED';
    /** Payment has been refunded */
    REFUNDED: 'REFUNDED';
  };
  /** User role values mapping to Prisma UserRole enum */
  USER_ROLES: {
    /** Administrator role with full access */
    ADMIN: 'ADMIN';
    /** Customer role with limited access */
    CUSTOMER: 'CUSTOMER';
  };
}

/**
 * Cache Key Constants Interface
 *
 * Defines the structure for cache key constants and generator functions
 * to ensure consistent cache key naming across the application.
 */
export interface CacheKeyConstants {
  /** Category-related cache keys */
  CATEGORIES: {
    /** Cache key for category tree structure */
    TREE: 'categories:tree';
    /** Generate cache key for category by slug */
    BY_SLUG: (slug: string) => string;
    /** Generate cache key for category by ID */
    BY_ID: (id: string) => string;
  };
  /** Product-related cache keys */
  PRODUCTS: {
    /** Cache key for product list */
    LIST: 'products:list';
    /** Generate cache key for product by ID */
    BY_ID: (id: string) => string;
    /** Generate cache key for product by slug */
    BY_SLUG: (slug: string) => string;
    /** Cache key for featured products */
    FEATURED: 'products:featured';
    /** Generate cache key for products by category */
    BY_CATEGORY: (categoryId: string) => string;
  };
  /** Shipping-related cache keys */
  SHIPPING: {
    /** Cache key for active shipping methods */
    METHODS: 'shipping:methods:active';
    /** Generate cache key for shipping rates calculation */
    RATES: (params: string) => string;
    /** Cache key for shipping method list */
    METHOD_LIST: 'shipping:methods:list';
    /** Generate cache key for shipping method by ID */
    METHOD_BY_ID: (id: string) => string;
    /** Generate cache key for shipping method by method ID */
    METHOD_BY_METHOD_ID: (methodId: string) => string;
  };
  /** Cart-related cache keys */
  CART: {
    /** Generate cache key for user cart */
    BY_USER: (userId: string) => string;
  };
  /** Content-related cache keys */
  CONTENT: {
    /** Cache key for homepage sections */
    HOMEPAGE_SECTIONS: 'homepage:sections';
    /** Generate cache key for blog post list */
    BLOG_LIST: (page: number, limit: number, categorySlug?: string) => string;
    /** Generate cache key for blog post by slug */
    BLOG_POST: (slug: string) => string;
    /** Generate cache key for related blog posts */
    BLOG_RELATED: (postId: string) => string;
  };
  /** Settings-related cache keys */
  SETTINGS: {
    /** Cache key for footer settings */
    FOOTER: 'footer:settings';
  };
  /** Session-related cache keys */
  SESSION: {
    /** Generate cache key for user session */
    BY_ID: (sessionId: string) => string;
  };
}

/**
 * System Constants Interface
 *
 * Defines the structure for system-level constants including
 * MIME types, email configuration, and API settings.
 */
export interface SystemConstants {
  /** MIME type constants for file validation and content types */
  MIME_TYPES: {
    /** PDF document MIME type */
    PDF: 'application/pdf';
    /** JPEG image MIME type */
    JPEG: 'image/jpeg';
    /** PNG image MIME type */
    PNG: 'image/png';
    /** WebP image MIME type */
    WEBP: 'image/webp';
    /** JSON data MIME type */
    JSON: 'application/json';
    /** Plain text MIME type */
    TEXT: 'text/plain';
    /** HTML content MIME type */
    HTML: 'text/html';
    /** CSV data MIME type */
    CSV: 'text/csv';
    /** XML data MIME type */
    XML: 'application/xml';
  };
  /** Email configuration constants */
  EMAIL: {
    /** Default sender email address */
    DEFAULT_FROM: 'noreply@example.com';
    /** Default SMTP port */
    SMTP_PORT: '587';
    /** Default SMTP server */
    SMTP_SERVER: 'smtp.gmail.com';
    /** Email template identifiers */
    TEMPLATES: {
      /** Order confirmation email template */
      ORDER_CONFIRMATION: 'order-confirmation';
      /** Order status update email template */
      ORDER_STATUS_UPDATE: 'order-status-update';
      /** Password reset email template */
      PASSWORD_RESET: 'password-reset';
      /** Welcome email template */
      WELCOME: 'welcome';
    };
  };
  /** API configuration constants */
  API: {
    /** Default pagination page size */
    DEFAULT_PAGE_SIZE: 20;
    /** Maximum allowed page size */
    MAX_PAGE_SIZE: 100;
    /** Default request timeout in milliseconds */
    DEFAULT_TIMEOUT: 30000;
    /** Rate limiting constants */
    RATE_LIMIT: {
      /** Default rate limit window in milliseconds */
      WINDOW_MS: 900000; // 15 minutes
      /** Default maximum requests per window */
      MAX_REQUESTS: 100;
    };
  };
}

/**
 * Status Constants
 *
 * Centralized status values that map directly to Prisma enum values.
 * These constants ensure consistency across the application and prevent typos.
 */
export const STATUS = {
  /**
   * Order Status Constants
   *
   * Maps to Prisma OrderStatus enum values for consistent order state management.
   */
  ORDER_STATUS: {
    /** Order is pending and awaiting processing */
    PENDING: 'PENDING',
    /** Order is pending quote approval */
    PENDING_QUOTE: 'PENDING_QUOTE',
    /** Order is being processed */
    PROCESSING: 'PROCESSING',
    /** Order has been shipped */
    SHIPPED: 'SHIPPED',
    /** Order has been delivered */
    DELIVERED: 'DELIVERED',
    /** Order has been cancelled */
    CANCELLED: 'CANCELLED',
    /** Order has been refunded */
    REFUNDED: 'REFUNDED',
  } as const,

  /**
   * Payment Status Constants
   *
   * Maps to Prisma PaymentStatus enum values for consistent payment state management.
   */
  PAYMENT_STATUS: {
    /** Payment is pending */
    PENDING: 'PENDING',
    /** Payment has been completed */
    PAID: 'PAID',
    /** Payment has failed */
    FAILED: 'FAILED',
    /** Payment has been refunded */
    REFUNDED: 'REFUNDED',
  } as const,

  /**
   * User Role Constants
   *
   * Maps to Prisma UserRole enum values for consistent role-based authorization.
   */
  USER_ROLES: {
    /** Administrator role with full access */
    ADMIN: 'ADMIN',
    /** Customer role with limited access */
    CUSTOMER: 'CUSTOMER',
  } as const,
} as const;

/**
 * Cache Key Constants
 *
 * Centralized cache key definitions and generator functions to ensure
 * consistent cache key naming and prevent key collisions.
 */
export const CACHE_KEYS = {
  /**
   * Category Cache Keys
   *
   * Cache keys for category-related data including tree structure and individual categories.
   */
  CATEGORIES: {
    /** Cache key for category tree structure */
    TREE: 'categories:tree',
    /** Generate cache key for category by slug */
    BY_SLUG: (slug: string) => `category:slug:${slug}`,
    /** Generate cache key for category by ID */
    BY_ID: (id: string) => `category:id:${id}`,
  },

  /**
   * Product Cache Keys
   *
   * Cache keys for product-related data including lists, individual products, and filtered results.
   */
  PRODUCTS: {
    /** Cache key for product list */
    LIST: 'products:list',
    /** Generate cache key for product by ID */
    BY_ID: (id: string) => `product:id:${id}`,
    /** Generate cache key for product by slug */
    BY_SLUG: (slug: string) => `product:slug:${slug}`,
    /** Cache key for featured products */
    FEATURED: 'products:featured',
    /** Generate cache key for products by category */
    BY_CATEGORY: (categoryId: string) => `products:category:${categoryId}`,
  },

  /**
   * Shipping Cache Keys
   *
   * Cache keys for shipping-related data including methods and rate calculations.
   */
  SHIPPING: {
    /** Cache key for active shipping methods */
    METHODS: 'shipping:methods:active',
    /** Generate cache key for shipping rates calculation */
    RATES: (params: string) => `shipping:rates:${params}`,
    /** Cache key for shipping method list */
    METHOD_LIST: 'shipping:methods:list',
    /** Generate cache key for shipping method by ID */
    METHOD_BY_ID: (id: string) => `shipping:method:id:${id}`,
    /** Generate cache key for shipping method by method ID */
    METHOD_BY_METHOD_ID: (methodId: string) => `shipping:method:methodId:${methodId}`,
  },

  /**
   * Cart Cache Keys
   *
   * Cache keys for cart-related data including user-specific carts.
   */
  CART: {
    /** Generate cache key for user cart */
    BY_USER: (userId: string) => `cart:user:${userId}`,
  },

  /**
   * Content Cache Keys
   *
   * Cache keys for content-related data including homepage sections and blog posts.
   */
  CONTENT: {
    /** Cache key for homepage sections */
    HOMEPAGE_SECTIONS: 'homepage:sections',
    /** Generate cache key for blog post list */
    BLOG_LIST: (page: number, limit: number, categorySlug?: string) => `blog:list:${page}:${limit}:${categorySlug || 'all'}`,
    /** Generate cache key for blog post by slug */
    BLOG_POST: (slug: string) => `blog:post:${slug}`,
    /** Generate cache key for related blog posts */
    BLOG_RELATED: (postId: string) => `blog:related:${postId}`,
  },

  /**
   * Settings Cache Keys
   *
   * Cache keys for application settings including footer configuration.
   */
  SETTINGS: {
    /** Cache key for footer settings */
    FOOTER: 'footer:settings',
  },

  /**
   * Session Cache Keys
   *
   * Cache keys for user session management.
   */
  SESSION: {
    /** Generate cache key for user session */
    BY_ID: (sessionId: string) => `session:${sessionId}`,
  },
} as const;

/**
 * System Constants
 *
 * System-level constants including MIME types, email configuration,
 * and API settings used throughout the application.
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
 * All Constants Export
 *
 * Consolidated export of all constants for convenient access.
 * Provides both individual constant groups and a unified constants object.
 */
export const CONSTANTS = {
  STATUS,
  CACHE_KEYS,
  SYSTEM,
} as const;

/**
 * Type Exports
 *
 * TypeScript type definitions derived from the constants for type safety.
 */
export type OrderStatus = typeof STATUS.ORDER_STATUS[keyof typeof STATUS.ORDER_STATUS];
export type PaymentStatus = typeof STATUS.PAYMENT_STATUS[keyof typeof STATUS.PAYMENT_STATUS];
export type UserRole = typeof STATUS.USER_ROLES[keyof typeof STATUS.USER_ROLES];
export type MimeType = typeof SYSTEM.MIME_TYPES[keyof typeof SYSTEM.MIME_TYPES];
export type EmailTemplate = typeof SYSTEM.EMAIL.TEMPLATES[keyof typeof SYSTEM.EMAIL.TEMPLATES];

/**
 * Utility Functions
 *
 * Helper functions for working with constants and validation.
 */
export const ConstantUtils = {
  /**
   * Validate if a string is a valid order status
   * @param status - The status string to validate
   * @returns True if the status is valid
   */
  isValidOrderStatus: (status: string): status is OrderStatus => {
    return Object.values(STATUS.ORDER_STATUS).includes(status as OrderStatus);
  },

  /**
   * Validate if a string is a valid payment status
   * @param status - The status string to validate
   * @returns True if the status is valid
   */
  isValidPaymentStatus: (status: string): status is PaymentStatus => {
    return Object.values(STATUS.PAYMENT_STATUS).includes(status as PaymentStatus);
  },

  /**
   * Validate if a string is a valid user role
   * @param role - The role string to validate
   * @returns True if the role is valid
   */
  isValidUserRole: (role: string): role is UserRole => {
    return Object.values(STATUS.USER_ROLES).includes(role as UserRole);
  },

  /**
   * Validate if a string is a valid MIME type
   * @param mimeType - The MIME type string to validate
   * @returns True if the MIME type is valid
   */
  isValidMimeType: (mimeType: string): mimeType is MimeType => {
    return Object.values(SYSTEM.MIME_TYPES).includes(mimeType as MimeType);
  },

  /**
   * Get all valid order statuses
   * @returns Array of all valid order status values
   */
  getAllOrderStatuses: (): OrderStatus[] => {
    return Object.values(STATUS.ORDER_STATUS);
  },

  /**
   * Get all valid payment statuses
   * @returns Array of all valid payment status values
   */
  getAllPaymentStatuses: (): PaymentStatus[] => {
    return Object.values(STATUS.PAYMENT_STATUS);
  },

  /**
   * Get all valid user roles
   * @returns Array of all valid user role values
   */
  getAllUserRoles: (): UserRole[] => {
    return Object.values(STATUS.USER_ROLES);
  },

  /**
   * Get all valid MIME types
   * @returns Array of all valid MIME type values
   */
  getAllMimeTypes: (): MimeType[] => {
    return Object.values(SYSTEM.MIME_TYPES);
  },
} as const;