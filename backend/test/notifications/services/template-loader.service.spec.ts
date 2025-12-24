import { Test, TestingModule } from '@nestjs/testing';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { TemplateNotFoundError, TemplateLoadError, TemplateDirectoryError } from '../../../src/notifications/errors/template-errors';
import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';

describe('TemplateLoaderService', () => {
  let service: TemplateLoaderService;
  let testTemplatesDir: string;

  beforeEach(async () => {
    // Create a temporary test templates directory
    testTemplatesDir = join(__dirname, 'test-templates');
    if (existsSync(testTemplatesDir)) {
      rmSync(testTemplatesDir, { recursive: true });
    }
    mkdirSync(testTemplatesDir, { recursive: true });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TemplateLoaderService,
          useFactory: () => new TemplateLoaderService({
            templatesPath: testTemplatesDir,
            isDevelopment: false,
            enableCaching: true,
            templateExtension: '.html'
          })
        }
      ],
    }).compile();

    service = module.get<TemplateLoaderService>(TemplateLoaderService);
  });

  afterEach(() => {
    // Clean up test templates directory
    if (existsSync(testTemplatesDir)) {
      rmSync(testTemplatesDir, { recursive: true });
    }
  });

  describe('loadTemplate', () => {
    it('should load a template file successfully', async () => {
      // Arrange
      const templateName = 'test-template';
      const templateContent = '<html><body>Hello {{name}}</body></html>';
      const templatePath = join(testTemplatesDir, `${templateName}.html`);
      writeFileSync(templatePath, templateContent);

      // Act
      const result = await service.loadTemplate(templateName);

      // Assert
      expect(result).toBe(templateContent);
    });

    it('should cache templates after first load', async () => {
      // Arrange
      const templateName = 'cached-template';
      const templateContent = '<html><body>Cached content</body></html>';
      const templatePath = join(testTemplatesDir, `${templateName}.html`);
      writeFileSync(templatePath, templateContent);

      // Act
      const result1 = await service.loadTemplate(templateName);
      const result2 = await service.loadTemplate(templateName);

      // Assert
      expect(result1).toBe(templateContent);
      expect(result2).toBe(templateContent);

      const cacheStats = service.getCacheStats();
      expect(cacheStats.templates.size).toBe(1);
      expect(cacheStats.templates.keys).toContain(templateName);
    });

    it('should throw TemplateNotFoundError for non-existent template', async () => {
      // Arrange
      const templateName = 'non-existent-template';

      // Act & Assert
      await expect(service.loadTemplate(templateName)).rejects.toThrow(TemplateNotFoundError);
    });

    it('should throw TemplateLoadError for file read errors', async () => {
      // Arrange
      const templateName = 'unreadable-template';
      const templatePath = join(testTemplatesDir, `${templateName}.html`);
      writeFileSync(templatePath, 'content');

      // Mock fs.readFile to throw an error
      const originalReadFile = fs.readFile;
      jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('Permission denied'));

      try {
        // Act & Assert
        await expect(service.loadTemplate(templateName)).rejects.toThrow(TemplateLoadError);
      } finally {
        // Restore original function
        (fs.readFile as jest.Mock).mockRestore();
      }
    });
  });

  describe('templateExists', () => {
    it('should return true for existing template', () => {
      // Arrange
      const templateName = 'existing-template';
      const templatePath = join(testTemplatesDir, `${templateName}.html`);
      writeFileSync(templatePath, 'content');

      // Act
      const result = service.templateExists(templateName);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-existing template', () => {
      // Arrange
      const templateName = 'non-existing-template';

      // Act
      const result = service.templateExists(templateName);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached templates', async () => {
      // Arrange
      const templateName = 'cached-template';
      const templateContent = '<html><body>Content</body></html>';
      const templatePath = join(testTemplatesDir, `${templateName}.html`);
      writeFileSync(templatePath, templateContent);

      // Load template to cache it
      await service.loadTemplate(templateName);
      expect(service.getCacheStats().templates.size).toBe(1);

      // Act
      service.clearCache();

      // Assert
      expect(service.getCacheStats().templates.size).toBe(0);
    });
  });

  describe('reloadTemplates', () => {
    it('should reload all previously cached templates', async () => {
      // Arrange
      const templateName = 'reload-template';
      const originalContent = '<html><body>Original</body></html>';
      const updatedContent = '<html><body>Updated</body></html>';
      const templatePath = join(testTemplatesDir, `${templateName}.html`);

      writeFileSync(templatePath, originalContent);
      await service.loadTemplate(templateName);

      // Update the file
      writeFileSync(templatePath, updatedContent);

      // Act
      await service.reloadTemplates();

      // Assert
      const result = await service.loadTemplate(templateName);
      expect(result).toBe(updatedContent);
    });
  });

  describe('getTemplatePath', () => {
    it('should return correct template path', () => {
      // Arrange
      const templateName = 'test-template';

      // Act
      const result = service.getTemplatePath(templateName);

      // Assert
      expect(result).toContain(`${templateName}.html`);
      expect(result).toContain(testTemplatesDir);
    });
  });

  describe('development mode', () => {
    let devService: TemplateLoaderService;

    beforeEach(() => {
      devService = new TemplateLoaderService({
        templatesPath: testTemplatesDir,
        isDevelopment: true,
        enableCaching: true,
        templateExtension: '.html'
      });
      // Stop file watching immediately to prevent Jest hanging
      devService.stopFileWatching();
    });

    afterEach(() => {
      devService.onModuleDestroy();
    });

    it('should enable development mode features', () => {
      expect(devService.isDevelopmentMode()).toBe(true);
    });

    it('should force reload template bypassing cache', async () => {
      // Arrange
      const templateName = 'force-reload-template';
      const originalContent = '<html><body>Original</body></html>';
      const updatedContent = '<html><body>Updated</body></html>';
      const templatePath = join(testTemplatesDir, `${templateName}.html`);

      writeFileSync(templatePath, originalContent);
      await devService.loadTemplate(templateName);

      // Update the file
      writeFileSync(templatePath, updatedContent);

      // Act
      const result = await devService.forceReloadTemplate(templateName);

      // Assert
      expect(result).toBe(updatedContent);
    });
  });

  describe('configuration validation', () => {
    it('should throw error for invalid templates directory', () => {
      expect(() => {
        new TemplateLoaderService({
          templatesPath: '/non/existent/path',
          isDevelopment: false,
          enableCaching: true,
          templateExtension: '.html'
        });
      }).toThrow(TemplateDirectoryError);
    });

    it('should throw error for missing templatesPath', () => {
      expect(() => {
        new TemplateLoaderService({
          templatesPath: '',
          isDevelopment: false,
          enableCaching: true,
          templateExtension: '.html'
        });
      }).toThrow('TemplateLoader configuration must include templatesPath');
    });
  });
});