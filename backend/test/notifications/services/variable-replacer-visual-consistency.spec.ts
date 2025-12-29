import { Test, TestingModule } from '@nestjs/testing';
import { VariableReplacerService } from '../../../src/notifications/services/variable-replacer.service';
import { HTMLEscapingService } from '../../../src/common/services/html-escaping.service';
import { BusinessInfoService } from '../../../src/common/services/business-info.service';
import { DesignSystemInjector } from '../../../src/notifications/services/design-system-injector.service';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';
import type { VariableReplacerConfig } from '../../../src/notifications/interfaces/variable-replacer.interface';

/**
 * Test suite to verify visual output consistency after refactoring.
 * Ensures generated HTML output is visually identical to the output before refactoring.
 *
 * Requirements: 6.1, 6.3 - Visual output consistency must be maintained
 */
describe('VariableReplacerService - Visual Output Consistency', () => {
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
      /* Design System CSS */
      .email-container { max-width: 600px; margin: 0 auto; }
      .header { background-color: #f8f9fa; padding: 20px; }
      .content { padding: 20px; }
      .footer { background-color: #e9ecef; padding: 15px; text-align: center; }
    `),
    getDesignTokens: jest.fn().mockReturnValue({
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545'
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px'
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px'
      }
    })
  };

  const mockBusinessInfoService = {
    getContactEmail: jest.fn().mockResolvedValue('contact@alacraft.com'),
    getBusinessInfo: jest.fn().mockResolvedValue({
      website: 'https://alacraft.com',
      companyName: 'AlaCraft'
    })
  };

  // Mock template loader to disable partial templates for this test
  const mockTemplateLoaderService = {
    partialExists: jest.fn(() => false), // No partials for this test
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
          provide: BusinessInfoService,
          useValue: mockBusinessInfoService
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

  describe('Core Template Processing Consistency', () => {
    it('should generate consistent HTML structure for basic templates', async () => {
      const template = `
        <div class="email-container">
          <header class="header">
            <h1>{{translations.companyName}}</h1>
            <p>{{translations.tagline}}</p>
          </header>

          <div class="content">
            <h2>{{translations.orderConfirmation}}</h2>
            <p>{{translations.greeting}} {{data.customerName}},</p>
            <p>{{translations.thankYou}} for your order #{{data.orderNumber}}.</p>

            <div class="order-details">
              <h3>{{translations.orderDetails}}</h3>
              {{#each data.items}}
                <div class="item">
                  <span class="name">{{this.name}}</span>
                  <span class="quantity">x{{this.quantity}}</span>
                  <span class="price">{{formatCurrency this.price "VND"}}</span>
                </div>
              {{/each}}
              <div class="total">
                <strong>Total: {{formatCurrency data.total "VND"}}</strong>
              </div>
            </div>

            <div class="shipping-address">
              <h3>{{translations.shippingAddress}}</h3>
              <div class="address">
                <div>{{data.shippingAddress.fullName}}</div>
                <div>{{data.shippingAddress.phone}}</div>
                <div>{{data.shippingAddress.addressLine1}}</div>
                <div>{{data.shippingAddress.city}}, {{data.shippingAddress.country}}</div>
              </div>
            </div>
          </div>

          <footer class="footer">
            <p>{{translations.copyright}} {{translations.companyName}}</p>
            <p>{{translations.disclaimer}}</p>
          </footer>
        </div>
      `;

      const orderData = {
        orderNumber: 'ORD-12345',
        customerName: 'John Doe',
        total: 500000,
        items: [
          { name: 'Handmade Ceramic Vase', quantity: 1, price: 300000 },
          { name: 'Wooden Cutting Board', quantity: 2, price: 100000 }
        ],
        shippingAddress: {
          fullName: 'John Doe',
          phone: '+84123456789',
          addressLine1: '123 Main Street',
          city: 'Ho Chi Minh City',
          country: 'Vietnam'
        }
      };

      const resultEn = await service.replaceVariables(template, orderData, 'en');
      const resultVi = await service.replaceVariables(template, orderData, 'vi');

      // Verify HTML structure is present and consistent
      expect(resultEn).toContain('class="email-container"');
      expect(resultEn).toContain('class="header"');
      expect(resultEn).toContain('class="content"');
      expect(resultEn).toContain('class="footer"');
      expect(resultEn).toContain('AlaCraft');
      expect(resultEn).toContain('Order Confirmation');
      expect(resultEn).toContain('ORD-12345');
      expect(resultEn).toContain('John Doe');
      expect(resultEn).toContain('Handmade Ceramic Vase');

      // Verify Vietnamese version has correct translations
      expect(resultVi).toContain('Xác nhận đơn hàng');
      expect(resultVi).toContain('Xin chào');
      expect(resultVi).toContain('Cảm ơn bạn');

      // Verify both versions have consistent HTML structure
      const enStructure = extractHTMLStructure(resultEn);
      const viStructure = extractHTMLStructure(resultVi);
      expect(enStructure).toEqual(viStructure);
    });

    it('should generate consistent HTML for conditional logic', async () => {
      const template = `
        <div class="email">
          {{#if data.showWelcome}}
            <div class="welcome">
              <h1>{{translations.greeting}} {{data.user.name}}!</h1>
            </div>
          {{/if}}

          {{#unless data.isGuest}}
            <div class="member-content">
              <p>Welcome back, valued member!</p>
            </div>
          {{/unless}}

          {{#each data.notifications}}
            <div class="notification notification-{{this.type}}">
              <h3>{{this.title}}</h3>
              <p>{{this.message}}</p>
            </div>
          {{/each}}
        </div>
      `;

      const data = {
        showWelcome: true,
        isGuest: false,
        user: { name: 'John' },
        notifications: [
          { type: 'info', title: 'Update', message: 'Your order has been processed' },
          { type: 'warning', title: 'Notice', message: 'Please update your address' }
        ]
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify conditional content is rendered
      expect(result).toContain('class="welcome"');
      expect(result).toContain('Hello John!');
      expect(result).toContain('class="member-content"');
      expect(result).toContain('valued member');
      expect(result).toContain('class="notification notification-info"');
      expect(result).toContain('class="notification notification-warning"');
      expect(result).toContain('Your order has been processed');
      expect(result).toContain('Please update your address');
    });

    it('should generate consistent HTML for helper functions', async () => {
      const template = `
        <div class="order-summary">
          <div class="pricing">
            <p>Subtotal: {{formatCurrency data.subtotal "VND"}}</p>
            <p>Tax: {{formatCurrency data.tax "VND"}}</p>
            <p>Total: {{formatCurrency data.total "VND"}}</p>
          </div>

          <div class="dates">
            <p>Order Date: {{formatDate data.orderDate}}</p>
            <p>Expected Delivery: {{formatDate data.deliveryDate}}</p>
          </div>

          <div class="status">
            <p>Status: {{getStatusText data.status locale}}</p>
          </div>
        </div>
      `;

      const data = {
        subtotal: 450000,
        tax: 50000,
        total: 500000,
        orderDate: '2024-01-15',
        deliveryDate: '2024-01-20',
        status: 'shipped'
      };

      const resultEn = await service.replaceVariables(template, data, 'en');
      const resultVi = await service.replaceVariables(template, data, 'vi');

      // Verify helper functions work consistently
      expect(resultEn).toContain('class="pricing"');
      expect(resultEn).toContain('class="dates"');
      expect(resultEn).toContain('class="status"');
      expect(resultEn).toContain('Subtotal:');
      expect(resultEn).toContain('Order Date:');
      expect(resultEn).toContain('Status: Shipped');

      expect(resultVi).toContain('Status: Đã giao vận');

      // Verify structure consistency
      const enStructure = extractHTMLStructure(resultEn);
      const viStructure = extractHTMLStructure(resultVi);
      expect(enStructure).toEqual(viStructure);
    });

    it('should handle nested object access consistently', async () => {
      const template = `
        <div class="user-profile">
          <div class="personal-info">
            <h2>{{data.user.profile.firstName}} {{data.user.profile.lastName}}</h2>
            <p>Email: {{data.user.contact.email}}</p>
            <p>Phone: {{data.user.contact.phone}}</p>
          </div>

          <div class="preferences">
            <h3>Preferences</h3>
            <p>Language: {{data.user.settings.language}}</p>
            <p>Currency: {{data.user.settings.currency}}</p>
            <p>Notifications: {{#if data.user.settings.notifications}}Enabled{{else}}Disabled{{/if}}</p>
          </div>

          <div class="addresses">
            <h3>Addresses</h3>
            {{#each data.user.addresses}}
              <div class="address-item">
                <h4>{{this.type}}</h4>
                <p>{{this.street}}, {{this.city}}</p>
              </div>
            {{/each}}
          </div>
        </div>
      `;

      const data = {
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe'
          },
          contact: {
            email: 'john@example.com',
            phone: '+84123456789'
          },
          settings: {
            language: 'English',
            currency: 'VND',
            notifications: true
          },
          addresses: [
            { type: 'Home', street: '123 Main St', city: 'Ho Chi Minh City' },
            { type: 'Work', street: '456 Office Blvd', city: 'Hanoi' }
          ]
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Verify nested object access works
      expect(result).toContain('John Doe');
      expect(result).toContain('john@example.com');
      expect(result).toContain('+84123456789');
      expect(result).toContain('Language: English');
      expect(result).toContain('Currency: VND');
      expect(result).toContain('Notifications: Enabled');
      expect(result).toContain('class="address-item"');
      expect(result).toContain('Home');
      expect(result).toContain('123 Main St');
      expect(result).toContain('Work');
      expect(result).toContain('456 Office Blvd');
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle missing data gracefully', async () => {
      const template = `
        <div class="content">
          <h1>{{data.title}}</h1>
          <p>{{data.description}}</p>
          <p>Optional: {{data.optional}}</p>
          {{#if data.missing}}
            <p>Missing: {{data.missing.property}}</p>
          {{else}}
            <p>Missing data handled gracefully</p>
          {{/if}}
        </div>
      `;

      const data = {
        title: 'Test Title',
        description: 'Test Description'
        // optional and missing are intentionally not provided
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Should not throw and should handle missing data gracefully
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Title');
      expect(result).toContain('Test Description');
      expect(result).toContain('Missing data handled gracefully');
      expect(result).toContain('class="content"');
    });

    it('should handle empty arrays and null values consistently', async () => {
      const template = `
        <div class="lists">
          <div class="items">
            {{#each data.items}}
              <p>{{this.name}}</p>
            {{else}}
              <p>No items found</p>
            {{/each}}
          </div>

          <div class="categories">
            {{#each data.categories}}
              <span>{{this}}</span>
            {{else}}
              <span>No categories</span>
            {{/each}}
          </div>
        </div>
      `;

      const data = {
        items: [], // Empty array
        categories: null // Null value
      };

      const result = await service.replaceVariables(template, data, 'en');

      // Should handle empty/null collections gracefully
      expect(result).toContain('No items found');
      expect(result).toContain('No categories');
      expect(result).toContain('class="lists"');
    });
  });

  describe('Locale Consistency', () => {
    it('should maintain consistent HTML structure across locales', async () => {
      const template = `
        <div class="email-wrapper">
          <header>
            <h1>{{translations.companyName}}</h1>
            <p>{{translations.tagline}}</p>
          </header>

          <main>
            <h2>{{translations.greeting}} {{data.name}}</h2>
            <p>{{translations.thankYou}}</p>
            <div class="status">Status: {{getStatusText data.status locale}}</div>
          </main>

          <footer>
            <p>{{translations.copyright}} {{translations.companyName}}</p>
          </footer>
        </div>
      `;

      const data = { name: 'John', status: 'shipped' };

      const resultEn = await service.replaceVariables(template, data, 'en');
      const resultVi = await service.replaceVariables(template, data, 'vi');

      // Extract and compare HTML structure (ignoring text content)
      const enStructure = extractHTMLStructure(resultEn);
      const viStructure = extractHTMLStructure(resultVi);

      expect(enStructure).toEqual(viStructure);

      // Verify locale-specific content
      expect(resultEn).toContain('Hello John');
      expect(resultEn).toContain('Thank you');
      expect(resultEn).toContain('Shipped');

      expect(resultVi).toContain('Xin chào John');
      expect(resultVi).toContain('Cảm ơn bạn');
      expect(resultVi).toContain('Đã giao vận');
    });
  });
});

/**
 * Helper function to extract HTML structure (tags and classes) while ignoring text content
 */
function extractHTMLStructure(html: string): string {
  return html
    // Remove text content between tags
    .replace(/>([^<]+)</g, '><')
    // Remove whitespace and newlines
    .replace(/\s+/g, ' ')
    .trim();
}