/**
 * Status translation utilities for OrderDetailView
 *
 * Provides functions to translate order status, payment status, payment method,
 * and shipping method values to localized text.
 */

/**
 * Get translated order status text
 * @param status - Raw order status value (e.g., "PENDING", "PROCESSING")
 * @param t - Translation function from useTranslations
 * @returns Translated status text
 */
export function getOrderStatusText(status: string, t: (key: string) => string): string {
  const statusKey = status.toLowerCase();

  // Map backend status values to translation keys
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
  return translationKey ? t(translationKey) : status;
}

/**
 * Get translated payment status text
 * @param status - Raw payment status value (e.g., "PENDING", "PAID")
 * @param t - Translation function from useTranslations
 * @returns Translated payment status text
 */
export function getPaymentStatusText(status: string, t: (key: string) => string): string {
  const statusKey = status.toLowerCase();

  // Map backend status values to translation keys
  const statusMap: Record<string, string> = {
    'pending': 'paymentStatus.pending',
    'paid': 'paymentStatus.paid',
    'failed': 'paymentStatus.failed',
    'refunded': 'paymentStatus.refunded',
  };

  const translationKey = statusMap[statusKey];
  return translationKey ? t(translationKey) : status;
}

/**
 * Get translated payment method text
 * @param method - Raw payment method value (e.g., "Bank Transfer", "Cash on Delivery")
 * @param t - Translation function from useTranslations
 * @returns Translated payment method text
 */
export function getPaymentMethodText(method: string, t: (key: string) => string): string {
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
export function getShippingMethodText(method: string, t: (key: string) => string): string {
  // For shipping methods, we need to handle dynamic values from the database
  // Since shipping methods are user-configurable, we'll try common translations first
  const methodKey = method.toLowerCase().replace(/\s+/g, '').replace(/[-_]/g, '');

  // Map common shipping method values to translation keys
  const methodMap: Record<string, string> = {
    'standard': 'shippingMethod.standard',
    'standardshipping': 'shippingMethod.standard',
    'express': 'shippingMethod.express',
    'expressshipping': 'shippingMethod.express',
    'overnight': 'shippingMethod.overnight',
    'overnightshipping': 'shippingMethod.overnight',
    'international': 'shippingMethod.international',
    'internationalshipping': 'shippingMethod.international',
    'free': 'shippingMethod.free',
    'freeshipping': 'shippingMethod.free',
    'pickup': 'shippingMethod.pickup',
    'storepickup': 'shippingMethod.pickup',
    'sameday': 'shippingMethod.same_day',
    'samedaydelivery': 'shippingMethod.same_day',
  };

  const translationKey = methodMap[methodKey];

  // If we have a translation, use it; otherwise return the original method name
  // This allows for custom shipping method names to be displayed as-is
  return translationKey ? t(translationKey) : method;
}