// Unit tests for translations module
import {
  translateOrderStatus,
  translatePaymentStatus,
  translateUserRole,
  translateStatus,
  getEmailTemplateTranslations,
  getOrderConfirmationTranslations,
  getOrderStatusMessage,
  getPaymentStatusMessage,
  STATUS_TRANSLATIONS,
  EMAIL_TRANSLATIONS,
} from '../src/translations';
import { OrderStatus, PaymentStatus, UserRole } from '../src/constants/status';

describe('Translations Module', () => {
  describe('Status Translations', () => {
    test('should translate order statuses correctly', () => {
      expect(translateOrderStatus(OrderStatus.PENDING, 'en')).toBe('Pending');
      expect(translateOrderStatus(OrderStatus.PENDING, 'vi')).toBe('Chờ xử lý');
      expect(translateOrderStatus(OrderStatus.DELIVERED, 'en')).toBe(
        'Delivered'
      );
      expect(translateOrderStatus(OrderStatus.DELIVERED, 'vi')).toBe(
        'Đã giao hàng'
      );
    });

    test('should translate payment statuses correctly', () => {
      expect(translatePaymentStatus(PaymentStatus.PENDING, 'en')).toBe(
        'Pending'
      );
      expect(translatePaymentStatus(PaymentStatus.PENDING, 'vi')).toBe(
        'Chờ thanh toán'
      );
      expect(translatePaymentStatus(PaymentStatus.PAID, 'en')).toBe('Paid');
      expect(translatePaymentStatus(PaymentStatus.PAID, 'vi')).toBe(
        'Đã thanh toán'
      );
    });

    test('should translate user roles correctly', () => {
      expect(translateUserRole(UserRole.ADMIN, 'en')).toBe('Administrator');
      expect(translateUserRole(UserRole.ADMIN, 'vi')).toBe('Quản trị viên');
      expect(translateUserRole(UserRole.CUSTOMER, 'en')).toBe('Customer');
      expect(translateUserRole(UserRole.CUSTOMER, 'vi')).toBe('Khách hàng');
    });

    test('should fallback to English for missing translations', () => {
      expect(translateOrderStatus(OrderStatus.PENDING, 'en')).toBe('Pending');
      // Test fallback behavior
      expect(translateOrderStatus(OrderStatus.PENDING)).toBe('Pending');
    });

    test('should have complete status translations', () => {
      expect(STATUS_TRANSLATIONS.order).toBeDefined();
      expect(STATUS_TRANSLATIONS.payment).toBeDefined();
      expect(STATUS_TRANSLATIONS.user).toBeDefined();

      // Check all order statuses have translations
      Object.values(OrderStatus).forEach((status) => {
        expect(STATUS_TRANSLATIONS.order[status]).toBeDefined();
        expect(STATUS_TRANSLATIONS.order[status].en).toBeDefined();
        expect(STATUS_TRANSLATIONS.order[status].vi).toBeDefined();
      });
    });
  });

  describe('Email Translations', () => {
    test('should provide email template translations', () => {
      const enTranslations = getEmailTemplateTranslations('en');
      const viTranslations = getEmailTemplateTranslations('vi');

      expect(enTranslations).toBeDefined();
      expect(viTranslations).toBeDefined();
      expect(typeof enTranslations).toBe('object');
      expect(typeof viTranslations).toBe('object');
    });

    test('should provide order confirmation translations', () => {
      const enTranslations = getOrderConfirmationTranslations('en');
      const viTranslations = getOrderConfirmationTranslations('vi');

      expect(enTranslations.subject).toBeDefined();
      expect(viTranslations.subject).toBeDefined();
      expect(enTranslations.greeting).toBeDefined();
      expect(viTranslations.greeting).toBeDefined();
    });

    test('should have complete email translations structure', () => {
      expect(EMAIL_TRANSLATIONS.orderConfirmation).toBeDefined();
      expect(EMAIL_TRANSLATIONS.adminOrderNotification).toBeDefined();
      expect(EMAIL_TRANSLATIONS.orderStatusUpdate).toBeDefined();
      expect(EMAIL_TRANSLATIONS.common).toBeDefined();
    });
  });

  describe('Generic Translation Functions', () => {
    test('should translate status generically', () => {
      expect(translateStatus('PENDING', 'order', 'en')).toBe('Pending');
      expect(translateStatus('PAID', 'payment', 'vi')).toBe('Đã thanh toán');
      expect(translateStatus('ADMIN', 'user', 'en')).toBe('Administrator');
    });
  });

  describe('Status Message Functions', () => {
    test('should provide order status messages', () => {
      expect(getOrderStatusMessage(OrderStatus.PENDING, 'en')).toBe(
        'Your order has been received and is awaiting processing.'
      );
      expect(getOrderStatusMessage(OrderStatus.PENDING, 'vi')).toBe(
        'Đơn hàng của bạn đã được nhận và đang chờ xử lý.'
      );
      expect(getOrderStatusMessage(OrderStatus.PROCESSING, 'en')).toBe(
        'Your order is being prepared for shipment. We will notify you once it ships.'
      );
      expect(getOrderStatusMessage(OrderStatus.DELIVERED, 'en')).toBe(
        'Your order has been successfully delivered. Thank you for your business!'
      );
    });

    test('should provide payment status messages', () => {
      expect(getPaymentStatusMessage(PaymentStatus.PENDING, 'en')).toBe(
        'Your payment is being processed. We will update you once the payment is confirmed.'
      );
      expect(getPaymentStatusMessage(PaymentStatus.PAID, 'vi')).toBe(
        'Thanh toán của bạn đã được xử lý thành công. Cảm ơn bạn đã thanh toán!'
      );
      expect(getPaymentStatusMessage(PaymentStatus.FAILED, 'en')).toBe(
        'Your payment could not be processed. Please try again or contact us for assistance.'
      );
    });

    test('should fallback to English for status messages', () => {
      expect(getOrderStatusMessage(OrderStatus.SHIPPED)).toBe(
        'Your order has been shipped and is on its way to you.'
      );
      expect(getPaymentStatusMessage(PaymentStatus.REFUNDED)).toBe(
        'Your payment has been refunded. The refund will appear in your original payment method within 3-5 business days.'
      );
    });

    test('should handle unknown status gracefully', () => {
      expect(getOrderStatusMessage('UNKNOWN_STATUS', 'en')).toBe('UNKNOWN_STATUS');
      expect(getPaymentStatusMessage('INVALID_STATUS', 'vi')).toBe('INVALID_STATUS');
    });
  });
});
