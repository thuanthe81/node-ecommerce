import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { BusinessInfoService } from './services/business-info.service';
import { TranslationService } from './services/translation.service';
import { HTMLEscapingService } from './services/html-escaping.service';
import { ErrorHandlingService } from './services/error-handling.service';
import { EnhancedRateLimitGuard } from './guards/enhanced-rate-limit.guard';
import { CsrfController } from './controllers/csrf.controller';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';

/**
 * Common module for shared services and utilities
 * Marked as Global so it's available throughout the application
 */
@Global()
@Module({
  imports: [FooterSettingsModule],
  controllers: [CsrfController],
  providers: [
    EncryptionService,
    BusinessInfoService,
    TranslationService,
    HTMLEscapingService,
    ErrorHandlingService,
    EnhancedRateLimitGuard,
  ],
  exports: [
    EncryptionService,
    BusinessInfoService,
    TranslationService,
    HTMLEscapingService,
    ErrorHandlingService,
    EnhancedRateLimitGuard,
  ],
})
export class CommonModule {}
