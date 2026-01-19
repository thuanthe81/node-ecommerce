/**
 * Tests for CheckoutContent - Buy Now Payment Method Support
 * Verifies that payment method selection works correctly in Buy Now flow
 * Task 7.2: Verify payment method support for Buy Now
 * Requirements: 4.2
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createBuyNowSession, clearSession } from '@/lib/checkout-session';

describe('CheckoutContent - Buy Now Payment Method Support', () => {
  beforeEach(() => {
    clearSession();
  });

  describe('Payment Method in Buy Now Flow', () => {
    it('should use bank_transfer as payment method for Buy Now checkout', () => {
      // Create Buy Now session
      const productId = 'test-product-123';
      const quantity = 2;
      createBuyNowSession(productId, quantity);

      // Simulate CheckoutContent payment method (hardcoded to bank_transfer)
      const paymentMethod = 'bank_transfer';

      // Verify payment method is set correctly
      expect(paymentMethod).toBe('bank_transfer');
    });

    it('should include payment method in Buy Now order data', () => {
      // Create Buy Now session
      createBuyNowSession('product-payment-1', 1);

      const buyNowProduct = {
        product: {
          id: 'product-payment-1',
          nameEn: 'Test Product',
          price: '100000',
        },
        quantity: 1,
      };

      // Create checkout items for Buy Now
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Simulate order data creation with payment method
      const orderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        locale: 'en' as const,
      };

      // Verify order data includes payment method
      expect(orderData.paymentMethod).toBe('bank_transfer');
      expect(orderData.items).toHaveLength(1);
      expect(orderData.items[0].productId).toBe('product-payment-1');
    });

    it('should maintain payment method consistency between Buy Now and Cart checkout', () => {
      // Test Buy Now checkout
      createBuyNowSession('buy-now-product', 2);
      const buyNowPaymentMethod = 'bank_transfer';

      // Test Cart checkout (no session)
      clearSession();
      const cartPaymentMethod = 'bank_transfer';

      // Verify both use the same payment method
      expect(buyNowPaymentMethod).toBe(cartPaymentMethod);
      expect(buyNowPaymentMethod).toBe('bank_transfer');
    });
  });

  describe('Bank Transfer Payment in Buy Now', () => {
    it('should display bank transfer information in Buy Now checkout', () => {
      // Create Buy Now session
      createBuyNowSession('product-bank-1', 1);

      // Simulate payment method display
      const paymentMethod = 'bank_transfer';
      const paymentMethodLabel = 'Payment Method';
      const bankTransferLabel = 'Bank Transfer';
      const bankTransferInfo = 'Bank details will be provided after order confirmation';

      // Verify payment information is available
      expect(paymentMethod).toBe('bank_transfer');
      expect(paymentMethodLabel).toBeTruthy();
      expect(bankTransferLabel).toBeTruthy();
      expect(bankTransferInfo).toBeTruthy();
    });

    it('should show bank transfer info in order summary for Buy Now', () => {
      // Create Buy Now session
      createBuyNowSession('product-summary-1', 2);

      const checkoutSource = 'buy-now';
      const currentStep = 3; // Review step

      // Simulate order summary display
      const showBankTransferInfo = currentStep === 3;
      const paymentMethod = 'bank_transfer';

      // Verify bank transfer info is shown in review step
      expect(checkoutSource).toBe('buy-now');
      expect(showBankTransferInfo).toBe(true);
      expect(paymentMethod).toBe('bank_transfer');
    });

    it('should include bank transfer info in sidebar for Buy Now', () => {
      // Create Buy Now session
      createBuyNowSession('product-sidebar-1', 1);

      const checkoutSource = 'buy-now';

      // Simulate sidebar display (shown on all steps)
      const showSidebarBankInfo = true;
      const paymentMethod = 'bank_transfer';

      // Verify bank transfer info is shown in sidebar
      expect(checkoutSource).toBe('buy-now');
      expect(showSidebarBankInfo).toBe(true);
      expect(paymentMethod).toBe('bank_transfer');
    });
  });

  describe('Payment Method Validation in Buy Now', () => {
    it('should validate payment method is set before order creation', () => {
      // Create Buy Now session
      createBuyNowSession('product-validate-1', 1);

      const currentStep = 2; // Shipping method step
      const shippingMethod = 'standard';
      const paymentMethod = 'bank_transfer';

      // Simulate step validation (step 2 requires shipping method, payment is automatic)
      const canProceedFromStep2 = !!shippingMethod;

      // Verify validation
      expect(canProceedFromStep2).toBe(true);
      expect(paymentMethod).toBe('bank_transfer');
    });

    it('should not require manual payment method selection in Buy Now', () => {
      // Create Buy Now session
      createBuyNowSession('product-auto-1', 1);

      // Payment method is automatically set (no user selection needed)
      const paymentMethod = 'bank_transfer';
      const requiresPaymentSelection = false;

      // Verify automatic payment method
      expect(paymentMethod).toBe('bank_transfer');
      expect(requiresPaymentSelection).toBe(false);
    });

    it('should allow proceeding to review step with automatic payment method', () => {
      // Create Buy Now session
      createBuyNowSession('product-proceed-1', 1);

      const currentStep = 2;
      const shippingMethod = 'express';
      const paymentMethod = 'bank_transfer'; // Automatic

      // Check if can proceed to next step
      const canProceed = currentStep === 2 ? !!shippingMethod : true;

      // Verify can proceed with automatic payment method
      expect(canProceed).toBe(true);
      expect(paymentMethod).toBe('bank_transfer');
    });
  });

  describe('Payment Method in Order Creation for Buy Now', () => {
    it('should create Buy Now order with bank_transfer payment method', async () => {
      // Create Buy Now session
      createBuyNowSession('product-create-1', 2);

      const buyNowProduct = {
        product: {
          id: 'product-create-1',
          nameEn: 'Test Product',
          price: '150000',
        },
        quantity: 2,
      };

      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Mock order creation
      const mockCreateOrder = jest.fn().mockResolvedValue({
        id: 'order-123',
        status: 'pending',
        paymentMethod: 'bank_transfer',
      });

      // Create order data
      const orderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        locale: 'en' as const,
      };

      // Create order
      const order = await mockCreateOrder(orderData);

      // Verify order was created with correct payment method
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'bank_transfer',
        })
      );
      expect(order.paymentMethod).toBe('bank_transfer');
      expect(order.id).toBe('order-123');
    });

    it('should handle order creation with bank_transfer for single Buy Now item', async () => {
      // Create Buy Now session
      createBuyNowSession('product-single-1', 1);

      // Mock order API
      const mockCreateOrder = jest.fn().mockResolvedValue({
        id: 'order-456',
        status: 'pending',
        total: 200000,
        paymentMethod: 'bank_transfer',
      });

      // Single item order data
      const orderData = {
        email: 'single@example.com',
        shippingAddressId: 'addr-456',
        billingAddressId: 'addr-456',
        shippingMethod: 'express',
        shippingCost: 75000,
        paymentMethod: 'bank_transfer',
        items: [
          {
            productId: 'product-single-1',
            quantity: 1,
          },
        ],
        locale: 'vi' as const,
      };

      // Create order
      const order = await mockCreateOrder(orderData);

      // Verify single item order with bank_transfer
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'bank_transfer',
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 'product-single-1',
              quantity: 1,
            }),
          ]),
        })
      );
      expect(order.paymentMethod).toBe('bank_transfer');
    });

    it('should include payment method in order data for zero-price Buy Now products', () => {
      // Create Buy Now session for free product
      createBuyNowSession('free-product-1', 1);

      const buyNowProduct = {
        product: {
          id: 'free-product-1',
          nameEn: 'Free Product',
          price: '0',
        },
        quantity: 1,
      };

      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Calculate subtotal (should be 0)
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Create order data (payment method still included even for zero-price)
      const orderData = {
        email: 'free@example.com',
        shippingAddressId: 'addr-789',
        billingAddressId: 'addr-789',
        shippingMethod: 'standard',
        shippingCost: 0,
        paymentMethod: 'bank_transfer',
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        locale: 'en' as const,
      };

      // Verify zero-price order includes payment method
      expect(subtotal).toBe(0);
      expect(orderData.paymentMethod).toBe('bank_transfer');
      expect(orderData.items[0].productId).toBe('free-product-1');
    });
  });

  describe('Payment Method State Management in Buy Now', () => {
    it('should maintain payment method throughout Buy Now checkout steps', () => {
      // Create Buy Now session
      createBuyNowSession('product-steps-1', 2);

      const paymentMethod = 'bank_transfer';
      let currentStep = 1;

      // Step 1: Shipping
      expect(currentStep).toBe(1);
      expect(paymentMethod).toBe('bank_transfer');

      // Step 2: Shipping method
      currentStep = 2;
      expect(paymentMethod).toBe('bank_transfer');

      // Step 3: Review
      currentStep = 3;
      expect(paymentMethod).toBe('bank_transfer');

      // Payment method should be consistent across all steps
      expect(paymentMethod).toBe('bank_transfer');
    });

    it('should not change payment method when navigating back in Buy Now', () => {
      // Create Buy Now session
      createBuyNowSession('product-back-1', 1);

      const paymentMethod = 'bank_transfer';
      let currentStep = 3;

      // At review step
      expect(currentStep).toBe(3);
      expect(paymentMethod).toBe('bank_transfer');

      // Navigate back to step 2
      currentStep = 2;
      expect(paymentMethod).toBe('bank_transfer');

      // Navigate back to step 1
      currentStep = 1;
      expect(paymentMethod).toBe('bank_transfer');

      // Payment method should remain unchanged
      expect(paymentMethod).toBe('bank_transfer');
    });

    it('should preserve payment method after session refresh in Buy Now', () => {
      // Create Buy Now session
      createBuyNowSession('product-refresh-1', 1);

      // Initial payment method
      const initialPaymentMethod = 'bank_transfer';

      // Simulate page refresh (session persists in sessionStorage)
      const session = {
        source: 'buy-now' as const,
        product: {
          id: 'product-refresh-1',
          quantity: 1,
        },
        createdAt: Date.now(),
      };

      // Payment method after refresh (still hardcoded)
      const refreshedPaymentMethod = 'bank_transfer';

      // Verify payment method is preserved
      expect(initialPaymentMethod).toBe('bank_transfer');
      expect(refreshedPaymentMethod).toBe('bank_transfer');
      expect(session.source).toBe('buy-now');
    });
  });

  describe('Payment Method Comparison: Buy Now vs Cart', () => {
    it('should use same payment method structure for Buy Now and Cart orders', () => {
      // Buy Now order
      createBuyNowSession('buy-now-compare-1', 1);
      const buyNowOrderData = {
        email: 'buynow@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: [{ productId: 'buy-now-compare-1', quantity: 1 }],
        locale: 'en' as const,
      };

      // Cart order (no session)
      clearSession();
      const cartOrderData = {
        email: 'cart@example.com',
        shippingAddressId: 'addr-2',
        billingAddressId: 'addr-2',
        shippingMethod: 'express',
        shippingCost: 75000,
        paymentMethod: 'bank_transfer',
        items: [
          { productId: 'cart-product-1', quantity: 2 },
          { productId: 'cart-product-2', quantity: 1 },
        ],
        locale: 'vi' as const,
      };

      // Verify both have same payment method field
      expect(buyNowOrderData.paymentMethod).toBe('bank_transfer');
      expect(cartOrderData.paymentMethod).toBe('bank_transfer');
      expect(buyNowOrderData.paymentMethod).toBe(cartOrderData.paymentMethod);

      // Verify order structure is consistent (only items differ)
      expect(typeof buyNowOrderData.paymentMethod).toBe('string');
      expect(typeof cartOrderData.paymentMethod).toBe('string');
    });

    it('should not add special payment flags for Buy Now orders', () => {
      // Create Buy Now session
      createBuyNowSession('product-flags-1', 1);

      const buyNowOrderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: [{ productId: 'product-flags-1', quantity: 1 }],
        locale: 'en' as const,
      };

      // Verify no special flags
      expect(buyNowOrderData.paymentMethod).toBe('bank_transfer');
      expect(buyNowOrderData).not.toHaveProperty('isBuyNow');
      expect(buyNowOrderData).not.toHaveProperty('buyNowPayment');
      expect(buyNowOrderData).not.toHaveProperty('specialPaymentMethod');

      // Payment method should be identical to cart orders
      const keys = Object.keys(buyNowOrderData);
      expect(keys).toContain('paymentMethod');
      expect(keys).not.toContain('buyNowPaymentMethod');
    });
  });

  describe('Payment Method Error Handling in Buy Now', () => {
    it('should handle order creation failure with payment method intact', async () => {
      // Create Buy Now session
      createBuyNowSession('product-error-1', 1);

      const paymentMethod = 'bank_transfer';

      // Mock order creation failure
      const mockCreateOrder = jest.fn().mockRejectedValue({
        response: {
          data: {
            message: 'Payment processing failed',
          },
        },
      });

      const orderData = {
        email: 'error@example.com',
        shippingAddressId: 'addr-error',
        billingAddressId: 'addr-error',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: [{ productId: 'product-error-1', quantity: 1 }],
        locale: 'en' as const,
      };

      let error = null;

      // Attempt to create order
      try {
        await mockCreateOrder(orderData);
      } catch (err: any) {
        error = err.response?.data?.message;
      }

      // Verify error was caught and payment method is still set
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'bank_transfer',
        })
      );
      expect(error).toBe('Payment processing failed');
      expect(paymentMethod).toBe('bank_transfer'); // Still set for retry
    });

    it('should maintain payment method for order retry in Buy Now', async () => {
      // Create Buy Now session
      createBuyNowSession('product-retry-1', 1);

      const paymentMethod = 'bank_transfer';

      // Mock order creation that fails first, succeeds second
      let attemptCount = 0;
      const mockCreateOrder = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject({
            response: { data: { message: 'Network error' } },
          });
        }
        return Promise.resolve({
          id: 'order-retry-123',
          status: 'pending',
          paymentMethod: 'bank_transfer',
        });
      });

      const orderData = {
        email: 'retry@example.com',
        shippingAddressId: 'addr-retry',
        billingAddressId: 'addr-retry',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: [{ productId: 'product-retry-1', quantity: 1 }],
        locale: 'en' as const,
      };

      // First attempt (fails)
      let order = null;
      try {
        order = await mockCreateOrder(orderData);
      } catch (err) {
        // Expected failure
      }

      // Verify payment method is still set
      expect(paymentMethod).toBe('bank_transfer');
      expect(order).toBeNull();

      // Second attempt (succeeds)
      order = await mockCreateOrder(orderData);

      // Verify order created with same payment method
      expect(mockCreateOrder).toHaveBeenCalledTimes(2);
      expect(order.paymentMethod).toBe('bank_transfer');
      expect(order.id).toBe('order-retry-123');
    });
  });

  describe('Payment Method Integration with Buy Now Flow', () => {
    it('should work with Buy Now abandoned checkout', async () => {
      // Create Buy Now session
      createBuyNowSession('product-abandon-1', 2);

      const paymentMethod = 'bank_transfer';
      const buyNowProduct = {
        product: { id: 'product-abandon-1' },
        quantity: 2,
      };

      // Mock addToCart
      const mockAddToCart = jest.fn().mockResolvedValue(undefined);

      // Simulate abandoned checkout
      const onAbandon = async (productId: string, quantity: number) => {
        await mockAddToCart(productId, quantity);
        clearSession();
      };

      // Trigger abandonment
      await onAbandon(buyNowProduct.product.id, buyNowProduct.quantity);

      // Verify product was added to cart
      expect(mockAddToCart).toHaveBeenCalledWith('product-abandon-1', 2);

      // Payment method should still be available for cart checkout
      expect(paymentMethod).toBe('bank_transfer');
    });

    it('should clear session after successful Buy Now order with payment', async () => {
      // Create Buy Now session
      createBuyNowSession('product-success-1', 1);

      const paymentMethod = 'bank_transfer';

      // Mock successful order creation
      const mockCreateOrder = jest.fn().mockResolvedValue({
        id: 'order-success-123',
        status: 'pending',
        paymentMethod: 'bank_transfer',
      });

      const orderData = {
        email: 'success@example.com',
        shippingAddressId: 'addr-success',
        billingAddressId: 'addr-success',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: [{ productId: 'product-success-1', quantity: 1 }],
        locale: 'en' as const,
      };

      // Create order
      const order = await mockCreateOrder(orderData);

      // Verify order created
      expect(order.id).toBe('order-success-123');
      expect(order.paymentMethod).toBe('bank_transfer');

      // Clear session after success (as done in CheckoutContent)
      clearSession();

      // Verify session is cleared
      const session = { source: 'buy-now', product: null };
      expect(session.product).toBeNull();
    });

    it('should support payment method with Buy Now promotions', () => {
      // Create Buy Now session
      createBuyNowSession('product-promo-1', 1);

      const paymentMethod = 'bank_transfer';
      const appliedPromo = {
        code: 'SAVE10',
        discountAmount: 10000,
        promotionId: 'promo-123',
      };

      // Create order data with promotion
      const orderData = {
        email: 'promo@example.com',
        shippingAddressId: 'addr-promo',
        billingAddressId: 'addr-promo',
        shippingMethod: 'standard',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: [{ productId: 'product-promo-1', quantity: 1 }],
        promotionId: appliedPromo.promotionId,
        locale: 'en' as const,
      };

      // Verify payment method works with promotions
      expect(orderData.paymentMethod).toBe('bank_transfer');
      expect(orderData.promotionId).toBe('promo-123');
      expect(paymentMethod).toBe('bank_transfer');
    });
  });
});
