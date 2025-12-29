import { Test, TestingModule } from '@nestjs/testing';
import { VariableReplacerService } from '../../../src/notifications/services/variable-replacer.service';
import { HTMLEscapingService } from '../../../src/common/services/html-escaping.service';
import { BusinessInfoService } from '../../../src/common/services/business-info.service';
import { DesignSystemInjector } from '../../../src/notifications/services/design-system-injector.service';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';
import type { VariableReplacerConfig } from '../../../src/notifications/interfaces/variable-replacer.interface';

describe('VariableReplacerService', () => {
  let service: VariableReplacerService;
  let htmlEscapingService: HTMLEscapingService;
  let designSystemInjector: DesignSystemInjector;

  const mockConfig: VariableReplacerConfig = {
    escapeHtml: true,
    logMissingVariables: true,
    missingVariableDefault: '',
    strictMode: false
  };

  const mockDesignSystemInjector = {
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
    partialExists: jest.fn(() => true),
    loadPartial: jest.fn((partialName: string) => {
      const partials = {
        'email-header': '<div class="email-header"><h1>{{companyName}}</h1></div>',
        'email-footer': '<div class="email-footer"><p>© {{currentYear}} {{companyName}}</p></div>',
        'address-card': '<div class="address-card"><h3>{{title}}</h3><div>{{fullName}}</div></div>',
        'button': '<a href="{{url}}" class="btn btn-{{style}}">{{text}}</a>',
        'status-badge': '<span class="badge badge-{{status}}">{{statusText}}</span>'
      };
      return Promise.resolve(partials[partialName] || '');
    }),
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
    })
    .overrideProvider('VariableReplacerConfig')
    .useValue(mockConfig)
    .compile();

    service = module.get<VariableReplacerService>(VariableReplacerService);
    htmlEscapingService = module.get<HTMLEscapingService>(HTMLEscapingService);
    designSystemInjector = module.get<DesignSystemInjector>(DesignSystemInjector);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('replaceVariables', () => {
    it('should replace simple variables', async () => {
      const template = '<h1>{{data.title}}</h1>';
      const data = { title: 'Test Title' };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Test Title');
    });

    it('should handle missing variables with default value', async () => {
      const template = '<h1>{{data.missingField}}</h1>';
      const data = { title: 'Test Title' };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toBe('<h1></h1>');
    });

    it('should support nested object access', async () => {
      const template = '<p>{{data.user.name}}</p>';
      const data = { user: { name: 'John Doe' } };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('John Doe');
    });

    it('should support conditional sections with boolean true', async () => {
      const template = '{{#if data.showMessage}}<p>Message shown</p>{{/if}}';
      const data = { showMessage: true };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Message shown');
    });

    it('should support conditional sections with boolean false', async () => {
      const template = '{{#if data.showMessage}}<p>Message shown</p>{{/if}}';
      const data = { showMessage: false };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).not.toContain('Message shown');
    });

    it('should support conditional sections with truthy string', async () => {
      const template = '{{#if data.message}}<p>{{data.message}}</p>{{/if}}';
      const data = { message: 'Hello World' };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Hello World');
    });

    it('should support conditional sections with empty string (falsy)', async () => {
      const template = '{{#if data.message}}<p>{{data.message}}</p>{{/if}}';
      const data = { message: '' };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).not.toContain('<p>');
    });

    it('should support conditional sections with number (truthy)', async () => {
      const template = '{{#if data.count}}<p>Count: {{data.count}}</p>{{/if}}';
      const data = { count: 5 };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Count: 5');
    });

    it('should support conditional sections with zero (falsy)', async () => {
      const template = '{{#if data.count}}<p>Count: {{data.count}}</p>{{/if}}';
      const data = { count: 0 };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).not.toContain('Count:');
    });

    it('should support conditional sections with null (falsy)', async () => {
      const template = '{{#if data.value}}<p>Value exists</p>{{/if}}';
      const data = { value: null };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).not.toContain('Value exists');
    });

    it('should support conditional sections with undefined (falsy)', async () => {
      const template = '{{#if data.value}}<p>Value exists</p>{{/if}}';
      const data = {};

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).not.toContain('Value exists');
    });

    it('should support conditional sections with array (truthy)', async () => {
      const template = '{{#if data.items}}<p>Has items</p>{{/if}}';
      const data = { items: [1, 2, 3] };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Has items');
    });

    it('should support conditional sections with empty array (falsy in Handlebars)', async () => {
      const template = '{{#if data.items}}<p>Has items</p>{{/if}}';
      const data = { items: [] };

      const result = await service.replaceVariables(template, data, 'en');

      // Note: In Handlebars, empty arrays are falsy in #if conditions
      expect(result).not.toContain('Has items');
    });

    it('should support conditional sections with object (truthy)', async () => {
      const template = '{{#if data.user}}<p>User exists</p>{{/if}}';
      const data = { user: { name: 'John' } };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('User exists');
    });

    it('should support conditional sections with else clause', async () => {
      const template = '{{#if data.showMessage}}<p>Message shown</p>{{else}}<p>No message</p>{{/if}}';
      const data = { showMessage: false };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('No message');
      expect(result).not.toContain('Message shown');
    });

    it('should support nested conditional sections', async () => {
      const template = '{{#if data.user}}{{#if data.user.isAdmin}}<p>Admin user</p>{{/if}}{{/if}}';
      const data = { user: { isAdmin: true } };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Admin user');
    });

    it('should support unless helper (inverse conditional)', async () => {
      const template = '{{#unless data.isHidden}}<p>Visible content</p>{{/unless}}';
      const data = { isHidden: false };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Visible content');
    });

    it('should support unless helper with truthy value', async () => {
      const template = '{{#unless data.isHidden}}<p>Visible content</p>{{/unless}}';
      const data = { isHidden: true };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).not.toContain('Visible content');
    });

    it('should support array iteration with simple array', async () => {
      const template = '{{#each data.items}}<li>{{this.name}}</li>{{/each}}';
      const data = { items: [{ name: 'Item 1' }, { name: 'Item 2' }] };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should support array iteration with primitive values', async () => {
      const template = '{{#each data.numbers}}<span>{{this}}</span>{{/each}}';
      const data = { numbers: [1, 2, 3, 4, 5] };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('<span>1</span>');
      expect(result).toContain('<span>2</span>');
      expect(result).toContain('<span>3</span>');
      expect(result).toContain('<span>4</span>');
      expect(result).toContain('<span>5</span>');
    });

    it('should support array iteration with string values', async () => {
      const template = '{{#each data.colors}}<div class="{{this}}">{{this}}</div>{{/each}}';
      const data = { colors: ['red', 'green', 'blue'] };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('<div class="red">red</div>');
      expect(result).toContain('<div class="green">green</div>');
      expect(result).toContain('<div class="blue">blue</div>');
    });

    it('should support array iteration with nested objects', async () => {
      const template = '{{#each data.users}}<p>{{this.name}} - {{this.profile.age}}</p>{{/each}}';
      const data = {
        users: [
          { name: 'John', profile: { age: 25 } },
          { name: 'Jane', profile: { age: 30 } }
        ]
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('John - 25');
      expect(result).toContain('Jane - 30');
    });

    it('should support array iteration with index access', async () => {
      const template = '{{#each data.items}}<li>{{@index}}: {{this}}</li>{{/each}}';
      const data = { items: ['First', 'Second', 'Third'] };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('0: First');
      expect(result).toContain('1: Second');
      expect(result).toContain('2: Third');
    });

    it('should support array iteration with first/last indicators', async () => {
      const template = '{{#each data.items}}{{#if @first}}<strong>{{this}}</strong>{{else if @last}}<em>{{this}}</em>{{else}}{{this}}{{/if}}{{/each}}';
      const data = { items: ['First', 'Middle', 'Last'] };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('<strong>First</strong>');
      expect(result).toContain('Middle');
      expect(result).toContain('<em>Last</em>');
    });

    it('should support array iteration with empty array', async () => {
      const template = '{{#each data.items}}<li>{{this}}</li>{{else}}<p>No items</p>{{/each}}';
      const data = { items: [] };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('No items');
      expect(result).not.toContain('<li>');
    });

    it('should support array iteration with null/undefined array', async () => {
      const template = '{{#each data.items}}<li>{{this}}</li>{{else}}<p>No items</p>{{/each}}';
      const data = { items: null };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('No items');
      expect(result).not.toContain('<li>');
    });

    it('should support nested array iteration', async () => {
      const template = '{{#each data.categories}}<div>{{this.name}}: {{#each this.items}}<span>{{this}}</span>{{/each}}</div>{{/each}}';
      const data = {
        categories: [
          { name: 'Fruits', items: ['Apple', 'Banana'] },
          { name: 'Vegetables', items: ['Carrot', 'Broccoli'] }
        ]
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Fruits:');
      expect(result).toContain('<span>Apple</span>');
      expect(result).toContain('<span>Banana</span>');
      expect(result).toContain('Vegetables:');
      expect(result).toContain('<span>Carrot</span>');
      expect(result).toContain('<span>Broccoli</span>');
    });

    it('should support array iteration with complex objects', async () => {
      const template = '{{#each data.orders}}<div>Order {{this.id}}: {{this.customer.name}} - {{this.items.length}} items</div>{{/each}}';
      const data = {
        orders: [
          {
            id: 'ORD001',
            customer: { name: 'John Doe' },
            items: [{ name: 'Product A' }, { name: 'Product B' }]
          },
          {
            id: 'ORD002',
            customer: { name: 'Jane Smith' },
            items: [{ name: 'Product C' }]
          }
        ]
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Order ORD001: John Doe - 2 items');
      expect(result).toContain('Order ORD002: Jane Smith - 1 items');
    });

    it('should support array iteration with mixed data types', async () => {
      const template = '{{#each data.mixed}}{{#if (eq (typeof this) "string")}}<span>{{this}}</span>{{else if (eq (typeof this) "number")}}<num>{{this}}</num>{{else}}<obj>{{this.name}}</obj>{{/if}}{{/each}}';
      const data = {
        mixed: ['text', 42, { name: 'object' }, 'another text', 100]
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('<span>text</span>');
      expect(result).toContain('<num>42</num>');
      expect(result).toContain('<obj>object</obj>');
      expect(result).toContain('<span>another text</span>');
      expect(result).toContain('<num>100</num>');
    });

    it('should provide locale-specific translations', async () => {
      const template = '<h1>{{translations.greeting}}</h1>';
      const data = {};

      const resultEn = await service.replaceVariables(template, data, 'en');
      const resultVi = await service.replaceVariables(template, data, 'vi');

      expect(resultEn).toContain('Hello');
      expect(resultVi).toContain('Xin chào');
    });

    it('should provide template helpers', async () => {
      const template = '<span>{{helpers.formatCurrency 100000 "VND"}}</span>';
      const data = {};

      const result = await service.replaceVariables(template, data, 'vi');

      expect(result).toContain('₫');
    });
  });

  describe('registerHelper', () => {
    it('should register custom helpers', () => {
      const customHelper = (value: string) => value.toUpperCase();

      service.registerHelper('uppercase', customHelper);

      expect(service.getRegisteredHelpers()).toContain('uppercase');
    });
  });

  describe('compileTemplate', () => {
    it('should compile templates successfully', () => {
      const template = '<h1>{{data.title}}</h1>';

      const compiledTemplate = service.compileTemplate(template);

      expect(compiledTemplate).toBeDefined();
      expect(typeof compiledTemplate).toBe('function');
    });
  });
});