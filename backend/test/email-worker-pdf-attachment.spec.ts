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

describe('EmailWorker Two-Step Email Integration', () => {
  let emailWorker: EmailWorker;
  let emailAttachmentService: EmailAttachmentService;
  let emailTemplateService: EmailTemplateService;
  let emailService: EmailService;
  let ordersService: OrdersService;

  const mockPricedOrder = {
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

  describe('Two-Step Email Workflow - Order Confirmation', () => {
    it('should send confirmation email without PDF for priced orders', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue({
        ...mockPricedOrder,
        status: 'PENDING' // Add status to prevent undefined warning
      });

      // Mock successful confirmation email template generation
      (emailTemplateService.getOrderConfirmationTemplate as jest.Mock).mockResolvedValue({
        subject: 'Order Confirmation - ORD-123',
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
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Call the private method using type assertion
      await (emailWorker as any).sendOrderConfirmation(event);

      // Verify that confirmation email template was generated (without PDF)
      expect(emailTemplateService.getOrderConfirmationTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'ORD-123',
          customerName: 'John Doe',
        }),
        'en'
      );

      // Verify OrdersService was called
      expect(ordersService.findOneById).toHaveBeenCalledWith('order-123');

      // Verify that PDF attachment service was NOT called for confirmation
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).not.toHaveBeenCalled();
    });

    it('should send confirmation email without PDF for quote orders', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue({
        ...mockQuoteOrder,
        status: 'PENDING_QUOTE' // Add status to prevent undefined warning
      });

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
          orderNumber: 'ORD-456',
          customerName: 'John Doe',
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
    });
  });

  describe('Two-Step Email Workflow - Automatic Invoice for Priced Orders', () => {
    it('should send order confirmation with PDF for priced orders automatically', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue({
        ...mockPricedOrder,
        status: 'PENDING' // Add status to prevent undefined warning
      });

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

    it('should handle EmailAttachmentService failures gracefully for invoice emails', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockPricedOrder);

      // Mock PDF invoice email sending failure
      (emailAttachmentService.sendInvoiceEmailWithPDF as jest.Mock).mockResolvedValue({
        success: false,
        error: 'PDF generation failed',
        deliveryStatus: 'failed',
        timestamp: new Date(),
      });

      // Create invoice email event
      const event = {
        type: EmailEventType.INVOICE_EMAIL,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Expect the method to throw an error
      await expect((emailWorker as any).sendInvoiceEmail(event))
        .rejects
        .toThrow('Failed to send invoice email with PDF: PDF generation failed');
    });

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
        .toThrow('Failed to send order confirmation with PDF: PDF generation failed');
    });

    it('should handle missing orders gracefully for all email types', async () => {
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

      // Test invoice email
      const invoiceEvent = {
        type: EmailEventType.INVOICE_EMAIL,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'non-existent-order',
        orderNumber: 'ORD-404',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      await expect((emailWorker as any).sendInvoiceEmail(invoiceEvent))
        .rejects
        .toThrow('Order not found: non-existent-order');

      // Verify EmailAttachmentService was not called
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).not.toHaveBeenCalled();
      expect(emailAttachmentService.sendInvoiceEmailWithPDF).not.toHaveBeenCalled();
    });
  });

  describe('Two-Step Email Content Consistency', () => {
    it('should use consistent data mapping for confirmation and invoice emails', async () => {
      // Mock the OrdersService call
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockPricedOrder);

      // Mock successful email template generation
      (emailTemplateService.getOrderConfirmationTemplate as jest.Mock).mockResolvedValue({
        subject: 'Order Confirmation - ORD-123',
        html: '<html><body>Order confirmed</body></html>',
        text: 'Order confirmed',
      });

      // Mock successful PDF invoice email sending
      (emailAttachmentService.sendInvoiceEmailWithPDF as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-invoice-message-id',
        deliveryStatus: 'sent',
        timestamp: new Date(),
      });

      // Test order confirmation (without PDF)
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

      // Test invoice email (with PDF)
      const invoiceEvent = {
        type: EmailEventType.INVOICE_EMAIL,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-123',
        orderNumber: 'ORD-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      await (emailWorker as any).sendInvoiceEmail(invoiceEvent);

      // Verify both used the same order data
      expect(ordersService.findOneById).toHaveBeenCalledTimes(2);
      expect(ordersService.findOneById).toHaveBeenCalledWith('order-123');

      // Verify confirmation email used template service
      expect(emailTemplateService.getOrderConfirmationTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: 'ORD-123',
          customerName: 'John Doe',
        }),
        'en'
      );

      // Verify invoice email used attachment service
      expect(emailAttachmentService.sendInvoiceEmailWithPDF).toHaveBeenCalledWith(
        'ORD-123',
        'customer@example.com',
        'en'
      );
    });

    it('should handle quote item detection consistently across email types', async () => {
      // Test with quote order
      (ordersService.findOneById as jest.Mock).mockResolvedValue(mockQuoteOrder);

      // Mock successful confirmation email template generation
      (emailTemplateService.getOrderConfirmationTemplate as jest.Mock).mockResolvedValue({
        subject: 'Order Confirmation - ORD-456',
        html: '<html><body>Order confirmed</body></html>',
        text: 'Order confirmed',
      });

      // Test confirmation email for quote order
      const confirmationEvent = {
        type: EmailEventType.ORDER_CONFIRMATION,
        locale: 'en' as const,
        timestamp: new Date(),
        orderId: 'order-456',
        orderNumber: 'ORD-456',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      await (emailWorker as any).sendOrderConfirmation(confirmationEvent);

      // Verify confirmation email was sent (without PDF)
      expect(emailTemplateService.getOrderConfirmationTemplate).toHaveBeenCalled();

      // Verify that quote item detection works consistently
      const orderData = {
        items: mockQuoteOrder.items.map(item => ({
          unitPrice: Number(item.price),
        })),
      };
      expect(hasQuoteItems(orderData)).toBe(true);

      // Verify no PDF attachment service was called for quote order
      expect(emailAttachmentService.sendOrderConfirmationWithPDF).not.toHaveBeenCalled();
      expect(emailAttachmentService.sendInvoiceEmailWithPDF).not.toHaveBeenCalled();
    });
  });

  describe('Email Content Consistency', () => {
    it('should use the same data mapping for both order confirmation and resend', async () => {
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
          orderNumber: 'ORD-123',
          customerInfo: expect.objectContaining({
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