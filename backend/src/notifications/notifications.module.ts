import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { TemplateLoaderService } from './services/template-loader.service';
import { VariableReplacerService } from './services/variable-replacer.service';
import { DesignSystemInjector } from './services/design-system-injector.service';
import { CSSInjectorService } from './services/css-injector.service';
import { EmailTranslationService } from './services/email-translation.service';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';
import { CommonModule } from '../common/common.module';
import { DEFAULT_TEMPLATE_SYSTEM_CONFIG } from './config/template-system.config';

@Module({
  imports: [FooterSettingsModule, CommonModule],
  providers: [
    EmailService,
    EmailTemplateService,
    TemplateLoaderService,
    VariableReplacerService,
    DesignSystemInjector,
    CSSInjectorService,
    EmailTranslationService,
    // Configuration providers
    {
      provide: 'TemplateLoaderConfig',
      useValue: DEFAULT_TEMPLATE_SYSTEM_CONFIG.templateLoader
    },
    {
      provide: 'VariableReplacerConfig',
      useValue: DEFAULT_TEMPLATE_SYSTEM_CONFIG.variableReplacer
    },
    {
      provide: 'DesignSystemInjectorConfig',
      useValue: DEFAULT_TEMPLATE_SYSTEM_CONFIG.designSystemInjector
    },
    {
      provide: 'CSSInjectorConfig',
      useValue: DEFAULT_TEMPLATE_SYSTEM_CONFIG.cssInjector
    }
  ],
  exports: [
    EmailService,
    EmailTemplateService,
    TemplateLoaderService,
    VariableReplacerService,
    DesignSystemInjector,
    CSSInjectorService,
    EmailTranslationService
  ],
})
export class NotificationsModule {}
