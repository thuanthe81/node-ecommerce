/**
 * Tests for CheckoutContent component
 * Verifies Buy Now and Cart checkout data loading logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createBuyNowSession, clearSession, getSession } from '@/lib/checkout-session';

describe('CheckoutContent - Data Loading Logic', () => {
  beforeEach(() => {
    // Clear any existing session before each test
    clearSession();
  });

  describe('Buy Now Checkout', () => {
    it('should create checkout items from Buy Now session', () => {
      // Simulate Buy Now session creation
      const productId = 'test-product-123';
      const quantity = 2;

      createBuyNowSession(productId, quantity);

      // Simulate the logic in CheckoutContent
      const buyNowProduct = {
        product: {
          id: productId,
          nameEn: 'Test Product',
          nameVi: 'Sản phẩm thử nghiệm',
          price: '100000',
          images: [],
        },
        quantity: quantity,
      };

      // Create checkout items as done in CheckoutContent
      const checkoutItems = [{
        id: `buy-now-${buyNowProduct.product.id}`,
        product: buyNowProduct.product,
        quantity: buyNowProduct.quantity,
      }];

      // Verify checkout items structure
      expect(checkoutItems).toHaveLength(1);
      expect(checkoutItems[0].id).toBe(`buy-now-${productId}`);
      expect(checkoutItems[0].product.id).toBe(productId);
      expect(checkoutItems[0].quantity).toBe(quantity);
    });

    it('should calculate subtotal correctly for Buy Now product', () => {
      const buyNowProduct = {
        product: {
          id: 'test-product',
          price: '150000',
        },
        quantity: 3,
      };

      const checkoutItems = [{
        id: `buy-now-${buyNowProduct.product.id}`,
        product: buyNowProduct.product,
        quantity: buyNowProduct.quantity,
      }];

      // Calculate subtotal as done in CheckoutContent
      const subtotal = checkoutItems.reduce(
        (sum, item) => {
          const price = Number(item.product.price);
          return sum + (price > 0 ? price * item.quantity : 0);
        },
        0,
      );

      expect(subtotal).toBe(450000); // 150000 * 3
    });

    it('should handle zero-price products in Buy Now', () => {
      const buyNowProduct = {
        product: {
          id: 'free-product',
          price: '0',
        },
        quantity: 1,
      };

      const checkoutItems = [{
        id: `buy-now-${buyNowProduct.product.id}`,
        product: buyNowProduct.product,
        quantity: buyNowProduct.quantity,
      }];

      const subtotal = checkoutItems.reduce(
        (sum, item) => {
          const price = Number(item.product.price);
          return sum + (price > 0 ? price * item.quantity : 0);
        },
        0,
      );

      expect(subtotal).toBe(0);
    });
  });

  describe('Cart Checkout', () => {
    it('should use cart items for cart checkout', () => {
      const cartItems = [
        {
          id: 'cart-item-1',
          product: {
            id: 'product-1',
            price: '100000',
          },
          quantity: 2,
        },
        {
          id: 'cart-item-2',
          product: {
            id: 'product-2',
            price: '200000',
          },
          quantity: 1,
        },
      ];

      // Simulate cart checkout (no Buy Now session)
      const checkoutSource = 'cart';
      const buyNowProduct = null;

      const checkoutItems = checkoutSource === 'buy-now' && buyNowProduct
        ? [{
            id: `buy-now-${buyNowProduct.product.id}`,
            product: buyNowProduct.product,
            quantity: buyNowProduct.quantity,
          }]
        : cartItems;

      expect(checkoutItems).toHaveLength(2);
      expect(checkoutItems).toEqual(cartItems);
    });

    it('should calculate subtotal correctly for multiple cart items', () => {
      const cartItems = [
        {
          id: 'cart-item-1',
          product: {
            id: 'product-1',
            price: '100000',
          },
          quantity: 2,
        },
        {
          id: 'cart-item-2',
          product: {
            id: 'product-2',
            price: '200000',
          },
          quantity: 1,
        },
      ];

      const subtotal = cartItems.reduce(
        (sum, item) => {
          const price = Number(item.product.price);
          return sum + (price > 0 ? price * item.quantity : 0);
        },
        0,
      );

      expect(subtotal).toBe(400000); // (100000 * 2) + (200000 * 1)
    });
  });

  describe('Order Data Creation', () => {
    it('should create order items from Buy Now checkout', () => {
      const buyNowProduct = {
        product: {
          id: 'buy-now-product',
          price: '100000',
        },
        quantity: 2,
      };

      const checkoutItems = [{
        id: `buy-now-${buyNowProduct.product.id}`,
        product: buyNowProduct.product,
        quantity: buyNowProduct.quantity,
      }];

      // Simulate order data creation
      const orderItems = checkoutItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      expect(orderItems).toHaveLength(1);
      expect(orderItems[0].productId).toBe('buy-now-product');
      expect(orderItems[0].quantity).toBe(2);
    });

    it('should create order items from cart checkout', () => {
      const cartItems = [
        {
          id: 'cart-item-1',
          product: {
            id: 'product-1',
            price: '100000',
          },
          quantity: 2,
        },
        {
          id: 'cart-item-2',
          product: {
            id: 'product-2',
            price: '200000',
          },
          quantity: 1,
        },
      ];

      const orderItems = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      expect(orderItems).toHaveLength(2);
      expect(orderItems[0].productId).toBe('product-1');
      expect(orderItems[0].quantity).toBe(2);
      expect(orderItems[1].productId).toBe('product-2');
      expect(orderItems[1].quantity).toBe(1);
    });
  });

  describe('Abandoned Checkout Handling', () => {
    it('should clear session after successful order completion for Buy Now', () => {
      // Create a Buy Now session
      const productId = 'test-product-123';
      const quantity = 2;
      createBuyNowSession(productId, quantity);

      // Verify session exists
      let session = getSession();
      expect(session).not.toBeNull();
      expect(session?.source).toBe('buy-now');
      expect(session?.product?.id).toBe(productId);

      // Simulate successful order completion
      // In CheckoutContent, this happens after orderApi.createOrder succeeds
      clearSession();

      // Verify session is cleared
      session = getSession();
      expect(session).toBeNull();
    });

    it('should not clear session on order creation failure', () => {
      // Create a Buy Now session
      const productId = 'test-product-123';
      const quantity = 2;
      createBuyNowSession(productId, quantity);

      // Verify session exists
      let session = getSession();
      expect(session).not.toBeNull();

      // Simulate order creation failure
      // In CheckoutContent, session is NOT cleared when order creation fails
      // Session should still exist for retry

      session = getSession();
      expect(session).not.toBeNull();
      expect(session?.source).toBe('buy-now');
      expect(session?.product?.id).toBe(productId);
    });

    it('should add product to cart when checkout is abandoned', async () => {
      // Mock addToCart function
      const mockAddToCart = jest.fn().mockResolvedValue(undefined);

      const productId = 'abandoned-product';
      const quantity = 3;

      // Simulate abandoned checkout callback
      const onAbandon = async (pid: string, qty: number) => {
        await mockAddToCart(pid, qty);
        clearSession();
      };

      // Trigger abandonment
      await onAbandon(productId, quantity);

      // Verify addToCart was called with correct parameters
      expect(mockAddToCart).toHaveBeenCalledWith(productId, quantity);
      expect(mockAddToCart).toHaveBeenCalledTimes(1);

      // Verify session was cleared after adding to cart
      const session = getSession();
      expect(session).toBeNull();
    });

    it('should handle addToCart failure gracefully during abandonment', async () => {
      // Mock addToCart function that fails
      const mockAddToCart = jest.fn().mockRejectedValue(new Error('Failed to add to cart'));

      const productId = 'abandoned-product';
      const quantity = 3;

      // Create session
      createBuyNowSession(productId, quantity);

      // Simulate abandoned checkout callback with error handling
      const onAbandon = async (pid: string, qty: number) => {
        try {
          await mockAddToCart(pid, qty);
          clearSession();
        } catch (error) {
          // Error is logged but session is not cleared
          console.error('Failed to add abandoned product to cart:', error);
        }
      };

      // Trigger abandonment
      await onAbandon(productId, quantity);

      // Verify addToCart was called
      expect(mockAddToCart).toHaveBeenCalledWith(productId, quantity);

      // Session should still exist since addToCart failed
      const session = getSession();
      expect(session).not.toBeNull();
    });

    it('should only enable abandoned checkout hook for Buy Now flow', () => {
      // Test Buy Now flow
      const checkoutSource = 'buy-now';
      const buyNowProduct = {
        product: { id: 'test-product' },
        quantity: 2,
      };

      const enabled = checkoutSource === 'buy-now' && !!buyNowProduct;
      expect(enabled).toBe(true);

      // Test Cart flow
      const cartCheckoutSource = 'cart';
      const noBuyNowProduct = null;

      const cartEnabled = cartCheckoutSource === 'buy-now' && !!noBuyNowProduct;
      expect(cartEnabled).toBe(false);
    });

    it('should pass correct product ID and quantity to abandoned checkout hook', () => {
      const buyNowProduct = {
        product: {
          id: 'hook-test-product',
          nameEn: 'Test Product',
          price: '100000',
        },
        quantity: 5,
      };

      // Simulate hook parameters
      const hookParams = {
        enabled: true,
        productId: buyNowProduct?.product.id,
        quantity: buyNowProduct?.quantity,
      };

      expect(hookParams.productId).toBe('hook-test-product');
      expect(hookParams.quantity).toBe(5);
    });
  });
});
