import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { EmailQueueConfigService } from '../src/email-queue/services/email-queue-config.service';
import { EmailWorker } from '../src/email-queue/services/email-worker.service';
import { EmailEventType } from '../src/email-queue/types/email-event.types';
import { EmailService } from '../src/notifications/services/email.service';
import { EmailTemplateService } from '../src/notifications/services/email-template.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { FooterSettingsService } from '../src/footer-settings/footer-settings.service';

describe('EmailQueue Resilience Features', () => {
  let emailEventPublisher: EmailEventPublisher;
  let emailWorker: EmailWorker;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailEventPublisher,
        EmailWorker,
        {
          provide: EmailQueueConfigService,
          useValue: {
            getRedisConfig: jest.fn(() => ({
              host: 'localhost',
              port: 6379,
            })),
            getQueueConfig: jest.fn(() => ({
              maxAttempts: 3,
              initialDelay: 30000,
              completedRetentionAge: 86400,
              completedRetentionCount: 1000,
              failedRetentionAge: 604800,
              failedRetentionCount: 500,
            })),
            getResilienceConfig: jest.fn(() => ({
              maxReconnectAttempts: 5,
              reconnectBaseDelay: 1000,
              reconnectMaxDelay: 15000,
            })),
            getWorkerConfig: jest.fn(() => ({
              concurrency: 2,
              rateLimitMax: 50,
              rateLimitDuration: 30000,
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'REDIS_HOST') return 'localhost';
              if (key === 'REDIS_PORT') return 6379;
              if (key === 'EMAIL_WORKER_CONCURRENCY') return '2';
              if (key === 'EMAIL_RATE_LIMIT_MAX') return '50';
              if (key === 'EMAIL_RATE_LIMIT_DURATION') return '30000';
              if (key === 'EMAIL_QUEUE_MAX_ATTEMPTS') return '3';
              if (key === 'EMAIL_QUEUE_INITIAL_DELAY') return '30000';
              if (key === 'EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS') return '5';
              if (key === 'EMAIL_QUEUE_RECONNECT_BASE_DELAY') return '500';
              if (key === 'EMAIL_QUEUE_RECONNECT_MAX_DELAY') return '15000';
              if (key === 'EMAIL_QUEUE_SHUTDOWN_TIMEOUT') return '15000';
              return defaultValue;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: EmailTemplateService,
          useValue: {
            getOrderConfirmationTemplate: jest.fn().mockReturnValue({
              subject: 'Test Subject',
              html: '<p>Test HTML</p>',
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            order: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'test-order-id',
                orderNumber: 'ORD-123',
                email: 'test@example.com',
                customerName: 'Test Customer',
                items: [],
                shippingAddress: {},
              }),
            },
          },
        },
        {
          provide: FooterSettingsService,
          useValue: {
            getFooterSettings: jest.fn().mockResolvedValue({
              contactEmail: 'admin@example.com',
            }),
          },
        },
      ],
    }).compile();

    emailEventPublisher = module.get<EmailEventPublisher>(EmailEventPublisher);
    emailWorker = module.get<EmailWorker>(EmailWorker);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    // Clean up connections
    await emailEventPublisher.onModuleDestroy();
    await emailWorker.onModuleDestroy();
  });

  describe('Graceful Shutdown', () => {
    it('should handle graceful shutdown of publisher', async () => {
      // Test that the publisher can be shut down gracefully
      expect(async () => {
        await emailEventPublisher.onModuleDestroy();
      }).not.toThrow();
    });

    it('should handle graceful shutdown of worker', async () => {
      // Initialize worker first
      emailWorker.onModuleInit();

      // Wait a bit for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test that the worker can be shut down gracefully
      expect(async () => {
        await emailWorker.onModuleDestroy();
      }).not.toThrow();
    });
  });

  describe('Health Checks', () => {
    it('should provide publisher health status', async () => {
      const health = await emailEventPublisher.getPublisherHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('connection');
      expect(health).toHaveProperty('resilience');
      expect(health.resilience).toHaveProperty('isShuttingDown');
      expect(health.resilience).toHaveProperty('reconnectAttempts');
    });

    it('should provide worker health status', async () => {
      const health = await emailWorker.getWorkerHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('resilience');
      expect(health.resilience).toHaveProperty('isShuttingDown');
      expect(health.resilience).toHaveProperty('processingJobs');
    });

    it('should provide detailed resilience status', async () => {
      const status = await emailWorker.getResilienceStatus();

      expect(status).toHaveProperty('worker');
      expect(status).toHaveProperty('redis');
      expect(status).toHaveProperty('processing');
      expect(status).toHaveProperty('configuration');
      expect(status.configuration).toHaveProperty('gracefulShutdownTimeout');
      expect(status.configuration).toHaveProperty('reconnectBaseDelay');
    });
  });

  describe('Exactly-Once Processing', () => {
    it('should generate deterministic job IDs for deduplication', () => {
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date('2023-01-01T00:00:00Z'),
        orderId: 'test-order-id',
        orderNumber: 'ORD-123',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
      };

      // Access private method for testing
      const jobId1 = (emailEventPublisher as any).generateJobId(event);
      const jobId2 = (emailEventPublisher as any).generateJobId(event);

      // Same event should generate same job ID
      expect(jobId1).toBe(jobId2);
      expect(jobId1).toContain('ORDER_CONFIRMATION');
    });

    it('should generate different job IDs for different events', () => {
      const event1 = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date('2023-01-01T00:00:00Z'),
        orderId: 'test-order-1',
        orderNumber: 'ORD-123',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
      };

      const event2 = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date('2023-01-01T00:00:00Z'),
        orderId: 'test-order-2', // Different order ID
        orderNumber: 'ORD-124',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
      };

      const jobId1 = (emailEventPublisher as any).generateJobId(event1);
      const jobId2 = (emailEventPublisher as any).generateJobId(event2);

      // Different events should generate different job IDs
      expect(jobId1).not.toBe(jobId2);
    });
  });

  describe('Connection Error Handling', () => {
    it('should identify connection errors correctly', () => {
      const connectionError = new Error('Connection refused');
      const validationError = new Error('Invalid email address');

      // Access private method for testing
      const isConnectionError1 = (emailEventPublisher as any).isConnectionError(connectionError);
      const isConnectionError2 = (emailEventPublisher as any).isConnectionError(validationError);

      expect(isConnectionError1).toBe(true);
      expect(isConnectionError2).toBe(false);
    });

    it('should calculate reconnection delay with exponential backoff', () => {
      // Access private method for testing
      const delay1 = (emailEventPublisher as any).calculateReconnectDelay(1);
      const delay2 = (emailEventPublisher as any).calculateReconnectDelay(2);
      const delay3 = (emailEventPublisher as any).calculateReconnectDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);

      // Should be exponential: 1s, 2s, 4s, 8s, etc.
      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    it('should cap reconnection delay at maximum', () => {
      // Access private method for testing
      const maxDelay = (emailEventPublisher as any).reconnectMaxDelay;
      const delay = (emailEventPublisher as any).calculateReconnectDelay(10); // Very high attempt

      expect(delay).toBeLessThanOrEqual(maxDelay);
      expect(delay).toBe(maxDelay); // Should be capped at max
    });
  });

  describe('Error Classification', () => {
    it('should classify permanent errors correctly', () => {
      const permanentErrors = [
        new Error('Order not found'),
        new Error('User not found'),
        new Error('Invalid email address'),
        new Error('Validation failed'),
      ];

      const temporaryErrors = [
        new Error('Connection timeout'),
        new Error('Network error'),
        new Error('Redis connection failed'),
        new Error('Service unavailable'),
      ];

      permanentErrors.forEach(error => {
        const isPermanent = (emailWorker as any).isPermanentError(error);
        expect(isPermanent).toBe(true);
      });

      temporaryErrors.forEach(error => {
        const isPermanent = (emailWorker as any).isPermanentError(error);
        expect(isPermanent).toBe(false);
      });
    });
  });

  describe('Manual Reconnection', () => {
    it('should support manual reconnection trigger for publisher', async () => {
      const result = await emailEventPublisher.triggerReconnection();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should support manual reconnection trigger for worker', async () => {
      const result = await emailWorker.triggerReconnection();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    it('should prevent reconnection during shutdown', async () => {
      // Set shutdown flag
      (emailEventPublisher as any).isShuttingDown = true;

      const result = await emailEventPublisher.triggerReconnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('shutdown');
    });
  });
});