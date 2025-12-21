import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailEventPublisher } from './services/email-event-publisher.service';
import { EmailWorker } from './services/email-worker.service';
import { EmailQueueMonitoringService } from './services/email-queue-monitoring.service';
import { EmailQueueConfigService } from './services/email-queue-config.service';
import { EmailQueueHealthController } from './controllers/email-queue-health.controller';
import { EmailQueueAdminController } from './controllers/email-queue-admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';
import { PDFGeneratorModule } from '../pdf-generator/pdf-generator.module';
import { CommonModule } from '../common/common.module';

/**
 * Email Queue Module
 *
 * Provides asynchronous email processing capabilities using BullMQ and Redis.
 * Includes comprehensive monitoring, logging, and health check endpoints.
 * Exports EmailEventPublisher for use in other modules while keeping
 * the worker service internal for background processing.
 */
@Module({
  imports: [
    ConfigModule,
    NotificationsModule, // Provides EmailService and EmailTemplateService
    PrismaModule,        // Database access
    FooterSettingsModule, // Footer settings for admin emails
    forwardRef(() => PDFGeneratorModule),  // Provides EmailAttachmentService for PDF generation
    CommonModule,        // Provides BusinessInfoService
  ],
  controllers: [
    EmailQueueHealthController, // Health check and monitoring endpoints
    EmailQueueAdminController,  // Admin interface for queue management
  ],
  providers: [
    EmailEventPublisher,
    EmailWorker,
    EmailQueueMonitoringService,
    EmailQueueConfigService,
  ],
  exports: [
    EmailEventPublisher, // Export for use in other modules
    EmailQueueMonitoringService, // Export for external monitoring integration
    EmailQueueConfigService, // Export for configuration access
  ],
})
export class EmailQueueModule implements OnModuleInit {
  constructor(
    private emailEventPublisher: EmailEventPublisher,
    private emailWorker: EmailWorker,
    private monitoringService: EmailQueueMonitoringService,
    private configService: EmailQueueConfigService,
  ) {}

  onModuleInit() {
    // Set up monitoring service references to avoid circular dependencies
    this.emailEventPublisher.setMonitoringService(this.monitoringService);
    this.emailWorker.setMonitoringService(this.monitoringService);
  }
}