import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService, OrderEmailData, AdminOrderEmailData } from '../src/notifications/services/email-template.service';
import { TemplateLoaderService } from '../src/notifications/services/template-loader.service';
import { VariableReplacerService } from '../src/notifications/services/variable-replacer.service';
import { DesignSystemInjector } from '../src/notifications/services/design-system-injector.service';

/**
 * Test email template rendering with undefined price scenarios
 * Requirements: 7.1, 7.2, 7.4
 */
describe('EmailTemplateService - Undefined Price Handling', () => {
  let emailTemplateService: EmailTemplateService;

  // Mock dependencies
  const mockTemplateLoader = {
    loadTemplate: jest.fn().mockResolvedValue(`
      <!DOCTYPE html>
      <html>
      <head><title>{{translations.subject}}</title></head>
      <body>
        <h1>Order {{data.orderNumber}}</h1>
        {{#if data.items}}
        <table>
          {{#each data.items}}
          <tr>
            <td>{{this.name}}</td>
            <td>{{formatCurrency this.price locale}}</td>
          </tr>
          {{/each}}
        </table>
        <p>Total: {{safeCalculateTotal data.items locale}}</p>
        {{/if}}
        {{#if data.hasQuoteItems}}
        <div class="quote-alert">Quote items present</div>
        {{/if}}
      </body>
      </html>
    `),
    clearCache: jest.fn(),
    reloadTemplates: jest.fn()
  };

  const mockVariableReplacer = {
    replaceVariables: jest.fn().mockImplementation((template, data) => {
      // Simple mock replacement - just return template with data injected
      let result = template.replace('{{data.orderNumber}}', data.orderNumber);
      result = result.replace('{{translations.subject}}', 'Test Subject');

      // Mock the conditional logic for hasQuoteItems
      if (data.hasQuoteItems) {
        result = result.replace('{{#if data.hasQuoteItems}}', '');
        result = result.replace('{{/if}}', '');
      } else {
        // Remove the conditional block
        result = result.replace(/{{#if data\.hasQuoteItems}}.*?{{\/if}}/s, '');
      }

      return Promise.resolve(result);
    })
  };

  const mockDesignSystemInjector = {
    injectDesignSystem: jest.fn().mockImplementation((html) => html)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateService,
        { provide: TemplateLoaderService, useValue: mockTemplateLoader },
        { provide: VariableReplacerService, useValue: mockVariableReplacer },
        { provide: DesignSystemInjector, useValue: mockDesignSystemInjector }
      ]
    }).compile();

    emailTemplateService = module.get<EmailTemplateService>(EmailTemplateService);
  });

  describe('Order Confirmation Template with Undefined Prices', () => {
    it('should handle order with undefined item prices', async () => {
      // Create test data with undefined prices (using any to bypass TypeScript checks)
      const orderDataWithUndefinedPrices: any = {
        orderId: 'test-order-1',
        orderNumber: 'ORD-UNDEFINED-001',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        items: [
          {
            name: 'Regular Product',
            quantity: 1,
            price: 100000
          },
          {
            name: 'Quote Product',
            quantity: 2,
            price: undefined // This should trigger quote item detection
          }
        ],
        subtotal: 100000,
        shippingCost: 25000,
        total: 125000,
        shippingAddress: {
          fullName: 'Test Customer',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        }
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(
        orderDataWithUndefinedPrices,
        'en'
      );

      expect(result).toBeDefined();
      expect(result.subject).toContain('ORD-UNDEFINED-001');
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);

      // Verify the template was processed
      expect(mockTemplateLoader.loadTemplate).toHaveBeenCalled();
      expect(mockVariableReplacer.replaceVariables).toHaveBeenCalled();
      expect(mockDesignSystemInjector.injectDesignSystem).toHaveBeenCalled();
    });

    it('should handle order with null item prices', async () => {
      const orderDataWithNullPrices: any = {
        orderId: 'test-order-2',
        orderNumber: 'ORD-NULL-002',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        items: [
          {
            name: 'Quote Product 1',
            quantity: 1,
            price: null // This should trigger quote item detection
          },
          {
            name: 'Quote Product 2',
            quantity: 1,
            price: null // This should trigger quote item detection
          }
        ],
        subtotal: null,
        shippingCost: 25000,
        total: null,
        shippingAddress: {
          fullName: 'Test Customer',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        }
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(
        orderDataWithNullPrices,
        'en'
      );

      expect(result).toBeDefined();
      expect(result.subject).toContain('ORD-NULL-002');
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
    });

    it('should handle order with zero prices (contact for price)', async () => {
      const orderDataWithZeroPrices: OrderEmailData = {
        orderId: 'test-order-3',
        orderNumber: 'ORD-ZERO-003',
        customerName: 'Test Customer',
        orderDate: '2024-01-01',
        items: [
          {
            name: 'Contact for Price Product',
            quantity: 1,
            price: 0 // This should trigger quote item detection
          }
        ],
        subtotal: 0,
        shippingCost: 25000,
        total: 25000,
        shippingAddress: {
          fullName: 'Test Customer',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        }
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(
        orderDataWithZeroPrices,
        'en'
      );

      expect(result).toBeDefined();
      expect(result.subject).toContain('ORD-ZERO-003');
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
    });

    it('should handle Vietnamese locale with undefined prices', async () => {
      const orderDataWithUndefinedPrices: any = {
        orderId: 'test-order-4',
        orderNumber: 'ORD-VI-004',
        customerName: 'Nguyễn Văn Test',
        orderDate: '2024-01-01',
        items: [
          {
            name: 'Sản phẩm báo giá',
            quantity: 1,
            price: undefined
          }
        ],
        subtotal: undefined,
        shippingCost: 25000,
        total: undefined,
        shippingAddress: {
          fullName: 'Nguyễn Văn Test',
          addressLine1: '123 Đường Test',
          city: 'TP Test',
          state: 'Tỉnh Test',
          postalCode: '12345',
          country: 'Việt Nam'
        }
      };

      const result = await emailTemplateService.getOrderConfirmationTemplate(
        orderDataWithUndefinedPrices,
        'vi'
      );

      expect(result).toBeDefined();
      expect(result.subject).toContain('ORD-VI-004');
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
    });
  });

  describe('Admin Order Notification Template with Undefined Prices', () => {
    it('should handle admin notification with undefined prices', async () => {
      const adminOrderDataWithUndefinedPrices: any = {
        orderId: 'test-admin-1',
        orderNumber: 'ORD-ADMIN-001',
        orderDate: '2024-01-01',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        items: [
          {
            nameEn: 'Quote Product',
            nameVi: 'Sản phẩm báo giá',
            sku: 'QUOTE-001',
            quantity: 1,
            price: undefined,
            total: undefined
          }
        ],
        subtotal: undefined,
        shippingCost: 25000,
        shippingMethod: 'Standard',
        taxAmount: 0,
        discountAmount: 0,
        total: undefined,
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '+1234567890',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        },
        billingAddress: {
          fullName: 'Test Customer',
          phone: '+1234567890',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country'
        },
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'pending'
      };

      const result = await emailTemplateService.getAdminOrderNotificationTemplate(
        adminOrderDataWithUndefinedPrices,
        'en'
      );

      expect(result).toBeDefined();
      expect(result.subject).toContain('ORD-ADMIN-001');
      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(0);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize order data and detect quote items', async () => {
      // Access the private method through reflection for testing
      const sanitizeOrderData = (emailTemplateService as any).sanitizeOrderData.bind(emailTemplateService);

      const rawOrderData = {
        items: [
          { name: 'Product 1', price: 100, total: 100 },
          { name: 'Product 2', price: undefined, total: undefined },
          { name: 'Product 3', price: null, total: null },
          { name: 'Product 4', price: 0, total: 0 }
        ],
        subtotal: undefined,
        total: null,
        shippingCost: 25000
      };

      const sanitized = sanitizeOrderData(rawOrderData);

      expect(sanitized.hasQuoteItems).toBe(true);
      expect(sanitized.items[0].price).toBe(100); // Regular item unchanged
      expect(sanitized.items[1].price).toBe(0); // Undefined converted to 0
      expect(sanitized.items[2].price).toBe(0); // Null converted to 0
      expect(sanitized.items[3].price).toBe(0); // Zero price (quote item)
      expect(sanitized.subtotal).toBe(0); // Undefined converted to 0
      expect(sanitized.total).toBe(0); // Null converted to 0
      expect(sanitized.shippingCost).toBe(25000); // Valid value unchanged
    });

    it('should not flag hasQuoteItems for orders with all valid prices', async () => {
      const sanitizeOrderData = (emailTemplateService as any).sanitizeOrderData.bind(emailTemplateService);

      const rawOrderData = {
        items: [
          { name: 'Product 1', price: 100, total: 100 },
          { name: 'Product 2', price: 200, total: 200 }
        ],
        subtotal: 300,
        total: 325,
        shippingCost: 25
      };

      const sanitized = sanitizeOrderData(rawOrderData);

      expect(sanitized.hasQuoteItems).toBe(false);
      expect(sanitized.items[0].price).toBe(100);
      expect(sanitized.items[1].price).toBe(200);
      expect(sanitized.subtotal).toBe(300);
      expect(sanitized.total).toBe(325);
    });
  });
});