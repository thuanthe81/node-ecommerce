import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailWorker } from '../src/email-queue/services/email-worker.service';
import { EmailQueueConfigService } from '../src/email-queue/services/email-queue-config.service';
import { EmailService } from '../src/notifications/services/email.service';
import { EmailTemplateService } from '../src/notifications/services/email-template.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { FooterSettingsService } from '../src/footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';
import { BusinessInfoService } from '../src/common/services/business-info.service';
import { EmailEventType } from '../src/email-queue/types/email-event.types';

describe('EmailWorker PDF Attachment Integration', () => {
  let emailWorker: EmailWorker;
  let emailAttachmentService: EmailAttachmentService;
  let prismaService: PrismaService;

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'ORD-123',
    email: 'customer@example.com',
    createdAt: new Date(),
    items: [
      {
        product: {
          id: 'product-1',
          nameEn: 'Test Product',
          nameVi: 'Sản phẩm thử nghiệm',
          descriptionEn: 'Test description',
          descriptionVi: 'Mô tả thử nghiệm',
          sku: 'TEST-001',
          images: [{ url: 'https://example.com/image.jpg' }],
          category: { nameEn: 'Test Category', nameVi: 'Danh mục thử nghiệm' },
        },
        quantity: 2,
        price: 100,
        total: 200,
      },
    ],
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'VN',
      phone: '+84123456789',
    },
    billingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'VN',
      phone: '+84123456789',
    },
    subtotal: 200,
    shippingCost: 20,
    taxAmount: 0,
    discountAmount: 0,
    total: 220,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    shippingMethod: 'standard',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailWorker,
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
              shutdownTimeout: 30000,
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
          },
        },
        {
          provide: PrismaService,
          useValue: {
            order: {
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
            getBusinessInfo: jest.fn().mockResolvedValue({
              companyName: 'Test Company',
              address: '123 Business St',
              phone: '+84123456789',
              email: 'info@testcompany.com',
            }),
          },
        },
      ],
    }).compile();

    emailWorker = module.get<EmailWorker>(EmailWorker);
    emailAttachmentService = module.get<EmailAttachmentService>(EmailAttachmentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('Order Confirmation with PDF', () => {
    it('should use EmailAttachmentService for order confirmation emails', async () => {
      // Mock the database call
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      // Mock successful PDF email sending
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        deliveryStatus: 'sent',
        timestamp: new Date(),
      });

      // Create order confirmation event
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Call the private method using type assertion
      await (emailWorker as any).sendOrderConfirmation(event);

      // Verify that EmailAttachmentService was called with correct parameters
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).toHaveBeenCalledWith(
        'customer@example.com',
        expect.objectContaining({
          orderNumber: 'ORD-123',
          customerInfo: expect.objectContaining({
            name: 'John Doe',
            email: 'customer@example.com',
          }),
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Test Product',
              quantity: 2,
              unitPrice: 100,
            }),
          ]),
          pricing: expect.objectContaining({
            subtotal: 200,
            total: 220,
          }),
        }),
        'en'
      );

      // Verify database was queried
      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  category: true,
                }
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });
    });

    it('should use EmailAttachmentService for order confirmation resend emails', async () => {
      // Mock the database call
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      // Mock successful PDF email sending
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        deliveryStatus: 'sent',
        timestamp: new Date(),
      });

      // Create order confirmation resend event
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION_RESEND,
        locale: 'vi' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Call the private method using type assertion
      await (emailWorker as any).sendOrderConfirmationResend(event);

      // Verify that EmailAttachmentService was called with correct parameters
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).toHaveBeenCalledWith(
        'customer@example.com',
        expect.objectContaining({
          orderNumber: 'ORD-123',
          customerInfo: expect.objectContaining({
            name: 'John Doe',
            email: 'customer@example.com',
          }),
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Sản phẩm thử nghiệm', // Vietnamese name should be used
              quantity: 2,
              unitPrice: 100,
            }),
          ]),
          pricing: expect.objectContaining({
            subtotal: 200,
            total: 220,
          }),
          locale: 'vi',
        }),
        'vi'
      );
    });

    it('should handle EmailAttachmentService failures gracefully', async () => {
      // Mock the database call
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      // Mock PDF email sending failure
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: false,
        error: 'PDF generation failed',
        deliveryStatus: 'failed',
        timestamp: new Date(),
      });

      // Create order confirmation event
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Expect the method to throw an error
      await expect((emailWorker as any).sendOrderConfirmation(event))
        .rejects
        .toThrow('Failed to send order confirmation with PDF: PDF generation failed');
    });

    it('should handle missing orders gracefully', async () => {
      // Mock the database call to return null (order not found)
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(null);

      // Create order confirmation event
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'non-existent-order',
        orderNumber: 'ORD-404',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Expect the method to throw an error
      await expect((emailWorker as any).sendOrderConfirmation(event))
        .rejects
        .toThrow('Order not found: non-existent-order');

      // Verify EmailAttachmentService was not called
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).not.toHaveBeenCalled();
    });
  });

  describe('Email Content Consistency', () => {
    it('should use the same data mapping for both order confirmation and resend', async () => {
      // Mock the database call
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      // Mock successful PDF email sending
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        deliveryStatus: 'sent',
        timestamp: new Date(),
      });

      // Test order confirmation
      const confirmationEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      await (emailWorker as any).sendOrderConfirmation(confirmationEvent);

      // Test order confirmation resend
      const resendEvent = {
        type: EmailEventType.ORDER_CONFIRMATION_RESEND,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      await (emailWorker as any).sendOrderConfirmationResend(resendEvent);

      // Verify both calls used the same EmailAttachmentService method
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).toHaveBeenCalledTimes(2);

      // Verify both calls had similar data structure
      const calls = (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mock.calls;
      const [firstCall, secondCall] = calls;

      // Both should have the same email
      expect(firstCall[0]).toBe(secondCall[0]);

      // Both should have similar order data structure
      expect(firstCall[1].orderNumber).toBe(secondCall[1].orderNumber);
      expect(firstCall[1].customerInfo.email).toBe(secondCall[1].customerInfo.email);
      expect(firstCall[1].pricing.total).toBe(secondCall[1].pricing.total);

      // Both should use the same locale
      expect(firstCall[2]).toBe(secondCall[2]);
    });
  });
});