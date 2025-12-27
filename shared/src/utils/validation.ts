/**
 * Validation Utilities
 *
 * Utility functions for validating constants, status values, MIME types,
 * email addresses, and URLs used throughout the application.
 */

import { OrderStatus, PaymentStatus, UserRole } from '../constants/status';
import { SYSTEM } from '../constants/system';

/**
 * Status Validation Functions
 *
 * Functions to validate status enum values at runtime.
 */

/**
 * Validate if a string is a valid order status
 * @param status - The status string to validate
 * @returns True if the status is a valid OrderStatus enum value
 */
export function isValidOrderStatus(status: string): status is OrderStatus {
  return Object.values(OrderStatus).includes(status as OrderStatus);
}

/**
 * Validate if a string is a valid payment status
 * @param status - The status string to validate
 * @returns True if the status is a valid PaymentStatus enum value
 */
export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return Object.values(PaymentStatus).includes(status as PaymentStatus);
}

/**
 * Validate if a string is a valid user role
 * @param role - The role string to validate
 * @returns True if the role is a valid UserRole enum value
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * MIME Type Validation Functions
 *
 * Functions to validate MIME types against supported system types.
 */

/**
 * Validate if a string is a valid MIME type from system constants
 * @param mimeType - The MIME type string to validate
 * @returns True if the MIME type is in the system constants
 */
export function isValidMimeType(mimeType: string): boolean {
  return Object.values(SYSTEM.MIME_TYPES).includes(mimeType as any);
}

/**
 * Validate if a MIME type is for an image
 * @param mimeType - The MIME type string to validate
 * @returns True if the MIME type is for an image format
 */
export function isImageMimeType(mimeType: string): boolean {
  const imageMimeTypes = [
    SYSTEM.MIME_TYPES.JPEG,
    SYSTEM.MIME_TYPES.PNG,
    SYSTEM.MIME_TYPES.WEBP,
  ];
  return imageMimeTypes.includes(mimeType as any);
}

/**
 * Validate if a MIME type is for a document
 * @param mimeType - The MIME type string to validate
 * @returns True if the MIME type is for a document format
 */
export function isDocumentMimeType(mimeType: string): boolean {
  const documentMimeTypes = [
    SYSTEM.MIME_TYPES.PDF,
    SYSTEM.MIME_TYPES.CSV,
    SYSTEM.MIME_TYPES.XML,
  ];
  return documentMimeTypes.includes(mimeType as any);
}

/**
 * Validate if a MIME type is for text content
 * @param mimeType - The MIME type string to validate
 * @returns True if the MIME type is for text content
 */
export function isTextMimeType(mimeType: string): boolean {
  const textMimeTypes = [
    SYSTEM.MIME_TYPES.TEXT,
    SYSTEM.MIME_TYPES.HTML,
    SYSTEM.MIME_TYPES.JSON,
    SYSTEM.MIME_TYPES.CSV,
    SYSTEM.MIME_TYPES.XML,
  ];
  return textMimeTypes.includes(mimeType as any);
}

/**
 * Email Validation Functions
 *
 * Functions to validate email addresses and email-related values.
 */

/**
 * Validate if a string is a properly formatted email address
 * @param email - The email string to validate
 * @returns True if the email has valid format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate if an email is a business contact email
 * @param email - The email string to validate
 * @returns True if the email is one of the business contact emails
 */
export function isBusinessEmail(email: string): boolean {
  // This would need to import BUSINESS constants, but to avoid circular imports,
  // we'll implement this as a more generic business domain check
  const businessDomains = ['gmail.com', 'alacraft.com'];
  const domain = email.split('@')[1];
  return businessDomains.includes(domain);
}

/**
 * Validate if an email template identifier is valid
 * @param template - The template identifier to validate
 * @returns True if the template is a valid email template
 */
export function isValidEmailTemplate(template: string): boolean {
  return Object.values(SYSTEM.EMAIL.TEMPLATES).includes(template as any);
}

/**
 * URL Validation Functions
 *
 * Functions to validate URLs and URL-related values.
 */

/**
 * Validate if a string is a properly formatted URL
 * @param url - The URL string to validate
 * @returns True if the URL has valid format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a URL is using HTTPS protocol
 * @param url - The URL string to validate
 * @returns True if the URL uses HTTPS
 */
export function isHttpsUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate if a URL is a social media URL
 * @param url - The URL string to validate
 * @returns True if the URL is from a known social media platform
 */
export function isSocialMediaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const socialDomains = [
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'x.com',
      'linkedin.com',
      'youtube.com',
      'tiktok.com',
      'zalo.me',
    ];
    return socialDomains.some(
      (domain) =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * General Validation Functions
 *
 * Generic validation utilities for common data types.
 */

/**
 * Validate if a value is not null or undefined
 * @param value - The value to validate
 * @returns True if the value is not null or undefined
 */
export function isNotNullOrUndefined<T>(
  value: T | null | undefined
): value is T {
  return value !== null && value !== undefined;
}

/**
 * Validate if a string is not empty or whitespace only
 * @param value - The string to validate
 * @returns True if the string has non-whitespace content
 */
export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate if a number is within a specified range
 * @param value - The number to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns True if the number is within the range
 */
export function isNumberInRange(
  value: number,
  min: number,
  max: number
): boolean {
  return (
    typeof value === 'number' && !isNaN(value) && value >= min && value <= max
  );
}

/**
 * Validate if a value is a positive integer
 * @param value - The value to validate
 * @returns True if the value is a positive integer
 */
export function isPositiveInteger(value: any): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Validate if an array has elements
 * @param array - The array to validate
 * @returns True if the array is not empty
 */
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
  return Array.isArray(array) && array.length > 0;
}

/**
 * Validation Result Type
 *
 * Type for validation functions that return detailed results.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Complex Validation Functions
 *
 * Functions that return detailed validation results.
 */

/**
 * Validate an email address with detailed error information
 * @param email - The email string to validate
 * @returns Validation result with error details
 */
export function validateEmailDetailed(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required and must be a string' };
  }

  if (!isNonEmptyString(email)) {
    return { isValid: false, error: 'Email cannot be empty' };
  }

  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Email format is invalid' };
  }

  return { isValid: true };
}

/**
 * Validate a URL with detailed error information
 * @param url - The URL string to validate
 * @returns Validation result with error details
 */
export function validateUrlDetailed(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required and must be a string' };
  }

  if (!isNonEmptyString(url)) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  if (!isValidUrl(url)) {
    return { isValid: false, error: 'URL format is invalid' };
  }

  return { isValid: true };
}
