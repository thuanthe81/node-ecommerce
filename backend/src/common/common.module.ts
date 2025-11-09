import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';

/**
 * Common module for shared services and utilities
 * Marked as Global so it's available throughout the application
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class CommonModule {}
