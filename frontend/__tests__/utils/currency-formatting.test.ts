/**
 * Currency formatting tests for VND formatting consistency
 */

import { formatMoney, formatCurrency } from '@/app/utils';

describe('Currency Formatting', () => {
  describe('formatMoney', () => {
    it('should format VND currency correctly', () => {
      expect(formatMoney(100000, 'vi')).toMatch(/100[.,]000/);
      expect(formatMoney(1500000, 'vi')).toMatch(/1[.,]500[.,]000/);
      expect(formatMoney(0, 'vi')).toMatch(/0/);
    });

    it('should handle string inputs', () => {
      expect(formatMoney('100000', 'vi')).toMatch(/100[.,]000/);
      expect(formatMoney('1500000', 'vi')).toMatch(/1[.,]500[.,]000/);
    });

    it('should handle undefined inputs', () => {
      expect(formatMoney(undefined, 'vi')).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format VND currency correctly', () => {
      expect(formatCurrency(100000, 'vi')).toMatch(/100[.,]000/);
      expect(formatCurrency(1500000, 'vi')).toMatch(/1[.,]500[.,]000/);
      expect(formatCurrency(0, 'vi')).toMatch(/0/);
    });

    it('should use VND for Vietnamese locale', () => {
      const result = formatCurrency(100000, 'vi');
      expect(result).toContain('₫');
    });

    it('should use USD for English locale', () => {
      const result = formatCurrency(100000, 'en');
      expect(result).toContain('$');
    });
  });
});