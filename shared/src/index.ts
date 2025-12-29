/**
 * @alacraft/shared - Main Export File
 *
 * This is the main entry point for the shared constants and translations library.
 * It provides consolidated exports for all modules including constants, translations,
 * utilities, and type definitions.
 *
 * @example
 * ```typescript
 * // Import everything
 * import * as Shared from '@alacraft/shared';
 *
 * // Import specific modules
 * import { CONSTANTS, translateOrderStatus, isValidEmail } from '@alacraft/shared';
 *
 * // Import types
 * import type { SupportedLocale, OrderStatus } from '@alacraft/shared';
 * ```
 */

// ============================================================================
// Constants Module Exports
// ============================================================================

// Export all constants and utilities
export * from './constants';

// ============================================================================
// Translations Module Exports
// ============================================================================

// Export all translation functions and data
export * from './translations';

// ============================================================================
// Utilities Module Exports
// ============================================================================

// Export all utility functions
export * from './utils';

// ============================================================================
// Unified Library Interface (Dynamic Import)
// ============================================================================

import { CONSTANTS } from './constants';
import {
  translateOrderStatus,
  translatePaymentStatus,
  translateUserRole,
  translateStatus,
  getEmailTemplateTranslations,
  getOrderConfirmationTranslations,
  getAdminOrderNotificationTranslations,
  getOrderStatusUpdateTranslations,
  getTranslation,
  getAllTranslations,
  getEmailTranslation,
  getOrderStatusMessage,
  getPaymentStatusMessage,
  EMAIL_TRANSLATIONS,
  STATUS_TRANSLATIONS,
} from './translations';
import {
  isValidOrderStatus,
  isValidPaymentStatus,
  isValidUserRole,
  isValidMimeType,
  isValidEmail,
  isValidUrl,
} from './utils/validation';
import {
  isSupportedLocale,
  getDefaultLocale,
  getSupportedLocales,
  normalizeLocale,
  formatCurrency,
  formatDate,
  formatNumber,
  interpolateTranslation,
  pluralizeByLocale,
} from './utils/translation-helpers';
import { OrderStatus, PaymentStatus, UserRole } from './constants/status';

/**
 * Unified Library Interface
 *
 * Provides a single object containing all library functionality
 * organized by category for convenient access.
 */
export const AlaCraftShared = {
  // Constants
  constants: CONSTANTS,

  // Status functions
  status: {
    translate: {
      order: translateOrderStatus,
      payment: translatePaymentStatus,
      user: translateUserRole,
      generic: translateStatus,
    },
    validate: {
      order: isValidOrderStatus,
      payment: isValidPaymentStatus,
      user: isValidUserRole,
    },
    enums: {
      OrderStatus,
      PaymentStatus,
      UserRole,
    },
  },

  // Email functions
  email: {
    translations: {
      all: getEmailTemplateTranslations,
      orderConfirmation: getOrderConfirmationTranslations,
      adminNotification: getAdminOrderNotificationTranslations,
      statusUpdate: getOrderStatusUpdateTranslations,
      generic: getTranslation,
    },
    statusMessages: {
      order: getOrderStatusMessage,
      payment: getPaymentStatusMessage,
    },
    data: EMAIL_TRANSLATIONS,
  },

  // Validation utilities
  validation: {
    status: {
      order: isValidOrderStatus,
      payment: isValidPaymentStatus,
      user: isValidUserRole,
    },
    format: {
      email: isValidEmail,
      url: isValidUrl,
      mimeType: isValidMimeType,
    },
  },

  // Locale utilities
  locale: {
    supported: getSupportedLocales(),
    default: getDefaultLocale(),
    validate: isSupportedLocale,
    normalize: normalizeLocale,
    format: {
      currency: formatCurrency,
      date: formatDate,
      number: formatNumber,
    },
  },

  // Utility functions
  utils: {
    interpolate: interpolateTranslation,
    pluralize: pluralizeByLocale,
  },
} as const;

// ============================================================================
// Version and Metadata
// ============================================================================

/**
 * Library version and metadata
 */
export const LIBRARY_INFO = {
  name: '@alacraft/shared',
  version: '1.0.0',
  description: 'Shared constants and translations for ALA Craft applications',
  supportedLocales: getSupportedLocales(),
  defaultLocale: getDefaultLocale(),
} as const;
