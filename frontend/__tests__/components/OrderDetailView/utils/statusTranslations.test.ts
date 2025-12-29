/**
 * Tests for status translation utilities
 */

import { getOrderStatusText, getPaymentStatusText, getPaymentMethodText, getShippingMethodText } from '../../../../components/OrderDetailView/utils/statusTranslations';

// Mock translation function
const mockT = (key: string): string => {
  const translations: Record<string, string> = {
    'statusPending': 'Pending',
    'statusProcessing': 'Processing',
    'statusShipped': 'Shipped',
    'statusDelivered': 'Delivered',
    'statusCancelled': 'Cancelled',
    'statusRefunded': 'Refunded',
    'statusPendingQuote': 'Pending Quote',
    'paymentStatus.pending': 'Pending',
    'paymentStatus.paid': 'Paid',
    'paymentStatus.failed': 'Failed',
    'paymentStatus.refunded': 'Refunded',
    'paymentMethod.bankTransfer': 'Bank Transfer',
    'paymentMethod.cashOnDelivery': 'Cash on Delivery',
    'paymentMethod.creditCard': 'Credit Card',
    'paymentMethod.paypal': 'PayPal',
    'shippingMethods.standard': 'Standard Shipping',
    'shippingMethods.express': 'Express Shipping',
    'shippingMethods.overnight': 'Overnight Shipping',
    'shippingMethods.free': 'Free Shipping',
  };
  return translations[key] || key;
};

describe('Status Translation Utilities', () => {
  describe('getOrderStatusText', () => {
    it('should translate order statuses correctly', () => {
      expect(getOrderStatusText('PENDING', mockT)).toBe('Pending');
      expect(getOrderStatusText('PROCESSING', mockT)).toBe('Processing');
      expect(getOrderStatusText('SHIPPED', mockT)).toBe('Shipped');
      expect(getOrderStatusText('DELIVERED', mockT)).toBe('Delivered');
      expect(getOrderStatusText('CANCELLED', mockT)).toBe('Cancelled');
      expect(getOrderStatusText('REFUNDED', mockT)).toBe('Refunded');
      expect(getOrderStatusText('PENDING_QUOTE', mockT)).toBe('Pending Quote');
    });

    it('should return original status for unknown values', () => {
      expect(getOrderStatusText('UNKNOWN_STATUS', mockT)).toBe('UNKNOWN_STATUS');
    });

    it('should handle null and undefined values', () => {
      expect(getOrderStatusText(null, mockT)).toBe('Unknown');
      expect(getOrderStatusText(undefined, mockT)).toBe('Unknown');
    });
  });

  describe('getPaymentStatusText', () => {
    it('should translate payment statuses correctly', () => {
      expect(getPaymentStatusText('PENDING', mockT)).toBe('Pending');
      expect(getPaymentStatusText('PAID', mockT)).toBe('Paid');
      expect(getPaymentStatusText('FAILED', mockT)).toBe('Failed');
      expect(getPaymentStatusText('REFUNDED', mockT)).toBe('Refunded');
    });

    it('should return original status for unknown values', () => {
      expect(getPaymentStatusText('UNKNOWN_STATUS', mockT)).toBe('UNKNOWN_STATUS');
    });

    it('should handle null and undefined values', () => {
      expect(getPaymentStatusText(null, mockT)).toBe('Unknown');
      expect(getPaymentStatusText(undefined, mockT)).toBe('Unknown');
    });
  });

  describe('getPaymentMethodText', () => {
    it('should translate payment methods correctly', () => {
      expect(getPaymentMethodText('Bank Transfer', mockT)).toBe('Bank Transfer');
      expect(getPaymentMethodText('Cash on Delivery', mockT)).toBe('Cash on Delivery');
      expect(getPaymentMethodText('Credit Card', mockT)).toBe('Credit Card');
      expect(getPaymentMethodText('PayPal', mockT)).toBe('PayPal');
    });

    it('should handle different case variations', () => {
      expect(getPaymentMethodText('bank transfer', mockT)).toBe('Bank Transfer');
      expect(getPaymentMethodText('CASH ON DELIVERY', mockT)).toBe('Cash on Delivery');
    });

    it('should return original method for unknown values', () => {
      expect(getPaymentMethodText('Custom Payment Method', mockT)).toBe('Custom Payment Method');
    });

    it('should handle null and undefined values', () => {
      expect(getPaymentMethodText(null, mockT)).toBe('Unknown');
      expect(getPaymentMethodText(undefined, mockT)).toBe('Unknown');
    });
  });

  describe('getShippingMethodText', () => {
    it('should translate shipping methods correctly', () => {
      expect(getShippingMethodText('Standard', mockT)).toBe('Standard Shipping');
      expect(getShippingMethodText('Express', mockT)).toBe('Express Shipping');
      // These should return original values since they're not in the mapping
      expect(getShippingMethodText('Overnight', mockT)).toBe('Overnight');
      expect(getShippingMethodText('Free', mockT)).toBe('Free');
    });

    it('should handle different variations', () => {
      expect(getShippingMethodText('Standard Shipping', mockT)).toBe('Standard Shipping');
      expect(getShippingMethodText('express shipping', mockT)).toBe('Express Shipping');
    });

    it('should return original method for unknown values', () => {
      expect(getShippingMethodText('Custom Shipping Method', mockT)).toBe('Custom Shipping Method');
    });

    it('should handle null and undefined values', () => {
      expect(getShippingMethodText(null, mockT)).toBe('Unknown');
      expect(getShippingMethodText(undefined, mockT)).toBe('Unknown');
    });
  });
});