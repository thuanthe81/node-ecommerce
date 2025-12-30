import { Test, TestingModule } from '@nestjs/testing';
import { OrderCancellationService } from '../src/orders/services/order-cancellation.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AccessControlService } from '../src/orders/services/access-control.service';
import { EmailEventPublisher } from '../src/email-queue/services/email-event-publisher.service';
import { ErrorHandlingService } from '../src/common/services/error-handling.service';
import { OrderStatus, UserRole } from '@prisma/client';

describe('Order Cancellation UserId Preservation', () => {
  let service: OrderCancellationService;
  let prismaService: PrismaService;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-123456',
    userId: 'user-123',
    email: 'test@example.com',
    status: OrderStatus.PENDING,
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 1,
        price: 100,
      },
    ],
    shippingAddress: { fullName: 'Test User' },
    billingAddress: { fullName: 'Test User' },
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    product: {
      update: jest.fn(),
    },
  };

  const mockAccessControlService = {
    validateOrderAccess: jest.fn(),
    canCancelOrder: jest.fn(),
  };

  const mockEmailEventPublisher = {
    sendOrderCancellation: jest.fn().mockResolvedValue('job-id-1'),
    sendAdminCancellationNotification: jest.fn().mockResolvedValue('job-id-2'),
  };

  const mockErrorHandlingService = {
    handleEmailServiceFailure: jest.fn(),
    logError: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCancellationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AccessControlService,
          useValue: mockAccessControlService,
        },
        {
          provide: EmailEventPublisher,
          useValue: mockEmailEventPublisher,
        },
        {
          provide: ErrorHandlingService,
          useValue: mockErrorHandlingService,
        },
      ],
    }).compile();

    service = module.get<OrderCancellationService>(OrderCancellationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cancelOrder', () => {
    it('should preserve userId when cancelling an order', async () => {
      // Setup
      const context = {
        userId: 'user-123',
        userRole: UserRole.CUSTOMER,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      mockAccessControlService.validateOrderAccess.mockResolvedValue(true);
      mockAccessControlService.canCancelOrder.mockResolvedValue(true);
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      // Mock the transaction
      const mockTransactionUpdate = jest.fn().mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Customer request',
        cancelledBy: 'user-123',
      });

      const mockTransactionProductUpdate = jest.fn().mockResolvedValue({});

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            update: mockTransactionUpdate,
          },
          product: {
            update: mockTransactionProductUpdate,
          },
        };
        return callback(mockTx);
      });

      // Execute
      const result = await service.cancelOrder('order-1', context, 'Customer request');

      // Verify that the order update was called with cancellation data but preserved userId
      expect(mockTransactionUpdate).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: expect.any(Date),
          cancellationReason: 'Customer request',
          cancelledBy: 'user-123',
        },
        include: expect.any(Object),
      });

      // Verify userId was not modified in the update data
      const updateCall = mockTransactionUpdate.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('userId');
      expect(updateCall.data.cancelledBy).toBe('user-123'); // This is different from userId - it's who cancelled it

      // Verify the operation was successful
      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled successfully');
    });

    it('should preserve userId when cancelling an order as admin', async () => {
      // Setup
      const context = {
        userId: 'admin-123',
        userRole: UserRole.ADMIN,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      mockAccessControlService.validateOrderAccess.mockResolvedValue(true);
      mockAccessControlService.canCancelOrder.mockResolvedValue(true);
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      // Mock the transaction
      const mockTransactionUpdate = jest.fn().mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Admin cancellation',
        cancelledBy: 'admin-123',
      });

      const mockTransactionProductUpdate = jest.fn().mockResolvedValue({});

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            update: mockTransactionUpdate,
          },
          product: {
            update: mockTransactionProductUpdate,
          },
        };
        return callback(mockTx);
      });

      // Execute
      const result = await service.cancelOrder('order-1', context, 'Admin cancellation');

      // Verify that the order update preserved the original userId
      expect(mockTransactionUpdate).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: expect.any(Date),
          cancellationReason: 'Admin cancellation',
          cancelledBy: 'admin-123', // Admin who cancelled it
        },
        include: expect.any(Object),
      });

      // Verify userId was not modified in the update data
      const updateCall = mockTransactionUpdate.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('userId');

      // The order should still belong to the original user (user-123)
      // The cancelledBy field tracks who performed the cancellation (admin-123)
      expect(updateCall.data.cancelledBy).toBe('admin-123');

      // Verify the operation was successful
      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled successfully');
    });
  });
});