import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PDFGeneratorService } from './pdf-generator.service';
import { PDFTemplateEngine } from './pdf-template.engine';
import { PDFDocumentStructureService } from './pdf-document-structure.service';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { PDFAccessibilityService } from './services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './services/pdf-device-optimization.service';
import { PDFCompressionService } from './services/pdf-compression.service';
import { DocumentStorageService } from './services/document-storage.service';
import { PDFCleanupService } from './services/pdf-cleanup.service';
import { StorageErrorHandlerService } from './services/storage-error-handler.service';
import { EmailAttachmentService } from './services/email-attachment.service';
import { ResendEmailHandlerService } from './services/resend-email-handler.service';
import { PDFErrorHandlerService } from './services/pdf-error-handler.service';
import { PDFMonitoringService } from './services/pdf-monitoring.service';
import { PDFAuditService } from './services/pdf-audit.service';
import { PDFHealthController } from './controllers/pdf-health.controller';
import { PaymentSettingsService } from '../payment-settings/payment-settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule, ScheduleModule.forRoot()],
  controllers: [PDFHealthController],
  providers: [
    PDFGeneratorService,
    PDFTemplateEngine,
    PDFDocumentStructureService,
    PDFLocalizationService,
    PDFAccessibilityService,
    PDFDeviceOptimizationService,
    PDFCompressionService,
    DocumentStorageService,
    PDFCleanupService,
    StorageErrorHandlerService,
    EmailAttachmentService,
    ResendEmailHandlerService,
    PDFErrorHandlerService,
    PDFMonitoringService,
    PDFAuditService,
    PaymentSettingsService
  ],
  exports: [
    PDFGeneratorService,
    PDFTemplateEngine,
    PDFDocumentStructureService,
    PDFLocalizationService,
    PDFAccessibilityService,
    PDFDeviceOptimizationService,
    PDFCompressionService,
    DocumentStorageService,
    PDFCleanupService,
    StorageErrorHandlerService,
    EmailAttachmentService,
    ResendEmailHandlerService,
    PDFErrorHandlerService,
    PDFMonitoringService,
    PDFAuditService
  ],
})
export class PDFGeneratorModule {}