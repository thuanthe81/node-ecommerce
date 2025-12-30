import { Test, TestingModule } from '@nestjs/testing';
import { OrderCancellationService } from '../../src/orders/services/order-cancellation.service';
import { AccessControlService } from '../../src/orders/services/access-control.service';
import { EmailEventPublisher } from '../../src/email-queue/services/email-event-publisher.service';
import { ErrorHandlingService } from '../../src/common/services/error-handling.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';

describe('OrderCancellationService', () => {
  let service: OrderCancellationService;
  let prismaService: PrismaService;
  let accessControlService: AccessControlService;
  let emailEventPublisher: EmailEventPublisher;
  let errorHandlingService: ErrorHandlingService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      $transaction: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
  };

  const mockAccessControlService = {
    validateOrderAccess: jest.fn(),
    canCancelOrder: jest.fn(),
  };

  const mockEmailEventPublisher = {
    sendOrderCancellation: jest.fn(),
    sendAdminCancellationNotification: jest.fn(),
  };

  const mockErrorHandlingService = {
    handleEmailServiceFailure: jest.fn(),
    logError: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCancellationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AccessControlService, useValue: mockAccessControlService },
        { provide: EmailEventPublisher, useValue: mockEmailEventPublisher },
        { provide: ErrorHandlingService, useValue: mockErrorHandlingService },
      ],
    }).compile();

    service = module.get<OrderCancellationService>(OrderCancellationService);
    prismaService = module.get<PrismaService>(PrismaService);
    accessControlService = module.get<AccessControlService>(AccessControlService);
    emailEventPublisher = module.get<EmailEventPublisher>(EmailEventPublisher);
    errorHandlingService = module.get<ErrorHandlingService>(ErrorHandlingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isOrderCancellable', () => {
    it('should return true for PENDING orders', () => {
      const order = { status: CONSTANTS.STATUS.ORDER_STATUS.PENDING };
      expect(service.isOrderCancellable(order)).toBe(true);
    });

    it('should return true for PROCESSING orders', () => {
      const order = { status: CONSTANTS.STATUS.ORDER_STATUS.PROCESSING };
      expect(service.isOrderCancellable(order)).toBe(true);
    });

    it('should return false for SHIPPED orders', () => {
      const order = { status: CONSTANTS.STATUS.ORDER_STATUS.SHIPPED };
      expect(service.isOrderCancellable(order)).toBe(false);
    });

    it('should return false for DELIVERED orders', () => {
      const order = { status: CONSTANTS.STATUS.ORDER_STATUS.DELIVERED };
      expect(service.isOrderCancellable(order)).toBe(false);
    });

    it('should return false for CANCELLED orders', () => {
      const order = { status: CONSTANTS.STATUS.ORDER_STATUS.CANCELLED };
      expect(service.isOrderCancellable(order)).toBe(false);
    });

    it('should return false for REFUNDED orders', () => {
      const order = { status: CONSTANTS.STATUS.ORDER_STATUS.REFUNDED };
      expect(service.isOrderCancellable(order)).toBe(false);
    });
  });

  describe('sendCancellationNotifications', () => {
    it('should send both customer and admin notifications', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-123',
        email: 'customer@example.com',
        shippingAddress: { fullName: 'John Doe' },
        cancellationReason: 'Customer request',
      };

      mockEmailEventPublisher.sendOrderCancellation.mockResolvedValue('job-1');
      mockEmailEventPublisher.sendAdminCancellationNotification.mockResolvedValue('job-2');

      await service.sendCancellationNotifications(mockOrder);

      expect(mockEmailEventPublisher.sendOrderCancellation).toHaveBeenCalledWith(
        'order-1',
        'ORD-123',
        'customer@example.com',
        'John Doe',
        'en',
        'Customer request'
      );

      expect(mockEmailEventPublisher.sendAdminCancellationNotification).toHaveBeenCalledWith(
        'order-1',
        'ORD-123',
        'en',
        'Customer request'
      );
    });

    it('should handle missing customer name gracefully', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-123',
        email: 'customer@example.com',
        shippingAddress: null,
        cancellationReason: null,
      };

      mockEmailEventPublisher.sendOrderCancellation.mockResolvedValue('job-1');
      mockEmailEventPublisher.sendAdminCancellationNotification.mockResolvedValue('job-2');

      await service.sendCancellationNotifications(mockOrder);

      expect(mockEmailEventPublisher.sendOrderCancellation).toHaveBeenCalledWith(
        'order-1',
        'ORD-123',
        'customer@example.com',
        'customer@example.com', // Falls back to email
        'en',
        null
      );
    });
  });
});