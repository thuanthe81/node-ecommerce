import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { EmailService } from '../notifications/services/email.service';
import { EmailTemplateService } from '../notifications/services/email-template.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private emailTemplateService: EmailTemplateService,
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
      paymentMethod,
      items,
      promotionCode,
      notes,
    } = createOrderDto;

    // Verify addresses exist and belong to user if authenticated
    const shippingAddress = await this.prisma.address.findUnique({
      where: { id: shippingAddressId },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    if (userId && shippingAddress.userId !== userId) {
      throw new ForbiddenException('Shipping address does not belong to user');
    }

    const billingAddress = await this.prisma.address.findUnique({
      where: { id: billingAddressId },
    });

    if (!billingAddress) {
      throw new NotFoundException('Billing address not found');
    }

    if (userId && billingAddress.userId !== userId) {
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
    let subtotal = 0;
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

      if (product.stockQuantity < item.quantity) {
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

    // Calculate shipping cost (simplified - can be enhanced with shipping service)
    const shippingCost = this.calculateShippingCost(shippingMethod);

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

    // Create order with transaction to ensure atomicity
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          email,
          status: OrderStatus.PENDING,
          subtotal,
          shippingCost,
          taxAmount,
          discountAmount,
          total,
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

      // Deduct inventory for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
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

    // Send order confirmation email
    await this.sendOrderConfirmationEmail(order);

    return order;
  }

  /**
   * Send order confirmation email
   */
  private async sendOrderConfirmationEmail(order: any) {
    try {
      const customerName = order.shippingAddress.fullName;
      const locale = 'en'; // Default to English, can be determined from user preferences

      const emailData = {
        orderNumber: order.orderNumber,
        customerName,
        orderDate: order.createdAt.toLocaleDateString(),
        items: order.items.map((item) => ({
          name: locale === 'vi' ? item.productNameVi : item.productNameEn,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        shippingAddress: order.shippingAddress,
      };

      const template =
        this.emailTemplateService.getOrderConfirmationTemplate(
          emailData,
          locale,
        );

      await this.emailService.sendEmail({
        to: order.email,
        subject: template.subject,
        html: template.html,
        locale,
      });
    } catch (error) {
      // Log error but don't fail the order creation
      console.error('Failed to send order confirmation email:', error);
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

    // Check authorization - users can only view their own orders
    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
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

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: updateOrderStatusDto.status,
        trackingNumber: updateOrderStatusDto.trackingNumber,
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
   * Send shipping notification email
   */
  private async sendShippingNotificationEmail(order: any) {
    try {
      const customerName = order.shippingAddress.fullName;
      const locale = 'en'; // Default to English

      const emailData = {
        orderNumber: order.orderNumber,
        customerName,
        orderDate: order.createdAt.toLocaleDateString(),
        items: order.items.map((item) => ({
          name: locale === 'vi' ? item.productNameVi : item.productNameEn,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
      };

      const template =
        this.emailTemplateService.getShippingNotificationTemplate(
          emailData,
          locale,
        );

      await this.emailService.sendEmail({
        to: order.email,
        subject: template.subject,
        html: template.html,
        locale,
      });
    } catch (error) {
      console.error('Failed to send shipping notification email:', error);
    }
  }

  /**
   * Send order status update email
   */
  private async sendOrderStatusUpdateEmail(order: any) {
    try {
      const customerName = order.shippingAddress.fullName;
      const locale = 'en'; // Default to English

      const emailData = {
        orderNumber: order.orderNumber,
        customerName,
        orderDate: order.createdAt.toLocaleDateString(),
        items: order.items.map((item) => ({
          name: locale === 'vi' ? item.productNameVi : item.productNameEn,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        shippingAddress: order.shippingAddress,
        status: order.status,
      };

      const template =
        this.emailTemplateService.getOrderStatusUpdateTemplate(
          emailData,
          locale,
        );

      await this.emailService.sendEmail({
        to: order.email,
        subject: template.subject,
        html: template.html,
        locale,
      });
    } catch (error) {
      console.error('Failed to send order status update email:', error);
    }
  }
}
