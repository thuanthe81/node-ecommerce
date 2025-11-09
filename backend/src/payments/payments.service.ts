import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Process a refund for an order
   * Note: This is a simplified implementation. In production, you would integrate with Stripe API
   */
  async processRefund(refundDto: RefundPaymentDto) {
    const { orderId, amount, reason } = refundDto;

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order can be refunded
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'Order payment status must be PAID to process refund',
      );
    }

    if (order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('Order has already been refunded');
    }

    // Determine refund amount (full refund if not specified)
    const refundAmount = amount || Number(order.total);

    if (refundAmount > Number(order.total)) {
      throw new BadRequestException(
        'Refund amount cannot exceed order total',
      );
    }

    // In production, integrate with Stripe API here:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // if (order.paymentIntentId) {
    //   await stripe.refunds.create({
    //     payment_intent: order.paymentIntentId,
    //     amount: Math.round(refundAmount * 100), // Convert to cents
    //     reason: reason || 'requested_by_customer',
    //   });
    // }

    // Update order status and payment status
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // Update order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
          notes: order.notes
            ? `${order.notes}\n\nRefund processed: ${refundAmount} USD. Reason: ${reason || 'N/A'}`
            : `Refund processed: ${refundAmount} USD. Reason: ${reason || 'N/A'}`,
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

      // Restore inventory for refunded items
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });
      }

      return updated;
    });

    // In production, send refund confirmation email here
    // await this.emailService.sendRefundConfirmation(order.email, updatedOrder);

    return {
      success: true,
      order: updatedOrder,
      refundAmount,
      message: 'Refund processed successfully',
    };
  }

  /**
   * Get refund information for an order
   */
  async getRefundInfo(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      canRefund:
        order.paymentStatus === PaymentStatus.PAID &&
        order.status !== OrderStatus.REFUNDED,
      totalAmount: Number(order.total),
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
    };
  }
}
