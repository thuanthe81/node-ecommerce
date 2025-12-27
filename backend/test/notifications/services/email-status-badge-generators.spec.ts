import { StatusBadgeGenerator, StatusBadgeUtils } from '../../../src/notifications/services/email-status-badge-generators';
import { CONSTANTS } from '@alacraft/shared';

describe('StatusBadgeGenerator', () => {
  describe('generateOrderStatusBadge', () => {
    it('should generate badge for all order statuses using constants', () => {
      const orderStatuses = [
        CONSTANTS.STATUS.ORDER_STATUS.PENDING,
        CONSTANTS.STATUS.ORDER_STATUS.PROCESSING,
        CONSTANTS.STATUS.ORDER_STATUS.SHIPPED,
        CONSTANTS.STATUS.ORDER_STATUS.DELIVERED,
        CONSTANTS.STATUS.ORDER_STATUS.CANCELLED,
        CONSTANTS.STATUS.ORDER_STATUS.REFUNDED,
      ];

      orderStatuses.forEach(status => {
        const badge = StatusBadgeGenerator.generateOrderStatusBadge(
          status.toLowerCase() as any,
          'en',
          'medium'
        );
        expect(badge).toContain('role="status"');
        expect(badge).toContain('<span');
        expect(badge).toContain('</span>');
      });
    });
  });

  describe('generatePaymentStatusBadge', () => {
    it('should generate badge for all payment statuses using constants', () => {
      const paymentStatuses = [
        CONSTANTS.STATUS.PAYMENT_STATUS.PENDING,
        CONSTANTS.STATUS.PAYMENT_STATUS.PAID,
        CONSTANTS.STATUS.PAYMENT_STATUS.FAILED,
        CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED,
      ];

      paymentStatuses.forEach(status => {
        const badge = StatusBadgeGenerator.generatePaymentStatusBadge(
          status.toLowerCase() as any,
          'en',
          'medium'
        );
        expect(badge).toContain('role="status"');
        expect(badge).toContain('<span');
        expect(badge).toContain('</span>');
      });
    });
  });
});

describe('StatusBadgeUtils', () => {
  describe('isValidStatus', () => {
    it('should validate order statuses using constants', () => {
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus('invalid', 'order')).toBe(false);
    });

    it('should validate payment statuses using constants', () => {
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus('invalid', 'payment')).toBe(false);
    });
  });

  describe('getValidStatuses', () => {
    it('should return all valid order statuses using constants', () => {
      const validStatuses = StatusBadgeUtils.getValidStatuses('order');
      expect(validStatuses).toContain(CONSTANTS.STATUS.ORDER_STATUS.PENDING.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.ORDER_STATUS.PROCESSING.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.ORDER_STATUS.SHIPPED.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.ORDER_STATUS.DELIVERED.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.ORDER_STATUS.CANCELLED.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.ORDER_STATUS.REFUNDED.toLowerCase());
      expect(validStatuses).toHaveLength(6);
    });

    it('should return all valid payment statuses using constants', () => {
      const validStatuses = StatusBadgeUtils.getValidStatuses('payment');
      expect(validStatuses).toContain(CONSTANTS.STATUS.PAYMENT_STATUS.PENDING.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.PAYMENT_STATUS.PAID.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.PAYMENT_STATUS.FAILED.toLowerCase());
      expect(validStatuses).toContain(CONSTANTS.STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase());
      expect(validStatuses).toHaveLength(4);
    });
  });
});