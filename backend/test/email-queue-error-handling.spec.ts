import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailWorker } from '../src/email-queue/services/email-worker.service';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { EmailQueueConfigService } from '../src/email-queue/services/email-queue-config.service';
import { EmailService } from '../src/notifications/services/email.service';
import { EmailTemplateService } from '../src/notifications/services/email-template.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { FooterSettingsService } from '../src/footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';
import { BusinessInfoService } from '../src/common/services/business-info.service';
import { EmailEventType } from '../src/email-queue/types/email-event.types';

describe('EmailQueue Error Handling', () => {
  let emailWorker: EmailWorker;
  let emailEventPublisher: EmailEventPublisher;
  let prismaService: PrismaService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailWorker,
        EmailEventPublisher,
        {
          provide: EmailQueueConfigService,
          useValue: {
            getRedisConfig: jest.fn(() => ({
              host: 'localhost',
              port: 6379,
            })),
            getQueueConfig: jest.fn(() => ({
              maxAttempts: 5,
              initialDelay: 60000,
              completedRetentionAge: 86400,
              completedRetentionCount: 1000,
              failedRetentionAge: 604800,
              failedRetentionCount: 500,
            })),
            getResilienceConfig: jest.fn(() => ({
              maxReconnectAttempts: 10,
              reconnectBaseDelay: 1000,
              reconnectMaxDelay: 30000,
            })),
            getWorkerConfig: jest.fn(() => ({
              concurrency: 5,
              rateLimitMax: 100,
              rateLimitDuration: 60000,
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: '6379',
                EMAIL_WORKER_CONCURRENCY: '5',
                EMAIL_RATE_LIMIT_MAX: '100',
                EMAIL_RATE_LIMIT_DURATION: '60000',
                EMAIL_QUEUE_MAX_ATTEMPTS: '5',
                EMAIL_QUEUE_INITIAL_DELAY: '60000',
                EMAIL_QUEUE_COMPLETED_RETENTION_AGE: '86400000',
                EMAIL_QUEUE_COMPLETED_RETENTION_COUNT: '1000',
                EMAIL_QUEUE_FAILED_RETENTION_AGE: '604800000',
                EMAIL_QUEUE_FAILED_RETENTION_COUNT: '500',
                EMAIL_QUEUE_MAX_RECONNECT_ATTEMPTS: '10',
                EMAIL_QUEUE_RECONNECT_BASE_DELAY: '1000',
                EMAIL_QUEUE_RECONNECT_MAX_DELAY: '30000',
                EMAIL_QUEUE_SHUTDOWN_TIMEOUT: '30000',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: EmailTemplateService,
          useValue: {
            getOrderConfirmationTemplate: jest.fn(),
            getAdminOrderNotificationTemplate: jest.fn(),
            getShippingNotificationTemplate: jest.fn(),
            getOrderStatusUpdateTemplate: jest.fn(),
            getWelcomeEmailTemplate: jest.fn(),
            getPasswordResetTemplate: jest.fn(),
            getContactFormTemplate: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            order: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: FooterSettingsService,
          useValue: {
            getFooterSettings: jest.fn(),
          },
        },
        {
          provide: EmailAttachmentService,
          useValue: {
            sendOrderConfirmationWithPDF: jest.fn(),
          },
        },
        {
          provide: BusinessInfoService,
          useValue: {
            getBusinessInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    emailWorker = module.get<EmailWorker>(EmailWorker);
    emailEventPublisher = module.get<EmailEventPublisher>(EmailEventPublisher);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  describe('Error Classification', () => {
    it('should classify database errors as permanent', () => {
      const error = new Error('Order not found: 123');
      const isPermanent = (emailWorker as any).isPermanentError(error);
      expect(isPermanent).toBe(true);
    });

    it('should classify validation errors as permanent', () => {
      const error = new Error('Invalid email address format');
      const isPermanent = (emailWorker as any).isPermanentError(error);
      expect(isPermanent).toBe(true);
    });

    it('should classify network errors as temporary', () => {
      const error = new Error('Connection timeout');
      const isPermanent = (emailWorker as any).isPermanentError(error);
      expect(isPermanent).toBe(false);
    });

    it('should classify SMTP permanent errors correctly', () => {
      const error = new Error('SMTP error: 5.1.1 User unknown');
      const isPermanent = (emailWorker as any).isPermanentError(error);
      expect(isPermanent).toBe(true);
    });

    it('should default unknown errors to temporary', () => {
      const error = new Error('Some unknown error');
      const isPermanent = (emailWorker as any).isPermanentError(error);
      expect(isPermanent).toBe(false);
    });
  });

  describe('Error Analysis', () => {
    it('should analyze database errors correctly', () => {
      const error = new Error('User not found: 456');
      const analysis = (emailWorker as any).analyzeError(error);

      expect(analysis.category).toBe('database');
      expect(analysis.severity).toBe('high');
      expect(analysis.retryable).toBe(false);
      expect(analysis.actionRequired).toContain('data integrity');
    });

    it('should analyze email service errors correctly', () => {
      const error = new Error('Email service returned false');
      const analysis = (emailWorker as any).analyzeError(error);

      expect(analysis.category).toBe('email_service');
      expect(analysis.severity).toBe('medium');
    });

    it('should analyze validation errors correctly', () => {
      const error = new Error('validation failed for user input');
      const analysis = (emailWorker as any).analyzeError(error);

      expect(analysis.category).toBe('validation');
      expect(analysis.severity).toBe('high');
      expect(analysis.retryable).toBe(false);
    });
  });

  describe('Retry Delay Calculation', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay1 = (emailWorker as any).calculateNextRetryDelay(1);
      const delay2 = (emailWorker as any).calculateNextRetryDelay(2);
      const delay3 = (emailWorker as any).calculateNextRetryDelay(3);

      expect(delay1).toBe(60000); // 1 minute
      expect(delay2).toBe(300000); // 5 minutes
      expect(delay3).toBe(1500000); // 25 minutes
    });

    it('should cap delay at maximum', () => {
      const delay = (emailWorker as any).calculateNextRetryDelay(10);
      const maxDelay = 4 * 60 * 60 * 1000; // 4 hours

      expect(delay).toBe(maxDelay);
    });
  });

  describe('Event Validation', () => {
    it('should validate event structure correctly', () => {
      const validEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: '123',
        orderNumber: 'ORD-001',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
      };

      expect(() => {
        (emailWorker as any).validateEventStructure(validEvent);
      }).not.toThrow();
    });

    it('should reject invalid event type', () => {
      const invalidEvent = {
        type: 'INVALID_TYPE',
        locale: 'en',
        timestamp: new Date(),
      };

      expect(() => {
        (emailWorker as any).validateEventStructure(invalidEvent);
      }).toThrow('Invalid event type');
    });

    it('should reject invalid locale', () => {
      const invalidEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'fr',
        timestamp: new Date(),
      };

      expect(() => {
        (emailWorker as any).validateEventStructure(invalidEvent);
      }).toThrow('Invalid locale');
    });
  });

  describe('Worker Health', () => {
    it('should return not_initialized when worker is not set', async () => {
      const health = await emailWorker.getWorkerHealth();

      expect(health.status).toBe('not_initialized');
      expect(health.isRunning).toBe(false);
      expect(health.connection).toBe('disconnected');
    });
  });

  describe('Event Publisher Validation', () => {
    it('should validate order confirmation events', () => {
      const validEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: '123',
        orderNumber: 'ORD-001',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
      };

      expect(() => {
        (emailEventPublisher as any).validateEvent(validEvent);
      }).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      const invalidEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: '123',
        orderNumber: 'ORD-001',
        customerEmail: 'invalid-email',
        customerName: 'Test User',
      };

      expect(() => {
        (emailEventPublisher as any).validateEvent(invalidEvent);
      }).toThrow('valid customerEmail');
    });

    it('should validate email addresses correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        '',
        null,
        undefined,
      ];

      validEmails.forEach(email => {
        expect((emailEventPublisher as any).isValidEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect((emailEventPublisher as any).isValidEmail(email)).toBe(false);
      });
    });
  });
});