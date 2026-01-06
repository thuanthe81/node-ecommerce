import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TemplateValidationService } from '../src/pdf-generator/services/template-validation.service';

describe('TemplateValidationService', () => {
  let service: TemplateValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateValidationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                NODE_ENV: 'test',
                TEMPLATE_MONITORING_ENABLED: 'false',
                TEMPLATE_BACKUP_DIR: '/tmp/test-backups',
                MAX_TEMPLATE_BACKUPS: '5',
                MAX_BACKUP_AGE_DAYS: '7'
              };
              return config[key] || defaultValue;
            })
          }
        }
      ]
    }).compile();

    service = module.get<TemplateValidationService>(TemplateValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateTemplate', () => {
    it('should validate order-confirmation template', async () => {
      const report = await service.validateTemplate('order-confirmation');

      expect(report).toBeDefined();
      expect(report.templateName).toBe('order-confirmation');
      expect(typeof report.isValid).toBe('boolean');
      expect(Array.isArray(report.errors)).toBe(true);
      expect(Array.isArray(report.warnings)).toBe(true);
      expect(typeof report.validationTime).toBe('number');
      expect(report.templateSize).toBeGreaterThan(0);
      expect(report.lastModified).toBeTruthy();
    });

    it('should validate invoice template', async () => {
      const report = await service.validateTemplate('invoice');

      expect(report).toBeDefined();
      expect(report.templateName).toBe('invoice');
      expect(typeof report.isValid).toBe('boolean');
      expect(Array.isArray(report.errors)).toBe(true);
      expect(Array.isArray(report.warnings)).toBe(true);
      expect(typeof report.validationTime).toBe('number');
      expect(report.templateSize).toBeGreaterThan(0);
      expect(report.lastModified).toBeTruthy();
    });
  });

  describe('validateAllTemplates', () => {
    it('should validate all templates', async () => {
      const reports = await service.validateAllTemplates();

      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(2);

      const templateNames = reports.map(r => r.templateName);
      expect(templateNames).toContain('order-confirmation');
      expect(templateNames).toContain('invoice');
    });
  });

  describe('getValidationSummary', () => {
    it('should return validation summary', async () => {
      const summary = await service.getValidationSummary();

      expect(summary).toBeDefined();
      expect(typeof summary.totalTemplates).toBe('number');
      expect(typeof summary.validTemplates).toBe('number');
      expect(typeof summary.invalidTemplates).toBe('number');
      expect(typeof summary.totalErrors).toBe('number');
      expect(typeof summary.totalWarnings).toBe('number');
      expect(summary.lastValidation).toBeInstanceOf(Date);

      expect(summary.totalTemplates).toBe(summary.validTemplates + summary.invalidTemplates);
    });
  });
});