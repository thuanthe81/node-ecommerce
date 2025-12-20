import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { EmailQueueConfigService } from '../src/email-queue/services/email-queue-config.service';
import { EmailOptions, EmailAttachmentOptions } from '../src/notifications/services/email.service';

describe('EmailEventPublisher Backward Compatibility', () => {
  let emailEventPublisher: EmailEventPublisher;
  let mockQueue: any;

  beforeEach(async () => {
    // Mock BullMQ Queue
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

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
              const config: Record<string, any> = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    emailEventPublisher = module.get<EmailEventPublisher>(EmailEventPublisher);

    // Replace the queue with our mock
    (emailEventPublisher as any).emailQueue = mockQueue;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail (backward compatibility)', () => {
    it('should accept EmailOptions interface and return true', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        locale: 'en',
      };

      const result = await emailEventPublisher.sendEmail(emailOptions);

      expect(result).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'CONTACT_FORM',
        expect.objectContaining({
          type: 'CONTACT_FORM',
          locale: 'en',
          senderEmail: 'test@example.com',
          message: expect.stringContaining('Test Subject'),
        }),
        expect.any(Object)
      );
    });

    it('should handle missing locale by defaulting to en', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      };

      const result = await emailEventPublisher.sendEmail(emailOptions);

      expect(result).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'CONTACT_FORM',
        expect.objectContaining({
          locale: 'en',
        }),
        expect.any(Object)
      );
    });

    it('should return false on error', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue error'));

      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      };

      const result = await emailEventPublisher.sendEmail(emailOptions);

      expect(result).toBe(false);
    });
  });

  describe('sendEmailWithAttachment (backward compatibility)', () => {
    it('should accept EmailAttachmentOptions interface and return true', async () => {
      const emailOptions: EmailAttachmentOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        locale: 'vi',
        attachments: [
          {
            filename: 'test.pdf',
            path: '/path/to/test.pdf',
            contentType: 'application/pdf',
          },
        ],
      };

      const result = await emailEventPublisher.sendEmailWithAttachment(emailOptions);

      expect(result).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'CONTACT_FORM',
        expect.objectContaining({
          type: 'CONTACT_FORM',
          locale: 'vi',
          message: expect.stringContaining('1 attachment(s) were requested'),
        }),
        expect.any(Object)
      );
    });

    it('should return false on error', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue error'));

      const emailOptions: EmailAttachmentOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        attachments: [],
      };

      const result = await emailEventPublisher.sendEmailWithAttachment(emailOptions);

      expect(result).toBe(false);
    });
  });

  describe('specific email event methods', () => {
    it('should send order confirmation email', async () => {
      const jobId = await emailEventPublisher.sendOrderConfirmation(
        'order-123',
        'ORD-001',
        'customer@example.com',
        'John Doe',
        'en'
      );

      expect(jobId).toBe('test-job-id');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'ORDER_CONFIRMATION',
        expect.objectContaining({
          type: 'ORDER_CONFIRMATION',
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          customerEmail: 'customer@example.com',
          customerName: 'John Doe',
          locale: 'en',
        }),
        expect.any(Object)
      );
    });

    it('should send welcome email', async () => {
      const jobId = await emailEventPublisher.sendWelcomeEmail(
        'user-123',
        'user@example.com',
        'Jane Doe',
        'vi'
      );

      expect(jobId).toBe('test-job-id');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'WELCOME_EMAIL',
        expect.objectContaining({
          type: 'WELCOME_EMAIL',
          userId: 'user-123',
          userEmail: 'user@example.com',
          userName: 'Jane Doe',
          locale: 'vi',
        }),
        expect.any(Object)
      );
    });

    it('should send password reset email', async () => {
      const jobId = await emailEventPublisher.sendPasswordReset(
        'user-123',
        'user@example.com',
        'reset-token-456',
        'en'
      );

      expect(jobId).toBe('test-job-id');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'PASSWORD_RESET',
        expect.objectContaining({
          type: 'PASSWORD_RESET',
          userId: 'user-123',
          userEmail: 'user@example.com',
          resetToken: 'reset-token-456',
          locale: 'en',
        }),
        expect.any(Object)
      );
    });

    it('should send contact form email', async () => {
      const jobId = await emailEventPublisher.sendContactForm(
        'John Sender',
        'sender@example.com',
        'This is a test message',
        'en'
      );

      expect(jobId).toBe('test-job-id');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'CONTACT_FORM',
        expect.objectContaining({
          type: 'CONTACT_FORM',
          senderName: 'John Sender',
          senderEmail: 'sender@example.com',
          message: 'This is a test message',
          locale: 'en',
        }),
        expect.any(Object)
      );
    });
  });

  describe('HTML text extraction', () => {
    it('should extract plain text from HTML', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Hello <strong>world</strong>!</p><br><div>More content</div>',
      };

      await emailEventPublisher.sendEmail(emailOptions);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'CONTACT_FORM',
        expect.objectContaining({
          message: expect.stringContaining('Hello world!'),
        }),
        expect.any(Object)
      );
    });

    it('should handle HTML entities', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test &amp; Subject',
        html: '<p>&lt;Hello&gt; &quot;world&quot; &amp; &#39;test&#39;</p>',
      };

      await emailEventPublisher.sendEmail(emailOptions);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'CONTACT_FORM',
        expect.objectContaining({
          message: expect.stringContaining('<Hello> "world" & \'test\''),
        }),
        expect.any(Object)
      );
    });
  });
});