import {
  isContactForPrice,
  formatProductPrice,
  getContactForPriceText,
  getPriceTBDText,
  getPricingGuidanceText,
  getCartQuoteMessage,
  getAdminOrderPricingMessage,
  getAdminProductZeroPriceMessage,
} from '../utils';

describe('Zero-Price Product Utilities', () => {
  describe('isContactForPrice', () => {
    it('should return true for zero price', () => {
      expect(isContactForPrice(0)).toBe(true);
      expect(isContactForPrice({ price: 0 })).toBe(true);
    });

    it('should return false for non-zero price', () => {
      expect(isContactForPrice(100)).toBe(false);
      expect(isContactForPrice({ price: 100 })).toBe(false);
      expect(isContactForPrice({ price: 0.01 })).toBe(false);
    });

    it('should handle string-like numbers correctly', () => {
      expect(isContactForPrice({ price: Number('0') })).toBe(true);
      expect(isContactForPrice({ price: Number('100') })).toBe(false);
    });
  });

  describe('formatProductPrice', () => {
    it('should return contact for price text for zero price', () => {
      expect(formatProductPrice(0, 'en')).toBe('Contact for Price');
      expect(formatProductPrice(0, 'vi')).toBe('Liên hệ để biết giá');
    });

    it('should format non-zero prices correctly', () => {
      const enPrice = formatProductPrice(100, 'en');
      const viPrice = formatProductPrice(100, 'vi');

      expect(enPrice).toContain('100');
      expect(viPrice).toContain('100');
    });
  });

  describe('getContactForPriceText', () => {
    it('should return English text by default', () => {
      expect(getContactForPriceText()).toBe('Contact for Price');
      expect(getContactForPriceText('en')).toBe('Contact for Price');
    });

    it('should return Vietnamese text for vi locale', () => {
      expect(getContactForPriceText('vi')).toBe('Liên hệ để biết giá');
    });
  });

  describe('getPriceTBDText', () => {
    it('should return English text by default', () => {
      expect(getPriceTBDText()).toBe('Price: TBD');
      expect(getPriceTBDText('en')).toBe('Price: TBD');
    });

    it('should return Vietnamese text for vi locale', () => {
      expect(getPriceTBDText('vi')).toBe('Giá: Đang chờ báo giá');
    });
  });

  describe('getPricingGuidanceText', () => {
    it('should return English text by default', () => {
      expect(getPricingGuidanceText()).toBe('Price will be provided after you place your order');
      expect(getPricingGuidanceText('en')).toBe('Price will be provided after you place your order');
    });

    it('should return Vietnamese text for vi locale', () => {
      expect(getPricingGuidanceText('vi')).toBe('Giá sẽ được cung cấp sau khi bạn đặt hàng');
    });
  });

  describe('getCartQuoteMessage', () => {
    it('should return English text by default', () => {
      expect(getCartQuoteMessage()).toBe('Your order contains items requiring quotes. We will contact you after order placement.');
      expect(getCartQuoteMessage('en')).toBe('Your order contains items requiring quotes. We will contact you after order placement.');
    });

    it('should return Vietnamese text for vi locale', () => {
      expect(getCartQuoteMessage('vi')).toBe('Đơn hàng của bạn có sản phẩm cần báo giá. Chúng tôi sẽ liên hệ với bạn sau khi đặt hàng.');
    });
  });

  describe('getAdminOrderPricingMessage', () => {
    it('should return English text by default', () => {
      expect(getAdminOrderPricingMessage()).toBe('⚠️ This order requires pricing before processing');
      expect(getAdminOrderPricingMessage('en')).toBe('⚠️ This order requires pricing before processing');
    });

    it('should return Vietnamese text for vi locale', () => {
      expect(getAdminOrderPricingMessage('vi')).toBe('⚠️ Đơn hàng này cần đặt giá cho các sản phẩm trước khi xử lý');
    });
  });

  describe('getAdminProductZeroPriceMessage', () => {
    it('should return English text by default', () => {
      expect(getAdminProductZeroPriceMessage()).toBe('💡 Price 0 = Customer must contact for pricing');
      expect(getAdminProductZeroPriceMessage('en')).toBe('💡 Price 0 = Customer must contact for pricing');
    });

    it('should return Vietnamese text for vi locale', () => {
      expect(getAdminProductZeroPriceMessage('vi')).toBe('💡 Giá 0 = Khách hàng cần liên hệ để biết giá');
    });
  });
});
