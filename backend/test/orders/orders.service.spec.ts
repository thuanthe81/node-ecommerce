import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/orders/orders.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AccessControlService } from '../../src/orders/services/access-control.service';
import { EmailEventPublisher } from '../../src/email-queue/services/email-event-publisher.service';
import { FooterSettingsService } from '../../src/footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../../src/pdf-generator/services/email-attachment.service';
import { ResendEmailHandlerService } from '../../src/pdf-generator/services/resend-email-handler.service';
import { BusinessInfoService } from '../../src/common/services/business-info.service';
import { ShippingService } from '../../src/shipping/shipping.service';
import { TranslationService } from '../../src/common/services/translation.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let accessControlService: AccessControlService;
  let emailEventPublisher: EmailEventPublisher;
  let footerSettingsService: FooterSettingsService;
  let emailAttachmentService: EmailAttachmentService;
  let resendEmailHandlerService: ResendEmailHandlerService;

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

  const mockAccessControlService = {
    validateOrderAccess: jest.fn(),
    canCancelOrder: jest.fn(),
    getOrderPermissions: jest.fn(),
    validateOrderOwnership: jest.fn(),
    logSecurityViolation: jest.fn(),
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

  const mockEmailEventPublisher = {
    sendOrderConfirmation: jest.fn().mockResolvedValue('job-id-1'),
    sendAdminOrderNotification: jest.fn().mockResolvedValue('job-id-2'),
    sendShippingNotification: jest.fn().mockResolvedValue('job-id-3'),
    sendOrderStatusUpdate: jest.fn().mockResolvedValue('job-id-4'),
  };

  const mockTranslationService = {
    translateShippingMethod: jest.fn().mockReturnValue('Standard Shipping'),
    translatePaymentMethod: jest.fn().mockReturnValue('Credit Card'),
    getPaymentMethodInstructions: jest.fn().mockReturnValue('Payment instructions'),
    getShippingMethodDescription: jest.fn().mockReturnValue('Delivery in 3-5 days'),
  };

  const mockFooterSettingsService = {
    getFooterSettings: jest.fn(),
  };

  const mockEmailAttachmentService = {
    sendOrderConfirmationWithPDF: jest.fn(),
  };

  const mockResendEmailHandlerService = {
    handleResendRequest: jest.fn(),
  };

  const mockBusinessInfoService = {
    getBusinessInfo: jest.fn().mockResolvedValue({
      companyName: 'Test Company',
      logoUrl: 'https://example.com/logo.png',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
      website: 'https://example.com',
      address: {
        fullName: 'Test Company',
        addressLine1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
        phone: '+1234567890',
      },
      returnPolicy: undefined,
      termsAndConditions: undefined,
    }),
  };

  const mockShippingService = {
    calculateShipping: jest.fn().mockResolvedValue([
      {
        method: 'standard',
        name: 'Standard Shipping',
        description: 'Delivery in 3-5 days',
        cost: 5.0,
        estimatedDays: '3-5 days',
        carrier: 'Test Carrier',
        isFreeShipping: false,
      },
    ]),
    getShippingMethodDetails: jest.fn().mockResolvedValue({
      method: 'standard',
      name: 'Standard Shipping',
      description: 'Delivery in 3-5 days',
      cost: 5.0,
      estimatedDays: '3-5 days',
      carrier: 'Test Carrier',
      isFreeShipping: false,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AccessControlService, useValue: mockAccessControlService },
        { provide: EmailEventPublisher, useValue: mockEmailEventPublisher },
        { provide: FooterSettingsService, useValue: mockFooterSettingsService },
        { provide: EmailAttachmentService, useValue: mockEmailAttachmentService },
        { provide: ResendEmailHandlerService, useValue: mockResendEmailHandlerService },
        { provide: BusinessInfoService, useValue: mockBusinessInfoService },
        { provide: ShippingService, useValue: mockShippingService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    accessControlService = module.get<AccessControlService>(AccessControlService);
    emailEventPublisher = module.get<EmailEventPublisher>(EmailEventPublisher);
    footerSettingsService = module.get<FooterSettingsService>(
      FooterSettingsService,
    );
    emailAttachmentService = module.get<EmailAttachmentService>(EmailAttachmentService);
    resendEmailHandlerService = module.get<ResendEmailHandlerService>(ResendEmailHandlerService);

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
      // Email events will be published to queue
      mockFooterSettingsService.getFooterSettings.mockResolvedValue({
        id: 'footer-1',
        contactEmail: 'admin@example.com',
        contactPhone: null,
        address: null,
        copyrightText: 'Copyright 2024',
        googleMapsUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        tiktokUrl: null,
        zaloUrl: null,
        whatsappUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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

    it('should require authentication for order creation (no guest orders)', async () => {
      const guestAddress = { ...mockAddress, userId: null };
      mockPrismaService.address.findUnique.mockResolvedValue(guestAddress);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      // Since all orders now require authentication, passing undefined userId should fail
      await expect(service.create(createOrderDto, undefined)).rejects.toThrow(
        'Address does not belong to user'
      );
    });

    it('should require authenticated user to use authenticated address', async () => {
      const guestAddress = { ...mockAddress, userId: null };
      mockPrismaService.address.findUnique.mockResolvedValue(guestAddress);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      // Authenticated user cannot use guest address (null userId)
      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        'Address does not belong to user'
      );
    });

    it('should throw BadRequestException if product is on pre-order (zero stock)', async () => {
      const preOrderProduct = { ...mockProduct, stockQuantity: 0 };
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([
        preOrderProduct,
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

      const result = await service.findOne('order-1', 'user-1', CONSTANTS.STATUS.USER_ROLES.ADMIN);

      expect(result).toHaveProperty('orderNumber');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'user-1', CONSTANTS.STATUS.USER_ROLES.CUSTOMER),
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
        service.findOne('order-1', 'user-1', CONSTANTS.STATUS.USER_ROLES.CUSTOMER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should require authentication for order access (no guest access)', async () => {
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

      // Since all orders now require authentication, guest access should fail
      await expect(service.findOne('order-1', undefined, undefined)).rejects.toThrow(
        ForbiddenException
      );
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
        service.findOne('order-1', 'user-1', CONSTANTS.STATUS.USER_ROLES.CUSTOMER),
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

      const result = await service.findOne('order-1', 'user-1', CONSTANTS.STATUS.USER_ROLES.CUSTOMER);

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
      // Email events will be published to queue

      const result = await service.updateStatus('order-1', updateStatusDto);

      expect(result.status).toBe(OrderStatus.SHIPPED);
      expect(result.trackingNumber).toBe('TRACK-123');
      expect(mockEmailEventPublisher.sendShippingNotification).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existent-id', updateStatusDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
