
export function formatMoney(num?: number | string, locale = 'vi'): string {
  if (num === undefined) return '';

  if (typeof num == 'string') num = parseFloat(num);

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(num.toFixed(2)));
}