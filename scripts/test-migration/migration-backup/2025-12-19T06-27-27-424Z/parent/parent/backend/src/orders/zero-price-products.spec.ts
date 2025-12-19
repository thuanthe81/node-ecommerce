import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/services/email.service';
import { EmailTemplateService } from '../notifications/services/email-template.service';
import { FooterSettingsService } from '../footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../pdf-generator/services/email-attachment.service';
import { ResendEmailHandlerService } from '../pdf-generator/services/resend-email-handler.service';
import { BusinessInfoService } from '../common/services/business-info.service';
import { ShippingService } from '../shipping/shipping.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('OrdersService - Zero Price Products', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

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

  const mockZeroPriceProduct = {
    id: 'prod-zero',
    slug: 'custom-product',
    sku: 'SKU-CUSTOM',
    nameEn: 'Custom Product',
    nameVi: 'Sản phẩm tùy chỉnh',
    descriptionEn: 'Custom made product',
    descriptionVi: 'Sản phẩm làm theo yêu cầu',
    price: 0.0,
    compareAtPrice: null,
    costPrice: null,
    stockQuantity: 0,
    lowStockThreshold: 0,
    weight: null,
    dimensions: null,
    categoryId: 'cat-1',
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRegularProduct = {
    id: 'prod-regular',
    slug: 'regular-product',
    sku: 'SKU-REG',
    nameEn: 'Regular Product',
    nameVi: 'Sản phẩm thường',
    descriptionEn: 'Regular product',
    descriptionVi: 'Sản phẩm thường',
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
      create: jest.fn(),
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
    getSimplifiedOrderConfirmationTemplate: jest.fn().mockReturnValue({
      subject: 'Order Confirmation',
      html: '<p>Order confirmed</p>',
    }),
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
        { provide: EmailService, useValue: mockEmailService },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
        { provide: FooterSettingsService, useValue: mockFooterSettingsService },
        { provide: EmailAttachmentService, useValue: mockEmailAttachmentService },
        { provide: ResendEmailHandlerService, useValue: mockResendEmailHandlerService },
        { provide: BusinessInfoService, useValue: mockBusinessInfoService },
        { provide: ShippingService, useValue: mockShippingService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();

    // Mock order.findUnique to return null (no collision in order number generation)
    mockPrismaService.order.findUnique.mockResolvedValue(null);
  });

  describe('create order with zero-price products', () => {
    it('should create order with PENDING_QUOTE status when order contains zero-price product', async () => {
      const createOrderDto = {
        email: 'test@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        items: [
          {
            productId: 'prod-zero',
            quantity: 1,
          },
        ],
        promotionCode: undefined,
        notes: undefined,
      };

      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([
        mockZeroPriceProduct,
      ]);

      let capturedOrderData: any = null;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockImplementation((data) => {
              capturedOrderData = data.data;
              return Promise.resolve({
                id: 'order-1',
                orderNumber: 'ORD-123456',
                ...data.data,
                items: [
                  {
                    id: 'item-1',
                    orderId: 'order-1',
                    productId: 'prod-zero',
                    productNameEn: 'Custom Product',
                    productNameVi: 'Sản phẩm tùy chỉnh',
                    sku: 'SKU-CUSTOM',
                    quantity: 1,
                    price: 0.0,
                    total: 0.0,
                    product: mockZeroPriceProduct,
                  },
                ],
                shippingAddress: mockAddress,
                billingAddress: mockAddress,
              });
            }),
          },
          product: {
            update: jest.fn(),
          },
          promotion: {
            update: jest.fn(),
          },
        });
      });

      const result = await service.create(createOrderDto, 'user-1');

      // Verify order was created with PENDING_QUOTE status
      expect(capturedOrderData.status).toBe(OrderStatus.PENDING_QUOTE);
      expect(capturedOrderData.requiresPricing).toBe(true);
      expect(result.status).toBe(OrderStatus.PENDING_QUOTE);
    });

    it('should create order with PENDING status when order contains only regular products', async () => {
      const createOrderDto = {
        email: 'test@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        items: [
          {
            productId: 'prod-regular',
            quantity: 2,
          },
        ],
        promotionCode: undefined,
        notes: undefined,
      };

      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([
        mockRegularProduct,
      ]);

      let capturedOrderData: any = null;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockImplementation((data) => {
              capturedOrderData = data.data;
              return Promise.resolve({
                id: 'order-1',
                orderNumber: 'ORD-123456',
                ...data.data,
                items: [
                  {
                    id: 'item-1',
                    orderId: 'order-1',
                    productId: 'prod-regular',
                    productNameEn: 'Regular Product',
                    productNameVi: 'Sản phẩm thường',
                    sku: 'SKU-REG',
                    quantity: 2,
                    price: 50.0,
                    total: 100.0,
                    product: mockRegularProduct,
                  },
                ],
                shippingAddress: mockAddress,
                billingAddress: mockAddress,
              });
            }),
          },
          product: {
            update: jest.fn(),
          },
          promotion: {
            update: jest.fn(),
          },
        });
      });

      const result = await service.create(createOrderDto, 'user-1');

      // Verify order was created with PENDING status
      expect(capturedOrderData.status).toBe(OrderStatus.PENDING);
      expect(capturedOrderData.requiresPricing).toBe(false);
      expect(result.status).toBe(OrderStatus.PENDING);
    });

    it('should create order with PENDING_QUOTE status when order contains mixed products', async () => {
      const createOrderDto = {
        email: 'test@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        items: [
          {
            productId: 'prod-zero',
            quantity: 1,
          },
          {
            productId: 'prod-regular',
            quantity: 2,
          },
        ],
        promotionCode: undefined,
        notes: undefined,
      };

      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([
        mockZeroPriceProduct,
        mockRegularProduct,
      ]);

      let capturedOrderData: any = null;

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockImplementation((data) => {
              capturedOrderData = data.data;
              return Promise.resolve({
                id: 'order-1',
                orderNumber: 'ORD-123456',
                ...data.data,
                items: [
                  {
                    id: 'item-1',
                    orderId: 'order-1',
                    productId: 'prod-zero',
                    productNameEn: 'Custom Product',
                    productNameVi: 'Sản phẩm tùy chỉnh',
                    sku: 'SKU-CUSTOM',
                    quantity: 1,
                    price: 0.0,
                    total: 0.0,
                    product: mockZeroPriceProduct,
                  },
                  {
                    id: 'item-2',
                    orderId: 'order-1',
                    productId: 'prod-regular',
                    productNameEn: 'Regular Product',
                    productNameVi: 'Sản phẩm thường',
                    sku: 'SKU-REG',
                    quantity: 2,
                    price: 50.0,
                    total: 100.0,
                    product: mockRegularProduct,
                  },
                ],
                shippingAddress: mockAddress,
                billingAddress: mockAddress,
              });
            }),
          },
          product: {
            update: jest.fn(),
          },
          promotion: {
            update: jest.fn(),
          },
        });
      });

      const result = await service.create(createOrderDto, 'user-1');

      // Verify order was created with PENDING_QUOTE status
      expect(capturedOrderData.status).toBe(OrderStatus.PENDING_QUOTE);
      expect(capturedOrderData.requiresPricing).toBe(true);
      expect(result.status).toBe(OrderStatus.PENDING_QUOTE);
    });

    it('should not deduct stock for zero-price products', async () => {
      const createOrderDto = {
        email: 'test@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        items: [
          {
            productId: 'prod-zero',
            quantity: 1,
          },
        ],
        promotionCode: undefined,
        notes: undefined,
      };

      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([
        mockZeroPriceProduct,
      ]);

      const mockProductUpdate = jest.fn();

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue({
              id: 'order-1',
              orderNumber: 'ORD-123456',
              status: OrderStatus.PENDING_QUOTE,
              requiresPricing: true,
              items: [],
              shippingAddress: mockAddress,
              billingAddress: mockAddress,
            }),
          },
          product: {
            update: mockProductUpdate,
          },
          promotion: {
            update: jest.fn(),
          },
        });
      });

      await service.create(createOrderDto, 'user-1');

      // Verify stock was NOT deducted for zero-price product
      expect(mockProductUpdate).not.toHaveBeenCalled();
    });

    it('should deduct stock only for regular products in mixed order', async () => {
      const createOrderDto = {
        email: 'test@example.com',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
        shippingMethod: 'standard',
        paymentMethod: 'credit_card',
        items: [
          {
            productId: 'prod-zero',
            quantity: 1,
          },
          {
            productId: 'prod-regular',
            quantity: 2,
          },
        ],
        promotionCode: undefined,
        notes: undefined,
      };

      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.product.findMany.mockResolvedValue([
        mockZeroPriceProduct,
        mockRegularProduct,
      ]);

      const mockProductUpdate = jest.fn();

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue({
              id: 'order-1',
              orderNumber: 'ORD-123456',
              status: OrderStatus.PENDING_QUOTE,
              requiresPricing: true,
              items: [],
              shippingAddress: mockAddress,
              billingAddress: mockAddress,
            }),
          },
          product: {
            update: mockProductUpdate,
          },
          promotion: {
            update: jest.fn(),
          },
        });
      });

      await service.create(createOrderDto, 'user-1');

      // Verify stock was deducted only for regular product
      expect(mockProductUpdate).toHaveBeenCalledTimes(1);
      expect(mockProductUpdate).toHaveBeenCalledWith({
        where: { id: 'prod-regular' },
        data: {
          stockQuantity: {
            decrement: 2,
          },
        },
      });
    });
  });

  describe('setOrderItemPrice', () => {
    it('should set price for zero-price order item and recalculate total', async () => {
      const orderId = 'order-1';
      const orderItemId = 'item-1';
      const newPrice = 150.0;

      const mockOrder = {
        id: orderId,
        orderNumber: 'ORD-123456',
        status: OrderStatus.PENDING_QUOTE,
        requiresPricing: true,
        subtotal: 0,
        shippingCost: 5.0,
        taxAmount: 0,
        discountAmount: 0,
        total: 5.0,
        items: [
          {
            id: orderItemId,
            orderId,
            productId: 'prod-zero',
            productNameEn: 'Custom Product',
            productNameVi: 'Sản phẩm tùy chỉnh',
            sku: 'SKU-CUSTOM',
            quantity: 2,
            price: 0.0,
            total: 0.0,
          },
        ],
      };

      const updatedOrderItem = {
        ...mockOrder.items[0],
        price: newPrice,
        total: newPrice * 2,
      };

      const updatedOrder = {
        ...mockOrder,
        subtotal: 300.0,
        taxAmount: 30.0,
        total: 335.0,
        status: OrderStatus.PENDING,
        requiresPricing: false,
        items: [updatedOrderItem],
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({
          ...mockOrder,
          items: [updatedOrderItem],
        });

      mockPrismaService.orderItem = {
        update: jest.fn().mockResolvedValue(updatedOrderItem),
      };

      mockPrismaService.order.update = jest.fn().mockResolvedValue(updatedOrder);

      mockPrismaService.product.findUnique = jest
        .fn()
        .mockResolvedValue(mockZeroPriceProduct);

      const result = await service.setOrderItemPrice(orderId, orderItemId, {
        price: newPrice,
      });

      // Verify order item price was updated
      expect(mockPrismaService.orderItem.update).toHaveBeenCalledWith({
        where: { id: orderItemId },
        data: {
          price: newPrice,
          total: newPrice * 2,
        },
      });

      // Verify product base price remains unchanged
      expect(result.productBasePriceUnchanged).toBe(true);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.setOrderItemPrice('invalid-order', 'item-1', { price: 100 }),
      ).rejects.toThrow('Order not found');
    });

    it('should throw NotFoundException if order item not found', async () => {
      const mockOrder = {
        id: 'order-1',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
          },
        ],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.setOrderItemPrice('order-1', 'invalid-item', { price: 100 }),
      ).rejects.toThrow('Order item not found');
    });
  });

  describe('recalculateOrderTotal', () => {
    it('should recalculate order total and update status when all items are priced', async () => {
      const orderId = 'order-1';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING_QUOTE,
        requiresPricing: true,
        shippingCost: 5.0,
        discountAmount: 0,
        items: [
          {
            id: 'item-1',
            price: 100.0,
            total: 200.0,
          },
          {
            id: 'item-2',
            price: 50.0,
            total: 50.0,
          },
        ],
      };

      const updatedOrder = {
        ...mockOrder,
        subtotal: 250.0,
        taxAmount: 25.0,
        total: 280.0,
        status: OrderStatus.PENDING,
        requiresPricing: false,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update = jest.fn().mockResolvedValue(updatedOrder);

      const result = await service.recalculateOrderTotal(orderId);

      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          subtotal: 250.0,
          taxAmount: 25.0,
          total: 280.0,
          status: OrderStatus.PENDING,
          requiresPricing: false,
        },
        include: expect.any(Object),
      });

      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.requiresPricing).toBe(false);
    });

    it('should keep PENDING_QUOTE status when items still have zero prices', async () => {
      const orderId = 'order-1';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING_QUOTE,
        requiresPricing: true,
        shippingCost: 5.0,
        discountAmount: 0,
        items: [
          {
            id: 'item-1',
            price: 100.0,
            total: 100.0,
          },
          {
            id: 'item-2',
            price: 0.0,
            total: 0.0,
          },
        ],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update = jest.fn().mockResolvedValue({
        ...mockOrder,
        subtotal: 100.0,
        taxAmount: 10.0,
        total: 115.0,
      });

      await service.recalculateOrderTotal(orderId);

      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          subtotal: 100.0,
          taxAmount: 10.0,
          total: 115.0,
          status: OrderStatus.PENDING_QUOTE,
          requiresPricing: true,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('updateStatus with unpriced items validation', () => {
    it('should throw BadRequestException when trying to process order with unpriced items', async () => {
      const orderId = 'order-1';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING_QUOTE,
        items: [
          {
            id: 'item-1',
            price: 0.0,
          },
        ],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.updateStatus(orderId, { status: OrderStatus.PROCESSING }),
      ).rejects.toThrow(
        'Cannot process order with unpriced items. Please set prices for all items first.',
      );
    });

    it('should allow status update to PROCESSING when all items are priced', async () => {
      const orderId = 'order-1';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        items: [
          {
            id: 'item-1',
            price: 100.0,
            product: mockRegularProduct,
          },
        ],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update = jest.fn().mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });

      const result = await service.updateStatus(orderId, {
        status: OrderStatus.PROCESSING,
      });

      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should allow status update to CANCELLED even with unpriced items', async () => {
      const orderId = 'order-1';

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING_QUOTE,
        items: [
          {
            id: 'item-1',
            price: 0.0,
            product: mockZeroPriceProduct,
          },
        ],
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update = jest.fn().mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.updateStatus(orderId, {
        status: OrderStatus.CANCELLED,
      });

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });
});
