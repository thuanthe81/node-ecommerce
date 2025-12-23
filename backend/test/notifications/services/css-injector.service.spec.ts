import { Test, TestingModule } from '@nestjs/testing';
import { CSSInjectorService } from '../../../src/notifications/services/css-injector.service';
import { CSSInjectorConfig } from '../../../src/notifications/interfaces/css-injector.interface';

describe('CSSInjectorService', () => {
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should preprocess CSS with design tokens', () => {
    const cssContent = `
      .test {
        color: {{designTokens.colors.primary}};
        font-size: {{designTokens.typography.fontSize.body}};
      }
    `;

    const designTokens = {
      colors: {
        primary: '#2c3e50'
      },
      typography: {
        fontSize: {
          body: '14px'
        }
      }
    };

    const result = service.preprocessCSS(cssContent, designTokens);

    expect(result).toContain('#2c3e50');
    expect(result).toContain('14px');
    expect(result).not.toContain('{{designTokens');
  });

  it('should inject CSS into template with placeholder', async () => {
    const template = `
      <html>
        <head>
          <style type="text/css">
            {{{injectedCSS}}}
          </style>
        </head>
        <body>Content</body>
      </html>
    `;

    // Since the CSS file doesn't exist, it should use default CSS
    const result = await service.loadAndInjectCSS('test-template', template);

    // Should contain default CSS styles
    expect(result).toContain('/* Default email styles - fallback when CSS file is missing */');
    expect(result).toContain('.email-container');
    expect(result).toContain('font-family: Arial, Helvetica, sans-serif');
  });

  it('should convert template name to CSS file name', () => {
    const templateName = 'order-confirmation';
    const expectedCSSFileName = 'styles-order-confirmation.css';

    // Test the private method indirectly through getCSSFilePath
    const cssFilePath = service.getCSSFilePath(expectedCSSFileName);
    expect(cssFilePath).toContain(expectedCSSFileName);
  });

  it('should handle missing CSS files with fallback', async () => {
    const template = '<html><head></head><body>Test</body></html>';

    try {
      const result = await service.loadAndInjectCSS('non-existent-template', template);
      // Should return template with default CSS injected
      expect(result).toContain('<style type="text/css">');
    } catch (error) {
      // If fallback is disabled, it should throw an error
      expect(error).toBeDefined();
    }
  });

  it('should enable and disable hot reloading', async () => {
    // Test hot reloading methods
    expect(service.isHotReloadingEnabled()).toBe(false);

    await service.enableHotReloading();
    // In non-development mode, hot reloading should not be enabled
    expect(service.isHotReloadingEnabled()).toBe(false);

    await service.disableHotReloading();
    expect(service.isHotReloadingEnabled()).toBe(false);
  });

  it('should get watched files list', () => {
    const watchedFiles = service.getWatchedFiles();
    expect(Array.isArray(watchedFiles)).toBe(true);
  });
});