import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/services/email.service';
import { EmailTemplateService } from '../notifications/services/email-template.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let emailTemplateService: EmailTemplateService;

  const mockAddress = {
    id: 'addr-1',
    userId: 'user-1',
    fullName: 'John Doe',
    phone: '1234567890',
    addressLine1: '123 Main St',
    addressLine2: null,
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-1',
    slug: 'test-product',
    sku: 'SKU-001',
    nameEn: 'Test Product',
    nameVi: 'Sản phẩm test',
    descriptionEn: 'Description',
    descriptionVi: 'Mô tả',
    price: 50.0,
    compareAtPrice: null,
    costPrice: null,
    stockQuantity: 10,
    lowStockThreshold: 5,
    weight: null,
    dimensions: null,
    categoryId: 'cat-1',
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-123456',
    userId: 'user-1',
    email: 'test@example.com',
    status: OrderStatus.PENDING,
    subtotal: 50.0,
    shippingCost: 5.0,
    taxAmount: 5.0,
    discountAmount: 0,
    total: 60.0,
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-1',
    shippingMethod: 'standard',
    paymentMethod: 'credit_card',
    paymentStatus: PaymentStatus.PENDING,
    paymentIntentId: null,
    promotionId: null,
    trackingNumber: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    address: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    promotion: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockEmailTemplateService = {
    getOrderConfirmationTemplate: jest.fn(),
    getShippingNotificationTemplate: jest.fn(),
    getOrderStatusUpdateTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    emailTemplateService = module.get<EmailTemplateService>(
      EmailTemplateService,
    );

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createOrderDto = {
      email: 'test@example.com',
      shippingAddressId: 'addr-1',
      billingAddressId: 'addr-1',
      shippingMethod: 'standard',
      paymentMethod: 'credit_card',
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
        },
      ],
      promotionCode: undefined,
      notes: undefined,
    };

    it('should successfully create an order', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue({
              ...mockOrder,
              items: [
                {
                  id: 'item-1',
                  orderId: 'order-1',
                  productId: 'prod-1',
                  productNameEn: 'Test Product',
                  productNameVi: 'Sản phẩm test',
                  sku: 'SKU-001',
                  quantity: 2,
                  price: 50.0,
                  total: 100.0,
                  product: mockProduct,
                },
              ],
              shippingAddress: mockAddress,
              billingAddress: mockAddress,
            }),
          },
          product: {
            update: jest.fn(),
          },
        });
      });
      mockEmailTemplateService.getOrderConfirmationTemplate.mockReturnValue({
        subject: 'Order Confirmation',
        html: '<p>Order confirmed</p>',
      });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const result = await service.create(createOrderDto, 'user-1');

      expect(result).toHaveProperty('orderNumber');
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException if shipping address not found', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(null);

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if address does not belong to user', async () => {
      const otherUserAddress = { ...mockAddress, userId: 'other-user' };
      mockPrismaService.address.findUnique.mockResolvedValue(otherUserAddress);

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should successfully create an order for guest user with null userId address', async () => {
      const guestAddress = { ...mockAddress, userId: null };
      mockPrismaService.address.findUnique.mockResolvedValue(guestAddress);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue({
              ...mockOrder,
              userId: null,
              items: [
                {
                  id: 'item-1',
                  orderId: 'order-1',
                  productId: 'prod-1',
                  productNameEn: 'Test Product',
                  productNameVi: 'Sản phẩm test',
                  sku: 'SKU-001',
                  quantity: 2,
                  price: 50.0,
                  total: 100.0,
                  product: mockProduct,
                },
              ],
              shippingAddress: guestAddress,
              billingAddress: guestAddress,
            }),
          },
          product: {
            update: jest.fn(),
          },
        });
      });
      mockEmailTemplateService.getOrderConfirmationTemplate.mockReturnValue({
        subject: 'Order Confirmation',
        html: '<p>Order confirmed</p>',
      });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const result = await service.create(createOrderDto, undefined);

      expect(result).toHaveProperty('orderNumber');
      expect(result.items).toHaveLength(1);
      expect(result.userId).toBeNull();
    });

    it('should allow authenticated user to use guest address (null userId)', async () => {
      const guestAddress = { ...mockAddress, userId: null };
      mockPrismaService.address.findUnique.mockResolvedValue(guestAddress);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue({
              ...mockOrder,
              items: [
                {
                  id: 'item-1',
                  orderId: 'order-1',
                  productId: 'prod-1',
                  productNameEn: 'Test Product',
                  productNameVi: 'Sản phẩm test',
                  sku: 'SKU-001',
                  quantity: 2,
                  price: 50.0,
                  total: 100.0,
                  product: mockProduct,
                },
              ],
              shippingAddress: guestAddress,
              billingAddress: guestAddress,
            }),
          },
          product: {
            update: jest.fn(),
          },
        });
      });
      mockEmailTemplateService.getOrderConfirmationTemplate.mockReturnValue({
        subject: 'Order Confirmation',
        html: '<p>Order confirmed</p>',
      });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const result = await service.create(createOrderDto, 'user-1');

      expect(result).toHaveProperty('orderNumber');
      expect(result.items).toHaveLength(1);
    });

    it('should throw BadRequestException if product is out of stock', async () => {
      const outOfStockProduct = { ...mockProduct, stockQuantity: 0 };
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([
        outOfStockProduct,
      ]);

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all orders for a user', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.findAllByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });
  });

  describe('findAll', () => {
    it('should return all orders with filters', async () => {
      const filters = {
        status: OrderStatus.PENDING,
        search: 'ORD-123',
      };

      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);

      const result = await service.findAll(filters);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an order by ID for admin', async () => {
      const orderWithDetails = {
        ...mockOrder,
        items: [],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        promotion: null,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.order.findUnique.mockResolvedValue(orderWithDetails);

      const result = await service.findOne('order-1', 'user-1', UserRole.ADMIN);

      expect(result).toHaveProperty('orderNumber');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'user-1', UserRole.CUSTOMER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user tries to access another users order', async () => {
      const orderWithDetails = {
        ...mockOrder,
        userId: 'other-user',
        items: [],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        promotion: null,
        user: {
          id: 'other-user',
          email: 'other@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      };

      mockPrismaService.order.findUnique.mockResolvedValue(orderWithDetails);

      await expect(
        service.findOne('order-1', 'user-1', UserRole.CUSTOMER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow guest user to view guest order', async () => {
      const guestOrder = {
        ...mockOrder,
        userId: null,
        items: [],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        promotion: null,
        user: null,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(guestOrder);

      const result = await service.findOne('order-1', undefined, undefined);

      expect(result).toHaveProperty('orderNumber');
      expect(result.userId).toBeNull();
    });

    it('should throw ForbiddenException if guest user tries to view authenticated user order', async () => {
      const userOrder = {
        ...mockOrder,
        userId: 'user-1',
        items: [],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        promotion: null,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.order.findUnique.mockResolvedValue(userOrder);

      await expect(
        service.findOne('order-1', undefined, undefined),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if authenticated user tries to view guest order', async () => {
      const guestOrder = {
        ...mockOrder,
        userId: null,
        items: [],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        promotion: null,
        user: null,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(guestOrder);

      await expect(
        service.findOne('order-1', 'user-1', UserRole.CUSTOMER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow authenticated user to view their own order', async () => {
      const userOrder = {
        ...mockOrder,
        userId: 'user-1',
        items: [],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        promotion: null,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.order.findUnique.mockResolvedValue(userOrder);

      const result = await service.findOne('order-1', 'user-1', UserRole.CUSTOMER);

      expect(result).toHaveProperty('orderNumber');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto = {
      status: OrderStatus.SHIPPED,
      trackingNumber: 'TRACK-123',
    };

    it('should successfully update order status', async () => {
      const orderWithDetails = {
        ...mockOrder,
        items: [],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(orderWithDetails);
      mockPrismaService.order.update.mockResolvedValue({
        ...orderWithDetails,
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK-123',
      });
      mockEmailTemplateService.getShippingNotificationTemplate.mockReturnValue({
        subject: 'Order Shipped',
        html: '<p>Your order has been shipped</p>',
      });
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const result = await service.updateStatus('order-1', updateStatusDto);

      expect(result.status).toBe(OrderStatus.SHIPPED);
      expect(result.trackingNumber).toBe('TRACK-123');
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent-id', updateStatusDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
