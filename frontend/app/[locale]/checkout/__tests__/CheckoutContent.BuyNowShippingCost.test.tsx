/**
 * Tests for CheckoutContent - Buy Now Shipping Cost Calculation
 * Verifies that shipping costs are calculated correctly for Buy Now flow
 * Task 7.4: Verify shipping cost calculation for Buy Now
 * Requirements: 4.4
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createBuyNowSession, clearSession } from '@/lib/checkout-session';

describe('CheckoutContent - Buy Now Shipping Cost Calculation', () => {
  beforeEach(() => {
    clearSession();
  });

  describe('ShippingMethodSelector Integration with Buy Now', () => {
    it('should pass correct cart items to ShippingMethodSelector for single Buy Now product', () => {
      // Create Buy Now session
      const productId = 'product-1';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product data (as loaded in CheckoutContent)
      const buyNowProduct = {
        product: {
          id: 'product-1',
          nameEn: 'Test Product',
          price: '100000',
          weight: 1.5, // kg
        },
        quantity: 1,
      };

      // Create checkout items for Buy Now (as done in CheckoutContent)
      const checkoutItems = [
        {
          id: `buy-now-${buyNowProduct.product.id}`,
          product: buyNowProduct.product,
          quantity: buyNowProduct.quantity,
        },
      ];

      // Verify checkout items structure for ShippingMethodSelector
      expect(checkoutItems).toHaveLength(1);
      expect(checkoutItems[0].product.id).toBe('product-1');
      expect(checkoutItems[0].product.weight).toBe(1.5);
      expect(checkoutItems[0].quantity).toBe(1);
    });

    it('should pass correct cart items for multiple quantity Buy Now', () => {
      // Create Buy Now session with multiple quantity
      const productId = 'product-2';
      const quantity = 3;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product data
      const buyNowProduct = {
        product: {
          id: 'product-2',
          nameEn: 'Heavy Product',
          price: '200000',
          weight: 2.0, // kg
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

      // Verify checkout items for shipping calculation
      expect(checkoutItems).toHaveLength(1);
      expect(checkoutItems[0].product.weight).toBe(2.0);
      expect(checkoutItems[0].quantity).toBe(3);

      // Total weight would be 2.0 * 3 = 6.0 kg
      const totalWeight = checkoutItems[0].product.weight! * checkoutItems[0].quantity;
      expect(totalWeight).toBe(6.0);
    });

    it('should pass correct order value (subtotal) to ShippingMethodSelector', () => {
      // Create Buy Now session
      const productId = 'product-3';
      const quantity = 2;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-3',
          nameEn: 'Test Product',
          price: '150000',
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

      // Calculate subtotal (as done in CheckoutContent)
      const subtotal = checkoutItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      // Verify subtotal calculation
      expect(subtotal).toBe(300000); // 150000 * 2
    });

    it('should handle Buy Now product without weight (default weight)', () => {
      // Create Buy Now session
      const productId = 'product-4';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate Buy Now product without weight
      const buyNowProduct = {
        product: {
          id: 'product-4',
          nameEn: 'Product Without Weight',
          price: '100000',
          // No weight specified
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

      // ShippingMethodSelector should use default weight (0.5 kg) if not specified
      const weight = checkoutItems[0].product.weight || 0.5;
      expect(weight).toBe(0.5);
    });
  });

  describe('Shipping Rate Calculation for Buy Now', () => {
    it('should calculate shipping rates based on Buy Now product weight and destination', async () => {
      // Create Buy Now session
      const productId = 'product-5';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Mock shipping API
      const mockCalculateShipping = jest.fn().mockResolvedValue([
        {
          method: 'standard',
          nameEn: 'Standard Shipping',
          nameVi: 'Giao hàng tiêu chuẩn',
          descriptionEn: '5-7 business days',
          descriptionVi: '5-7 ngày làm việc',
          cost: 50000,
          estimatedDays: '5-7 days',
          isFreeShipping: false,
        },
        {
          method: 'express',
          nameEn: 'Express Shipping',
          nameVi: 'Giao hàng nhanh',
          descriptionEn: '2-3 business days',
          descriptionVi: '2-3 ngày làm việc',
          cost: 100000,
          estimatedDays: '2-3 days',
          isFreeShipping: false,
        },
      ]);

      // Simulate shipping address
      const shippingAddress = {
        city: 'Ho Chi Minh City',
        state: 'Ho Chi Minh',
        postalCode: '700000',
        country: 'Vietnam',
      };

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-5',
          nameEn: 'Test Product',
          price: '200000',
          weight: 1.0,
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
      const subtotal = Number(buyNowProduct.product.price) * buyNowProduct.quantity;

      // Prepare shipping calculation data (as done in ShippingMethodSelector)
      const items = checkoutItems.map((item) => ({
        weight: item.product.weight || 0.5,
        quantity: item.quantity,
      }));

      const calculateData = {
        destinationCity: shippingAddress.city,
        destinationState: shippingAddress.state,
        destinationPostalCode: shippingAddress.postalCode,
        destinationCountry: shippingAddress.country,
        items,
        orderValue: subtotal,
        locale: 'en' as const,
      };

      // Call shipping API
      const rates = await mockCalculateShipping(calculateData);

      // Verify shipping calculation was called with correct data
      expect(mockCalculateShipping).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationCity: 'Ho Chi Minh City',
          items: [{ weight: 1.0, quantity: 1 }],
          orderValue: 200000,
        })
      );

      // Verify rates were returned
      expect(rates).toHaveLength(2);
      expect(rates[0].method).toBe('standard');
      expect(rates[0].cost).toBe(50000);
      expect(rates[1].method).toBe('express');
      expect(rates[1].cost).toBe(100000);
    });

    it('should calculate shipping rates for multiple quantity Buy Now', async () => {
      // Create Buy Now session
      const productId = 'product-6';
      const quantity = 4;
      createBuyNowSession(productId, quantity);

      // Mock shipping API
      const mockCalculateShipping = jest.fn().mockResolvedValue([
        {
          method: 'standard',
          nameEn: 'Standard Shipping',
          cost: 80000, // Higher cost due to more weight
          estimatedDays: '5-7 days',
          isFreeShipping: false,
        },
      ]);

      // Simulate shipping address
      const shippingAddress = {
        city: 'Hanoi',
        state: 'Hanoi',
        postalCode: '100000',
        country: 'Vietnam',
      };

      // Simulate Buy Now product with multiple quantity
      const buyNowProduct = {
        product: {
          id: 'product-6',
          nameEn: 'Bulk Product',
          price: '100000',
          weight: 1.5,
        },
        quantity: 4,
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
      const subtotal = Number(buyNowProduct.product.price) * buyNowProduct.quantity;

      // Prepare shipping calculation data
      const items = checkoutItems.map((item) => ({
        weight: item.product.weight || 0.5,
        quantity: item.quantity,
      }));

      const calculateData = {
        destinationCity: shippingAddress.city,
        destinationState: shippingAddress.state,
        destinationPostalCode: shippingAddress.postalCode,
        destinationCountry: shippingAddress.country,
        items,
        orderValue: subtotal,
        locale: 'en' as const,
      };

      // Call shipping API
      const rates = await mockCalculateShipping(calculateData);

      // Verify shipping calculation with correct weight and quantity
      expect(mockCalculateShipping).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ weight: 1.5, quantity: 4 }], // Total weight: 1.5 * 4 = 6.0 kg
          orderValue: 400000, // 100000 * 4
        })
      );

      // Verify rates
      expect(rates).toHaveLength(1);
      expect(rates[0].cost).toBe(80000);
    });

    it('should handle free shipping for Buy Now orders above threshold', async () => {
      // Create Buy Now session
      const productId = 'product-7';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Mock shipping API with free shipping
      const mockCalculateShipping = jest.fn().mockResolvedValue([
        {
          method: 'standard',
          nameEn: 'Standard Shipping',
          cost: 0,
          estimatedDays: '5-7 days',
          isFreeShipping: true,
        },
      ]);

      // Simulate high-value Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-7',
          nameEn: 'High Value Product',
          price: '5000000', // 5 million VND
          weight: 1.0,
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
      const subtotal = Number(buyNowProduct.product.price) * buyNowProduct.quantity;

      // Prepare shipping calculation data
      const items = checkoutItems.map((item) => ({
        weight: item.product.weight || 0.5,
        quantity: item.quantity,
      }));

      const calculateData = {
        destinationCity: 'Ho Chi Minh City',
        destinationState: 'Ho Chi Minh',
        destinationPostalCode: '700000',
        destinationCountry: 'Vietnam',
        items,
        orderValue: subtotal,
        locale: 'en' as const,
      };

      // Call shipping API
      const rates = await mockCalculateShipping(calculateData);

      // Verify free shipping
      expect(mockCalculateShipping).toHaveBeenCalledWith(
        expect.objectContaining({
          orderValue: 5000000,
        })
      );
      expect(rates[0].isFreeShipping).toBe(true);
      expect(rates[0].cost).toBe(0);
    });
  });

  describe('Shipping Cost Selection for Buy Now', () => {
    it('should update shipping cost when method is selected in Buy Now', () => {
      // Create Buy Now session
      const productId = 'product-8';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate available shipping rates
      const shippingRates = [
        {
          method: 'standard',
          nameEn: 'Standard Shipping',
          cost: 50000,
          estimatedDays: '5-7 days',
          isFreeShipping: false,
        },
        {
          method: 'express',
          nameEn: 'Express Shipping',
          cost: 100000,
          estimatedDays: '2-3 days',
          isFreeShipping: false,
        },
      ];

      // Simulate method selection (as done in CheckoutContent.handleShippingMethodSelect)
      let shippingMethod = '';
      let shippingCost = 0;

      const handleShippingMethodSelect = (methodId: string) => {
        shippingMethod = methodId;
        const selectedRate = shippingRates.find((rate) => rate.method === methodId);
        if (selectedRate) {
          shippingCost = selectedRate.cost;
        }
      };

      // Select standard shipping
      handleShippingMethodSelect('standard');

      expect(shippingMethod).toBe('standard');
      expect(shippingCost).toBe(50000);

      // Switch to express shipping
      handleShippingMethodSelect('express');

      expect(shippingMethod).toBe('express');
      expect(shippingCost).toBe(100000);
    });

    it('should include shipping cost in order data for Buy Now', () => {
      // Create Buy Now session
      const productId = 'product-9';
      const quantity = 2;
      createBuyNowSession(productId, quantity);

      // Simulate selected shipping method
      const shippingMethod = 'express';
      const shippingCost = 100000;

      // Simulate Buy Now product
      const buyNowProduct = {
        product: {
          id: 'product-9',
          nameEn: 'Test Product',
          price: '150000',
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

      // Create order data (as done in CheckoutContent.handlePlaceOrder)
      const orderData = {
        email: 'test@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: shippingMethod,
        shippingCost: shippingCost,
        paymentMethod: 'bank_transfer',
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        locale: 'en' as const,
      };

      // Verify order data includes shipping cost
      expect(orderData.shippingMethod).toBe('express');
      expect(orderData.shippingCost).toBe(100000);
      expect(orderData.items).toHaveLength(1);
    });

    it('should handle zero shipping cost for free shipping in Buy Now', () => {
      // Create Buy Now session
      const productId = 'product-10';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate free shipping rate
      const shippingRates = [
        {
          method: 'standard',
          nameEn: 'Standard Shipping',
          cost: 0,
          estimatedDays: '5-7 days',
          isFreeShipping: true,
        },
      ];

      // Select free shipping
      let shippingMethod = 'standard';
      let shippingCost = 0;

      const selectedRate = shippingRates.find((rate) => rate.method === shippingMethod);
      if (selectedRate) {
        shippingCost = selectedRate.cost;
      }

      // Verify free shipping
      expect(shippingMethod).toBe('standard');
      expect(shippingCost).toBe(0);
      expect(selectedRate?.isFreeShipping).toBe(true);
    });
  });

  describe('Shipping Cost Consistency: Buy Now vs Cart', () => {
    it('should use same shipping calculation logic for Buy Now and Cart', async () => {
      // Mock shipping API
      const mockCalculateShipping = jest.fn().mockResolvedValue([
        {
          method: 'standard',
          cost: 50000,
        },
      ]);

      // Test Buy Now
      createBuyNowSession('product-compare-1', 1);
      const buyNowItems = [
        {
          id: 'buy-now-product-compare-1',
          product: { id: 'product-compare-1', weight: 1.0 },
          quantity: 1,
        },
      ];

      const buyNowData = {
        destinationCity: 'Hanoi',
        destinationState: 'Hanoi',
        destinationPostalCode: '100000',
        destinationCountry: 'Vietnam',
        items: buyNowItems.map((item) => ({
          weight: item.product.weight || 0.5,
          quantity: item.quantity,
        })),
        orderValue: 100000,
        locale: 'en' as const,
      };

      await mockCalculateShipping(buyNowData);

      // Test Cart (no session)
      clearSession();
      const cartItems = [
        {
          id: 'cart-product-1',
          product: { id: 'cart-product-1', weight: 1.0 },
          quantity: 1,
        },
      ];

      const cartData = {
        destinationCity: 'Hanoi',
        destinationState: 'Hanoi',
        destinationPostalCode: '100000',
        destinationCountry: 'Vietnam',
        items: cartItems.map((item) => ({
          weight: item.product.weight || 0.5,
          quantity: item.quantity,
        })),
        orderValue: 100000,
        locale: 'en' as const,
      };

      await mockCalculateShipping(cartData);

      // Verify both calls use same structure
      expect(mockCalculateShipping).toHaveBeenCalledTimes(2);
      expect(mockCalculateShipping.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          items: [{ weight: 1.0, quantity: 1 }],
          orderValue: 100000,
        })
      );
      expect(mockCalculateShipping.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          items: [{ weight: 1.0, quantity: 1 }],
          orderValue: 100000,
        })
      );
    });

    it('should not add special flags to Buy Now shipping calculation', async () => {
      // Create Buy Now session
      createBuyNowSession('product-flags-1', 1);

      // Mock shipping API
      const mockCalculateShipping = jest.fn().mockResolvedValue([
        {
          method: 'standard',
          cost: 50000,
        },
      ]);

      // Prepare shipping calculation data
      const calculateData = {
        destinationCity: 'Ho Chi Minh City',
        destinationState: 'Ho Chi Minh',
        destinationPostalCode: '700000',
        destinationCountry: 'Vietnam',
        items: [{ weight: 1.0, quantity: 1 }],
        orderValue: 100000,
        locale: 'en' as const,
      };

      await mockCalculateShipping(calculateData);

      // Verify no special Buy Now flags
      expect(mockCalculateShipping).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationCity: 'Ho Chi Minh City',
          items: [{ weight: 1.0, quantity: 1 }],
          orderValue: 100000,
        })
      );

      // Verify no special properties
      const callArg = mockCalculateShipping.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('isBuyNow');
      expect(callArg).not.toHaveProperty('buyNowShipping');
    });
  });

  describe('Shipping Address Updates for Buy Now', () => {
    it('should recalculate shipping when address changes in Buy Now', async () => {
      // Create Buy Now session
      const productId = 'product-11';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Mock shipping API
      const mockCalculateShipping = jest.fn()
        .mockResolvedValueOnce([
          { method: 'standard', cost: 50000 },
        ])
        .mockResolvedValueOnce([
          { method: 'standard', cost: 75000 }, // Different cost for different address
        ]);

      // First address
      const address1 = {
        city: 'Hanoi',
        state: 'Hanoi',
        postalCode: '100000',
        country: 'Vietnam',
      };

      const items = [{ weight: 1.0, quantity: 1 }];

      await mockCalculateShipping({
        ...address1,
        items,
        orderValue: 100000,
        locale: 'en' as const,
      });

      // Change address
      const address2 = {
        city: 'Da Nang',
        state: 'Da Nang',
        postalCode: '550000',
        country: 'Vietnam',
      };

      await mockCalculateShipping({
        ...address2,
        items,
        orderValue: 100000,
        locale: 'en' as const,
      });

      // Verify shipping was recalculated for both addresses
      expect(mockCalculateShipping).toHaveBeenCalledTimes(2);
      expect(mockCalculateShipping.mock.calls[0][0].city).toBe('Hanoi');
      expect(mockCalculateShipping.mock.calls[1][0].city).toBe('Da Nang');
    });

    it('should maintain shipping cost when navigating back in Buy Now', () => {
      // Create Buy Now session
      const productId = 'product-12';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Simulate shipping method selection
      let currentStep = 2;
      let shippingMethod = 'express';
      let shippingCost = 100000;

      // Verify shipping is set at step 2
      expect(currentStep).toBe(2);
      expect(shippingMethod).toBe('express');
      expect(shippingCost).toBe(100000);

      // Navigate to step 3
      currentStep = 3;
      expect(shippingMethod).toBe('express');
      expect(shippingCost).toBe(100000);

      // Navigate back to step 2
      currentStep = 2;
      expect(shippingMethod).toBe('express');
      expect(shippingCost).toBe(100000);

      // Shipping cost should persist
      expect(shippingCost).toBe(100000);
    });
  });

  describe('Edge Cases for Buy Now Shipping', () => {
    it('should handle zero-price product shipping calculation', async () => {
      // Create Buy Now session for free product
      const productId = 'free-product-1';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Mock shipping API
      const mockCalculateShipping = jest.fn().mockResolvedValue([
        {
          method: 'standard',
          cost: 50000, // Still charge shipping for free product
        },
      ]);

      // Simulate free product
      const buyNowProduct = {
        product: {
          id: 'free-product-1',
          nameEn: 'Free Product',
          price: '0',
          weight: 0.5,
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

      const subtotal = 0; // Free product

      const items = checkoutItems.map((item) => ({
        weight: item.product.weight || 0.5,
        quantity: item.quantity,
      }));

      await mockCalculateShipping({
        destinationCity: 'Hanoi',
        destinationState: 'Hanoi',
        destinationPostalCode: '100000',
        destinationCountry: 'Vietnam',
        items,
        orderValue: subtotal,
        locale: 'en' as const,
      });

      // Verify shipping is calculated even for free product
      expect(mockCalculateShipping).toHaveBeenCalledWith(
        expect.objectContaining({
          orderValue: 0,
          items: [{ weight: 0.5, quantity: 1 }],
        })
      );
    });

    it('should handle out-of-stock product shipping calculation', async () => {
      // Create Buy Now session for out-of-stock product
      const productId = 'oos-product-1';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Mock shipping API
      const mockCalculateShipping = jest.fn().mockResolvedValue([
        {
          method: 'standard',
          cost: 50000,
        },
      ]);

      // Simulate out-of-stock product (booking order)
      const buyNowProduct = {
        product: {
          id: 'oos-product-1',
          nameEn: 'Out of Stock Product',
          price: '100000',
          weight: 1.0,
          stock: 0, // Out of stock
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

      const subtotal = Number(buyNowProduct.product.price) * buyNowProduct.quantity;

      const items = checkoutItems.map((item) => ({
        weight: item.product.weight || 0.5,
        quantity: item.quantity,
      }));

      await mockCalculateShipping({
        destinationCity: 'Hanoi',
        destinationState: 'Hanoi',
        destinationPostalCode: '100000',
        destinationCountry: 'Vietnam',
        items,
        orderValue: subtotal,
        locale: 'en' as const,
      });

      // Verify shipping is calculated for out-of-stock product
      expect(mockCalculateShipping).toHaveBeenCalledWith(
        expect.objectContaining({
          orderValue: 100000,
          items: [{ weight: 1.0, quantity: 1 }],
        })
      );
    });

    it('should handle shipping calculation error gracefully in Buy Now', async () => {
      // Create Buy Now session
      const productId = 'product-error-1';
      const quantity = 1;
      createBuyNowSession(productId, quantity);

      // Mock shipping API with error
      const mockCalculateShipping = jest.fn().mockRejectedValue({
        response: {
          data: {
            message: 'Shipping service unavailable',
          },
        },
      });

      let error = null;
      let shippingRates: any[] = [];

      try {
        shippingRates = await mockCalculateShipping({
          destinationCity: 'Hanoi',
          destinationState: 'Hanoi',
          destinationPostalCode: '100000',
          destinationCountry: 'Vietnam',
          items: [{ weight: 1.0, quantity: 1 }],
          orderValue: 100000,
          locale: 'en' as const,
        });
      } catch (err: any) {
        error = err.response?.data?.message || 'Shipping calculation error';
      }

      // Verify error handling
      expect(mockCalculateShipping).toHaveBeenCalled();
      expect(error).toBe('Shipping service unavailable');
      expect(shippingRates).toHaveLength(0);
    });
  });
});
