import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { forwardRef } from '@nestjs/common';
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
import { InvoiceEmailHandlerService } from './services/invoice-email-handler.service';
import { PDFErrorHandlerService } from './services/pdf-error-handler.service';
import { PDFMonitoringService } from './services/pdf-monitoring.service';
import { PDFAuditService } from './services/pdf-audit.service';
import { PDFImageConverterService } from './services/pdf-image-converter.service';
import { PDFImageOptimizationMetricsService } from './services/pdf-image-optimization-metrics.service';
import { PDFImageOptimizationConfigService } from './services/pdf-image-optimization-config.service';
import { PDFImageValidationService } from './services/pdf-image-validation.service';
import { CompressedImageService } from './services/compressed-image.service';
import { CompressedImageConfigService } from './services/compressed-image-config.service';
import { CompressedImageStorageMonitoringService } from './services/compressed-image-storage-monitoring.service';
import { PDFTemplateLoaderService } from './services/pdf-template-loader.service';
import { TemplateVariableProcessorService } from './services/template-variable-processor.service';
import { TemplateValidationService } from './services/template-validation.service';
import { TemplateMonitoringService } from './services/template-monitoring.service';
import { TemplateBackupService } from './services/template-backup.service';
import { TemplateManagementService } from './services/template-management.service';
import { PDFHealthController } from './controllers/pdf-health.controller';
import { PaymentSettingsService } from '../payment-settings/payment-settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';
import { ShippingModule } from '../shipping/shipping.module';
import { EmailQueueModule } from '../email-queue/email-queue.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    FooterSettingsModule,
    ShippingModule,
    forwardRef(() => EmailQueueModule),
    forwardRef(() => OrdersModule),
    ScheduleModule.forRoot(),
    ConfigModule
  ],
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
    InvoiceEmailHandlerService,
    PDFErrorHandlerService,
    PDFMonitoringService,
    PDFAuditService,
    PDFImageConverterService,
    PDFImageOptimizationMetricsService,
    PDFImageOptimizationConfigService,
    PDFImageValidationService,
    CompressedImageService,
    CompressedImageConfigService,
    PDFTemplateLoaderService,
    TemplateVariableProcessorService,
    TemplateValidationService,
    TemplateMonitoringService,
    TemplateBackupService,
    TemplateManagementService,
    // CompressedImageStorageMonitoringService,
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
    InvoiceEmailHandlerService,
    PDFErrorHandlerService,
    PDFMonitoringService,
    PDFAuditService,
    PDFImageConverterService,
    PDFImageOptimizationMetricsService,
    PDFImageOptimizationConfigService,
    PDFImageValidationService,
    CompressedImageService,
    CompressedImageConfigService,
    PDFTemplateLoaderService,
    TemplateVariableProcessorService,
    TemplateValidationService,
    TemplateMonitoringService,
    TemplateBackupService,
    TemplateManagementService,
    // CompressedImageStorageMonitoringService
  ],
})
export class PDFGeneratorModule {}