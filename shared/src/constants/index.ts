/**
 * Constants Module Exports
 *
 * This file provides consolidated exports for all constants modules
 * and creates a unified CONSTANTS object for convenient access.
 */

// Export all individual constant modules
export * from './status';
export * from './business';
export * from './system';
export * from './cache';

// Import for unified export
import { STATUS, OrderStatus, PaymentStatus, UserRole } from './status';
import { BUSINESS } from './business';
import { SYSTEM } from './system';
import { CACHE_KEYS } from './cache';

/**
 * Unified Constants Export
 *
 * Consolidated export of all constants for convenient access.
 * Provides both individual constant groups and a unified constants object.
 */
export const CONSTANTS = {
  STATUS,
  BUSINESS,
  SYSTEM,
  CACHE_KEYS,
} as const;

// Re-export enums for direct access
export { OrderStatus, PaymentStatus, UserRole };

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
    return Object.values(OrderStatus).includes(status as OrderStatus);
  },

  /**
   * Validate if a string is a valid payment status
   * @param status - The status string to validate
   * @returns True if the status is valid
   */
  isValidPaymentStatus: (status: string): status is PaymentStatus => {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  },

  /**
   * Validate if a string is a valid user role
   * @param role - The role string to validate
   * @returns True if the role is valid
   */
  isValidUserRole: (role: string): role is UserRole => {
    return Object.values(UserRole).includes(role as UserRole);
  },

  /**
   * Validate if a string is a valid MIME type
   * @param mimeType - The MIME type string to validate
   * @returns True if the MIME type is valid
   */
  isValidMimeType: (mimeType: string): boolean => {
    return (Object.values(SYSTEM.MIME_TYPES) as string[]).includes(mimeType);
  },

  /**
   * Get all valid order statuses
   * @returns Array of all valid order status values
   */
  getAllOrderStatuses: (): OrderStatus[] => {
    return Object.values(OrderStatus);
  },

  /**
   * Get all valid payment statuses
   * @returns Array of all valid payment status values
   */
  getAllPaymentStatuses: (): PaymentStatus[] => {
    return Object.values(PaymentStatus);
  },

  /**
   * Get all valid user roles
   * @returns Array of all valid user role values
   */
  getAllUserRoles: (): UserRole[] => {
    return Object.values(UserRole);
  },

  /**
   * Get all valid MIME types
   * @returns Array of all valid MIME type values
   */
  getAllMimeTypes: (): string[] => {
    return Object.values(SYSTEM.MIME_TYPES);
  },

  /**
   * Get company name by locale
   * @param locale - The locale ('en' or 'vi')
   * @returns Localized company name
   */
  getCompanyName: (locale: 'en' | 'vi'): string => {
    return locale === 'vi'
      ? BUSINESS.COMPANY.NAME.VI
      : BUSINESS.COMPANY.NAME.EN;
  },

  /**
   * Get contact email by type
   * @param type - The email type ('primary', 'vietnamese', or 'orders')
   * @returns Contact email address
   */
  getContactEmail: (type: 'primary' | 'vietnamese' | 'orders'): string => {
    switch (type) {
      case 'vietnamese':
        return BUSINESS.CONTACT.EMAIL.VIETNAMESE;
      case 'orders':
        return BUSINESS.CONTACT.EMAIL.ORDERS;
      default:
        return BUSINESS.CONTACT.EMAIL.PRIMARY;
    }
  },

  /**
   * Get all social media URLs
   * @returns Object containing all social media platform URLs
   */
  getAllSocialUrls: () => {
    return BUSINESS.SOCIAL;
  },

  /**
   * Validate if a string is a valid contact email
   * @param email - The email string to validate
   * @returns True if the email is a valid business contact email
   */
  isValidContactEmail: (email: string): boolean => {
    return (Object.values(BUSINESS.CONTACT.EMAIL) as string[]).includes(email);
  },
} as const;
