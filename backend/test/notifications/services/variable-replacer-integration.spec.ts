import { Test, TestingModule } from '@nestjs/testing';
import { VariableReplacerService } from '../../../src/notifications/services/variable-replacer.service';
import { HTMLEscapingService } from '../../../src/common/services/html-escaping.service';
import { DesignSystemInjector } from '../../../src/notifications/services/design-system-injector.service';
import { EmailTranslationService } from '../../../src/notifications/services/email-translation.service';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';
import type { VariableReplacerConfig } from '../../../src/notifications/interfaces/variable-replacer.interface';

describe('VariableReplacerService Integration', () => {
  let service: VariableReplacerService;

  const mockConfig: VariableReplacerConfig = {
    escapeHtml: true,
    logMissingVariables: true,
    missingVariableDefault: '',
    strictMode: false
  };

  const mockDesignSystemInjector = {
    getDesignTokens: jest.fn().mockReturnValue({})
  };

  const mockEmailTranslationService = {
    getEmailTemplateTranslations: jest.fn().mockReturnValue({}),
    getStatusTranslations: jest.fn().mockReturnValue({})
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

  describe('Nested Object Access and Missing Variables', () => {
    it('should handle deeply nested object access', async () => {
      const template = `
        <div>
          <h1>{{data.order.customer.name}}</h1>
          <p>Email: {{data.order.customer.email}}</p>
          <p>Address: {{data.order.shipping.address.street}}, {{data.order.shipping.address.city}}</p>
        </div>
      `;

      const data = {
        order: {
          customer: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          shipping: {
            address: {
              street: '123 Main St',
              city: 'New York'
            }
          }
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('John Doe');
      expect(result).toContain('john@example.com');
      expect(result).toContain('123 Main St');
      expect(result).toContain('New York');
    });

    it('should handle missing nested properties gracefully', async () => {
      const template = `
        <div>
          <h1>{{data.order.customer.name}}</h1>
          <p>Phone: {{get data.order.customer "phone"}}</p>
          <p>Missing: {{get data.order "missing.property"}}</p>
        </div>
      `;

      const data = {
        order: {
          customer: {
            name: 'John Doe'
            // phone is missing
          }
          // missing object is missing
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('John Doe');
      expect(result).toContain('Phone: '); // Should have empty value
      expect(result).toContain('Missing: '); // Should have empty value
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
    });

    it('should use custom get helper for safe nested access', async () => {
      const template = `
        <div>
          <p>Safe access: {{get data "order.customer.name"}}</p>
          <p>Safe missing: {{get data "order.missing.property"}}</p>
        </div>
      `;

      const data = {
        order: {
          customer: {
            name: 'Jane Doe'
          }
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Jane Doe');
      expect(result).toContain('Safe missing: '); // Should be empty
    });

    it('should handle array access within nested objects', async () => {
      const template = `
        <ul>
          {{#each data.order.items}}
            <li>{{this.name}} - {{this.price}} ({{this.category.name}})</li>
          {{/each}}
        </ul>
      `;

      const data = {
        order: {
          items: [
            {
              name: 'Product 1',
              price: 100,
              category: { name: 'Electronics' }
            },
            {
              name: 'Product 2',
              price: 200,
              category: { name: 'Books' }
            }
          ]
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Product 1');
      expect(result).toContain('Product 2');
      expect(result).toContain('Electronics');
      expect(result).toContain('Books');
    });

    it('should handle conditional sections with nested objects', async () => {
      const template = `
        <div>
          {{#if data.order.customer.isPremium}}
            <p>Premium customer: {{data.order.customer.name}}</p>
          {{/if}}
          {{#if data.order.customer.isRegular}}
            <p>Regular customer: {{data.order.customer.name}}</p>
          {{/if}}
        </div>
      `;

      const data = {
        order: {
          customer: {
            name: 'John Doe',
            isPremium: true,
            isRegular: false
          }
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('Premium customer: John Doe');
      expect(result).not.toContain('Regular customer');
    });

    it('should handle HTML escaping in nested values', async () => {
      const template = `
        <div>
          <p>Name: {{data.user.name}}</p>
          <p>Bio: {{data.user.profile.bio}}</p>
        </div>
      `;

      const data = {
        user: {
          name: 'John <script>alert("xss")</script> Doe',
          profile: {
            bio: 'I love <b>coding</b> & "programming"'
          }
        }
      };

      const result = await service.replaceVariables(template, data, 'en');

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;b&gt;coding&lt;/b&gt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;programming&quot;');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<b>coding</b>');
    });
  });
});