import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { EmailQueueConfigService } from '../src/email-queue/services/email-queue-config.service';
import { EmailEventType } from '../src/email-queue/types/email-event.types';

describe('EmailQueue', () => {
  let emailEventPublisher: EmailEventPublisher;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'REDIS_HOST') return 'localhost';
              if (key === 'REDIS_PORT') return 6379;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    emailEventPublisher = module.get<EmailEventPublisher>(EmailEventPublisher);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    // Clean up the queue connection
    await emailEventPublisher.onModuleDestroy();
  });

  describe('EmailEventPublisher', () => {
    it('should be defined', () => {
      expect(emailEventPublisher).toBeDefined();
    });

    it('should validate email event structure', async () => {
      const validEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'test-order-id',
        orderNumber: 'ORD-123',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
      };

      // This should not throw
      expect(() => {
        // Access private method for testing
        (emailEventPublisher as any).validateEvent(validEvent);
      }).not.toThrow();
    });

    it('should reject invalid email event type', () => {
      const invalidEvent = {
        type: 'INVALID_TYPE' as any,
        locale: 'en' as const,
        timestamp: new Date(),
      };

      expect(() => {
        (emailEventPublisher as any).validateEvent(invalidEvent);
      }).toThrow('Invalid email event type');
    });

    it('should reject invalid locale', () => {
      const invalidEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'invalid' as any,
        timestamp: new Date(),
      };

      expect(() => {
        (emailEventPublisher as any).validateEvent(invalidEvent);
      }).toThrow('Invalid locale');
    });

    it('should get correct priority for event types', () => {
      expect((emailEventPublisher as any).getEventPriority(EmailEventType.PASSWORD_RESET)).toBe(1);
      expect((emailEventPublisher as any).getEventPriority(EmailEventType.ORDER_CONFIRMATION)).toBe(2);
      expect((emailEventPublisher as any).getEventPriority(EmailEventType.CONTACT_FORM)).toBe(7);
    });
  });
});