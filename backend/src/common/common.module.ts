import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { BusinessInfoService } from './services/business-info.service';
import { TranslationService } from './services/translation.service';
import { HTMLEscapingService } from './services/html-escaping.service';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';

/**
 * Common module for shared services and utilities
 * Marked as Global so it's available throughout the application
 */
@Global()
@Module({
  imports: [FooterSettingsModule],
  providers: [EncryptionService, BusinessInfoService, TranslationService, HTMLEscapingService],
  exports: [EncryptionService, BusinessInfoService, TranslationService, HTMLEscapingService],
})
export class CommonModule {}
