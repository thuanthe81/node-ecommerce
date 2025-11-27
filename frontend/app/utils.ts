
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