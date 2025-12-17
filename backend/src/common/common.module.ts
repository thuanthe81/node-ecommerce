import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { BusinessInfoService } from './services/business-info.service';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';

/**
 * Common module for shared services and utilities
 * Marked as Global so it's available throughout the application
 */
@Global()
@Module({
  imports: [FooterSettingsModule],
  providers: [EncryptionService, BusinessInfoService],
  exports: [EncryptionService, BusinessInfoService],
})
export class CommonModule {}
