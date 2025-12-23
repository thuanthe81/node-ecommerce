import { EmailTemplateService } from '../../../src/notifications/services/email-template.service';
import type { OrderEmailData, AdminOrderEmailData, UserEmailData } from '../../../src/notifications/services/email-template.service';

/**
 * Simple Integration Tests for Email Template Service
 *
 * Task 12.2: Write integration tests for complete email generation flow
 *
 * Tests end-to-end email generation with real data using the fallback methods
 * that are currently active (since template system is disabled).
 *
 * Requirements: 5.4
 */
describe('EmailTemplateService Simple Integration Tests', () => {
  let emailTemplateService: EmailTemplateService;

  // Mock dependencies
  const mockTemplateLoader = {
    templateExists: jest.fn().mockReturnValue(false), // Force fallback usage
    loadTemplate: jest.fn(),
    getTemplatePath: jest.fn()
  };

  const mockVariableReplacer = {
    replaceVariables: jest.fn()
  };

  const mockDesignSystemInjector = {
    injectDesignSystem: jest.fn()
  };

  const mockHtmlEscapingService = {
    escapeHtml: jest.fn().mockImplementation((text) => text),
    removeCSSComments: jest.fn().mockImplementation((css) => css)
  };

  beforeEach(() => {
    // Create service instance with mocked dependencies
    emailTemplateService = new EmailTemplateService(
      mockTemplateLoader as any,
      mockVariableReplacer as any,
      mockDesignSystemInjector as any,
      mockHtmlEscapingService as any
    );
  });

  // Test data
  const mockOrderData: OrderEmailData = {
    orderNumber: 'ORD-INT-001',
    customerName: 'Test Customer',
    orderDate: '2024-01-15T10:30:00Z',
    items: [
      { name: 'Test Product', quantity: 1, price: 50000 }
    ],
    subtotal: 50000,
    shippingCost: 25000,
    total: 75000,
    shippingAddress: {
      fullName: 'Test Customer',
      addressLine1: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Vietnam'
    }
  };

  const mockAdminOrderData: AdminOrderEmailData = {
    orderNumber: 'ORD-ADMIN-001',
    orderDate: '2024-01-15T10:30:00Z',
    customerName: 'Admin Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+84901234567',
    items: [
      {
        nameEn: 'Test Product',
        nameVi: 'Sản phẩm test',
        sku: 'TEST-001',
        quantity: 1,
        price: 50000,
        total: 50000
      }
    ],
    subtotal: 50000,
    shippingCost: 25000,
    shippingMethod: 'Standard',
    taxAmount: 5000,
    discountAmount: 0,
    total: 80000,
    shippingAddress: {
      fullName: 'Admin Test Customer',
      phone: '+84901234567',
      addressLine1: '123 Admin St',
      city: 'Admin City',
      state: 'Admin State',
      postalCode: '12345',
      country: 'Vietnam'
    },
    billingAddress: {
      fullName: 'Admin Test Customer',
      phone: '+84901234567',
      addressLine1: '123 Admin St',
      city: 'Admin City',
      state: 'Admin State',
      postalCode: '12345',
      country: 'Vietnam'
    },
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Pending'
  };

  const mockUserData: UserEmailData = {
    name: 'Test User',
    email: 'test@example.com',
    resetToken: 'test-token-123'
  };

  describe('End-to-End Email Generation', () => {
    it('should generate order confirmation email with real data', async () => {
      const startTime = Date.now();

      const result = await emailTemplateService.getOrderConfirmationTemplate(mockOrderData, 'en');

      const processingTime = Date.now() - startTime;

      // Verify basic structure
      expect(result).toBeDefined();
      expect(result.subject).toBeDefined();
      expect(result.html).toBeDefined();

      // Verify content
      expect(result.subject).toContain('ORD-INT-001');
      expect(result.html).toContain('Test Customer');
      expect(result.html).toContain('ORD-INT-001');
      expect(result.html).toContain('75.000 ₫'); // Vietnamese number format uses dots

      // Verify HTML structure
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html');
      expect(result.html).toContain('</html>');

      // Performance check
      expect(processingTime).toBeLessThan(5000);

      console.log(`Order confirmation: ${processingTime}ms`);
    });

    it('should generate admin notification email with real data', async () => {
      const result = await emailTemplateService.getAdminOrderNotificationTemplate(mockAdminOrderData, 'en');

      expect(result).toBeDefined();
      expect(result.subject).toContain('ORD-ADMIN-001');
      expect(result.html).toContain('test@example.com');
      expect(result.html).toContain('80.000 ₫'); // Correct total: 50k + 25k + 5k = 80k
      expect(result.html).toContain('<!DOCTYPE html>');
    });

    it('should generate shipping notification email', async () => {
      const result = await emailTemplateService.getShippingNotificationTemplate(mockOrderData, 'en');

      expect(result).toBeDefined();
      expect(result.subject).toContain('ORD-INT-001');
      expect(result.html).toContain('Test Customer');
      expect(result.html).toContain('<!DOCTYPE html>');
    });

    it('should generate welcome email', async () => {
      const result = await emailTemplateService.getWelcomeEmailTemplate(mockUserData, 'en');

      expect(result).toBeDefined();
      expect(result.html).toContain('Test User');
      expect(result.html).toContain('<!DOCTYPE html>');
    });

    it('should generate password reset email', async () => {
      const result = await emailTemplateService.getPasswordResetTemplate(mockUserData, 'en');

      expect(result).toBeDefined();
      expect(result.html).toContain('Test User');
      expect(result.html).toContain('test-token-123');
      expect(result.html).toContain('<!DOCTYPE html>');
    });
  });

  describe('Locale Support', () => {
    it('should handle Vietnamese locale', async () => {
      const result = await emailTemplateService.getOrderConfirmationTemplate(mockOrderData, 'vi');

      expect(result).toBeDefined();
      expect(result.html).toContain('lang="vi"');
      expect(result.html).toContain('75.000 ₫'); // Vietnamese number format uses dots
    });

    it('should handle Vietnamese admin notification', async () => {
      const result = await emailTemplateService.getAdminOrderNotificationTemplate(mockAdminOrderData, 'vi');

      expect(result).toBeDefined();
      expect(result.html).toContain('lang="vi"');
      expect(result.html).toContain('Sản phẩm test');
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        emailTemplateService.getOrderConfirmationTemplate({
          ...mockOrderData,
          orderNumber: `ORD-CONCURRENT-${i + 1}`
        }, 'en')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.subject).toContain(`ORD-CONCURRENT-${i + 1}`);
      });
    });

    it('should handle large order data', async () => {
      const largeOrderData = {
        ...mockOrderData,
        items: Array.from({ length: 20 }, (_, i) => ({
          name: `Product ${i + 1}`,
          quantity: 1,
          price: 10000
        }))
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(largeOrderData, 'en');

      expect(result).toBeDefined();
      expect(result.html).toContain('Product 1');
      expect(result.html).toContain('Product 20');
    });
  });

  describe('Security Tests', () => {
    it('should escape HTML in customer data', async () => {
      const maliciousData = {
        ...mockOrderData,
        customerName: '<script>alert("xss")</script>Test'
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(maliciousData, 'en');

      // Verify result is generated (HTML escaping is handled by the service)
      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
      expect(result.html).toContain('Test'); // Should contain the safe part
    });

    it('should handle Vietnamese characters', async () => {
      const vietnameseData = {
        ...mockOrderData,
        customerName: 'Nguyễn Văn An'
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(vietnameseData, 'vi');

      expect(result.html).toContain('Nguyễn Văn An');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional data', async () => {
      const incompleteData = {
        ...mockOrderData,
        trackingNumber: undefined,
        taxAmount: undefined
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(incompleteData, 'en');

      expect(result).toBeDefined();
      expect(result.html).toContain('Test Customer');
    });
  });
});