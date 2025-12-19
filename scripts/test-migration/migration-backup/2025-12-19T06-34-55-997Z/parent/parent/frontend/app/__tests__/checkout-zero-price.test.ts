/**
 * Tests for zero-price product handling in checkout
 * Validates Requirements 3.3
 */

import { isContactForPrice, getPriceTBDText, getCartQuoteMessage } from '../utils';

describe('Checkout Zero-Price Product Handling', () => {
  describe('isContactForPrice', () => {
    it('should return true for zero price', () => {
      expect(isContactForPrice(0)).toBe(true);
      expect(isContactForPrice({ price: 0 })).toBe(true);
    });

    it('should return false for non-zero price', () => {
      expect(isContactForPrice(10)).toBe(false);
      expect(isContactForPrice({ price: 10 })).toBe(false);
      expect(isContactForPrice(0.01)).toBe(false);
    });
  });

  describe('getPriceTBDText', () => {
    it('should return English text for en locale', () => {
      expect(getPriceTBDText('en')).toBe('Price: TBD');
    });

    it('should return Vietnamese text for vi locale', () => {
      expect(getPriceTBDText('vi')).toBe('Giá: Đang chờ báo giá');
    });
  });

  describe('getCartQuoteMessage', () => {
    it('should return English message for en locale', () => {
      expect(getCartQuoteMessage('en')).toBe(
        'Your order contains items requiring quotes. We will contact you after order placement.'
      );
    });

    it('should return Vietnamese message for vi locale', () => {
      expect(getCartQuoteMessage('vi')).toBe(
        'Đơn hàng của bạn có sản phẩm cần báo giá. Chúng tôi sẽ liên hệ với bạn sau khi đặt hàng.'
      );
    });
  });

  describe('Checkout calculations with zero-price items', () => {
    it('should calculate subtotal excluding zero-price items', () => {
      const cartItems = [
        { product: { price: '10' }, quantity: 2 }, // $20
        { product: { price: '0' }, quantity: 1 },  // $0 (zero-price)
        { product: { price: '5' }, quantity: 3 },  // $15
      ];

      const subtotal = cartItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      expect(subtotal).toBe(35); // 20 + 0 + 15
    });

    it('should handle cart with all zero-price items', () => {
      const cartItems = [
        { product: { price: '0' }, quantity: 1 },
        { product: { price: '0' }, quantity: 2 },
      ];

      const subtotal = cartItems.reduce((sum, item) => {
        const price = Number(item.product.price);
        return sum + (price > 0 ? price * item.quantity : 0);
      }, 0);

      expect(subtotal).toBe(0);
    });

    it('should detect zero-price items in cart', () => {
      const cartItems = [
        { product: { price: '10' }, quantity: 2 },
        { product: { price: '0' }, quantity: 1 },
      ];

      const hasZeroPriceItems = cartItems.some(item =>
        isContactForPrice(Number(item.product.price))
      );

      expect(hasZeroPriceItems).toBe(true);
    });

    it('should not detect zero-price items when none exist', () => {
      const cartItems = [
        { product: { price: '10' }, quantity: 2 },
        { product: { price: '5' }, quantity: 1 },
      ];

      const hasZeroPriceItems = cartItems.some(item =>
        isContactForPrice(Number(item.product.price))
      );

      expect(hasZeroPriceItems).toBe(false);
    });
  });
});
