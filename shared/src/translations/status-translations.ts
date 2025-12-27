/**
 * Status Translations
 *
 * Centralized translations for all status values used throughout the application.
 * Supports English (en) and Vietnamese (vi) locales.
 */

import { OrderStatus, PaymentStatus, UserRole } from '../constants/status';
import type { SupportedLocale, StatusTranslations } from './types';

/**
 * Status Translations Object
 *
 * Contains translations for order status, payment status, and user roles
 * organized by category for easy access and maintenance.
 */
export const STATUS_TRANSLATIONS: StatusTranslations = {
  // Order Status Translations
  order: {
    [OrderStatus.PENDING]: { en: 'Pending', vi: 'Chờ xử lý' },
    [OrderStatus.PENDING_QUOTE]: { en: 'Pending Quote', vi: 'Chờ báo giá' },
    [OrderStatus.PROCESSING]: { en: 'Processing', vi: 'Đang xử lý' },
    [OrderStatus.SHIPPED]: { en: 'Shipped', vi: 'Đã giao vận' },
    [OrderStatus.DELIVERED]: { en: 'Delivered', vi: 'Đã giao hàng' },
    [OrderStatus.CANCELLED]: { en: 'Cancelled', vi: 'Đã hủy' },
    [OrderStatus.REFUNDED]: { en: 'Refunded', vi: 'Đã hoàn tiền' },
  },
  // Payment Status Translations
  payment: {
    [PaymentStatus.PENDING]: { en: 'Pending', vi: 'Chờ thanh toán' },
    [PaymentStatus.PAID]: { en: 'Paid', vi: 'Đã thanh toán' },
    [PaymentStatus.FAILED]: { en: 'Failed', vi: 'Thất bại' },
    [PaymentStatus.REFUNDED]: { en: 'Refunded', vi: 'Đã hoàn tiền' },
  },
  // User Role Translations
  user: {
    [UserRole.ADMIN]: { en: 'Administrator', vi: 'Quản trị viên' },
    [UserRole.CUSTOMER]: { en: 'Customer', vi: 'Khách hàng' },
  },
};

/**
 * Translate Order Status
 *
 * Translates an order status to the specified locale with fallback logic.
 *
 * @param status - The order status to translate
 * @param locale - The target locale (defaults to 'en')
 * @returns The translated status string
 */
export function translateOrderStatus(
  status: OrderStatus,
  locale: SupportedLocale = 'en'
): string {
  const translation = STATUS_TRANSLATIONS.order?.[status];
  if (!translation) {
    console.warn(`Missing translation for order status: ${status}`);
    return status; // Fallback to raw status
  }
  return translation[locale] || translation.en; // Fallback to English
}

/**
 * Translate Payment Status
 *
 * Translates a payment status to the specified locale with fallback logic.
 *
 * @param status - The payment status to translate
 * @param locale - The target locale (defaults to 'en')
 * @returns The translated status string
 */
export function translatePaymentStatus(
  status: PaymentStatus,
  locale: SupportedLocale = 'en'
): string {
  const translation = STATUS_TRANSLATIONS.payment?.[status];
  if (!translation) {
    console.warn(`Missing translation for payment status: ${status}`);
    return status; // Fallback to raw status
  }
  return translation[locale] || translation.en; // Fallback to English
}

/**
 * Translate User Role
 *
 * Translates a user role to the specified locale with fallback logic.
 *
 * @param role - The user role to translate
 * @param locale - The target locale (defaults to 'en')
 * @returns The translated role string
 */
export function translateUserRole(
  role: UserRole,
  locale: SupportedLocale = 'en'
): string {
  const translation = STATUS_TRANSLATIONS.user?.[role];
  if (!translation) {
    console.warn(`Missing translation for user role: ${role}`);
    return role; // Fallback to raw role
  }
  return translation[locale] || translation.en; // Fallback to English
}

/**
 * Generic Status Translation Function
 *
 * Translates any status based on its type with fallback logic.
 *
 * @param status - The status value to translate
 * @param type - The status type ('order', 'payment', or 'user')
 * @param locale - The target locale (defaults to 'en')
 * @returns The translated status string
 */
export function translateStatus(
  status: string,
  type: 'order' | 'payment' | 'user',
  locale: SupportedLocale = 'en'
): string {
  const categoryTranslations = STATUS_TRANSLATIONS[type];
  if (!categoryTranslations) {
    console.warn(`Unknown status type: ${type}`);
    return status;
  }

  const translation = categoryTranslations[status];
  if (!translation) {
    console.warn(`Missing translation for ${type} status: ${status}`);
    return status; // Fallback to raw status
  }
  return translation[locale] || translation.en; // Fallback to English
}
