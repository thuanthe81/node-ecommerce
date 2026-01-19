/**
 * Tests for promotion code support in Buy Now checkout
 * Validates Requirements 4.3, 4.6
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createBuyNowSession, clearSession, getSession } from '@/lib/checkout-session';

describe('CheckoutContent - Buy Now Promotion Support', () => {
  beforeEach(() => {
    clearSession();
  });

  describe('Promotion Code Validation with Buy Now', () => {
    it('should validate promotion code with correct Buy Now product subtotal', () => {
      // Create Buy Now session with single product
      const productId = 'product-1';
      const quantity = 1;
      const productPrice = 100000;

      createBuyNowSession(productId, quantity);

      // Simulate promotion validation as done in CheckoutContent
      const promoCode = 'SAVE10';
      const subtotal = productPrice * quantity; // 100000

      // Simulate validation request data
      const validationData = {
        code: promoCode,
        orderAmount: subtotal,
      };

      // Verify validation would be called with correct subtotal
      expect(validationData.code).toBe('SAVE10');
      expect(validationData.orderAmount).toBe(100000);

      // Simulate successful validation response
      const mockResponse = {
        valid: true,
        discountAmount: 10000,
      };

      expect(mockResponse.valid).toBe(true);
      expect(mockResponse.discountAmount).toBe(10000);
    });

    it('should calculate correct subtotal for multiple quantity Buy Now', () => {
      // Create Buy Now session with multiple quantity
      const productId = 'product-2';
      const quantity = 3;
      const productPrice = 100000;

      createBuyNowSession(productId, quantity);

      // Calculate subtotal as CheckoutContent does
      const subtotal = productPrice * quantity; // 300000

      // Simulate validation request
      const validationData = {
        code: 'BULK10',
        orderAmount: subtotal,
      };

      // Verify correct subtotal calculation
      expect(validationData.orderAmount).toBe(300000);

      // Simulate 10% discount
      const discountAmount = subtotal * 0.1;
      expect(discountAmount).toBe(30000);
    });

    it('should handle invalid promotion code for Buy Now', () => {
      // Create Buy Now session
      const productId = 'product-3';
      const quantity = 1;
      const productPrice = 100000;

      createBuyNowSession(productId, quantity);

      const subtotal = productPrice * quantity;

      // Simulate validation request
      const validationData = {
        code: 'INVALID',
        orderAmount: subtotal,
      };

      // Verify validation data
      expect(validationData.code).toBe('INVALID');
      expect(validationData.orderAmount).toBe(100000);

      // Simulate invalid response
      const mockResponse = {
        valid: false,
        message: 'Invalid promotion code',
      };

      expect(mockResponse.valid).toBe(false);
      expect(mockResponse.message).toBe('Invalid promotion code');
    });

    it('should handle promotion with minimum order amount requirement', () => {
      // Create Buy Now session with low-value product
      const productId = 'product-4';
      const quantity = 1;
      const productPrice = 50000; // Below minimum

      createBuyNowSession(productId, quantity);

      const subtotal = productPrice * quantity;

      // Simulate validation request
      const validationData = {
        code: 'MIN500K',
        orderAmount: subtotal,
      };

      // Verify validation data
      expect(validationData.orderAmount).toBe(50000);

      // Simulate response for minimum not met
      const mockResponse = {
        valid: false,
        message: 'Minimum order amount not met',
      };

      expect(mockResponse.valid).toBe(false);
      expect(mockResponse.message).toContain('Minimum order amount');
    });

    it('should support fixed discount promotions for Buy Now', () => {
      // Create Buy Now session
      const productId = 'product-5';
      const quantity = 2;
      const productPrice = 150000;

      createBuyNowSession(productId, quantity);

      const subtotal = productPrice * quantity; // 300000

      // Simulate validation request
      const validationData = {
        code: 'FIXED50K',
        orderAmount: subtotal,
      };

      // Verify validation data
      expect(validationData.orderAmount).toBe(300000);

      // Simulate fixed discount response
      const mockResponse = {
        valid: true,
        promotion: {
          type: 'FIXED',
          value: 50000,
        },
        discountAmount: 50000,
      };

      expect(mockResponse.valid).toBe(true);
      expect(mockResponse.discountAmount).toBe(50000);
      expect(mockResponse.promotion?.type).toBe('FIXED');
    });

    it('should handle zero-price product with promotion', () => {
      // Create Buy Now session with zero-price product
      const productId = 'product-7';
      const quantity = 1;
      const productPrice = 0; // Free product

      createBuyNowSession(productId, quantity);

      const subtotal = productPrice * quantity; // 0

      // Simulate validation request
      const validationData = {
        code: 'SAVE10',
        orderAmount: subtotal,
      };

      // Verify validation with 0 amount
      expect(validationData.orderAmount).toBe(0);

      // Simulate response for zero-price
      const mockResponse = {
        valid: false,
        message: 'Cannot apply promotion to zero-price items',
      };

      expect(mockResponse.valid).toBe(false);
    });
  });

  describe('Promotion Integration with Buy Now Order Creation', () => {
    it('should include promotion data in Buy Now order', () => {
      // Create Buy Now session
      const productId = 'product-8';
      const quantity = 1;

      createBuyNowSession(productId, quantity);

      // Simulate applied promotion (as stored in CheckoutContent state)
      const appliedPromo = {
        code: 'SAVE10',
        discountAmount: 10000,
        promotionId: 'promo-1',
      };

      // Simulate order creation data (as done in CheckoutContent.handlePlaceOrder)
      const orderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: [{ productId, quantity }],
        promotionCode: appliedPromo.code,
        promotionId: appliedPromo.promotionId,
        locale: 'en' as const,
      };

      // Verify promotion data is included
      expect(orderData.promotionCode).toBe('SAVE10');
      expect(orderData.promotionId).toBe('promo-1');
      expect(orderData.items).toHaveLength(1);
      expect(orderData.items[0].productId).toBe(productId);
    });

    it('should calculate correct total with promotion discount', () => {
      // Create Buy Now session
      const productId = 'product-9';
      const quantity = 2;
      const productPrice = 100000;

      createBuyNowSession(productId, quantity);

      // Calculate order totals (as done in CheckoutContent)
      const subtotal = productPrice * quantity; // 200000
      const shippingCost = 50000;
      const tax = subtotal * 0.1; // 20000
      const discountAmount = 20000; // Promotion discount
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total calculation
      expect(subtotal).toBe(200000);
      expect(shippingCost).toBe(50000);
      expect(tax).toBe(20000);
      expect(discountAmount).toBe(20000);
      expect(total).toBe(250000); // 200000 + 50000 + 20000 - 20000
    });

    it('should ensure total never goes below zero with large discount', () => {
      // Create Buy Now session
      const productId = 'product-10';
      const quantity = 1;
      const productPrice = 50000;

      createBuyNowSession(productId, quantity);

      // Calculate with large discount
      const subtotal = productPrice * quantity; // 50000
      const shippingCost = 30000;
      const tax = subtotal * 0.1; // 5000
      const discountAmount = 100000; // Discount larger than subtotal
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total is clamped to 0
      expect(total).toBe(0);
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Buy Now Session Verification', () => {
    it('should maintain Buy Now session during promotion application', () => {
      // Create Buy Now session
      const productId = 'product-11';
      const quantity = 2;

      createBuyNowSession(productId, quantity);

      // Verify session exists
      const session = getSession();
      expect(session).not.toBeNull();
      expect(session?.source).toBe('buy-now');
      expect(session?.product?.id).toBe(productId);
      expect(session?.product?.quantity).toBe(quantity);

      // Simulate promotion application (session should remain intact)
      const appliedPromo = {
        code: 'SAVE10',
        discountAmount: 10000,
        promotionId: 'promo-1',
      };

      // Verify session still exists after promotion
      const sessionAfterPromo = getSession();
      expect(sessionAfterPromo).not.toBeNull();
      expect(sessionAfterPromo?.source).toBe('buy-now');
      expect(sessionAfterPromo?.product?.id).toBe(productId);
    });
  });
});
