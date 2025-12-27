// Unit tests for translations module
import {
  translateOrderStatus,
  translatePaymentStatus,
  translateUserRole,
  translateStatus,
  getEmailTemplateTranslations,
  getOrderConfirmationTranslations,
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
});
