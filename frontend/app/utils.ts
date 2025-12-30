
export function formatMoney(num?: number | string, locale = 'vi'): string {
  if (num === undefined) return '';

  if (typeof num == 'string') num = parseFloat(num);

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(num.toFixed(2)));
}

/**
 * Format currency values with locale-specific formatting
 * @param value - The numeric value to format
 * @param locale - The locale ('en' or 'vi')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, locale: string = 'en'): string {
  const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US';
  const currency = locale === 'vi' ? 'VND' : 'USD';

  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Format numeric values with locale-specific formatting
 * @param value - The numeric value to format
 * @param locale - The locale ('en' or 'vi')
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: string = 'en'): string {
  const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US';

  return new Intl.NumberFormat(localeCode).format(value);
}

/**
 * Check if a product requires contact for pricing (zero-price product)
 * @param product - The product object or price value
 * @returns True if the product has zero price, false otherwise
 */
export function isContactForPrice(product: { price: number | string | null | undefined } | number | string | null | undefined): boolean {
  // Handle null/undefined
  if (product === null || product === undefined) {
    return true; // Treat null/undefined as zero-price
  }

  const price = typeof product === 'object' ? product.price : product;

  // Handle null/undefined price
  if (price === null || price === undefined) {
    return true;
  }

  return Number(price) === 0;
}

/**
 * Format price display for products, handling zero-price products
 * @param price - The price value
 * @param locale - The locale ('en' or 'vi')
 * @returns Formatted price string or "Contact for Price" message
 */
export function formatProductPrice(price: number, locale: string = 'en'): string {
  if (isContactForPrice(price)) {
    return getContactForPriceText(locale);
  }
  return formatCurrency(price, locale);
}

/**
 * Get the localized "Contact for Price" text
 * @param locale - The locale ('en' or 'vi')
 * @returns Localized contact for price message
 */
export function getContactForPriceText(locale: string = 'en'): string {
  return locale === 'vi' ? 'Liên hệ để biết giá' : 'Contact for Price';
}

/**
 * Get the localized "Price TBD" text for cart items
 * @param locale - The locale ('en' or 'vi')
 * @returns Localized price TBD message
 */
export function getPriceTBDText(locale: string = 'en'): string {
  return locale === 'vi' ? 'Giá: Đang chờ báo giá' : 'Price: TBD';
}

/**
 * Get the localized message explaining that pricing will be provided after order placement
 * @param locale - The locale ('en' or 'vi')
 * @returns Localized pricing guidance message
 */
export function getPricingGuidanceText(locale: string = 'en'): string {
  return locale === 'vi'
    ? 'Giá sẽ được cung cấp sau khi bạn đặt hàng'
    : 'Price will be provided after you place your order';
}

/**
 * Get the localized message for cart containing zero-price items
 * @param locale - The locale ('en' or 'vi')
 * @returns Localized cart quote message
 */
export function getCartQuoteMessage(locale: string = 'en'): string {
  return locale === 'vi'
    ? 'Đơn hàng của bạn có sản phẩm cần báo giá. Chúng tôi sẽ liên hệ với bạn sau khi đặt hàng.'
    : 'Your order contains items requiring quotes. We will contact you after order placement.';
}

/**
 * Get the localized message for admin orders requiring pricing
 * @param locale - The locale ('en' or 'vi')
 * @returns Localized admin order pricing message
 */
export function getAdminOrderPricingMessage(locale: string = 'en'): string {
  return locale === 'vi'
    ? '⚠️ Đơn hàng này cần đặt giá cho các sản phẩm trước khi xử lý'
    : '⚠️ This order requires pricing before processing';
}

/**
 * Get the localized message for admin product form with zero price
 * @param locale - The locale ('en' or 'vi')
 * @returns Localized admin product zero price message
 */
export function getAdminProductZeroPriceMessage(locale: string = 'en'): string {
  return locale === 'vi'
    ? '💡 Giá 0 = Khách hàng cần liên hệ để biết giá'
    : '💡 Price 0 = Customer must contact for pricing';
}
/**
 * Safely format a date string with error handling for invalid dates
 * @param dateString - The date string to format
 * @param locale - The locale ('en' or 'vi')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or 'Invalid date' if the date is invalid
 */
export function formatDateSafe(
  dateString: string | null | undefined,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) {
    return 'Invalid date';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const localeCode = locale === 'vi' ? 'vi-VN' : 'en-US';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(localeCode, options || defaultOptions).format(date);
}

/**
 * Safely format a date string for display in lists (shorter format)
 * @param dateString - The date string to format
 * @param locale - The locale ('en' or 'vi')
 * @returns Formatted date string or 'Invalid date' if the date is invalid
 */
export function formatDateShort(
  dateString: string | null | undefined,
  locale: string = 'en'
): string {
  return formatDateSafe(dateString, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Safely format a date string with date and time
 * @param dateString - The date string to format
 * @param locale - The locale ('en' or 'vi')
 * @returns Formatted date and time string or 'Invalid date' if the date is invalid
 */
export function formatDateTime(
  dateString: string | null | undefined,
  locale: string = 'en'
): string {
  return formatDateSafe(dateString, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Safely compare two date strings for sorting
 * @param dateA - First date string
 * @param dateB - Second date string
 * @returns Comparison result for sorting (negative, zero, or positive)
 */
export function compareDates(
  dateA: string | null | undefined,
  dateB: string | null | undefined
): number {
  const timeA = dateA ? new Date(dateA).getTime() : 0;
  const timeB = dateB ? new Date(dateB).getTime() : 0;

  // Handle invalid dates by treating them as 0
  const validTimeA = isNaN(timeA) ? 0 : timeA;
  const validTimeB = isNaN(timeB) ? 0 : timeB;

  return validTimeB - validTimeA; // Descending order (newest first)
}