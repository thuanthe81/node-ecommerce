import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService } from '../../../src/notifications/services/email-template.service';
import { TemplateLoaderService } from '../../../src/notifications/services/template-loader.service';
import { VariableReplacerService } from '../../../src/notifications/services/variable-replacer.service';
import { DesignSystemInjector } from '../../../src/notifications/services/design-system-injector.service';

describe('EmailTemplateService Integration', () => {
  let service: EmailTemplateService;

  const mockTemplateLoaderService = {
    loadTemplate: jest.fn().mockResolvedValue('<html>Mock template</html>'),
    loadPartial: jest.fn().mockResolvedValue('<div>Mock partial</div>'),
    partialExists: jest.fn().mockReturnValue(true),
    getPartialPath: jest.fn().mockReturnValue('mock/path'),
  };

  const mockVariableReplacerService = {
    replaceVariables: jest.fn().mockResolvedValue('<html>Processed template</html>'),
  };

  const mockDesignSystemInjector = {
    generateCSS: jest.fn().mockReturnValue('/* mock css */'),
    getDesignTokens: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateService,
        { provide: TemplateLoaderService, useValue: mockTemplateLoaderService },
        { provide: VariableReplacerService, useValue: mockVariableReplacerService },
        { provide: DesignSystemInjector, useValue: mockDesignSystemInjector },
      ],
    }).compile();

    service = module.get<EmailTemplateService>(EmailTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});