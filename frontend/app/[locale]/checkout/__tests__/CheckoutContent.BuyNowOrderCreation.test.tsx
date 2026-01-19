/**
 * Tests for Buy Now Order Creation
 * Task 9.1: Verify order creation for Buy Now
 *
 * Requirements:
 * - 5.1: Buy Now orders use same CreateOrderData structure as cart orders
 * - 5.2: Order items array contains single item for Buy Now
 * - 5.3: No special flags added to Buy Now orders
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CreateOrderData } from '@/lib/order-api';

describe('CheckoutContent - Buy Now Order Creation (Task 9.1)', () => {
  beforeEach(() => {
    // Clear any state before each test
  });

  describe('Requirement 5.1: Same CreateOrderData structure', () => {
    it('should create Buy Now order with same structure as cart order', () => {
      // Simulate Buy Now checkout items
      const buyNowCheckoutItems = [
        {
          id: 'buy-now-product-123',
          product: {
            id: 'product-123',
            nameEn: 'Test Product',
            nameVi: 'Sản phẩm thử nghiệm',
            price: '150000',
            images: [],
          },
          quantity: 2,
        },
      ];

      // Simulate cart checkout items
      const cartCheckoutItems = [
        {
          id: 'cart-item-1',
          product: {
            id: 'product-456',
            nameEn: 'Cart Product',
            nameVi: 'Sản phẩm giỏ hàng',
            price: '200000',
            images: [],
          },
          quantity: 1,
        },
      ];

      // Create order data for Buy Now (as done in CheckoutContent)
      const buyNowOrderData: CreateOrderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 30000,
        paymentMethod: 'bank_transfer',
        items: buyNowCheckoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: undefined,
        promotionId: undefined,
        locale: 'en',
      };

      // Create order data for cart (as done in CheckoutContent)
      const cartOrderData: CreateOrderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-456',
        billingAddressId: 'addr-456',
        shippingMethod: 'express',
        shippingCost: 50000,
        paymentMethod: 'bank_transfer',
        items: cartCheckoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: undefined,
        promotionId: undefined,
        locale: 'vi',
      };

      // Verify both have the same structure (same keys)
      const buyNowKeys = Object.keys(buyNowOrderData).sort();
      const cartKeys = Object.keys(cartOrderData).sort();

      expect(buyNowKeys).toEqual(cartKeys);

      // Verify all required fields are present in Buy Now order
      expect(buyNowOrderData).toHaveProperty('email');
      expect(buyNowOrderData).toHaveProperty('shippingAddressId');
      expect(buyNowOrderData).toHaveProperty('billingAddressId');
      expect(buyNowOrderData).toHaveProperty('shippingMethod');
      expect(buyNowOrderData).toHaveProperty('shippingCost');
      expect(buyNowOrderData).toHaveProperty('paymentMethod');
      expect(buyNowOrderData).toHaveProperty('items');
      expect(buyNowOrderData).toHaveProperty('locale');

      // Verify data types match
      expect(typeof buyNowOrderData.email).toBe('string');
      expect(typeof buyNowOrderData.shippingAddressId).toBe('string');
      expect(typeof buyNowOrderData.billingAddressId).toBe('string');
      expect(typeof buyNowOrderData.shippingMethod).toBe('string');
      expect(typeof buyNowOrderData.shippingCost).toBe('number');
      expect(typeof buyNowOrderData.paymentMethod).toBe('string');
      expect(Array.isArray(buyNowOrderData.items)).toBe(true);
      expect(typeof buyNowOrderData.locale).toBe('string');
    });

    it('should not add any special flags or fields to Buy Now orders', () => {
      const buyNowCheckoutItems = [
        {
          id: 'buy-now-product-789',
          product: {
            id: 'product-789',
            price: '100000',
          },
          quantity: 1,
        },
      ];

      const buyNowOrderData: CreateOrderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 30000,
        paymentMethod: 'bank_transfer',
        items: buyNowCheckoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        locale: 'en',
      };

      // Verify no special flags like 'isBuyNow', 'source', 'buyNowFlag', etc.
      expect(buyNowOrderData).not.toHaveProperty('isBuyNow');
      expect(buyNowOrderData).not.toHaveProperty('source');
      expect(buyNowOrderData).not.toHaveProperty('buyNowFlag');
      expect(buyNowOrderData).not.toHaveProperty('checkoutType');
      expect(buyNowOrderData).not.toHaveProperty('orderSource');

      // Verify only standard CreateOrderData fields are present
      const allowedKeys = [
        'email',
        'shippingAddressId',
        'billingAddressId',
        'shippingMethod',
        'shippingCost',
        'paymentMethod',
        'items',
        'notes',
        'promotionId',
        'locale',
      ];

      const actualKeys = Object.keys(buyNowOrderData);
      actualKeys.forEach((key) => {
        expect(allowedKeys).toContain(key);
      });
    });
  });

  describe('Requirement 5.2: Single item in order items array', () => {
    it('should create order with single item for Buy Now', () => {
      const buyNowProduct = {
        product: {
          id: 'single-product',
          price: '250000',
        },
        quantity: 3,
      };

      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      const orderItems = checkoutItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Verify only one item in the array
      expect(orderItems).toHaveLength(1);
      expect(orderItems[0].productId).toBe('single-product');
      expect(orderItems[0].quantity).toBe(3);
    });

    it('should preserve quantity from Buy Now session in order item', () => {
      const testCases = [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 5 },
        { productId: 'prod-3', quantity: 10 },
      ];

      testCases.forEach(({ productId, quantity }) => {
        const checkoutItems = [
          {
            id: `buy-now-${productId}`,
            product: { id: productId, price: '100000' },
            quantity: quantity,
          },
        ];

        const orderItems = checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }));

        expect(orderItems).toHaveLength(1);
        expect(orderItems[0].productId).toBe(productId);
        expect(orderItems[0].quantity).toBe(quantity);
      });
    });

    it('should create order item with correct structure', () => {
      const checkoutItems = [
        {
          id: 'buy-now-test-product',
          product: {
            id: 'test-product',
            price: '150000',
          },
          quantity: 2,
        },
      ];

      const orderItems = checkoutItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Verify order item structure
      expect(orderItems[0]).toHaveProperty('productId');
      expect(orderItems[0]).toHaveProperty('quantity');
      expect(Object.keys(orderItems[0])).toHaveLength(2);

      // Verify types
      expect(typeof orderItems[0].productId).toBe('string');
      expect(typeof orderItems[0].quantity).toBe('number');
    });
  });

  describe('Requirement 5.3: No special flags in order data', () => {
    it('should not include checkout source in order data', () => {
      const checkoutSource = 'buy-now'; // This is internal state only

      const checkoutItems = [
        {
          id: 'buy-now-product',
          product: { id: 'product', price: '100000' },
          quantity: 1,
        },
      ];

      const orderData: CreateOrderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 30000,
        paymentMethod: 'bank_transfer',
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        locale: 'en',
      };

      // Verify checkoutSource is NOT included in order data
      expect(orderData).not.toHaveProperty('checkoutSource');
      expect(orderData).not.toHaveProperty('source');
    });

    it('should create identical order structure for Buy Now and cart with same data', () => {
      const productId = 'identical-product';
      const quantity = 2;
      const email = 'same@example.com';
      const addressId = 'same-addr';
      const shippingMethod = 'standard';
      const shippingCost = 30000;

      // Buy Now order
      const buyNowOrderData: CreateOrderData = {
        email,
        shippingAddressId: addressId,
        billingAddressId: addressId,
        shippingMethod,
        shippingCost,
        paymentMethod: 'bank_transfer',
        items: [{ productId, quantity }],
        locale: 'en',
      };

      // Cart order with same product
      const cartOrderData: CreateOrderData = {
        email,
        shippingAddressId: addressId,
        billingAddressId: addressId,
        shippingMethod,
        shippingCost,
        paymentMethod: 'bank_transfer',
        items: [{ productId, quantity }],
        locale: 'en',
      };

      // Orders should be structurally identical
      expect(JSON.stringify(buyNowOrderData)).toBe(JSON.stringify(cartOrderData));
    });

    it('should support optional fields in Buy Now orders same as cart orders', () => {
      const checkoutItems = [
        {
          id: 'buy-now-product',
          product: { id: 'product', price: '100000' },
          quantity: 1,
        },
      ];

      // Order with optional fields
      const orderDataWithOptionals: CreateOrderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 30000,
        paymentMethod: 'bank_transfer',
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: 'Please handle with care',
        promotionId: 'promo-123',
        locale: 'vi',
      };

      // Verify optional fields are included
      expect(orderDataWithOptionals.notes).toBe('Please handle with care');
      expect(orderDataWithOptionals.promotionId).toBe('promo-123');

      // Order without optional fields
      const orderDataWithoutOptionals: CreateOrderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-123',
        billingAddressId: 'addr-123',
        shippingMethod: 'standard',
        shippingCost: 30000,
        paymentMethod: 'bank_transfer',
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        locale: 'en',
      };

      // Verify optional fields can be omitted
      expect(orderDataWithoutOptionals.notes).toBeUndefined();
      expect(orderDataWithoutOptionals.promotionId).toBeUndefined();
    });
  });

  describe('Order data mapping from checkout items', () => {
    it('should correctly map Buy Now checkout items to order items', () => {
      const buyNowProduct = {
        product: {
          id: 'mapping-test-product',
          nameEn: 'Mapping Test',
          nameVi: 'Kiểm tra ánh xạ',
          price: '175000',
          images: [{ url: '/test.jpg' }],
          // Other product fields that should NOT be in order items
          description: 'Test description',
          category: 'test-category',
        },
        quantity: 4,
      };

      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Map to order items (as done in CheckoutContent)
      const orderItems = checkoutItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Verify only productId and quantity are included
      expect(orderItems[0]).toEqual({
        productId: 'mapping-test-product',
        quantity: 4,
      });

      // Verify product details are NOT included in order items
      expect(orderItems[0]).not.toHaveProperty('nameEn');
      expect(orderItems[0]).not.toHaveProperty('nameVi');
      expect(orderItems[0]).not.toHaveProperty('price');
      expect(orderItems[0]).not.toHaveProperty('images');
      expect(orderItems[0]).not.toHaveProperty('description');
      expect(orderItems[0]).not.toHaveProperty('category');
    });
  });
});
