import { Test, TestingModule } from '@nestjs/testing';
import { VariableReplacerService } from '../../../src/notifications/services/variable-replacer.service';
import { HTMLEscapingService } from '../../../src/common/services/html-escaping.service';
import { BusinessInfoService } from '../../../src/common/services/business-info.service';
import { DesignSystemInjector } from '../../../src/notifications/services/design-system-injector.service';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';
import type {
  IVariableReplacer,
  VariableReplacerConfig
} from '../../../src/notifications/interfaces/variable-replacer.interface';

/**
 * Test suite to verify API compatibility after refactoring.
 * Ensures all public method signatures remain unchanged and functionality is preserved.
 *
 * Requirements: 6.2 - API compatibility must be maintained
 */
describe('VariableReplacerService - API Compatibility (Core)', () => {
  let service: VariableReplacerService;
  let serviceAsInterface: IVariableReplacer;

  const mockConfig: VariableReplacerConfig = {
    escapeHtml: true,
    logMissingVariables: false, // Reduce noise in tests
    missingVariableDefault: '',
    strictMode: false
  };

  const mockDesignSystemInjector = {
    generateCSS: jest.fn().mockReturnValue('/* design system css */'),
    getDesignTokens: jest.fn().mockReturnValue({
      colors: { primary: '#007bff' },
      typography: { fontFamily: 'Arial' },
      spacing: { small: '8px' }
    })
  };

  const mockBusinessInfoService = {
    getContactEmail: jest.fn().mockResolvedValue('contact@alacraft.com'),
    getBusinessInfo: jest.fn().mockResolvedValue({
      website: 'https://alacraft.com',
      companyName: 'AlaCraft'
    })
  };

  const mockTemplateLoaderService = {
    partialExists: jest.fn(() => false), // No partials for this test
    loadPartial: jest.fn(() => Promise.resolve('')),
    getPartialPath: jest.fn((partialName: string) => `/path/to/partials/${partialName}.hbs`)
  };

  const mockCSSInjectorService = {
    loadCSSFile: jest.fn().mockResolvedValue('/* mock css content */'),
    cssFileExists: jest.fn().mockReturnValue(true),
    getCSSFilePath: jest.fn().mockReturnValue('/path/to/css/file.css')
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
    serviceAsInterface = service as IVariableReplacer;
  });

  describe('Interface Compliance', () => {
    it('should implement IVariableReplacer interface', () => {
      expect(service).toBeInstanceOf(VariableReplacerService);
      expect(serviceAsInterface).toBeDefined();
    });

    it('should have all required interface methods', () => {
      expect(typeof serviceAsInterface.replaceVariables).toBe('function');
      expect(typeof serviceAsInterface.registerHelper).toBe('function');
      expect(typeof serviceAsInterface.registerHelpers).toBe('function');
      expect(typeof serviceAsInterface.compileTemplate).toBe('function');
      expect(typeof serviceAsInterface.getRegisteredHelpers).toBe('function');
    });
  });

  describe('replaceVariables Method Compatibility', () => {
    it('should maintain method signature: (template: string, data: any, locale: "en" | "vi") => Promise<string>', async () => {
      const template = '<h1>{{data.title}}</h1>';
      const data = { title: 'Test Title' };

      // Test method exists and returns Promise<string>
      const result = serviceAsInterface.replaceVariables(template, data, 'en');
      expect(result).toBeInstanceOf(Promise);

      const resolvedResult = await result;
      expect(typeof resolvedResult).toBe('string');
      expect(resolvedResult).toContain('Test Title');
    });

    it('should support both locale values', async () => {
      const template = '<h1>{{translations.greeting}}</h1>';
      const data = {};

      const resultEn = await serviceAsInterface.replaceVariables(template, data, 'en');
      const resultVi = await serviceAsInterface.replaceVariables(template, data, 'vi');

      expect(typeof resultEn).toBe('string');
      expect(typeof resultVi).toBe('string');
      expect(resultEn).toContain('Hello');
      expect(resultVi).toContain('Xin chào');
    });

    it('should handle complex data objects', async () => {
      const template = `
        <div>
          <h1>{{data.order.id}}</h1>
          <p>Customer: {{data.customer.name}}</p>
          <ul>
            {{#each data.items}}
              <li>{{this.name}} - {{this.price}}</li>
            {{/each}}
          </ul>
        </div>
      `;

      const data = {
        order: { id: 'ORD-123' },
        customer: { name: 'John Doe' },
        items: [
          { name: 'Product A', price: 100 },
          { name: 'Product B', price: 200 }
        ]
      };

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');

      expect(result).toContain('ORD-123');
      expect(result).toContain('John Doe');
      expect(result).toContain('Product A');
      expect(result).toContain('Product B');
    });

    it('should handle conditional logic', async () => {
      const template = `
        <div>
          {{#if data.showWelcome}}
            <h1>Welcome {{data.user.name}}!</h1>
          {{/if}}
          {{#unless data.isGuest}}
            <p>You are logged in</p>
          {{/unless}}
        </div>
      `;

      const data = {
        showWelcome: true,
        isGuest: false,
        user: { name: 'John' }
      };

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');

      expect(result).toContain('Welcome John!');
      expect(result).toContain('You are logged in');
    });

    it('should handle array iteration', async () => {
      const template = `
        <ul>
          {{#each data.items}}
            <li>{{@index}}: {{this.name}} ({{this.category}})</li>
          {{/each}}
        </ul>
      `;

      const data = {
        items: [
          { name: 'Item 1', category: 'Category A' },
          { name: 'Item 2', category: 'Category B' }
        ]
      };

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');

      expect(result).toContain('0: Item 1');
      expect(result).toContain('1: Item 2');
      expect(result).toContain('Category A');
      expect(result).toContain('Category B');
    });
  });

  describe('registerHelper Method Compatibility', () => {
    it('should maintain method signature: (name: string, helper: Function) => void', () => {
      const helperFunction = (value: string) => value.toUpperCase();

      // Should not throw and should return void
      const result = serviceAsInterface.registerHelper('testHelper', helperFunction);
      expect(result).toBeUndefined();

      // Helper should be registered
      expect(serviceAsInterface.getRegisteredHelpers()).toContain('testHelper');
    });

    it('should allow helpers to be used in templates', async () => {
      const helperFunction = (value: string) => value.toUpperCase();
      serviceAsInterface.registerHelper('uppercase', helperFunction);

      const template = '<p>{{uppercase data.text}}</p>';
      const data = { text: 'hello world' };

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');
      expect(result).toContain('HELLO WORLD');
    });
  });

  describe('registerHelpers Method Compatibility', () => {
    it('should maintain method signature: (helpers: Record<string, Function>) => void', () => {
      const helpers = {
        lowercase: (value: string) => value.toLowerCase(),
        reverse: (value: string) => value.split('').reverse().join('')
      };

      // Should not throw and should return void
      const result = serviceAsInterface.registerHelpers(helpers);
      expect(result).toBeUndefined();

      // Helpers should be registered
      const registeredHelpers = serviceAsInterface.getRegisteredHelpers();
      expect(registeredHelpers).toContain('lowercase');
      expect(registeredHelpers).toContain('reverse');
    });

    it('should allow multiple helpers to be used in templates', async () => {
      const helpers = {
        lowercase: (value: string) => value.toLowerCase(),
        reverse: (value: string) => value.split('').reverse().join('')
      };

      serviceAsInterface.registerHelpers(helpers);

      const template = '<p>{{lowercase data.text}} | {{reverse data.text}}</p>';
      const data = { text: 'Hello' };

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');
      expect(result).toContain('hello');
      expect(result).toContain('olleH');
    });
  });

  describe('compileTemplate Method Compatibility', () => {
    it('should maintain method signature: (template: string) => HandlebarsTemplateDelegate', () => {
      const template = '<h1>{{data.title}}</h1>';

      const compiledTemplate = serviceAsInterface.compileTemplate(template);

      expect(typeof compiledTemplate).toBe('function');

      // Should be callable with context and return string
      const context = { data: { title: 'Test' } };
      const result = compiledTemplate(context);
      expect(typeof result).toBe('string');
      expect(result).toContain('Test');
    });

    it('should produce reusable template functions', () => {
      const template = '<p>Hello {{data.name}}</p>';
      const compiledTemplate = serviceAsInterface.compileTemplate(template);

      const result1 = compiledTemplate({ data: { name: 'John' } });
      const result2 = compiledTemplate({ data: { name: 'Jane' } });

      expect(result1).toContain('Hello John');
      expect(result2).toContain('Hello Jane');
    });
  });

  describe('getRegisteredHelpers Method Compatibility', () => {
    it('should maintain method signature: () => string[]', () => {
      const result = serviceAsInterface.getRegisteredHelpers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.every(item => typeof item === 'string')).toBe(true);
    });

    it('should return list of registered helpers', () => {
      const initialHelpers = serviceAsInterface.getRegisteredHelpers();

      serviceAsInterface.registerHelper('customHelper', () => 'test');

      const updatedHelpers = serviceAsInterface.getRegisteredHelpers();
      expect(updatedHelpers).toContain('customHelper');
      expect(updatedHelpers.length).toBeGreaterThan(initialHelpers.length);
    });

    it('should include built-in helpers', () => {
      const helpers = serviceAsInterface.getRegisteredHelpers();

      // Should include some built-in helpers
      expect(helpers).toContain('formatCurrency');
      expect(helpers).toContain('formatDate');
      expect(helpers).toContain('getStatusText');
    });
  });

  describe('Backward Compatibility - Core Template Processing', () => {
    it('should process basic templates', async () => {
      const template = `
        <div class="content">
          <h2>{{data.title}}</h2>
          <p>{{data.message}}</p>
          <p>Locale: {{locale}}</p>
        </div>
      `;

      const data = {
        title: 'Welcome',
        message: 'Thank you for joining us!'
      };

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');

      expect(result).toContain('Welcome');
      expect(result).toContain('Thank you for joining us!');
      expect(result).toContain('Locale: en');
    });

    it('should maintain helper function compatibility', async () => {
      const template = `
        <div>
          <p>Currency: {{formatCurrency 100000 "VND"}}</p>
          <p>Date: {{formatDate "2024-01-15"}}</p>
          <p>Status: {{getStatusText "shipped" locale}}</p>
        </div>
      `;

      const data = {};

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');

      expect(result).toContain('Currency:');
      expect(result).toContain('Date:');
      expect(result).toContain('Status:');
    });

    it('should handle complex nested data structures', async () => {
      const template = `
        <div class="order-summary">
          <h1>Order {{data.orderNumber}}</h1>
          <div class="customer">
            <h3>Shipping Address</h3>
            <div>{{data.shipping.fullName}}</div>
            <div>{{data.shipping.address}}</div>
          </div>
          <div class="items">
            {{#each data.items}}
              <div class="item">
                <span>{{this.name}}</span>
                <span class="price">{{formatCurrency this.price "VND"}}</span>
                <span class="badge badge-{{this.status}}">{{this.status}}</span>
              </div>
            {{/each}}
          </div>
          <div class="total">
            Total: {{formatCurrency data.total "VND"}}
          </div>
        </div>
      `;

      const data = {
        orderNumber: 'ORD-12345',
        shipping: {
          fullName: 'John Doe',
          address: '123 Main St, New York, NY'
        },
        items: [
          { name: 'Product A', price: 100000, status: 'shipped' },
          { name: 'Product B', price: 200000, status: 'pending' }
        ],
        total: 300000
      };

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');

      expect(result).toContain('ORD-12345');
      expect(result).toContain('John Doe');
      expect(result).toContain('Product A');
      expect(result).toContain('Product B');
    });
  });

  describe('Error Handling Compatibility', () => {
    it('should handle template compilation errors gracefully', async () => {
      const invalidTemplate = '{{#if unclosed condition}}';
      const data = {};

      await expect(
        serviceAsInterface.replaceVariables(invalidTemplate, data, 'en')
      ).rejects.toThrow();
    });

    it('should handle missing data gracefully', async () => {
      const template = '<p>{{get data "missing.property"}}</p>';
      const data = {};

      const result = await serviceAsInterface.replaceVariables(template, data, 'en');

      // Should not throw, should return empty string for missing properties
      expect(typeof result).toBe('string');
      expect(result).toContain('<p></p>');
    });

    it('should handle null/undefined data gracefully', async () => {
      const template = '<p>{{data.value}}</p>';

      const resultNull = await serviceAsInterface.replaceVariables(template, null, 'en');
      const resultUndefined = await serviceAsInterface.replaceVariables(template, undefined, 'en');

      expect(typeof resultNull).toBe('string');
      expect(typeof resultUndefined).toBe('string');
    });
  });
});