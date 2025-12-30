import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../src/orders/orders.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AccessControlService } from '../src/orders/services/access-control.service';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { FooterSettingsService } from '../src/footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../src/pdf-generator/services/email-attachment.service';
import { ResendEmailHandlerService } from '../src/pdf-generator/services/resend-email-handler.service';
import { BusinessInfoService } from '../src/common/services/business-info.service';
import { ShippingService } from '../src/shipping/shipping.service';
import { TranslationService } from '../src/common/services/translation.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('Order UserId Preservation', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-123456',
    userId: 'user-123',
    email: 'test@example.com',
    status: OrderStatus.PENDING,
    subtotal: 100,
    shippingCost: 10,
    taxAmount: 11,
    discountAmount: 0,
    total: 121,
    requiresPricing: false,
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 1,
        price: 100,
        total: 100,
      },
    ],
    shippingAddress: { fullName: 'Test User' },
    billingAddress: { fullName: 'Test User' },
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      update: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailEventPublisher = {
    sendShippingNotification: jest.fn().mockResolvedValue('job-id'),
    sendOrderStatusUpdate: jest.fn().mockResolvedValue('job-id'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AccessControlService,
          useValue: {},
        },
        {
          provide: EmailEventPublisher,
          useValue: mockEmailEventPublisher,
        },
        {
          provide: FooterSettingsService,
          useValue: {},
        },
        {
          provide: EmailAttachmentService,
          useValue: {},
        },
        {
          provide: ResendEmailHandlerService,
          useValue: {},
        },
        {
          provide: BusinessInfoService,
          useValue: {},
        },
        {
          provide: ShippingService,
          useValue: {},
        },
        {
          provide: TranslationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('should preserve userId when updating order status', async () => {
      // Setup
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });

      // Execute
      await service.updateStatus('order-1', { status: OrderStatus.PROCESSING });

      // Verify that update was called without modifying userId
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: OrderStatus.PROCESSING,
        },
        include: expect.any(Object),
      });

      // Verify userId was not included in the update data
      const updateCall = mockPrismaService.order.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('userId');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should preserve userId when updating payment status', async () => {
      // Setup
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      });

      // Execute
      await service.updatePaymentStatus('order-1', { paymentStatus: PaymentStatus.PAID });

      // Verify that update was called without modifying userId
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
        include: expect.any(Object),
      });

      // Verify userId was not included in the update data
      const updateCall = mockPrismaService.order.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('userId');
    });
  });

  describe('setOrderItemPrice', () => {
    it('should preserve userId when updating order item prices', async () => {
      // Setup
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.orderItem.update.mockResolvedValue({
        ...mockOrder.items[0],
        price: 150,
        total: 150,
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        subtotal: 150,
        total: 176.5,
      });
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-1',
        price: 100,
      });

      // Execute
      await service.setOrderItemPrice('order-1', 'item-1', { price: 150 });

      // Verify that order update was called without modifying userId
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          subtotal: expect.any(Number),
          taxAmount: expect.any(Number),
          total: expect.any(Number),
          status: expect.any(String),
          requiresPricing: expect.any(Boolean),
        },
        include: expect.any(Object),
      });

      // Verify userId was not included in the update data
      const updateCall = mockPrismaService.order.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('userId');
    });
  });

  describe('recalculateOrderTotal', () => {
    it('should preserve userId when recalculating order totals', async () => {
      // Setup
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        subtotal: 150,
        total: 176.5,
      });

      // Execute
      await service.recalculateOrderTotal('order-1');

      // Verify that update was called without modifying userId
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          subtotal: expect.any(Number),
          taxAmount: expect.any(Number),
          total: expect.any(Number),
          status: expect.any(String),
          requiresPricing: expect.any(Boolean),
        },
        include: expect.any(Object),
      });

      // Verify userId was not included in the update data
      const updateCall = mockPrismaService.order.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('userId');
    });
  });
});