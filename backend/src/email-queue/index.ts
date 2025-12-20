/**
 * Email Queue Module Exports
 *
 * Main entry point for the email queue system.
 * Exports types, services, controllers, and module for use throughout the application.
 */

// Export types
export * from './types/email-event.types';

// Export services
export { EmailEventPublisher } from './services/email-event-publisher.service';
export { EmailWorker } from './services/email-worker.service';
export { EmailQueueMonitoringService } from './services/email-queue-monitoring.service';

// Export controllers
export { EmailQueueHealthController } from './controllers/email-queue-health.controller';
export { EmailQueueAdminController } from './controllers/email-queue-admin.controller';

// Export module
export { EmailQueueModule } from './email-queue.module';

// Export monitoring types
export type {
  QueueMetrics,
  ProcessingMetrics,
  ErrorMetrics,
  HealthCheckResult,
  HealthCheckComponent,
  HealthSummary,
} from './services/email-queue-monitoring.service';