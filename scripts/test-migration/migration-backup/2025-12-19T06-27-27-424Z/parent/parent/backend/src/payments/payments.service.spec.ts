import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-123456',
    userId: 'user-1',
    email: 'test@example.com',
    status: OrderStatus.PROCESSING,
    subtotal: 100.0,
    shippingCost: 10.0,
    taxAmount: 11.0,
    discountAmount: 0,
    total: 121.0,
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    shippingMethod: 'standard',
    paymentMethod: 'credit_card',
    paymentStatus: PaymentStatus.PAID,
    paymentIntentId: 'pi_123',
    promotionId: null,
    trackingNumber: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderItem = {
    id: 'item-1',
    orderId: 'order-1',
    productId: 'prod-1',
    productNameEn: 'Test Product',
    productNameVi: 'Sản phẩm test',
    sku: 'SKU-001',
    quantity: 2,
    price: 50.0,
    total: 100.0,
    product: {
      id: 'prod-1',
      slug: 'test-product',
      sku: 'SKU-001',
      nameEn: 'Test Product',
      nameVi: 'Sản phẩm test',
      stockQuantity: 10,
    },
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('processRefund', () => {
    const refundDto = {
      orderId: 'order-1',
      amount: 121.0,
      reason: 'Customer request',
    };

    it('should successfully process a full refund', async () => {
      const orderWithItems = {
        ...mockOrder,
        items: [mockOrderItem],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(orderWithItems);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            update: jest.fn().mockResolvedValue({
              ...orderWithItems,
              status: OrderStatus.REFUNDED,
              paymentStatus: PaymentStatus.REFUNDED,
              shippingAddress: {},
              billingAddress: {},
            }),
          },
          product: {
            update: jest.fn(),
          },
        });
      });

      const result = await service.processRefund(refundDto);

      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(121.0);
      expect(result.order.status).toBe(OrderStatus.REFUNDED);
    });

    it('should successfully process a partial refund', async () => {
      const partialRefundDto = {
        orderId: 'order-1',
        amount: 50.0,
        reason: 'Partial refund',
      };

      const orderWithItems = {
        ...mockOrder,
        items: [mockOrderItem],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(orderWithItems);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            update: jest.fn().mockResolvedValue({
              ...orderWithItems,
              status: OrderStatus.REFUNDED,
              paymentStatus: PaymentStatus.REFUNDED,
              shippingAddress: {},
              billingAddress: {},
            }),
          },
          product: {
            update: jest.fn(),
          },
        });
      });

      const result = await service.processRefund(partialRefundDto);

      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(50.0);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.processRefund(refundDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if payment status is not PAID', async () => {
      const unpaidOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.PENDING,
        items: [mockOrderItem],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(unpaidOrder);

      await expect(service.processRefund(refundDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if order already refunded', async () => {
      const refundedOrder = {
        ...mockOrder,
        status: OrderStatus.REFUNDED,
        items: [mockOrderItem],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(refundedOrder);

      await expect(service.processRefund(refundDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if refund amount exceeds order total', async () => {
      const invalidRefundDto = {
        orderId: 'order-1',
        amount: 200.0,
        reason: 'Invalid amount',
      };

      const orderWithItems = {
        ...mockOrder,
        items: [mockOrderItem],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(orderWithItems);

      await expect(service.processRefund(invalidRefundDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getRefundInfo', () => {
    it('should return refund information for an order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getRefundInfo('order-1');

      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('canRefund');
      expect(result.canRefund).toBe(true);
      expect(result.totalAmount).toBe(121.0);
    });

    it('should indicate order cannot be refunded if not paid', async () => {
      const unpaidOrder = {
        ...mockOrder,
        paymentStatus: PaymentStatus.PENDING,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(unpaidOrder);

      const result = await service.getRefundInfo('order-1');

      expect(result.canRefund).toBe(false);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getRefundInfo('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
