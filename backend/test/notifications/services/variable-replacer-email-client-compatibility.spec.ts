import { Test, TestingModule } from '@nestjs/testing';
import { VariableReplacerService } from '../../../src/notifications/services/variable-replacer.service';
import { HTMLEscapingService } from '../../../src/common/services/html-escaping.service';
import { DesignSystemInjector } from '../../../src/notifications/services/design-system-injector.service';
import { EmailTranslationService } from '../../../src/notifications/services/email-translation.service';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';
import type { VariableReplacerConfig } from '../../../src/notifications/interfaces/variable-replacer.interface';

/**
 * Test suite to verify email client compatibility and accessibility features are preserved.
 * Ensures all email client compatibility features and accessibility features are maintained.
 *
 * Requirements: 6.4, 6.5, 6.6 - Email client compatibility and accessibility preservation
 */
describe('VariableReplacerService - Email Client Compatibility & Accessibility', () => {
  let service: VariableReplacerService;
  let module: TestingModule;

  const mockConfig: VariableReplacerConfig = {
    escapeHtml: true,
    logMissingVariables: false,
    missingVariableDefault: '',
    strictMode: false
  };

  // Mock services with realistic implementations
  const mockDesignSystemInjector = {
    generateCSS: jest.fn().mockReturnValue(`
      /* Email Client Compatible CSS */
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        font-family: Arial, sans-serif;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      .btn {
        display: inline-block;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        mso-padding-alt: 0;
        mso-text-raise: 4px;
      }
      .btn-primary {
        background-color: #007bff;
        color: #ffffff;
      }
      .address-card {
        background-color: #f8f9fa;
        padding: 20px;
        border-left: 4px solid #3498db;
      }
      .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }
      .badge-shipped {
        background-color: #17a2b8;
        color: #ffffff;
      }
      /* Accessibility styles */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        border: 0;
      }
      /* High contrast support */
      @media (prefers-contrast: high) {
        .btn { border: 2px solid; }
        .badge { border: 1px solid; }
      }
    `),
    getDesignTokens: jest.fn().mockReturnValue({
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545'
      }
    })
  };

  const mockEmailTranslationService = {
    getEmailTemplateTranslations: jest.fn().mockImplementation((locale) => ({
      companyName: 'AlaCraft',
      tagline: locale === 'vi' ? 'Thủ công chất lượng cao' : 'High Quality Handmade',
      greeting: locale === 'vi' ? 'Xin chào' : 'Hello',
      viewOrder: locale === 'vi' ? 'Xem đơn hàng' : 'View Order',
      shippingAddress: locale === 'vi' ? 'Địa chỉ giao hàng' : 'Shipping Address',
      orderStatus: locale === 'vi' ? 'Trạng thái đơn hàng' : 'Order Status'
    })),
    getStatusTranslations: jest.fn().mockImplementation((locale) => ({
      shipped: locale === 'vi' ? 'Đã giao vận' : 'Shipped',
      delivered: locale === 'vi' ? 'Đã giao hàng' : 'Delivered'
    }))
  };

  // Mock template loader to disable partial templates for this test
  const mockTemplateLoaderService = {
    partialExists: jest.fn(() => false),
    loadPartial: jest.fn(() => Promise.resolve('')),
    getPartialPath: jest.fn((partialName: string) => `/path/to/partials/${partialName}.hbs`)
  };

  const mockCSSInjectorService = {
    loadCSSFile: jest.fn().mockResolvedValue('/* mock css */'),
    cssFileExists: jest.fn().mockReturnValue(true),
    getCSSFilePath: jest.fn().mockReturnValue('/path/to/css/file.css')
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        VariableReplacerService,
        HTMLEscapingService,
        {
          provide: DesignSystemInjector,
          useValue: mockDesignSystemInjector
        },
        {
          provide: EmailTranslationService,
          useValue: mockEmailTranslationService
        },
        {
          provide: TemplateLoaderService,
          useValue: mockTemplateLoaderService
        },
        {
          provide: CSSInjectorService,
          useValue: mockCSSInjectorService
        },
        {
          provide: 'VariableReplacerConfig',
          useValue: mockConfig
        }
      ],
    }).compile();

    service = module.get<VariableReplacerService>(VariableReplacerService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Email Client Compatibility Features', () => {
    it('should generate Outlook-compatible HTML structure', async () => {
      const template = `
        <div class="email-container">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <h1>{{translations.companyName}}</h1>
                <p>{{translations.greeting}} {{data.customerName}}</p>

                <!-- Outlook-compatible button -->
                <div class="btn-container">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{data.orderUrl}}" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#007bff">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">{{translations.viewOrder}}</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="{{data.orderUrl}}" class="btn btn-primary" style="background-color:#007bff;color:#ffffff;display:inline-block;padding:12px 24px;text-decoration:none;border-radius:4px;">{{translations.viewOrder}}</a>
                  <!--<![endif]-->
                </div>

                <!-- Address card with table structure for Outlook -->
                <table class="address-card" role="presentation" cellspacing="0" cellpadding="20" border="0" style="background-color:#f8f9fa;border-left:4px solid #3498db;margin:16px 0;">
                  <tr>
                    <td>
                      <h3 style="margin-top:0;">{{translations.shippingAddress}}</h3>
                      <div>{{data.shippingAddress.fullName}}</div>
                      <div>{{data.shippingAddress.addressLine1}}</div>
                      <div>{{data.shippingAddress.city}}, {{data.shippingAddress.country}}</div>
                    </td>
                  </tr>
                </table>

                <!-- Status badge -->
                <span class="badge badge-shipped" style="background-color:#17a2b8;color:#ffffff;display:inline-block;padding:4px 8px;border-radius:4px;">
                  {{getStatusText data.status locale}}
                </span>
              </td>
            </tr>
          </table>
        </div>
      `;

      const data = {
        customerName: 'John Doe',
        orderUrl: 'https://example.com/orders/12345',
        status: 'shipped',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main Street',
          city: 'Ho Chi Minh City',
          country: 'Vietnam'
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify Outlook-specific compatibility features
      expect(result).toContain('role="presentation"');
      expect(result).toContain('cellspacing="0"');
      expect(result).toContain('cellpadding="0"');
      expect(result).toContain('border="0"');
      expect(result).toContain('<!--[if mso]>');
      expect(result).toContain('<![endif]-->');
      expect(result).toContain('<!--[if !mso]><!-->');
      expect(result).toContain('<!--<![endif]-->');
      expect(result).toContain('v:roundrect');
      expect(result).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
      expect(result).toContain('xmlns:w="urn:schemas-microsoft-com:office:word"');

      // Verify content is properly rendered
      expect(result).toContain('AlaCraft');
      expect(result).toContain('Hello John Doe');
      expect(result).toContain('View Order');
      expect(result).toContain('Shipping Address');
      expect(result).toContain('Shipped');
    });

    it('should generate Gmail-compatible HTML structure', async () => {
      const template = `
        <div class="email-wrapper" style="font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
          <div class="content" style="max-width:600px;margin:0 auto;">
            <h1 style="color:#2c3e50;font-size:28px;margin:0;">{{translations.companyName}}</h1>

            <!-- Gmail-safe button with fallback -->
            <div style="margin:20px 0;">
              <a href="{{data.actionUrl}}"
                 class="btn"
                 style="background-color:#007bff;color:#ffffff;display:inline-block;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;text-align:center;min-width:120px;">
                {{data.actionText}}
              </a>
            </div>

            <!-- Gmail-compatible list -->
            <div class="order-items" style="margin:20px 0;">
              <h3 style="color:#2c3e50;margin-bottom:10px;">Order Items:</h3>
              {{#each data.items}}
                <div class="item" style="padding:8px 0;border-bottom:1px solid #eee;">
                  <span style="font-weight:bold;">{{this.name}}</span>
                  <span style="float:right;">{{formatCurrency this.price "VND"}}</span>
                </div>
              {{/each}}
            </div>

            <!-- Status with proper contrast -->
            <div class="status-section" style="margin:20px 0;padding:15px;background-color:#f8f9fa;border-radius:4px;">
              <strong>{{translations.orderStatus}}:</strong>
              <span class="status-badge" style="background-color:#17a2b8;color:#ffffff;padding:4px 8px;border-radius:4px;margin-left:8px;">
                {{getStatusText data.status locale}}
              </span>
            </div>
          </div>
        </div>
      `;

      const data = {
        actionUrl: 'https://example.com/track/12345',
        actionText: 'Track Order',
        status: 'shipped',
        items: [
          { name: 'Handmade Vase', price: 300000 },
          { name: 'Wooden Bowl', price: 150000 }
        ]
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify Gmail-specific compatibility features
      expect(result).toContain('-webkit-text-size-adjust:100%');
      expect(result).toContain('-ms-text-size-adjust:100%');
      expect(result).toContain('font-family:Arial,sans-serif');
      expect(result).toContain('max-width:600px');
      expect(result).toContain('margin:0 auto');
      expect(result).toContain('display:inline-block');
      expect(result).toContain('text-decoration:none');

      // Verify content rendering
      expect(result).toContain('AlaCraft');
      expect(result).toContain('Track Order');
      expect(result).toContain('Order Items:');
      expect(result).toContain('Handmade Vase');
      expect(result).toContain('Wooden Bowl');
      expect(result).toContain('Order Status');
      expect(result).toContain('Shipped');
    });

    it('should handle mobile email client compatibility', async () => {
      const template = `
        <div class="mobile-email" style="width:100%;min-width:320px;">
          <!-- Mobile-optimized header -->
          <div class="header" style="padding:20px 15px;text-align:center;background-color:#f8f9fa;">
            <h1 style="font-size:24px;margin:0;line-height:1.2;">{{translations.companyName}}</h1>
          </div>

          <!-- Mobile-friendly content -->
          <div class="content" style="padding:20px 15px;">
            <p style="font-size:16px;line-height:1.5;margin:0 0 15px 0;">
              {{translations.greeting}} {{data.customerName}},
            </p>

            <!-- Touch-friendly button -->
            <div style="text-align:center;margin:25px 0;">
              <a href="{{data.orderUrl}}"
                 style="background-color:#007bff;color:#ffffff;display:inline-block;padding:15px 30px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;min-height:44px;line-height:44px;text-align:center;min-width:200px;">
                {{translations.viewOrder}}
              </a>
            </div>

            <!-- Mobile-optimized table -->
            <div class="order-summary" style="margin:20px 0;">
              <h3 style="font-size:18px;margin:0 0 15px 0;">Order Summary</h3>
              {{#each data.items}}
                <div style="display:block;padding:10px 0;border-bottom:1px solid #eee;">
                  <div style="font-weight:bold;margin-bottom:5px;">{{this.name}}</div>
                  <div style="color:#666;font-size:14px;">Qty: {{this.quantity}} × {{formatCurrency this.price "VND"}}</div>
                </div>
              {{/each}}
            </div>
          </div>
        </div>
      `;

      const data = {
        customerName: 'John Doe',
        orderUrl: 'https://example.com/orders/12345',
        items: [
          { name: 'Ceramic Mug', quantity: 2, price: 75000 },
          { name: 'Bamboo Plate', quantity: 1, price: 120000 }
        ]
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify mobile-specific compatibility features
      expect(result).toContain('min-width:320px');
      expect(result).toContain('min-height:44px'); // Touch target size
      expect(result).toContain('min-width:200px'); // Button minimum width
      expect(result).toContain('font-size:16px'); // Readable font size
      expect(result).toContain('line-height:1.5'); // Readable line height
      expect(result).toContain('padding:15px 30px'); // Touch-friendly padding

      // Verify content
      expect(result).toContain('Hello John Doe');
      expect(result).toContain('View Order');
      expect(result).toContain('Ceramic Mug');
      expect(result).toContain('Bamboo Plate');
    });
  });

  describe('Accessibility Features', () => {
    it('should generate accessible HTML with proper semantic structure', async () => {
      const template = `
        <div role="main" class="email-content">
          <!-- Accessible header -->
          <header role="banner">
            <h1>{{translations.companyName}}</h1>
            <p>{{translations.tagline}}</p>
          </header>

          <!-- Main content with proper headings hierarchy -->
          <main>
            <h2>Order Confirmation</h2>
            <p>{{translations.greeting}} {{data.customerName}},</p>

            <!-- Accessible button with proper labeling -->
            <div class="action-section">
              <a href="{{data.orderUrl}}"
                 class="btn btn-primary"
                 role="button"
                 aria-label="View your order details for order number {{data.orderNumber}}"
                 title="View Order Details">
                {{translations.viewOrder}}
              </a>
            </div>

            <!-- Accessible data table -->
            <section aria-labelledby="order-details-heading">
              <h3 id="order-details-heading">Order Details</h3>
              <table role="table" aria-label="Order items and pricing">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each data.items}}
                    <tr>
                      <td>{{this.name}}</td>
                      <td>{{this.quantity}}</td>
                      <td>{{formatCurrency this.price "VND"}}</td>
                    </tr>
                  {{/each}}
                </tbody>
              </table>
            </section>

            <!-- Accessible status with screen reader text -->
            <div class="status-section">
              <h3>Order Status</h3>
              <span class="badge badge-shipped" aria-label="Order status: {{getStatusText data.status locale}}">
                <span aria-hidden="true">📦</span>
                {{getStatusText data.status locale}}
              </span>
            </div>
          </main>

          <!-- Accessible footer -->
          <footer role="contentinfo">
            <p>Need help? <a href="mailto:support@example.com" aria-label="Contact customer support">Contact Support</a></p>
          </footer>
        </div>
      `;

      const data = {
        customerName: 'John Doe',
        orderNumber: 'ORD-12345',
        orderUrl: 'https://example.com/orders/12345',
        status: 'shipped',
        items: [
          { name: 'Handmade Ceramic Bowl', quantity: 1, price: 250000 },
          { name: 'Wooden Spoon Set', quantity: 2, price: 150000 }
        ]
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify semantic HTML structure
      expect(result).toContain('role="main"');
      expect(result).toContain('role="banner"');
      expect(result).toContain('role="button"');
      expect(result).toContain('role="table"');
      expect(result).toContain('role="contentinfo"');

      // Verify ARIA attributes
      expect(result).toContain('aria-label="View your order details for order number ORD-12345"');
      expect(result).toContain('aria-label="Order items and pricing"');
      expect(result).toContain('aria-label="Order status: Shipped"');
      expect(result).toContain('aria-label="Contact customer support"');
      expect(result).toContain('aria-labelledby="order-details-heading"');
      expect(result).toContain('aria-hidden="true"');

      // Verify proper heading hierarchy
      expect(result).toContain('<h1>');
      expect(result).toContain('<h2>');
      expect(result).toContain('<h3>');
      expect(result).toContain('id="order-details-heading"');

      // Verify table accessibility
      expect(result).toContain('scope="col"');
      expect(result).toContain('<thead>');
      expect(result).toContain('<tbody>');

      // Verify content
      expect(result).toContain('Hello John Doe');
      expect(result).toContain('View Order');
      expect(result).toContain('Handmade Ceramic Bowl');
      expect(result).toContain('Shipped');
    });

    it('should support high contrast and reduced motion preferences', async () => {
      const template = `
        <div class="email-wrapper">
          <style>
            /* High contrast support */
            @media (prefers-contrast: high) {
              .btn { border: 2px solid currentColor; }
              .badge { border: 1px solid currentColor; }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
              * { animation-duration: 0.01ms !important; }
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .email-wrapper { background-color: #1a1a1a; color: #ffffff; }
              .btn-primary { background-color: #0d6efd; }
            }
          </style>

          <div class="content">
            <h1>{{translations.companyName}}</h1>

            <!-- Button with high contrast support -->
            <a href="{{data.actionUrl}}"
               class="btn btn-primary"
               style="background-color:#007bff;color:#ffffff;display:inline-block;padding:12px 24px;text-decoration:none;border-radius:4px;border:2px solid transparent;">
              {{data.actionText}}
            </a>

            <!-- Status badge with contrast support -->
            <span class="badge badge-status"
                  style="background-color:#17a2b8;color:#ffffff;padding:4px 8px;border-radius:4px;border:1px solid transparent;">
              {{getStatusText data.status locale}}
            </span>

            <!-- Focus-visible support -->
            <div class="links">
              <a href="{{data.trackingUrl}}"
                 style="color:#007bff;text-decoration:underline;outline:2px solid transparent;outline-offset:2px;">
                Track Package
              </a>
            </div>
          </div>
        </div>
      `;

      const data = {
        actionUrl: 'https://example.com/orders/12345',
        actionText: 'View Order',
        trackingUrl: 'https://example.com/track/12345',
        status: 'shipped'
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify accessibility media queries
      expect(result).toContain('@media (prefers-contrast: high)');
      expect(result).toContain('@media (prefers-reduced-motion: reduce)');
      expect(result).toContain('@media (prefers-color-scheme: dark)');

      // Verify high contrast support
      expect(result).toContain('border: 2px solid currentColor');
      expect(result).toContain('border: 1px solid currentColor');

      // Verify reduced motion support
      expect(result).toContain('animation-duration: 0.01ms !important');

      // Verify focus support
      expect(result).toContain('outline:2px solid transparent');
      expect(result).toContain('outline-offset:2px');

      // Verify content
      expect(result).toContain('View Order');
      expect(result).toContain('Track Package');
      expect(result).toContain('Shipped');
    });

    it('should provide proper color contrast and readability', async () => {
      const template = `
        <div class="email-content" style="background-color:#ffffff;color:#212529;">
          <!-- High contrast text -->
          <h1 style="color:#212529;font-size:28px;font-weight:600;">{{translations.companyName}}</h1>

          <!-- Sufficient contrast for body text -->
          <p style="color:#495057;font-size:16px;line-height:1.6;">
            {{translations.greeting}} {{data.customerName}},
          </p>

          <!-- High contrast button -->
          <a href="{{data.orderUrl}}"
             style="background-color:#0056b3;color:#ffffff;display:inline-block;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:600;border:2px solid #0056b3;">
            {{translations.viewOrder}}
          </a>

          <!-- Status with proper contrast ratios -->
          <div class="status-info" style="margin:20px 0;padding:15px;background-color:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;">
            <h3 style="color:#212529;margin:0 0 8px 0;font-size:18px;">Status Update</h3>
            <span class="status-badge" style="background-color:#0c5460;color:#ffffff;padding:6px 12px;border-radius:4px;font-weight:600;">
              {{getStatusText data.status locale}}
            </span>
          </div>

          <!-- Link with proper contrast -->
          <p style="color:#495057;">
            Questions? <a href="mailto:support@example.com" style="color:#0056b3;text-decoration:underline;">Contact us</a>
          </p>
        </div>
      `;

      const data = {
        customerName: 'John Doe',
        orderUrl: 'https://example.com/orders/12345',
        status: 'shipped'
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify high contrast colors (WCAG AA compliant)
      expect(result).toContain('color:#212529'); // Dark text on light background
      expect(result).toContain('background-color:#ffffff'); // White background
      expect(result).toContain('background-color:#0056b3'); // High contrast blue
      expect(result).toContain('background-color:#0c5460'); // High contrast teal
      expect(result).toContain('color:#495057'); // Medium gray for body text

      // Verify readable font sizes
      expect(result).toContain('font-size:28px'); // Large heading
      expect(result).toContain('font-size:18px'); // Medium heading
      expect(result).toContain('font-size:16px'); // Body text

      // Verify readable line height
      expect(result).toContain('line-height:1.6');

      // Verify content
      expect(result).toContain('Hello John Doe');
      expect(result).toContain('View Order');
      expect(result).toContain('Status Update');
      expect(result).toContain('Shipped');
    });
  });

  describe('Cross-Client Feature Preservation', () => {
    it('should maintain consistent rendering across different email clients', async () => {
      const template = `
        <div class="universal-email" style="font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
          <!-- Universal header -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">
            <tr>
              <td style="padding:20px;text-align:center;background-color:#f8f9fa;">
                <h1 style="margin:0;color:#2c3e50;font-size:28px;font-weight:600;">{{translations.companyName}}</h1>
              </td>
            </tr>
          </table>

          <!-- Universal content area -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 20px 0;color:#495057;font-size:16px;line-height:1.6;">
                  {{translations.greeting}} {{data.customerName}},
                </p>

                <!-- Universal button (works in all clients) -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
                  <tr>
                    <td style="border-radius:4px;background-color:#007bff;">
                      <a href="{{data.orderUrl}}"
                         style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;font-size:16px;">
                        {{translations.viewOrder}}
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Universal status display -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:20px 0;">
                  <tr>
                    <td style="padding:15px;background-color:#f8f9fa;border-left:4px solid #17a2b8;">
                      <h3 style="margin:0 0 8px 0;color:#2c3e50;font-size:18px;">Order Status</h3>
                      <span style="display:inline-block;padding:4px 8px;background-color:#17a2b8;color:#ffffff;border-radius:4px;font-size:14px;font-weight:600;">
                        {{getStatusText data.status locale}}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;

      const data = {
        customerName: 'John Doe',
        orderUrl: 'https://example.com/orders/12345',
        status: 'shipped'
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify universal compatibility features
      expect(result).toContain('role="presentation"');
      expect(result).toContain('cellspacing="0"');
      expect(result).toContain('cellpadding="0"');
      expect(result).toContain('border="0"');
      expect(result).toContain('font-family:Arial,Helvetica,sans-serif');
      expect(result).toContain('-webkit-text-size-adjust:100%');
      expect(result).toContain('-ms-text-size-adjust:100%');
      expect(result).toContain('max-width:600px');
      expect(result).toContain('margin:0 auto');

      // Verify table-based layout (most compatible)
      expect(result).toContain('<table');
      expect(result).toContain('<td');
      expect(result).toContain('display:inline-block');

      // Verify content preservation
      expect(result).toContain('AlaCraft');
      expect(result).toContain('Hello John Doe');
      expect(result).toContain('View Order');
      expect(result).toContain('Order Status');
      expect(result).toContain('Shipped');
    });
  });
});