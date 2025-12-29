/**
 * Test for simplified email status update template
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService } from '../src/notifications/services/email-template.service';
import { TemplateLoaderService } from '../src/notifications/services/template-loader.service';
import { VariableReplacerService } from '../src/notifications/services/variable-replacer.service';
import { DesignSystemInjector } from '../src/notifications/services/design-system-injector.service';
import { HTMLEscapingService } from '../src/common/services/html-escaping.service';
import { BusinessInfoService } from '../src/common/services/business-info.service';
import { CSSInjectorService } from '../src/notifications/services/css-injector.service';

describe('Simplified Email Status Update Template', () => {
  let emailTemplateService: EmailTemplateService;
  let mockTemplateLoader: jest.Mocked<TemplateLoaderService>;
  let mockVariableReplacer: jest.Mocked<VariableReplacerService>;
  let mockDesignSystemInjector: jest.Mocked<DesignSystemInjector>;

  beforeEach(async () => {
    // Create mocks
    mockTemplateLoader = {
      loadTemplate: jest.fn(),
      loadPartial: jest.fn(),
      partialExists: jest.fn(),
      getPartialPath: jest.fn(),
      clearCache: jest.fn(),
      reloadTemplates: jest.fn(),
    } as any;

    mockVariableReplacer = {
      replaceVariables: jest.fn(),
      registerHelper: jest.fn(),
      registerHelpers: jest.fn(),
      compileTemplate: jest.fn(),
      getRegisteredHelpers: jest.fn(),
    } as any;

    mockDesignSystemInjector = {
      injectDesignSystem: jest.fn(),
      generateCSS: jest.fn(),
      getDesignTokens: jest.fn(),
    } as any;

    const mockHTMLEscapingService = {
      escapeHtmlContent: jest.fn((content) => content),
      sanitizeHtml: jest.fn((content) => content),
    };

    const mockBusinessInfoService = {
      getBusinessInfo: jest.fn(),
      getContactEmail: jest.fn(),
    };

    const mockCSSInjectorService = {
      injectCSS: jest.fn(),
      generateCSS: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateService,
        {
          provide: TemplateLoaderService,
          useValue: mockTemplateLoader,
        },
        {
          provide: VariableReplacerService,
          useValue: mockVariableReplacer,
        },
        {
          provide: DesignSystemInjector,
          useValue: mockDesignSystemInjector,
        },
        {
          provide: HTMLEscapingService,
          useValue: mockHTMLEscapingService,
        },
        {
          provide: BusinessInfoService,
          useValue: mockBusinessInfoService,
        },
        {
          provide: CSSInjectorService,
          useValue: mockCSSInjectorService,
        },
      ],
    }).compile();

    emailTemplateService = module.get<EmailTemplateService>(EmailTemplateService);
  });

  describe('getSimplifiedOrderStatusUpdateTemplate', () => {
    it('should generate simplified order status update template', async () => {
      // Arrange
      const orderData = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        orderDate: '2024-01-15',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        total: 150000,
        status: 'processing',
        paymentStatus: 'paid',
        statusMessage: 'Your order is being prepared for shipment.',
        items: [
          {
            productName: 'Test Product',
            quantity: 2,
            price: 75000,
            total: 150000,
          },
        ],
        subtotal: 150000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country',
        },
      };

      const mockTemplateContent = `
        <html>
          <body>
            <h1>{{translations.greeting}} {{data.customerName}}</h1>
            <p>Order: #{{data.orderNumber}}</p>
            <p>Status: {{data.status}}</p>
            <p>Total: {{data.total}}</p>
          </body>
        </html>
      `;

      const mockProcessedTemplate = `
        <html>
          <body>
            <h1>Hello John Doe</h1>
            <p>Order: #ORD-001</p>
            <p>Status: processing</p>
            <p>Total: 150000</p>
          </body>
        </html>
      `;

      const mockFinalHtml = `
        <html>
          <head><style>/* CSS */</style></head>
          <body>
            <h1>Hello John Doe</h1>
            <p>Order: #ORD-001</p>
            <p>Status: processing</p>
            <p>Total: 150000</p>
          </body>
        </html>
      `;

      mockTemplateLoader.loadTemplate.mockResolvedValue(mockTemplateContent);
      mockVariableReplacer.replaceVariables.mockResolvedValue(mockProcessedTemplate);
      mockDesignSystemInjector.injectDesignSystem.mockReturnValue(mockFinalHtml);

      // Act
      const result = await emailTemplateService.getSimplifiedOrderStatusUpdateTemplate(orderData, 'en');

      // Assert
      expect(result).toBeDefined();
      expect(result.subject).toBe('Order Update #ORD-001');
      expect(result.html).toBe(mockFinalHtml);

      // Verify the correct template was loaded
      expect(mockTemplateLoader.loadTemplate).toHaveBeenCalledWith('orders/template-order-status-update-simple');

      // Verify template processing
      expect(mockVariableReplacer.replaceVariables).toHaveBeenCalledWith(
        'orders/template-order-status-update-simple',
        mockTemplateContent,
        expect.objectContaining({
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          customerName: 'John Doe',
          status: 'processing',
          paymentStatus: 'paid',
          total: 150000,
        }),
        'en'
      );

      // Verify design system injection
      expect(mockDesignSystemInjector.injectDesignSystem).toHaveBeenCalledWith(mockProcessedTemplate);
    });

    it('should generate Vietnamese subject for Vietnamese locale', async () => {
      // Arrange
      const orderData = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        orderDate: '2024-01-15',
        customerName: 'Nguyễn Văn A',
        total: 150000,
        status: 'processing',
        paymentStatus: 'paid',
        items: [],
        subtotal: 150000,
        shippingCost: 0,
        tax: 0,
        discount: 0,
      };

      mockTemplateLoader.loadTemplate.mockResolvedValue('<html></html>');
      mockVariableReplacer.replaceVariables.mockResolvedValue('<html></html>');
      mockDesignSystemInjector.injectDesignSystem.mockReturnValue('<html></html>');

      // Act
      const result = await emailTemplateService.getSimplifiedOrderStatusUpdateTemplate(orderData, 'vi');

      // Assert
      expect(result.subject).toBe('Cập nhật đơn hàng #ORD-001');
    });
  });
});