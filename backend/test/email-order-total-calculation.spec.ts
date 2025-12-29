import { Test, TestingModule } from '@nestjs/testing';
import { EmailHandlebarsHelpers } from '../src/notifications/helpers/email-handlebars-helpers';

describe('Email Order Total Calculation', () => {
  let helpers: Record<string, any>;

  beforeEach(async () => {
    helpers = EmailHandlebarsHelpers.getAllHelpers();
  });

  describe('safeCalculateOrderTotal', () => {
    it('should calculate correct total with all components', () => {
      const orderData = {
        items: [
          { price: 100000, quantity: 2, total: 200000 }, // 200,000 VND
          { price: 50000, quantity: 1, total: 50000 },   // 50,000 VND
        ],
        shippingCost: 25000,    // 25,000 VND
        taxAmount: 25000,       // 25,000 VND (10% of 250,000)
        discountAmount: 10000,  // 10,000 VND discount
      };

      const result = helpers.safeCalculateOrderTotal(orderData, 'vi');

      // Expected: 250,000 + 25,000 + 25,000 - 10,000 = 290,000 VND
      expect(result).toBe('290.000 ₫');
    });

    it('should handle undefined prices gracefully', () => {
      const orderData = {
        items: [
          { price: 100000, quantity: 2, total: 200000 },
          { price: undefined, quantity: 1, total: undefined }, // Undefined price item
        ],
        shippingCost: 25000,
        taxAmount: 25000,
        discountAmount: 0,
      };

      const result = helpers.safeCalculateOrderTotal(orderData, 'vi');

      // Expected: 200,000 + 25,000 + 25,000 = 250,000 VND with quote note
      expect(result).toContain('250.000 ₫');
      expect(result).toContain('+ giá sản phẩm cần báo giá');
    });

    it('should handle missing shipping/tax/discount fields', () => {
      const orderData = {
        items: [
          { price: 100000, quantity: 1, total: 100000 },
        ],
        // Missing shippingCost, taxAmount, discountAmount
      };

      const result = helpers.safeCalculateOrderTotal(orderData, 'vi');

      // Should only include item total
      expect(result).toBe('100.000 ₫');
    });

    it('should work with English locale', () => {
      const orderData = {
        items: [
          { price: 100000, quantity: 1, total: 100000 },
        ],
        shippingCost: 25000,
        taxAmount: 10000,
        discountAmount: 5000,
      };

      const result = helpers.safeCalculateOrderTotal(orderData, 'en');

      // Expected: 100,000 + 25,000 + 10,000 - 5,000 = 130,000 VND
      expect(result).toBe('130.000 ₫');
    });

    it('should handle zero values correctly', () => {
      const orderData = {
        items: [
          { price: 0, quantity: 1, total: 0 }, // Zero price item (quote item)
          { price: 50000, quantity: 2, total: 100000 },
        ],
        shippingCost: 0,
        taxAmount: 0,
        discountAmount: 0,
      };

      const result = helpers.safeCalculateOrderTotal(orderData, 'vi');

      // Should only include the priced item
      expect(result).toBe('100.000 ₫');
    });

    it('should handle empty items array', () => {
      const orderData = {
        items: [],
        shippingCost: 25000,
        taxAmount: 2500,
        discountAmount: 0,
      };

      const result = helpers.safeCalculateOrderTotal(orderData, 'vi');

      // Should only include shipping and tax
      expect(result).toBe('27.500 ₫');
    });

    it('should handle invalid order data', () => {
      const result1 = helpers.safeCalculateOrderTotal(null, 'vi');
      const result2 = helpers.safeCalculateOrderTotal(undefined, 'vi');
      const result3 = helpers.safeCalculateOrderTotal('invalid', 'vi');

      expect(result1).toBe('0');
      expect(result2).toBe('0');
      expect(result3).toBe('0');
    });
  });

  describe('formatCurrency helper integration', () => {
    it('should handle undefined amounts correctly', () => {
      const result1 = helpers.formatCurrency(undefined, 'VND', 'vi');
      const result2 = helpers.formatCurrency(null, 'VND', 'vi');
      const result3 = helpers.formatCurrency(NaN, 'VND', 'vi');

      expect(result1).toBe('Liên hệ để biết giá');
      expect(result2).toBe('Liên hệ để biết giá');
      expect(result3).toBe('Liên hệ để biết giá');
    });

    it('should format valid amounts correctly', () => {
      const result = helpers.formatCurrency(185000, 'VND', 'vi');
      expect(result).toBe('185.000 ₫');
    });

    it('should handle 2-parameter calls correctly', () => {
      // Simulate template call: {{formatCurrency amount locale}}
      const result = helpers.formatCurrency(185000, 'vi');
      expect(result).toBe('185.000 ₫');
    });
  });
});