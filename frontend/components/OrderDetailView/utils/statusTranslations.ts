/**
 * Status translation utilities for OrderDetailView
 *
 * Provides functions to translate order status, payment status, payment method,
 * and shipping method values to localized text using the shared library.
 */

import { translateOrderStatus, translatePaymentStatus, OrderStatus, PaymentStatus } from '@alacraft/shared';

/**
 * Get translated order status text using orders namespace only
 * @param status - Raw order status value (e.g., "PENDING", "PROCESSING")
 * @param t - Translation function from useTranslations('orders')
 * @param locale - Current locale ('en' | 'vi')
 * @returns Translated status text
 */
export function getOrderStatusText(status: string | undefined | null, t: (key: string) => string, locale?: 'en' | 'vi'): string {
  // Handle undefined/null status
  if (!status) {
    console.warn('Order status is undefined or null');
    return status || 'Unknown';
  }

  // Try to use shared library translation first
  try {
    if (Object.values(OrderStatus).includes(status as OrderStatus) && locale) {
      return translateOrderStatus(status as OrderStatus, locale);
    }
  } catch (error) {
    console.warn('Failed to translate order status with shared library:', error);
  }

  // Fallback to orders namespace translation system ONLY
  const statusKey = status.toLowerCase();
  const statusMap: Record<string, string> = {
    'pending': 'statusPending',
    'pending_quote': 'statusPendingQuote',
    'processing': 'statusProcessing',
    'shipped': 'statusShipped',
    'delivered': 'statusDelivered',
    'cancelled': 'statusCancelled',
    'refunded': 'statusRefunded',
  };

  const translationKey = statusMap[statusKey];
  if (translationKey) {
    try {
      const translated = t(translationKey);
      // If translation returns the key itself, it means translation failed
      if (translated === translationKey) {
        console.warn(`Order status translation not found for key: ${translationKey}`);
        return status; // Return raw status instead of falling back to other namespaces
      }
      return translated;
    } catch (error) {
      console.warn(`Failed to translate order status key: ${translationKey}`, error);
      return status; // Return raw status instead of falling back to other namespaces
    }
  }

  // Log unknown status and return raw value
  console.warn(`Unknown order status: ${status}`);
  return status;
}

/**
 * Get translated payment status text using email namespace only
 * @param status - Raw payment status value (e.g., "PENDING", "PAID")
 * @param t - Translation function from useTranslations('email')
 * @param locale - Current locale ('en' | 'vi')
 * @returns Translated payment status text
 */
export function getPaymentStatusText(status: string | undefined | null, t: (key: string) => string, locale?: 'en' | 'vi'): string {
  // Handle undefined/null status
  if (!status) {
    console.warn('Payment status is undefined or null');
    return status || 'Unknown';
  }

  // Try to use shared library translation first
  try {
    if (Object.values(PaymentStatus).includes(status as PaymentStatus) && locale) {
      return translatePaymentStatus(status as PaymentStatus, locale);
    }
  } catch (error) {
    console.warn('Failed to translate payment status with shared library:', error);
  }

  // Fallback to email namespace translation system ONLY
  const statusKey = status.toLowerCase();
  const statusMap: Record<string, string> = {
    'pending': 'paymentStatus.pending',
    'paid': 'paymentStatus.paid',
    'failed': 'paymentStatus.failed',
    'refunded': 'paymentStatus.refunded',
  };

  const translationKey = statusMap[statusKey];
  if (translationKey) {
    try {
      const translated = t(translationKey);
      // If translation returns the key itself, it means translation failed
      if (translated === translationKey) {
        console.warn(`Payment status translation not found for key: ${translationKey}`);
        return status; // Return raw status instead of falling back to other namespaces
      }
      return translated;
    } catch (error) {
      console.warn(`Failed to translate payment status key: ${translationKey}`, error);
      return status; // Return raw status instead of falling back to other namespaces
    }
  }

  // Log unknown status and return raw value
  console.warn(`Unknown payment status: ${status}`);
  return status;
}

/**
 * Get translated payment method text
 * @param method - Raw payment method value (e.g., "Bank Transfer", "Cash on Delivery")
 * @param t - Translation function from useTranslations
 * @returns Translated payment method text
 */
export function getPaymentMethodText(method: string | undefined | null, t: (key: string) => string): string {
  // Handle undefined/null method
  if (!method) {
    return 'Unknown';
  }

  // Normalize the method string to match translation keys
  const methodKey = method.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');

  // Map backend method values to translation keys
  const methodMap: Record<string, string> = {
    'banktransfer': 'paymentMethod.bankTransfer',
    'cashondelivery': 'paymentMethod.cashOnDelivery',
    'creditcard': 'paymentMethod.creditCard',
    'paypal': 'paymentMethod.paypal',
  };

  const translationKey = methodMap[methodKey];
  return translationKey ? t(translationKey) : method;
}

/**
 * Get translated shipping method text
 * @param method - Raw shipping method value
 * @param t - Translation function from useTranslations
 * @returns Translated shipping method text
 */
export function getShippingMethodText(method: string | undefined | null, t: (key: string) => string): string {
  // Handle undefined/null method
  if (!method) {
    return 'Unknown';
  }

  // For shipping methods, we need to handle dynamic values from the database
  // Since shipping methods are user-configurable, we'll try common translations first
  const methodKey = method.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');

  // Map common shipping method values to translation keys
  const methodMap: Record<string, string> = {
    'standard': 'shippingMethods.standard',
    'standardshipping': 'shippingMethods.standard',
    'express': 'shippingMethods.express',
    'expressshipping': 'shippingMethods.express',
  };

  const translationKey = methodMap[methodKey];

  // If we have a translation, use it; otherwise return the original method name
  // This allows for custom shipping method names to be displayed as-is
  return translationKey ? t(translationKey) : method;
}