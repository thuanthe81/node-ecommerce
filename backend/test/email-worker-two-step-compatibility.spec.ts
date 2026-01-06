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
import { OrdersService } from '../src/orders/orders.service';
import { EmailEventType } from '../src/email-queue/types/email-event.types';
import { hasQuoteItems } from '@alacraft/shared';

/**
 * Tests for EmailWorker Two-Step Email Compatibility
 *
 * Tests Requirements:
 * - 9.1: Universal confirmation email without attachment for all orders
 * - 9.2: Automatic invoice email for priced orders (via PDF attachment)
 * - 9.3: Single confirmation email for quote orders
 * - 11.1: Confirmation emails always sent without attachments
 * - 11.2: Automatic invoice emails for priced orders
 * - 11.3: Admin-controlled invoice emails for quote orders
 */
describe('EmailWorker Two-Step Email Compatibility', () => {
  let emailWorker: EmailWorker;
  let emailAttachmentService: EmailAttachmentService;
  let emailTemplateService: EmailTemplateService;
  let emailService: EmailService;
  let ordersService: OrdersService;

  const mockPricedOrder = {
    id: 'order-123',
    orderNumber: 'ORD-123',
    email: 'customer@example.com',
    status: 'PENDING',
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
        price: 100, // Priced item
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

  const mockQuoteOrder = {
    ...mockPricedOrder,
    id: 'order-456',
    orderNumber: 'ORD-456',
    status: 'PENDING_QUOTE',
    items: [
      {
        ...mockPricedOrder.items[0],
        price: 0, // Quote item (no price set)
        total: 0,
      },
    ],
    subtotal: 0,
    total: 20, // Only shipping cost
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
              const config: Record<string, any> = {
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
          provide: OrdersService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
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
            sendInvoiceEmailWithPDF: jest.fn(),
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
    emailTemplateService = module.get<EmailTemplateService>(EmailTemplateService);
    emailService = module.get<EmailService>(EmailService);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  describe('Two-Step Email Flow - Quote Orders (Confirmation Only)', () => {
    it('should send confirmation email without PDF for quote orders', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockQuoteOrder);

      // Mock successful confirmation email template generation
      (emailTemplateService.getOrderConfirmationTemplate as jest.Mock).mockResolvedValue({
        subject: 'Order Confirmation - ORD-456',
        html: '<html><body>Order confirmed</body></html>',
        text: 'Order confirmed',
      });

      // Mock successful email sending
      (emailService.sendEmail as jest.Mock).mockResolvedValue(true);

      // Create order confirmation event
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-456',
        orderNumber: 'ORD-456',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Call the private method using type assertion
      await (emailWorker as any).sendOrderConfirmation(event);

      // Verify that confirmation email template was generated (without PDF)
      expect(emailTemplateService.getOrderConfirmationTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-456',
          orderNumber: 'ORD-456',
          customerEmail: 'customer@example.com',
        }),
        'en'
      );

      // Verify that the order contains quote items
      const orderData = {
        items: mockQuoteOrder.items.map(item => ({
          unitPrice: Number(item.price),
        })),
      };
      expect(hasQuoteItems(orderData)).toBe(true);

      // Verify that PDF attachment service was NOT called for quote order confirmation
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).not.toHaveBeenCalled();

      // Verify simple email service was called
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('Two-Step Email Flow - Priced Orders (Confirmation + PDF)', () => {
    it('should send order confirmation with PDF for priced orders automatically', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockPricedOrder);

      // Mock successful PDF email sending
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        deliveryStatus: 'sent',
        timestamp: new Date(),
      });

      // Create order confirmation event (for priced order, this will trigger PDF attachment)
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

      // Verify that EmailAttachmentService was called for priced order (with PDF)
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).toHaveBeenCalledWith(
        'customer@example.com',
        expect.objectContaining({
          orderId: 'order-123',
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

      // Verify OrdersService was called
      expect(ordersService.findOneById).toHaveBeenCalledWith('order-123');

      // Verify simple email service was NOT called (PDF service handles it)
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Legacy PDF Attachment Support (Backward Compatibility)', () => {
    it('should use EmailAttachmentService for legacy order confirmation resend emails', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockPricedOrder);

      // Mock successful PDF email sending
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        deliveryStatus: 'sent',
        timestamp: new Date(),
      });

      // Create order confirmation resend event (legacy behavior with PDF)
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
          orderId: 'order-123',
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
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle EmailAttachmentService failures gracefully for legacy resend emails', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockPricedOrder);

      // Mock PDF email sending failure
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: false,
        error: 'PDF generation failed',
        deliveryStatus: 'failed',
        timestamp: new Date(),
      });

      // Create order confirmation resend event
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION_RESEND,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Expect the method to throw an error
      await expect((emailWorker as any).sendOrderConfirmationResend(event))
        .rejects
        .toThrow('Failed to send order confirmation resend with PDF: PDF generation failed');
    });

    it('should handle missing orders gracefully', async () => {
      // Mock the OrdersService call to throw NotFoundException
      (ordersService.findOneById as jest.Mock).mockRejectedValue(new Error('Order not found: non-existent-order'));

      // Test confirmation email
      const confirmationEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'non-existent-order',
        orderNumber: 'ORD-404',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      await expect((emailWorker as any).sendOrderConfirmation(confirmationEvent))
        .rejects
        .toThrow('Order not found: non-existent-order');

      // Verify EmailAttachmentService was not called
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).not.toHaveBeenCalled();
    });

    it('should handle simple email failures gracefully for quote orders', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockQuoteOrder);

      // Mock successful confirmation email template generation
      (emailTemplateService.getOrderConfirmationTemplate as jest.Mock).mockResolvedValue({
        subject: 'Order Confirmation - ORD-456',
        html: '<html><body>Order confirmed</body></html>',
        text: 'Order confirmed',
      });

      // Mock email sending failure
      (emailService.sendEmail as jest.Mock).mockResolvedValue(false);

      // Create order confirmation event
      const event = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-456',
        orderNumber: 'ORD-456',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Expect the method to throw an error
      await expect((emailWorker as any).sendOrderConfirmation(event))
        .rejects
        .toThrow('Failed to send order confirmation email without PDF for quote order: ORD-456');
    });
  });

  describe('Quote Item Detection Consistency', () => {
    it('should correctly identify quote items across different order types', async () => {
      // Test priced order
      const pricedOrderData = {
        orderNumber: 'ORD-123',
        items: mockPricedOrder.items.map(item => ({
          unitPrice: Number(item.price),
          price: Number(item.price),
          total: Number(item.total),
        })),
      };
      expect(hasQuoteItems(pricedOrderData)).toBe(false);

      // Test quote order
      const quoteOrderData = {
        orderNumber: 'ORD-456',
        items: mockQuoteOrder.items.map(item => ({
          unitPrice: Number(item.price),
          price: Number(item.price),
          total: Number(item.total),
        })),
      };
      expect(hasQuoteItems(quoteOrderData)).toBe(true);

      // Test mixed order
      const mixedOrderData = {
        orderNumber: 'ORD-MIXED',
        items: [
          { unitPrice: 100, price: 100, total: 100 }, // Priced item
          { unitPrice: 0, price: 0, total: 0 },   // Quote item
        ],
      };
      expect(hasQuoteItems(mixedOrderData)).toBe(true);
    });
  });

  describe('Email Content Consistency', () => {
    it('should use consistent data mapping for different email flows', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockPricedOrder);

      // Mock successful PDF email sending
      (emailAttachmentService.sendOrderConfirmationWithPDF as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
        deliveryStatus: 'sent',
        timestamp: new Date(),
      });

      // Test order confirmation resend (legacy behavior)
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

      // Verify EmailAttachmentService was called with correct data structure
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).toHaveBeenCalledWith(
        'customer@example.com',
        expect.objectContaining({
          orderId: 'order-123',
          orderNumber: 'ORD-123',
          customerInfo: expect.objectContaining({
            name: 'John Doe',
            email: 'customer@example.com',
          }),
          pricing: expect.objectContaining({
            total: 220,
          }),
        }),
        'en'
      );
    });
  });
});