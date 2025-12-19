/**
 * Tests for status translation utilities
 */

import { getOrderStatusText, getPaymentStatusText, getPaymentMethodText, getShippingMethodText } from './statusTranslations';

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
    'shippingMethod.standard': 'Standard Shipping',
    'shippingMethod.express': 'Express Shipping',
    'shippingMethod.overnight': 'Overnight Shipping',
    'shippingMethod.free': 'Free Shipping',
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
  });

  describe('getShippingMethodText', () => {
    it('should translate shipping methods correctly', () => {
      expect(getShippingMethodText('Standard', mockT)).toBe('Standard Shipping');
      expect(getShippingMethodText('Express', mockT)).toBe('Express Shipping');
      expect(getShippingMethodText('Overnight', mockT)).toBe('Overnight Shipping');
      expect(getShippingMethodText('Free', mockT)).toBe('Free Shipping');
    });

    it('should handle different variations', () => {
      expect(getShippingMethodText('Standard Shipping', mockT)).toBe('Standard Shipping');
      expect(getShippingMethodText('express shipping', mockT)).toBe('Express Shipping');
    });

    it('should return original method for unknown values', () => {
      expect(getShippingMethodText('Custom Shipping Method', mockT)).toBe('Custom Shipping Method');
    });
  });
});