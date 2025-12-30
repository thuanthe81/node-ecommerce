import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlService } from './services/access-control.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { SetOrderItemPriceDto } from './dto/set-order-item-price.dto';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { EmailEventPublisher } from '../email-queue/services/email-event-publisher.service';
import { FooterSettingsService } from '../footer-settings/footer-settings.service';
import { EmailAttachmentService } from '../pdf-generator/services/email-attachment.service';
import { EmailFlowLogger } from '../email-queue/utils/email-flow-logger';
import { ResendEmailHandlerService } from '../pdf-generator/services/resend-email-handler.service';
import { OrderPDFData, AddressData, OrderItemData, PaymentMethodData, ShippingMethodData, BusinessInfoData, ResendResult } from '../pdf-generator/types/pdf.types';
import { CONSTANTS } from '@alacraft/shared';
import { ShippingService } from '../shipping/shipping.service';
import { BusinessInfoService } from '../common/services/business-info.service';
import { TranslationService } from '../common/services/translation.service';
import { UserIdErrorHandler } from '../common/utils/userid-error-handler.util';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private accessControlService: AccessControlService,
    private emailEventPublisher: EmailEventPublisher,
    private footerSettingsService: FooterSettingsService,
    private emailAttachmentService: EmailAttachmentService,
    private resendEmailHandlerService: ResendEmailHandlerService,
    private businessInfoService: BusinessInfoService,
    private shippingService: ShippingService,
    private translationService: TranslationService,
  ) {}

  /**
   * Generate a unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    // Check if order number already exists (very unlikely)
    const existing = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (existing) {
      // Recursively generate a new one if collision occurs
      return this.generateOrderNumber();
    }

    return orderNumber;
  }

  /**
   * Create a new order
   */
  async create(createOrderDto: CreateOrderDto, userId: string) {
    const {
      email,
      shippingAddressId,
      billingAddressId,
      shippingMethod,
      shippingCost: providedShippingCost,
      paymentMethod,
      items,
      promotionCode,
      notes,
      locale = 'vi', // Default to Vietnamese if not provided
    } = createOrderDto;

    // Log order creation attempt with userId context
    this.logger.log(`Order creation initiated`, {
      userId,
      userType: 'authenticated',
      email,
      itemCount: items?.length || 0,
      shippingAddressId,
      billingAddressId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verify addresses exist and belong to user if authenticated
      const shippingAddress = await this.prisma.address.findUnique({
        where: { id: shippingAddressId },
      });

      if (!shippingAddress) {
        this.logger.warn(`Shipping address not found during order creation`, {
          userId,
          shippingAddressId,
          email,
          timestamp: new Date().toISOString(),
        });
        throw new NotFoundException('Shipping address not found');
      }

      // Validate that the address belongs to the authenticated user
      if (!shippingAddress.userId) {
        this.logger.warn(`Shipping address has no userId - guest addresses not allowed for authenticated orders`, {
          userId,
          shippingAddressId,
          email,
          timestamp: new Date().toISOString(),
        });
        throw new BadRequestException('Address must belong to an authenticated user');
      }

      const shippingValidation = UserIdErrorHandler.validateAddressOwnership(
        shippingAddress.userId,
        userId,
        shippingAddressId,
        'order_creation_shipping_address'
      );

      if (!shippingValidation.isValid) {
        throw UserIdErrorHandler.createExceptionFromValidation(shippingValidation);
      }

      const billingAddress = await this.prisma.address.findUnique({
        where: { id: billingAddressId },
      });

      if (!billingAddress) {
        this.logger.warn(`Billing address not found during order creation`, {
          userId,
          billingAddressId,
          email,
          timestamp: new Date().toISOString(),
        });
        throw new NotFoundException('Billing address not found');
      }

      // Validate that the address belongs to the authenticated user
      if (!billingAddress.userId) {
        this.logger.warn(`Billing address has no userId - guest addresses not allowed for authenticated orders`, {
          userId,
          billingAddressId,
          email,
          timestamp: new Date().toISOString(),
        });
        throw new BadRequestException('Address must belong to an authenticated user');
      }

      const billingValidation = UserIdErrorHandler.validateAddressOwnership(
        billingAddress.userId,
        userId,
        billingAddressId,
        'order_creation_billing_address'
      );

      if (!billingValidation.isValid) {
        throw UserIdErrorHandler.createExceptionFromValidation(billingValidation);
      }

    // Fetch products and validate stock
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      this.logger.warn(`Product validation failed during order creation`, {
        userId,
        requestedProducts: productIds.length,
        foundProducts: products.length,
        missingProducts: productIds.filter(id => !products.find(p => p.id === id)),
        email,
        timestamp: new Date().toISOString(),
      });
      throw new BadRequestException('One or more products not found');
    }

    // Create a map for easy lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock and calculate totals
    // Track if order contains zero-price products
    let subtotal = 0;
    let hasZeroPriceItems = false;
    const orderItems: Array<{
      productId: string;
      productNameEn: string;
      productNameVi: string;
      sku: string;
      quantity: number;
      price: any;
      total: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        this.logger.error(`Product not found in validation map during order creation`, {
          userId,
          productId: item.productId,
          email,
          timestamp: new Date().toISOString(),
        });
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
        this.logger.warn(`Inactive product in order creation attempt`, {
          userId,
          productId: item.productId,
          productName: product.nameEn,
          email,
          timestamp: new Date().toISOString(),
        });
        throw new BadRequestException(
          `Product ${product.nameEn} is not available`,
        );
      }

      // Check if this is a zero-price product
      const isZeroPrice = Number(product.price) === 0;
      if (isZeroPrice) {
        hasZeroPriceItems = true;
      }

      // Only validate stock for non-zero-price products
      if (!isZeroPrice && product.stockQuantity < item.quantity) {
        this.logger.warn(`Insufficient stock during order creation`, {
          userId,
          productId: item.productId,
          productName: product.nameEn,
          requestedQuantity: item.quantity,
          availableStock: product.stockQuantity,
          email,
          timestamp: new Date().toISOString(),
        });
        throw new BadRequestException(
          `Insufficient stock for product ${product.nameEn}. Available: ${product.stockQuantity}`,
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        productNameEn: product.nameEn,
        productNameVi: product.nameVi,
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Use provided shipping cost from frontend (calculated by shipping service)
    // Fall back to calculated cost if not provided (for backward compatibility)
    const shippingCost = providedShippingCost ?? this.calculateShippingCost(shippingMethod);

    // Calculate tax (simplified - 10% tax rate)
    const taxAmount = subtotal * 0.1;

    // Apply promotion if provided
    let discountAmount = 0;
    let promotionId = null;

    if (promotionCode) {
      const promotion = await this.prisma.promotion.findUnique({
        where: { code: promotionCode },
      });

      if (promotion && this.isPromotionValid(promotion, subtotal)) {
        promotionId = promotion.id;
        if (promotion.type === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(promotion.value)) / 100;
          if (
            promotion.maxDiscountAmount &&
            discountAmount > Number(promotion.maxDiscountAmount)
          ) {
            discountAmount = Number(promotion.maxDiscountAmount);
          }
        } else {
          discountAmount = Number(promotion.value);
        }
      }
    }

    // Calculate total
    const total = subtotal + shippingCost + taxAmount - discountAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Determine order status based on zero-price items
    const orderStatus = hasZeroPriceItems
      ? OrderStatus.PENDING_QUOTE
      : OrderStatus.PENDING;

    // Create order with transaction to ensure atomicity
    const order = await this.prisma.$transaction(async (tx) => {
      try {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            email,
            status: orderStatus,
            subtotal,
            shippingCost,
            taxAmount,
            discountAmount,
            total,
            requiresPricing: hasZeroPriceItems,
            shippingAddressId,
            billingAddressId,
            shippingMethod,
            paymentMethod,
            paymentStatus: PaymentStatus.PENDING,
            promotionId,
            notes,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            shippingAddress: true,
            billingAddress: true,
          },
        });

        this.logger.log(`Order created successfully`, {
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          userId,
          userType: 'authenticated',
          email,
          total: newOrder.total,
          itemCount: orderItems.length,
          hasZeroPriceItems,
          timestamp: new Date().toISOString(),
        });

        // Deduct inventory for each product (only for non-zero-price products)
        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product) {
            continue; // Skip if product not found (should not happen due to earlier validation)
          }

          const isZeroPrice = Number(product.price) === 0;

          // Only deduct stock for non-zero-price products
          if (!isZeroPrice) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        // Update promotion usage count if applicable
        if (promotionId) {
          await tx.promotion.update({
            where: { id: promotionId },
            data: {
              usageCount: {
                increment: 1,
              },
            },
          });
        }

        return newOrder;
      } catch (error) {
        this.logger.error(`Order creation transaction failed`, {
          userId,
          email,
          error: error.message,
          orderNumber,
          timestamp: new Date().toISOString(),
        });

        // Handle database constraint violations
        if (error.code === 'P2002') {
          const constraintError = UserIdErrorHandler.handleDatabaseConstraintViolation(error, {
            userId,
            operation: 'order_creation',
            resourceType: 'order',
            additionalData: { orderNumber, email }
          });
          throw constraintError;
        }

        throw error;
      }
    });

    // Send order confirmation email using event publisher
    await this.sendOrderConfirmationEmail(order, locale);

    // Send admin notification email using event publisher
    await this.sendAdminOrderNotification(order, locale);

    return order;
  } catch (error) {
    this.logger.error(`Order creation failed`, {
      userId,
      userType: 'authenticated',
      email,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Re-throw the error to maintain existing error handling
    throw error;
  }
  }

  /**
   * Send order confirmation email to customer using event publisher
   *
   * Publishes an order confirmation event to the email queue for asynchronous processing.
   * The email worker will handle PDF generation and email delivery.
   *
   * @param order - The order object with items, addresses, and totals
   * @param locale - Language locale for the email
   * @returns Promise<void> - Resolves when event is published to queue
   *
   * @example
   * ```typescript
   * // Automatically called after order creation
   * await this.sendOrderConfirmationEmail(order, locale);
   * ```
   *
   * @remarks
   * - Uses EmailEventPublisher to queue order confirmation event
   * - Email processing happens asynchronously in background worker
   * - Logs success/failure of event publishing
   * - Actual email delivery is handled by EmailWorker service
   */
  private async sendOrderConfirmationEmail(order: any, locale: 'en' | 'vi' = 'en'): Promise<void> {
    const startTime = Date.now();

    try {
      const customerName = order.shippingAddress?.fullName || order.email || 'Customer';

      // Log the email trigger with comprehensive details
      EmailFlowLogger.logOrderCreationEmailTrigger(
        order.id,
        order.orderNumber,
        order.email,
        locale,
        'OrdersService.sendOrderConfirmationEmail'
      );

      // Publish order confirmation event to queue
      const jobId = await this.emailEventPublisher.sendOrderConfirmation(
        order.id,
        order.orderNumber,
        order.email,
        customerName,
        locale
      );

      const processingTime = Date.now() - startTime;

      // Log successful event publication
      EmailFlowLogger.logEmailEventPublication(
        'ORDER_CONFIRMATION',
        order.id,
        order.orderNumber,
        order.email,
        jobId,
        locale,
        false // Not a duplicate at this point
      );

      console.log(`Order confirmation event published for order ${order.orderNumber} (Job ID: ${jobId}) in ${processingTime}ms`);
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Log error with comprehensive details
      EmailFlowLogger.logEmailDeliveryFailure(
        'unknown',
        order.id,
        order.orderNumber,
        order.email,
        error instanceof Error ? error.message : String(error),
        1
      );

      // Log error but don't fail the order creation
      console.error(`Failed to publish order confirmation event for order ${order.orderNumber} (${processingTime}ms):`, error);
    }
  }



  /**
   * Send admin order notification email using event publisher
   *
   * Publishes an admin order notification event to the email queue for asynchronous processing.
   * The email worker will handle fetching admin email from footer settings and sending the notification.
   *
   * @param order - The order object with complete details
   * @param locale - Language locale for the email
   * @returns Promise<void> - Resolves when event is published to queue
   *
   * @example
   * ```typescript
   * // Automatically called after order creation and customer email
   * await this.sendAdminOrderNotification(order, locale);
   * ```
   *
   * @remarks
   * - Uses EmailEventPublisher to queue admin order notification event
   * - Email processing happens asynchronously in background worker
   * - EmailWorker will handle admin email lookup and template generation
   * - Logs success/failure of event publishing
   */
  private async sendAdminOrderNotification(order: any, locale: 'en' | 'vi' = 'en'): Promise<void> {
    try {
      // Publish admin order notification event to queue
      const jobId = await this.emailEventPublisher.sendAdminOrderNotification(
        order.id,
        order.orderNumber,
        locale
      );

      console.log(`Admin order notification event published for order ${order.orderNumber} (Job ID: ${jobId})`);
    } catch (error) {
      // Log error but don't fail the order creation
      console.error(`Failed to publish admin order notification event for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Calculate shipping cost based on method
   */
  private calculateShippingCost(shippingMethod: string): number {
    const shippingRates: Record<string, number> = {
      standard: 5.0,
      express: 15.0,
      overnight: 25.0,
    };

    return shippingRates[shippingMethod.toLowerCase()] || 5.0;
  }

  /**
   * Validate if promotion is valid
   */
  private isPromotionValid(promotion: any, orderAmount: number): boolean {
    const now = new Date();

    if (!promotion.isActive) {
      return false;
    }

    if (now < promotion.startDate || now > promotion.endDate) {
      return false;
    }

    if (
      promotion.minOrderAmount &&
      orderAmount < Number(promotion.minOrderAmount)
    ) {
      return false;
    }

    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return false;
    }

    return true;
  }

  /**
   * Get all orders for a user
   */
  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all orders (admin only)
   */
  async findAll(filters?: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Add search functionality for order number or email
    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single order by ID with access control for authenticated users
   * All orders now require authentication, so userId is required for access control
   */
  async findOne(id: string, userId?: string, userRole?: UserRole) {
    try {
      // Since all orders now require authentication, userId must be provided
      if (!userId) {
        this.logger.warn(`Order access denied: Authentication required`, {
          orderId: id,
          userId,
          userRole,
          violation: 'unauthenticated_access_attempt',
          timestamp: new Date().toISOString(),
        });
        throw new ForbiddenException('Authentication required to access orders');
      }

      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { displayOrder: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
          promotion: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Order not found during access attempt`, {
          orderId: id,
          userId,
          userRole,
          timestamp: new Date().toISOString(),
        });
        throw new NotFoundException('Order not found');
      }

      // Since all orders now have required userId, we can use direct comparison
      // Admin users can access any order
      if (userRole === CONSTANTS.STATUS.USER_ROLES.ADMIN) {
        this.logger.log(`Admin order access granted`, {
          orderId: id,
          userId,
          userRole,
          orderUserId: order.userId,
          timestamp: new Date().toISOString(),
        });
        return order;
      }

      // Regular users can only access their own orders
      // Both order.userId and userId are guaranteed to be non-null strings
      if (order.userId !== userId) {
        this.logger.warn(`Unauthorized order access attempt`, {
          orderId: id,
          userId,
          userRole,
          orderUserId: order.userId,
          violation: 'authenticated_user_accessing_different_user_order',
          timestamp: new Date().toISOString(),
        });
        throw new ForbiddenException('You do not have access to this order');
      }

      this.logger.log(`Order access granted - user accessing own order`, {
        orderId: id,
        userId,
        userRole,
        timestamp: new Date().toISOString(),
      });

      return order;
    } catch (error) {
      this.logger.error(`Order access failed`, {
        orderId: id,
        userId,
        userRole,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Get a single order by ID without access control (for internal use)
   */
  async findOneById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promotion: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Set price for an order item (admin only)
   */
  async setOrderItemPrice(
    orderId: string,
    orderItemId: string,
    setOrderItemPriceDto: SetOrderItemPriceDto,
  ) {
    // Verify order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify order item exists and belongs to this order
    const orderItem = order.items.find((item) => item.id === orderItemId);

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    // Update the order item price and total
    const updatedOrderItem = await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        price: setOrderItemPriceDto.price,
        total: setOrderItemPriceDto.price * orderItem.quantity,
      },
    });

    // Recalculate order total
    const updatedOrder = await this.recalculateOrderTotal(orderId);

    // Verify product base price remains unchanged
    const product = await this.prisma.product.findUnique({
      where: { id: orderItem.productId },
    });

    // Return the complete updated order instead of just the order item
    return updatedOrder;
  }

  /**
   * Recalculate order total after price updates
   */
  async recalculateOrderTotal(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate new subtotal from order items
    const subtotal = order.items.reduce((sum, item) => {
      return sum + Number(item.total);
    }, 0);

    // Recalculate tax based on new subtotal
    const taxAmount = subtotal * 0.1;

    // Recalculate total
    const total =
      subtotal +
      Number(order.shippingCost) +
      taxAmount -
      Number(order.discountAmount);

    // Check if all items are priced
    const allItemsPriced = order.items.every((item) => Number(item.price) > 0);

    // Update order status if all items are now priced
    const newStatus =
      allItemsPriced && order.status === OrderStatus.PENDING_QUOTE
        ? OrderStatus.PENDING
        : order.status;

    // Update order with new totals
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        taxAmount,
        total,
        status: newStatus,
        requiresPricing: !allItemsPriced,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    return updatedOrder;
  }

  /**
   * Update order status (admin only)
   */
  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate that order doesn't have unpriced items if moving to PROCESSING or SHIPPED
    if (
      updateOrderStatusDto.status === OrderStatus.PROCESSING ||
      updateOrderStatusDto.status === OrderStatus.SHIPPED
    ) {
      const hasUnpricedItems = order.items.some(
        (item) => Number(item.price) === 0,
      );

      if (hasUnpricedItems) {
        throw new BadRequestException(
          'Cannot process order with unpriced items. Please set prices for all items first.',
        );
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderStatusDto.status,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Send appropriate email based on status
    if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
      await this.sendShippingNotificationEmail(updatedOrder);
    } else {
      await this.sendOrderStatusUpdateEmail(updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Send shipping notification email using event publisher
   *
   * Publishes a shipping notification event to the email queue for asynchronous processing.
   * The email worker will handle template generation and email delivery.
   *
   * @param order - The order object with shipping details
   * @returns Promise<void> - Resolves when event is published to queue
   *
   * @example
   * ```typescript
   * // Automatically called when order status changes to SHIPPED
   * if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
   *   await this.sendShippingNotificationEmail(updatedOrder);
   * }
   * ```
   *
   * @remarks
   * - Uses EmailEventPublisher to queue shipping notification event
   * - Email processing happens asynchronously in background worker
   * - Tracking number can be included if available
   * - Logs success/failure of event publishing
   */
  private async sendShippingNotificationEmail(order: any): Promise<void> {
    try {
      const locale = 'en' as 'en' | 'vi'; // Default to English
      const trackingNumber = undefined; // TODO: Add tracking number support

      // Publish shipping notification event to queue
      const jobId = await this.emailEventPublisher.sendShippingNotification(
        order.id,
        order.orderNumber,
        trackingNumber,
        locale
      );

      console.log(`Shipping notification event published for order ${order.orderNumber} (Job ID: ${jobId})`);
    } catch (error) {
      console.error(`Failed to publish shipping notification event for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Send order status update email using event publisher
   *
   * Publishes an order status update event to the email queue for asynchronous processing.
   * The email worker will handle template generation and email delivery.
   *
   * @param order - The order object with current status
   * @returns Promise<void> - Resolves when event is published to queue
   *
   * @example
   * ```typescript
   * // Automatically called when order status changes (except SHIPPED which uses shipping notification)
   * await this.sendOrderStatusUpdateEmail(updatedOrder);
   * ```
   *
   * @remarks
   * - Uses EmailEventPublisher to queue order status update event
   * - Email processing happens asynchronously in background worker
   * - EmailWorker will handle status-specific template generation
   * - Logs success/failure of event publishing
   */
  private async sendOrderStatusUpdateEmail(order: any): Promise<void> {
    try {
      const locale = 'en' as 'en' | 'vi'; // Default to English

      // Publish order status update event to queue
      const jobId = await this.emailEventPublisher.sendOrderStatusUpdate(
        order.id,
        order.orderNumber,
        order.status,
        locale
      );

      console.log(`Order status update event published for order ${order.orderNumber} (status: ${order.status}) (Job ID: ${jobId})`);
    } catch (error) {
      console.error(`Failed to publish order status update event for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * Update payment status (admin only)
   */
  async updatePaymentStatus(
    id: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: updatePaymentStatusDto.paymentStatus,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        promotion: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * Resend order confirmation email with PDF attachment
   * @param orderNumber - Order number to resend
   * @param customerEmail - Customer's email address
   * @param locale - Language locale for email content
   * @param userId - ID of the authenticated user requesting the resend
   * @returns Promise<ResendResult> - Result of resend operation
   */
  async resendOrderConfirmationEmail(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi' = 'vi',
    userId: string
  ): Promise<ResendResult> {
    try {
      // First, validate that the order belongs to the authenticated user
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        select: { userId: true, email: true }
      });

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'ORDER_NOT_FOUND'
        };
      }

      // Validate that the order belongs to the authenticated user
      if (order.userId !== userId) {
        this.logger.warn(`Unauthorized resend email attempt`, {
          orderNumber,
          requestingUserId: userId,
          orderUserId: order.userId,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          message: 'Unauthorized: You can only resend emails for your own orders',
          error: 'UNAUTHORIZED_ACCESS'
        };
      }

      // Validate that the email matches the order's email
      if (order.email !== customerEmail) {
        this.logger.warn(`Email mismatch in resend request`, {
          orderNumber,
          userId,
          requestedEmail: customerEmail,
          orderEmail: order.email,
          timestamp: new Date().toISOString(),
        });
        return {
          success: false,
          message: 'Email address does not match the order',
          error: 'EMAIL_MISMATCH'
        };
      }

      // Use the ResendEmailHandlerService to handle the request
      const result = await this.resendEmailHandlerService.handleResendRequest(
        orderNumber,
        customerEmail,
        locale
      );

      return result;

    } catch (error) {
      console.error(`Failed to resend order confirmation email for order ${orderNumber}:`, error);

      return {
        success: false,
        message: locale === 'vi'
          ? 'Đã xảy ra lỗi khi gửi lại email. Vui lòng thử lại sau.'
          : 'An error occurred while resending the email. Please try again later.',
        error: error.message,
      };
    }
  }
}