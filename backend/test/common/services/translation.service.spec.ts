/**
 * Tests for TranslationService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TranslationService } from '../../../src/common/services/translation.service';
import { CONSTANTS } from '@alacraft/shared';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TranslationService],
    }).compile();

    service = module.get<TranslationService>(TranslationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('translateOrderStatus', () => {
    it('should translate order statuses to English', () => {
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.PENDING, 'en')).toBe('Pending');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.PENDING_QUOTE, 'en')).toBe('Pending Quote');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.PROCESSING, 'en')).toBe('Processing');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.SHIPPED, 'en')).toBe('Shipped');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.DELIVERED, 'en')).toBe('Delivered');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.CANCELLED, 'en')).toBe('Cancelled');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.REFUNDED, 'en')).toBe('Refunded');
    });

    it('should translate order statuses to Vietnamese', () => {
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.PENDING, 'vi')).toBe('Chờ xử lý');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.PENDING_QUOTE, 'vi')).toBe('Chờ báo giá');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.PROCESSING, 'vi')).toBe('Đang xử lý');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.SHIPPED, 'vi')).toBe('Đã giao vận');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.DELIVERED, 'vi')).toBe('Đã giao hàng');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.CANCELLED, 'vi')).toBe('Đã hủy');
      expect(service.translateOrderStatus(CONSTANTS.STATUS.ORDER_STATUS.REFUNDED, 'vi')).toBe('Đã hoàn tiền');
    });

    it('should handle unknown statuses', () => {
      expect(service.translateOrderStatus('UNKNOWN_STATUS', 'en')).toBe('UNKNOWN_STATUS');
      expect(service.translateOrderStatus('UNKNOWN_STATUS', 'vi')).toBe('UNKNOWN_STATUS');
    });

    it('should handle case insensitive input', () => {
      expect(service.translateOrderStatus('pending', 'en')).toBe('Pending');
      expect(service.translateOrderStatus('PENDING', 'en')).toBe('Pending');
    });
  });

  describe('translatePaymentStatus', () => {
    it('should translate payment statuses to English', () => {
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.PENDING, 'en')).toBe('Pending');
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.PAID, 'en')).toBe('Paid');
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.FAILED, 'en')).toBe('Failed');
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED, 'en')).toBe('Refunded');
    });

    it('should translate payment statuses to Vietnamese', () => {
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.PENDING, 'vi')).toBe('Chờ thanh toán');
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.PAID, 'vi')).toBe('Đã thanh toán');
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.FAILED, 'vi')).toBe('Thất bại');
      expect(service.translatePaymentStatus(CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED, 'vi')).toBe('Đã hoàn tiền');
    });
  });

  describe('translatePaymentMethod', () => {
    it('should translate payment methods to English', () => {
      expect(service.translatePaymentMethod('bank_transfer', 'en')).toBe('Bank Transfer');
      expect(service.translatePaymentMethod('cash_on_delivery', 'en')).toBe('Cash on Delivery');
      expect(service.translatePaymentMethod('credit_card', 'en')).toBe('Credit Card');
      expect(service.translatePaymentMethod('paypal', 'en')).toBe('PayPal');
    });

    it('should translate payment methods to Vietnamese', () => {
      expect(service.translatePaymentMethod('bank_transfer', 'vi')).toBe('Chuyển khoản ngân hàng');
      expect(service.translatePaymentMethod('cash_on_delivery', 'vi')).toBe('Thanh toán khi nhận hàng');
      expect(service.translatePaymentMethod('credit_card', 'vi')).toBe('Thẻ tín dụng');
      expect(service.translatePaymentMethod('paypal', 'vi')).toBe('PayPal');
    });

    it('should handle different formats', () => {
      expect(service.translatePaymentMethod('Bank Transfer', 'en')).toBe('Bank Transfer');
      expect(service.translatePaymentMethod('bank-transfer', 'en')).toBe('Bank Transfer');
      expect(service.translatePaymentMethod('banktransfer', 'en')).toBe('Bank Transfer');
    });

    it('should return original for unknown methods', () => {
      expect(service.translatePaymentMethod('custom_payment', 'en')).toBe('custom_payment');
    });
  });

  describe('translateShippingMethod', () => {
    it('should be deprecated and return original method name', () => {
      // Mock console.warn to verify deprecation warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(service.translateShippingMethod('standard', 'en')).toBe('standard');
      expect(service.translateShippingMethod('express', 'en')).toBe('express');
      expect(service.translateShippingMethod('overnight', 'en')).toBe('overnight');
      expect(service.translateShippingMethod('free', 'en')).toBe('free');

      // Verify deprecation warning was called
      expect(consoleSpy).toHaveBeenCalledWith(
        'TranslationService.translateShippingMethod is deprecated. Use ShippingService.getShippingMethodDetails() or query the shipping_methods database table instead.'
      );

      consoleSpy.mockRestore();
    });

    it('should return original method name for Vietnamese locale', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(service.translateShippingMethod('standard', 'vi')).toBe('standard');
      expect(service.translateShippingMethod('express', 'vi')).toBe('express');
      expect(service.translateShippingMethod('overnight', 'vi')).toBe('overnight');
      expect(service.translateShippingMethod('free', 'vi')).toBe('free');

      consoleSpy.mockRestore();
    });

    it('should handle different formats by returning original', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(service.translateShippingMethod('Standard Shipping', 'en')).toBe('Standard Shipping');
      expect(service.translateShippingMethod('standard-shipping', 'en')).toBe('standard-shipping');
      expect(service.translateShippingMethod('standardshipping', 'en')).toBe('standardshipping');

      consoleSpy.mockRestore();
    });

    it('should return original for custom methods', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      expect(service.translateShippingMethod('Custom Delivery Method', 'en')).toBe('Custom Delivery Method');

      consoleSpy.mockRestore();
    });
  });

  describe('getPaymentMethodInstructions', () => {
    it('should return instructions for bank transfer', () => {
      const enInstructions = service.getPaymentMethodInstructions('bank_transfer', 'en');
      const viInstructions = service.getPaymentMethodInstructions('bank_transfer', 'vi');

      expect(enInstructions).toContain('transfer payment');
      expect(viInstructions).toContain('chuyển khoản');
    });

    it('should return instructions for cash on delivery', () => {
      const enInstructions = service.getPaymentMethodInstructions('cash_on_delivery', 'en');
      const viInstructions = service.getPaymentMethodInstructions('cash_on_delivery', 'vi');

      expect(enInstructions).toContain('cash upon delivery');
      expect(viInstructions).toContain('tiền mặt');
    });

    it('should return empty string for unknown methods', () => {
      expect(service.getPaymentMethodInstructions('unknown_method', 'en')).toBe('');
    });
  });

  describe('getShippingMethodDescription', () => {
    it('should be deprecated and return fallback description', () => {
      // Mock console.warn to verify deprecation warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const enResult = service.getShippingMethodDescription('standard', 'en');
      const viResult = service.getShippingMethodDescription('standard', 'vi');

      expect(enResult).toBe('Standard delivery (3-7 business days)');
      expect(viResult).toBe('Giao hàng tiêu chuẩn (3-7 ngày làm việc)');

      // Verify deprecation warning was called
      expect(consoleSpy).toHaveBeenCalledWith(
        'TranslationService.getShippingMethodDescription is deprecated. Use ShippingService.getShippingMethodDetails() or query the shipping_methods database table instead.'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('formatDate', () => {
    it('should format dates according to locale', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');

      const enFormatted = service.formatDate(testDate, 'en');
      const viFormatted = service.formatDate(testDate, 'vi');

      expect(enFormatted).toContain('January');
      expect(viFormatted).toContain('tháng');
    });

    it('should handle string dates', () => {
      const dateString = '2024-01-15T10:30:00Z';

      const formatted = service.formatDate(dateString, 'en');
      expect(formatted).toContain('January');
    });

    it('should handle empty dates', () => {
      expect(service.formatDate('', 'en')).toBe('');
      expect(service.formatDate(null as any, 'en')).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency according to locale', () => {
      expect(service.formatCurrency(100, 'en')).toContain('$100');
      expect(service.formatCurrency(100, 'vi')).toContain('100');
    });

    it('should handle invalid amounts', () => {
      expect(service.formatCurrency(null as any, 'en')).toBe('0');
      expect(service.formatCurrency(undefined as any, 'en')).toBe('0');
    });
  });

  describe('getEmailPhrase', () => {
    it('should return translated email phrases', () => {
      expect(service.getEmailPhrase('order_confirmation', 'en')).toBe('Order Confirmation');
      expect(service.getEmailPhrase('order_confirmation', 'vi')).toBe('Xác nhận đơn hàng');

      expect(service.getEmailPhrase('thank_you', 'en')).toBe('Thank you for your order!');
      expect(service.getEmailPhrase('thank_you', 'vi')).toBe('Cảm ơn bạn đã đặt hàng!');
    });

    it('should return key for unknown phrases', () => {
      expect(service.getEmailPhrase('unknown_phrase', 'en')).toBe('unknown_phrase');
    });
  });
});