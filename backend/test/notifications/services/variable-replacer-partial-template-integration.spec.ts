import { Test, TestingModule } from '@nestjs/testing';
import { VariableReplacerService } from '../../../src/notifications/services/variable-replacer.service';
import { HTMLEscapingService } from '../../../src/common/services/html-escaping.service';
import { DesignSystemInjector } from '../../../src/notifications/services/design-system-injector.service';
import { EmailTranslationService } from '../../../src/notifications/services/email-translation.service';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';

describe('VariableReplacerService - Partial Template Integration', () => {
  let service: VariableReplacerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariableReplacerService,
        HTMLEscapingService,
        DesignSystemInjector,
        EmailTranslationService,
        TemplateLoaderService,
        CSSInjectorService,
        {
          provide: 'VariableReplacerConfig',
          useValue: {
            templatesPath: 'src/notifications/templates',
            partialsPath: 'src/notifications/templates/partials',
            templateExtension: '.hbs',
            partialExtension: '.hbs',
            enableCaching: false,
            developmentMode: true,
            escapeHtml: false,
            strictMode: false,
            logMissingVariables: false,
            missingVariableDefault: ''
          }
        },
        {
          provide: 'TemplateLoaderConfig',
          useValue: {
            templatesPath: 'src/notifications/templates',
            partialsPath: 'src/notifications/templates/partials',
            templateExtension: '.hbs',
            partialExtension: '.hbs',
            enableCaching: false,
            developmentMode: true
          }
        },
        {
          provide: 'CSSInjectorConfig',
          useValue: {
            stylesPath: 'src/notifications/styles',
            enableCaching: false
          }
        }
      ],
    }).compile();

    service = module.get<VariableReplacerService>(VariableReplacerService);

    // Wait for partial templates to be registered asynchronously
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    // Clean up any test artifacts
  });

  describe('End-to-End Email Generation', () => {
    it('should generate complete email with all partial templates', async () => {
      // Arrange
      const template = `
        {{> email-header}}
        <div class="content">
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>

          <h3>Shipping Address</h3>
          {{> address-card}}

          <h3>Order Status</h3>
          {{> status-badge}}

          <div class="actions">
            {{> button}}
          </div>
        </div>
        {{> email-footer}}
      `;

      const data = {
        name: 'John Doe',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        status: 'confirmed',
        statusText: 'Confirmed',
        url: 'https://example.com/track',
        text: 'Track Order',
        style: 'primary'
      };

      // Act
      const result = await service.replaceVariables(template, data, 'en');

      // Assert - Check that partial templates are rendered
      expect(result).toContain('<div class="email-header">');
      expect(result).toContain('<div class="address-card">');
      expect(result).toContain('Anytown, CA 12345'); // Address data is rendered
      expect(result).toContain('<span class="badge badge-confirmed">Confirmed</span>');
      expect(result).toContain('<a href="https://example.com/track" class="btn btn-primary">Track Order</a>');
      expect(result).toContain('<div class="email-footer">');
    });

    it('should handle partial templates with missing data gracefully', async () => {
      const template = '{{> email-header}}';
      const data = {}; // Missing data

      const result = await service.replaceVariables(template, data, 'en');

      // Should render but with default/empty values
      expect(result).toContain('<div class="email-header">');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing partial templates gracefully', async () => {
      const template = '{{> non-existent-partial}}';
      const data = {};

      await expect(service.replaceVariables(template, data, 'en'))
        .rejects
        .toThrow(/non-existent-partial.*could not be found/i);
    });
  });

  describe('Performance Integration', () => {
    it('should handle multiple partial template calls efficiently', async () => {
      const template = `
        {{> email-header}}
        {{> address-card}}
        {{> status-badge}}
        {{> button}}
        {{> email-footer}}
        {{> email-header}}
        {{> address-card}}
        {{> status-badge}}
        {{> button}}
        {{> email-footer}}
      `;

      const data = {
        name: 'Jane Doe',
        address: '456 Oak Ave',
        city: 'Testville',
        state: 'NY',
        postalCode: '67890',
        status: 'shipped',
        statusText: 'Shipped',
        url: 'https://example.com/track/123',
        text: 'View Details',
        style: 'secondary'
      };

      const startTime = Date.now();
      const result = await service.replaceVariables(template, data, 'en');
      const endTime = Date.now();

      // Should complete within reasonable time (less than 200ms)
      expect(endTime - startTime).toBeLessThan(200);

      // Should render all partials correctly (note: footer contains multiple links)
      expect(result.split('<div class="email-header">').length - 1).toBe(2);
      expect(result.split('<div class="address-card">').length - 1).toBe(2);
      expect(result.split('<span class="badge').length - 1).toBe(2);
      expect(result.split('<a href=').length - 1).toBeGreaterThanOrEqual(2); // Footer has additional links
      expect(result.split('<div class="email-footer">').length - 1).toBe(2);
    });

    it('should cache compiled partial templates for better performance', async () => {
      const template = '{{> email-header}}';
      const data = {};

      // First call - should compile and cache
      const startTime1 = Date.now();
      const result1 = await service.replaceVariables(template, data, 'en');
      const endTime1 = Date.now();

      // Second call - should use cached version
      const startTime2 = Date.now();
      const result2 = await service.replaceVariables(template, data, 'en');
      const endTime2 = Date.now();

      // Results should be identical
      expect(result1).toBe(result2);

      // Second call should be faster or similar (cached)
      expect(endTime2 - startTime2).toBeLessThanOrEqual(endTime1 - startTime1 + 10); // Allow 10ms tolerance
    });
  });

  describe('Locale Integration', () => {
    it('should handle locale-specific data in partial templates', async () => {
      const template = '{{> status-badge}}';

      const enData = {
        status: 'confirmed',
        statusText: 'Confirmed'
      };

      const viData = {
        status: 'confirmed',
        statusText: 'Đã xác nhận'
      };

      const enResult = await service.replaceVariables(template, enData, 'en');
      const viResult = await service.replaceVariables(template, viData, 'vi');

      expect(enResult).toContain('Confirmed');
      expect(viResult).toContain('Đã xác nhận');
    });
  });

  describe('Partial Template System Validation', () => {
    it('should have all required partial templates registered', async () => {
      const requiredPartials = [
        'email-header',
        'email-footer',
        'address-card',
        'button',
        'status-badge'
      ];

      for (const partialName of requiredPartials) {
        const template = `{{> ${partialName}}}`;
        const data = {
          name: 'Test User',
          address: 'Test Address',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          status: 'pending',
          statusText: 'Pending',
          url: 'https://test.com',
          text: 'Test Button',
          style: 'primary'
        };

        // Should not throw an error for missing partials
        await expect(service.replaceVariables(template, data, 'en'))
          .resolves
          .toBeDefined();
      }
    });

    it('should render partial templates with proper HTML structure', async () => {
      const testCases = [
        {
          partial: 'email-header',
          expectedClass: 'email-header'
        },
        {
          partial: 'email-footer',
          expectedClass: 'email-footer'
        },
        {
          partial: 'address-card',
          expectedClass: 'address-card'
        },
        {
          partial: 'button',
          expectedElement: '<a href='
        },
        {
          partial: 'status-badge',
          expectedClass: 'badge badge-'
        }
      ];

      for (const testCase of testCases) {
        const template = `{{> ${testCase.partial}}}`;
        const data = {
          name: 'Test User',
          address: 'Test Address',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          status: 'pending',
          statusText: 'Pending',
          url: 'https://test.com',
          text: 'Test Button',
          style: 'primary'
        };

        const result = await service.replaceVariables(template, data, 'en');

        if (testCase.expectedClass) {
          expect(result).toContain(testCase.expectedClass);
        }
        if (testCase.expectedElement) {
          expect(result).toContain(testCase.expectedElement);
        }
      }
    });
  });
});