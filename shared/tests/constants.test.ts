// Unit tests for constants module
import {
  CONSTANTS,
  OrderStatus,
  PaymentStatus,
  UserRole,
  ConstantUtils,
} from '../src/constants';

describe('Constants Module', () => {
  describe('Status Constants', () => {
    test('should export all order statuses', () => {
      expect(CONSTANTS.STATUS.ORDER_STATUS).toBeDefined();
      expect(Object.values(OrderStatus)).toHaveLength(7);
      expect(OrderStatus.PENDING).toBe('PENDING');
      expect(OrderStatus.DELIVERED).toBe('DELIVERED');
    });

    test('should export all payment statuses', () => {
      expect(CONSTANTS.STATUS.PAYMENT_STATUS).toBeDefined();
      expect(Object.values(PaymentStatus)).toHaveLength(4);
      expect(PaymentStatus.PENDING).toBe('PENDING');
      expect(PaymentStatus.PAID).toBe('PAID');
    });

    test('should export all user roles', () => {
      expect(CONSTANTS.STATUS.USER_ROLES).toBeDefined();
      expect(Object.values(UserRole)).toHaveLength(2);
      expect(UserRole.ADMIN).toBe('ADMIN');
      expect(UserRole.CUSTOMER).toBe('CUSTOMER');
    });
  });

  describe('Business Constants', () => {
    test('should export company information', () => {
      expect(CONSTANTS.BUSINESS.COMPANY).toBeDefined();
      expect(CONSTANTS.BUSINESS.COMPANY.NAME.EN).toBe('Ala Craft');
      expect(CONSTANTS.BUSINESS.COMPANY.NAME.VI).toBe('Ala Craft');
    });

    test('should export contact information', () => {
      expect(CONSTANTS.BUSINESS.CONTACT).toBeDefined();
      expect(CONSTANTS.BUSINESS.CONTACT.EMAIL.PRIMARY).toBeDefined();
      expect(CONSTANTS.BUSINESS.CONTACT.PHONE.PRIMARY).toBeDefined();
    });
  });

  describe('System Constants', () => {
    test('should export MIME types', () => {
      expect(CONSTANTS.SYSTEM.MIME_TYPES).toBeDefined();
      expect(CONSTANTS.SYSTEM.MIME_TYPES.JPEG).toBe('image/jpeg');
      expect(CONSTANTS.SYSTEM.MIME_TYPES.PNG).toBe('image/png');
    });

    test('should export email configuration', () => {
      expect(CONSTANTS.SYSTEM.EMAIL).toBeDefined();
      expect(CONSTANTS.SYSTEM.EMAIL.DEFAULT_FROM).toBeDefined();
    });
  });

  describe('Cache Keys', () => {
    test('should export cache key generators', () => {
      expect(CONSTANTS.CACHE_KEYS).toBeDefined();
      expect(CONSTANTS.CACHE_KEYS.CATEGORIES).toBeDefined();
      expect(CONSTANTS.CACHE_KEYS.PRODUCTS).toBeDefined();
    });

    test('should generate proper cache keys', () => {
      const categoryKey = CONSTANTS.CACHE_KEYS.CATEGORIES.BY_ID('123');
      expect(categoryKey).toBe('category:id:123');

      const productKey = CONSTANTS.CACHE_KEYS.PRODUCTS.BY_SLUG('test-product');
      expect(productKey).toBe('product:slug:test-product');
    });
  });

  describe('Constant Utils', () => {
    test('should validate order statuses', () => {
      expect(ConstantUtils.isValidOrderStatus('PENDING')).toBe(true);
      expect(ConstantUtils.isValidOrderStatus('INVALID')).toBe(false);
    });

    test('should validate payment statuses', () => {
      expect(ConstantUtils.isValidPaymentStatus('PAID')).toBe(true);
      expect(ConstantUtils.isValidPaymentStatus('INVALID')).toBe(false);
    });

    test('should validate user roles', () => {
      expect(ConstantUtils.isValidUserRole('ADMIN')).toBe(true);
      expect(ConstantUtils.isValidUserRole('INVALID')).toBe(false);
    });

    test('should get company name by locale', () => {
      expect(ConstantUtils.getCompanyName('en')).toBe('Ala Craft');
      expect(ConstantUtils.getCompanyName('vi')).toBe('Ala Craft');
    });
  });
});
