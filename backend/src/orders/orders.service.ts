import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
import { STATUS } from '../common/constants';
import { BusinessInfoService } from '../common/services/business-info.service';
import { TranslationService } from '../common/services/translation.service';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
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
  async create(createOrderDto: CreateOrderDto, userId?: string) {
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
      locale = 'vi', // Default to English if not provided
    } = createOrderDto;

    // Verify addresses exist and belong to user if authenticated
    const shippingAddress = await this.prisma.address.findUnique({
      where: { id: shippingAddressId },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Only check ownership if both userId and address.userId exist
    // This allows guest addresses (null userId) to be used in orders
    if (userId && shippingAddress.userId && shippingAddress.userId !== userId) {
      throw new ForbiddenException('Shipping address does not belong to user');
    }

    const billingAddress = await this.prisma.address.findUnique({
      where: { id: billingAddressId },
    });

    if (!billingAddress) {
      throw new NotFoundException('Billing address not found');
    }

    // Only check ownership if both userId and address.userId exist
    // This allows guest addresses (null userId) to be used in orders
    if (userId && billingAddress.userId && billingAddress.userId !== userId) {
      throw new ForbiddenException('Billing address does not belong to user');
    }

    // Fetch products and validate stock
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
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
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (!product.isActive) {
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
    });

    // Send order confirmation email using event publisher
    await this.sendOrderConfirmationEmail(order, locale);

    // Send admin notification email using event publisher
    await this.sendAdminOrderNotification(order, locale);

    return order;
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
            product: true,
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
   * Get a single order by ID
   */
  async findOne(id: string, userId?: string, userRole?: UserRole) {
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

    // Check authorization
    // - Admins can view any order
    // - Authenticated users can only view their own orders
    // - Guest users (no userId) can view guest orders (order.userId is null)
    if (userRole === STATUS.USER_ROLES.ADMIN) {
      // Admin can view any order
      return order;
    }

    if (userId && order.userId && order.userId !== userId) {
      // Authenticated user trying to view another user's order
      throw new ForbiddenException('You do not have access to this order');
    }

    if (userId && !order.userId) {
      // Authenticated user trying to view a guest order
      throw new ForbiddenException('You do not have access to this order');
    }

    if (!userId && order.userId) {
      // Guest user trying to view an authenticated user's order
      throw new ForbiddenException('You do not have access to this order');
    }

    // Allow: authenticated user viewing their own order, or guest viewing guest order

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
    await this.recalculateOrderTotal(orderId);

    // Verify product base price remains unchanged
    const product = await this.prisma.product.findUnique({
      where: { id: orderItem.productId },
    });

    return {
      orderItem: updatedOrderItem,
      productBasePriceUnchanged: product
        ? Number(product.price) === 0
        : false,
    };
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
            product: true,
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
            product: true,
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
            product: true,
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
   * @returns Promise<ResendResult> - Result of resend operation
   */
  async resendOrderConfirmationEmail(
    orderNumber: string,
    customerEmail: string,
    locale: 'en' | 'vi' = 'vi'
  ): Promise<ResendResult> {
    try {
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