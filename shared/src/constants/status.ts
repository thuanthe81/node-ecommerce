/**
 * Status Constants
 *
 * Centralized status values that map directly to Prisma enum values.
 * These constants ensure consistency across the application and prevent typos.
 */

/**
 * Order Status Enum
 *
 * Maps to Prisma OrderStatus enum values for consistent order state management.
 */
export enum OrderStatus {
  /** Order is pending and awaiting processing */
  PENDING = 'PENDING',
  /** Order is pending quote approval */
  PENDING_QUOTE = 'PENDING_QUOTE',
  /** Order is being processed */
  PROCESSING = 'PROCESSING',
  /** Order has been shipped */
  SHIPPED = 'SHIPPED',
  /** Order has been delivered */
  DELIVERED = 'DELIVERED',
  /** Order has been cancelled */
  CANCELLED = 'CANCELLED',
  /** Order has been refunded */
  REFUNDED = 'REFUNDED',
}

/**
 * Payment Status Enum
 *
 * Maps to Prisma PaymentStatus enum values for consistent payment state management.
 */
export enum PaymentStatus {
  /** Payment is pending */
  PENDING = 'PENDING',
  /** Payment has been completed */
  PAID = 'PAID',
  /** Payment has failed */
  FAILED = 'FAILED',
  /** Payment has been refunded */
  REFUNDED = 'REFUNDED',
}

/**
 * User Role Enum
 *
 * Maps to Prisma UserRole enum values for consistent role-based authorization.
 */
export enum UserRole {
  /** Administrator role with full access */
  ADMIN = 'ADMIN',
  /** Customer role with limited access */
  CUSTOMER = 'CUSTOMER',
}

/**
 * Status Constants Object
 *
 * Consolidated status constants for backward compatibility and easy access.
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
 * Type Exports
 *
 * TypeScript type definitions derived from the constants for type safety.
 */
export type OrderStatusType =
  (typeof STATUS.ORDER_STATUS)[keyof typeof STATUS.ORDER_STATUS];
export type PaymentStatusType =
  (typeof STATUS.PAYMENT_STATUS)[keyof typeof STATUS.PAYMENT_STATUS];
export type UserRoleType =
  (typeof STATUS.USER_ROLES)[keyof typeof STATUS.USER_ROLES];
