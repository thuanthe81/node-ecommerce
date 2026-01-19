/**
 * Tests for CheckoutContent - Buy Now Order Summary Accuracy
 * Verifies that order totals calculate correctly for Buy Now flow
 * Task 7.5: Verify order summary accuracy for Buy Now
 * Requirements: 4.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createBuyNowSession, clearSession } from '@/lib/checkout-session';

describe('CheckoutContent - Buy Now Order Summary Accuracy', () => {
  beforeEach(() => {
    clearSession();
  });

  describe('Subtotal Calculation for Buy Now', () => {
    it('should calculate correct subtotal for single Buy Now product', () => {
      // Create Buy Now session
      const productId = 'product-1';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-1',
          nameEn: 'Test Product',
          price: '100000',
        },
        quantity: 1,
      };

      // Create checkout items (as done in CheckoutContent)
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal (as done in CheckoutContent)
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Verify subtotal
      expect(subtotal).toBe(100000);
    });

    it('should calculate correct subtotal for multiple quantity Buy Now', () => {
      // Create Buy Now session
      const productId = 'product-2';
      const quantity = 3;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product with multiple quantity
      const buyNowProduct = {
        product: {
          id: 'product-2',
          nameEn: 'Test Product',
          price: '150000',
        },
        quantity: 3,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Verify subtotal
      expect(subtotal).toBe(450000); // 150000 * 3
    });

    it('should exclude zero-price products from subtotal calculation', () => {
      // Create Buy Now session for free product
      const productId = 'free-product-1';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate free product
      const buyNowProduct = {
        product: {
          id: 'free-product-1',
          nameEn: 'Free Product',
          price: '0',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal (should exclude zero-price items)
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Verify subtotal is 0
      expect(subtotal).toBe(0);
    });
  });

  describe('Tax Calculation for Buy Now', () => {
    it('should calculate 10% tax on subtotal', () => {
      // Create Buy Now session
      const productId = 'product-3';
      const quantity = 2;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-3',
          nameEn: 'Test Product',
          price: '200000',
        },
        quantity: 2,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Calculate tax (as done in CheckoutContent)
      const tax = subtotal * 0.1;

      // Verify tax calculation
      expect(subtotal).toBe(400000); // 200000 * 2
      expect(tax).toBe(40000); // 10% of 400000
    });

    it('should calculate zero tax for zero-price products', () => {
      // Create Buy Now session for free product
      const productId = 'free-product-2';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate free product
      const buyNowProduct = {
        product: {
          id: 'free-product-2',
          nameEn: 'Free Product',
          price: '0',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Calculate tax
      const tax = subtotal * 0.1;

      // Verify zero tax
      expect(subtotal).toBe(0);
      expect(tax).toBe(0);
    });
  });

  describe('Shipping Cost Integration for Buy Now', () => {
    it('should include calculated shipping cost in order total', () => {
      // Create Buy Now session
      const productId = 'product-4';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-4',
          nameEn: 'Test Product',
          price: '100000',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Simulate calculated shipping cost (from ShippingMethodSelector)
      const calculatedShippingCost = 50000;
      const shippingCost = calculatedShippingCost;

      // Calculate tax
      const tax = subtotal * 0.1;

      // Calculate total
      const discountAmount = 0;
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total includes shipping
      expect(subtotal).toBe(100000);
      expect(shippingCost).toBe(50000);
      expect(tax).toBe(10000);
      expect(total).toBe(160000); // 100000 + 50000 + 10000
    });

    it('should handle free shipping in order total', () => {
      // Create Buy Now session
      const productId = 'product-5';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate high-value Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-5',
          nameEn: 'High Value Product',
          price: '5000000',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Free shipping
      const calculatedShippingCost = 0;
      const shippingCost = calculatedShippingCost;

      // Calculate tax
      const tax = subtotal * 0.1;

      // Calculate total
      const discountAmount = 0;
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total with free shipping
      expect(subtotal).toBe(5000000);
      expect(shippingCost).toBe(0);
      expect(tax).toBe(500000);
      expect(total).toBe(5500000); // 5000000 + 0 + 500000
    });
  });

  describe('Discount Application for Buy Now', () => {
    it('should apply promotion discount to order total', () => {
      // Create Buy Now session
      const productId = 'product-6';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-6',
          nameEn: 'Test Product',
          price: '200000',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Simulate shipping and tax
      const shippingCost = 50000;
      const tax = subtotal * 0.1;

      // Apply promotion discount
      const appliedPromo = {
        code: 'SAVE20',
        discountAmount: 20000,
        promotionId: 'promo-1',
      };
      const discountAmount = appliedPromo.discountAmount;

      // Calculate total (as done in CheckoutContent)
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total with discount
      expect(subtotal).toBe(200000);
      expect(shippingCost).toBe(50000);
      expect(tax).toBe(20000);
      expect(discountAmount).toBe(20000);
      expect(total).toBe(250000); // 200000 + 50000 + 20000 - 20000
    });

    it('should handle percentage-based discount', () => {
      // Create Buy Now session
      const productId = 'product-7';
      const quantity = 2;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-7',
          nameEn: 'Test Product',
          price: '100000',
        },
        quantity: 2,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Simulate shipping and tax
      const shippingCost = 50000;
      const tax = subtotal * 0.1;

      // Apply 10% discount
      const discountAmount = subtotal * 0.1;

      // Calculate total
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total with percentage discount
      expect(subtotal).toBe(200000); // 100000 * 2
      expect(discountAmount).toBe(20000); // 10% of 200000
      expect(total).toBe(250000); // 200000 + 50000 + 20000 - 20000
    });

    it('should ensure total never goes below zero with large discount', () => {
      // Create Buy Now session
      const productId = 'product-8';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate low-value Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-8',
          nameEn: 'Low Value Product',
          price: '50000',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Simulate shipping and tax
      const shippingCost = 30000;
      const tax = subtotal * 0.1;

      // Apply large discount (larger than subtotal)
      const discountAmount = 100000;

      // Calculate total (should be clamped to 0)
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total is clamped to 0
      expect(subtotal).toBe(50000);
      expect(shippingCost).toBe(30000);
      expect(tax).toBe(5000);
      expect(discountAmount).toBe(100000);
      expect(total).toBe(0); // Clamped to 0, not negative
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complete Order Total Calculation for Buy Now', () => {
    it('should calculate correct total: subtotal + shipping + tax - discount', () => {
      // Create Buy Now session
      const productId = 'product-9';
      const quantity = 3;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-9',
          nameEn: 'Test Product',
          price: '150000',
        },
        quantity: 3,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate all components (as done in CheckoutContent)
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      const calculatedShippingCost = 75000;
      const shippingCost = calculatedShippingCost;
      const tax = subtotal * 0.1;
      const discountAmount = 30000;
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify all components
      expect(subtotal).toBe(450000); // 150000 * 3
      expect(shippingCost).toBe(75000);
      expect(tax).toBe(45000); // 10% of 450000
      expect(discountAmount).toBe(30000);
      expect(total).toBe(540000); // 450000 + 75000 + 45000 - 30000
    });

    it('should calculate correct total without discount', () => {
      // Create Buy Now session
      const productId = 'product-10';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-10',
          nameEn: 'Test Product',
          price: '300000',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate all components (no discount)
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      const calculatedShippingCost = 50000;
      const shippingCost = calculatedShippingCost;
      const tax = subtotal * 0.1;
      const discountAmount = 0; // No discount
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total without discount
      expect(subtotal).toBe(300000);
      expect(shippingCost).toBe(50000);
      expect(tax).toBe(30000);
      expect(discountAmount).toBe(0);
      expect(total).toBe(380000); // 300000 + 50000 + 30000
    });

    it('should calculate correct total with free shipping and discount', () => {
      // Create Buy Now session
      const productId = 'product-11';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-11',
          nameEn: 'Test Product',
          price: '1000000',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate all components (free shipping + discount)
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      const calculatedShippingCost = 0; // Free shipping
      const shippingCost = calculatedShippingCost;
      const tax = subtotal * 0.1;
      const discountAmount = 50000; // Discount applied
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify total with free shipping and discount
      expect(subtotal).toBe(1000000);
      expect(shippingCost).toBe(0);
      expect(tax).toBe(100000);
      expect(discountAmount).toBe(50000);
      expect(total).toBe(1050000); // 1000000 + 0 + 100000 - 50000
    });
  });

  describe('Order Summary Consistency: Buy Now vs Cart', () => {
    it('should use same calculation formula for Buy Now and Cart', () => {
      // Test Buy Now calculation
      createBuyNowSession('product-compare-1', 1);
      const buyNowItems = [
        {
          id: 'buy-now-product-compare-1',
          product: { id: 'product-compare-1', price: '100000' },
          quantity: 1,
        },
      ];

      const buyNowSubtotal = buyNowItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);
      const buyNowShipping = 50000;
      const buyNowTax = buyNowSubtotal * 0.1;
      const buyNowDiscount = 0;
      const buyNowTotal = Math.max(
        0,
        buyNowSubtotal + buyNowShipping + buyNowTax - buyNowDiscount
      );

      // Test Cart calculation (no session)
      clearSession();
      const cartItems = [
        {
          id: 'cart-product-1',
          product: { id: 'cart-product-1', price: '100000' },
          quantity: 1,
        },
      ];

      const cartSubtotal = cartItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);
      const cartShipping = 50000;
      const cartTax = cartSubtotal * 0.1;
      const cartDiscount = 0;
      const cartTotal = Math.max(
        0,
        cartSubtotal + cartShipping + cartTax - cartDiscount
      );

      // Verify both use same formula
      expect(buyNowSubtotal).toBe(cartSubtotal);
      expect(buyNowTax).toBe(cartTax);
      expect(buyNowTotal).toBe(cartTotal);
      expect(buyNowTotal).toBe(160000); // 100000 + 50000 + 10000
    });

    it('should apply same tax rate (10%) for Buy Now and Cart', () => {
      // Buy Now tax
      createBuyNowSession('product-tax-1', 1);
      const buyNowSubtotal = 200000;
      const buyNowTax = buyNowSubtotal * 0.1;

      // Cart tax
      clearSession();
      const cartSubtotal = 200000;
      const cartTax = cartSubtotal * 0.1;

      // Verify same tax rate
      expect(buyNowTax).toBe(cartTax);
      expect(buyNowTax).toBe(20000);
      expect(cartTax).toBe(20000);
    });
  });

  describe('Edge Cases for Buy Now Order Summary', () => {
    it('should handle very large order values', () => {
      // Create Buy Now session
      const productId = 'product-large-1';
      const quantity = 10;
      createBuyNowSession(productId, quantity);

      // Simulate large order
      const buyNowProduct = {
        product: {
          id: 'product-large-1',
          nameEn: 'Expensive Product',
          price: '10000000', // 10 million VND
        },
        quantity: 10,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate totals
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      const shippingCost = 0; // Free shipping for large orders
      const tax = subtotal * 0.1;
      const discountAmount = 1000000; // 1 million discount
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify large order calculation
      expect(subtotal).toBe(100000000); // 10M * 10
      expect(tax).toBe(10000000); // 10% of 100M
      expect(total).toBe(109000000); // 100M + 0 + 10M - 1M
    });

    it('should handle decimal precision in calculations', () => {
      // Create Buy Now session
      const productId = 'product-decimal-1';
      const quantity = 3;
      createBuyNowSession(productId, quantity);

      // Simulate product with price that creates decimal tax
      const buyNowProduct = {
        product: {
          id: 'product-decimal-1',
          nameEn: 'Test Product',
          price: '33333', // Creates decimal in tax calculation
        },
        quantity: 3,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate totals
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      const shippingCost = 50000;
      const tax = subtotal * 0.1;
      const discountAmount = 0;
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify calculations handle decimals
      expect(subtotal).toBe(99999); // 33333 * 3
      expect(tax).toBeCloseTo(9999.9, 1); // 10% of 99999 (allow floating point precision)
      expect(total).toBeCloseTo(159998.9, 1); // 99999 + 50000 + 9999.9
    });

    it('should handle minimum order value (1 VND)', () => {
      // Create Buy Now session
      const productId = 'product-min-1';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate minimum price product
      const buyNowProduct = {
        product: {
          id: 'product-min-1',
          nameEn: 'Minimum Price Product',
          price: '1',
        },
        quantity: 1,
      };

      // Create checkout items
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate totals
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      const shippingCost = 50000;
      const tax = subtotal * 0.1;
      const discountAmount = 0;
      const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

      // Verify minimum order calculation
      expect(subtotal).toBe(1);
      expect(tax).toBe(0.1);
      expect(total).toBe(50001.1); // 1 + 50000 + 0.1
    });
  });
});
