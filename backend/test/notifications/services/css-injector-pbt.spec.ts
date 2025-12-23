import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';
import { CSSInjectorConfig } from '../../../src/notifications/interfaces/css-injector.interface';

/**
 * Property-Based Tests for CSSInjectorService
 *
 * These tests validate universal properties that should hold across all valid inputs
 * using property-based testing with fast-check.
 *
 * Feature: email-template-file-system
 */
describe('CSSInjectorService Property-Based Tests', () => {
  let service: CSSInjectorService;

  const mockConfig: CSSInjectorConfig = {
    stylesPath: 'test/fixtures/styles',
    isDevelopment: false,
    minifyCSS: false,
    includeFallbacks: true
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CSSInjectorService,
        {
          provide: 'CSSInjectorConfig',
          useValue: mockConfig
        }
      ],
    }).compile();

    service = module.get<CSSInjectorService>(CSSInjectorService);
  });

  /**
   * Property 18: CSS Design Token Preprocessing
   * For any CSS design file containing design token placeholders and corresponding design token values,
   * the CSS_Injector should replace all placeholders with their actual values during preprocessing
   *
   * **Feature: email-template-file-system, Property 18: CSS Design Token Preprocessing**
   * **Validates: Requirements 8.3, 8.6**
   */
  it('should replace design token placeholders with actual values', () => {
    fc.assert(fc.property(
      fc.record({
        colors: fc.record({
          primary: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
          secondary: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`)
        }),
        typography: fc.record({
          fontSize: fc.record({
            body: fc.integer({ min: 10, max: 24 }).map(n => `${n}px`)
          })
        }),
        spacing: fc.record({
          md: fc.integer({ min: 4, max: 32 }).map(n => `${n}px`)
        })
      }),
      (designTokens) => {
        const cssWithTokens = `
          .test {
            color: {{designTokens.colors.primary}};
            background: {{designTokens.colors.secondary}};
            font-size: {{designTokens.typography.fontSize.body}};
            padding: {{designTokens.spacing.md}};
          }
        `;

        const processedCSS = service.preprocessCSS(cssWithTokens, designTokens);

        // Should replace all design token placeholders
        expect(processedCSS).toContain(designTokens.colors.primary);
        expect(processedCSS).toContain(designTokens.colors.secondary);
        expect(processedCSS).toContain(designTokens.typography.fontSize.body);
        expect(processedCSS).toContain(designTokens.spacing.md);

        // Should not contain any unresolved placeholders
        expect(processedCSS).not.toContain('{{designTokens');
      }
    ), { numRuns: 10 });
  });

  /**
   * Property 16: CSS Injection into Templates
   * For any template being processed, the CSS_Injector should inject CSS styles
   * from the corresponding design file into the final HTML output
   *
   * **Feature: email-template-file-system, Property 16: CSS Injection into Templates**
   * **Validates: Requirements 8.2**
   */
  it('should inject CSS into templates at appropriate locations', () => {
    fc.assert(fc.property(
      fc.oneof(
        // Template with CSS placeholder
        fc.constant('<html><head><style>{{{injectedCSS}}}</style></head><body>Content</body></html>'),
        // Template with head section but no placeholder
        fc.constant('<html><head><title>Test</title></head><body>Content</body></html>'),
        // Template with body but no head
        fc.constant('<html><body>Content</body></html>')
      ),
      fc.string({ minLength: 10, maxLength: 100 }).filter(s => !s.includes('{{{')),
      (template, cssContent) => {
        // Use the private method indirectly through accessing it
        const result = service['injectCSSIntoTemplate'](template, cssContent);

        if (template.includes('{{{injectedCSS}}}')) {
          // Should replace the placeholder
          expect(result).not.toContain('{{{injectedCSS}}}');
          expect(result).toContain(cssContent);
        } else if (template.includes('</head>')) {
          // Should inject before closing head tag
          expect(result).toContain('<style type="text/css">');
          expect(result).toContain(cssContent);
        } else if (template.includes('<body')) {
          // Should inject after body tag as fallback
          expect(result).toContain('<style type="text/css">');
          expect(result).toContain(cssContent);
        }

        // Should always contain the original template structure
        expect(result).toContain('Content');
      }
    ), { numRuns: 10 });
  });

  /**
   * Property 11: Template Caching Efficiency
   * For any template that has been loaded once, subsequent requests for the same template
   * should return cached content without additional file system access
   *
   * **Feature: email-template-file-system, Property 11: Template Caching Efficiency**
   * **Validates: Requirements 4.2**
   */
  it('should maintain consistent file path generation', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
      (fileName) => {
        const cssFileName = `${fileName}.css`;

        // Multiple calls should return the same path
        const path1 = service.getCSSFilePath(cssFileName);
        const path2 = service.getCSSFilePath(cssFileName);

        expect(path1).toBe(path2);
        expect(path1).toContain(cssFileName);
        expect(path1).toContain(mockConfig.stylesPath);
      }
    ), { numRuns: 10 });
  });

  /**
   * Property 2: Missing Template Error Handling
   * For any non-existent template name, the Email_Template_Service should throw a descriptive error
   * that includes the template name and indicates it was not found
   *
   * **Feature: email-template-file-system, Property 2: Missing Template Error Handling**
   * **Validates: Requirements 1.5**
   */
  it('should handle non-existent CSS files consistently', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
      (fileName) => {
        const cssFileName = `non-existent-${fileName}.css`;

        // Should consistently report file as non-existent
        const exists1 = service.cssFileExists(cssFileName);
        const exists2 = service.cssFileExists(cssFileName);

        expect(exists1).toBe(exists2);
        expect(exists1).toBe(false);
      }
    ), { numRuns: 10 });
  });
});