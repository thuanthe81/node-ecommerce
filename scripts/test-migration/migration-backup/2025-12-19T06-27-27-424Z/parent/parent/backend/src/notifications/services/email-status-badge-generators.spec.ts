import { StatusBadgeGenerator, StatusBadgeUtils } from './email-status-badge-generators';
import { STATUS } from '../../common/constants';

describe('StatusBadgeGenerator', () => {
  describe('generateOrderStatusBadge', () => {
    it('should generate badge for all order statuses using constants', () => {
      const orderStatuses = [
        STATUS.ORDER_STATUS.PENDING,
        STATUS.ORDER_STATUS.PROCESSING,
        STATUS.ORDER_STATUS.SHIPPED,
        STATUS.ORDER_STATUS.DELIVERED,
        STATUS.ORDER_STATUS.CANCELLED,
        STATUS.ORDER_STATUS.REFUNDED,
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
        STATUS.PAYMENT_STATUS.PENDING,
        STATUS.PAYMENT_STATUS.PAID,
        STATUS.PAYMENT_STATUS.FAILED,
        STATUS.PAYMENT_STATUS.REFUNDED,
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
      expect(StatusBadgeUtils.isValidStatus(STATUS.ORDER_STATUS.PENDING.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.ORDER_STATUS.PROCESSING.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.ORDER_STATUS.SHIPPED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.ORDER_STATUS.DELIVERED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.ORDER_STATUS.CANCELLED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.ORDER_STATUS.REFUNDED.toLowerCase(), 'order')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus('invalid', 'order')).toBe(false);
    });

    it('should validate payment statuses using constants', () => {
      expect(StatusBadgeUtils.isValidStatus(STATUS.PAYMENT_STATUS.PENDING.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.PAYMENT_STATUS.PAID.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.PAYMENT_STATUS.FAILED.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus(STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase(), 'payment')).toBe(true);
      expect(StatusBadgeUtils.isValidStatus('invalid', 'payment')).toBe(false);
    });
  });

  describe('getValidStatuses', () => {
    it('should return all valid order statuses using constants', () => {
      const validStatuses = StatusBadgeUtils.getValidStatuses('order');
      expect(validStatuses).toContain(STATUS.ORDER_STATUS.PENDING.toLowerCase());
      expect(validStatuses).toContain(STATUS.ORDER_STATUS.PROCESSING.toLowerCase());
      expect(validStatuses).toContain(STATUS.ORDER_STATUS.SHIPPED.toLowerCase());
      expect(validStatuses).toContain(STATUS.ORDER_STATUS.DELIVERED.toLowerCase());
      expect(validStatuses).toContain(STATUS.ORDER_STATUS.CANCELLED.toLowerCase());
      expect(validStatuses).toContain(STATUS.ORDER_STATUS.REFUNDED.toLowerCase());
      expect(validStatuses).toHaveLength(6);
    });

    it('should return all valid payment statuses using constants', () => {
      const validStatuses = StatusBadgeUtils.getValidStatuses('payment');
      expect(validStatuses).toContain(STATUS.PAYMENT_STATUS.PENDING.toLowerCase());
      expect(validStatuses).toContain(STATUS.PAYMENT_STATUS.PAID.toLowerCase());
      expect(validStatuses).toContain(STATUS.PAYMENT_STATUS.FAILED.toLowerCase());
      expect(validStatuses).toContain(STATUS.PAYMENT_STATUS.REFUNDED.toLowerCase());
      expect(validStatuses).toHaveLength(4);
    });
  });
});