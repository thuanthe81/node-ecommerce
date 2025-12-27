// Unit tests for utility functions
import {
  isValidOrderStatus,
  isValidPaymentStatus,
  isValidUserRole,
  isValidMimeType,
  isValidEmail,
  isValidUrl,
  isBusinessEmail,
  validateEmailDetailed,
  validateUrlDetailed,
} from '../src/utils/validation';

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
} from '../src/utils/translation-helpers';

import { OrderStatus, PaymentStatus, UserRole } from '../src/constants/status';

describe('Utility Functions', () => {
  describe('Validation Utils', () => {
    test('should validate order statuses', () => {
      expect(isValidOrderStatus('PENDING')).toBe(true);
      expect(isValidOrderStatus('DELIVERED')).toBe(true);
      expect(isValidOrderStatus('INVALID_STATUS')).toBe(false);
      expect(isValidOrderStatus('')).toBe(false);
    });

    test('should validate payment statuses', () => {
      expect(isValidPaymentStatus('PENDING')).toBe(true);
      expect(isValidPaymentStatus('PAID')).toBe(true);
      expect(isValidPaymentStatus('INVALID_STATUS')).toBe(false);
      expect(isValidPaymentStatus('')).toBe(false);
    });

    test('should validate user roles', () => {
      expect(isValidUserRole('ADMIN')).toBe(true);
      expect(isValidUserRole('CUSTOMER')).toBe(true);
      expect(isValidUserRole('INVALID_ROLE')).toBe(false);
      expect(isValidUserRole('')).toBe(false);
    });

    test('should validate MIME types', () => {
      expect(isValidMimeType('image/jpeg')).toBe(true);
      expect(isValidMimeType('image/png')).toBe(true);
      expect(isValidMimeType('application/pdf')).toBe(true);
      expect(isValidMimeType('invalid/mime')).toBe(false);
    });

    test('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    test('should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('invalid-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    test('should validate business emails', () => {
      expect(isBusinessEmail('admin@alacraft.com')).toBe(true);
      expect(isBusinessEmail('test@gmail.com')).toBe(true); // gmail.com is included in business domains
      expect(isBusinessEmail('random@yahoo.com')).toBe(false);
    });

    test('should provide detailed email validation', () => {
      const validResult = validateEmailDetailed('test@example.com');
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBeUndefined();

      const invalidResult = validateEmailDetailed('invalid-email');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBeDefined();
    });

    test('should provide detailed URL validation', () => {
      const validResult = validateUrlDetailed('https://example.com');
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBeUndefined();

      const invalidResult = validateUrlDetailed('invalid-url');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBeDefined();
    });
  });

  describe('Translation Helper Utils', () => {
    test('should validate supported locales', () => {
      expect(isSupportedLocale('en')).toBe(true);
      expect(isSupportedLocale('vi')).toBe(true);
      expect(isSupportedLocale('fr')).toBe(false);
      expect(isSupportedLocale('')).toBe(false);
    });

    test('should provide default locale', () => {
      expect(getDefaultLocale()).toBe('en');
    });

    test('should provide supported locales', () => {
      const locales = getSupportedLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('vi');
      expect(locales).toHaveLength(2);
    });

    test('should normalize locales', () => {
      expect(normalizeLocale('EN')).toBe('en');
      expect(normalizeLocale('Vi')).toBe('vi');
      expect(normalizeLocale('en-US')).toBe('en');
      expect(normalizeLocale('vi-VN')).toBe('vi');
      expect(normalizeLocale('invalid')).toBe('en');
    });

    test('should format currency', () => {
      const enFormatted = formatCurrency(1000, 'en');
      const viFormatted = formatCurrency(1000, 'vi');

      expect(typeof enFormatted).toBe('string');
      expect(typeof viFormatted).toBe('string');
      expect(enFormatted).toContain('1,000');
      expect(viFormatted).toContain('1.000');
    });

    test('should format dates', () => {
      const date = new Date('2024-01-15');
      const enFormatted = formatDate(date, 'en');
      const viFormatted = formatDate(date, 'vi');

      expect(typeof enFormatted).toBe('string');
      expect(typeof viFormatted).toBe('string');
    });

    test('should format numbers', () => {
      const enFormatted = formatNumber(1234.56, 'en');
      const viFormatted = formatNumber(1234.56, 'vi');

      expect(typeof enFormatted).toBe('string');
      expect(typeof viFormatted).toBe('string');
    });

    test('should interpolate translations', () => {
      const template = 'Hello {name}, you have {count} messages';
      const result = interpolateTranslation(template, {
        name: 'John',
        count: 5,
      });
      expect(result).toBe('Hello John, you have 5 messages');
    });

    test('should pluralize by locale', () => {
      const enResult = pluralizeByLocale(1, 'en', 'item', 'items');
      const enResultPlural = pluralizeByLocale(2, 'en', 'item', 'items');

      expect(enResult).toBe('item');
      expect(enResultPlural).toBe('items');

      // Vietnamese doesn't have plural forms
      const viResult = pluralizeByLocale(1, 'vi', 'sản phẩm');
      const viResultPlural = pluralizeByLocale(2, 'vi', 'sản phẩm');

      expect(viResult).toBe('sản phẩm');
      expect(viResultPlural).toBe('sản phẩm');
    });
  });
});
