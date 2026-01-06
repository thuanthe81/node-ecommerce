import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService, OrderAccessContext } from './access-control.service';
import { EmailEventPublisher } from '../../email-queue/services/email-event-publisher.service';
import { ErrorHandlingService, ErrorCodes } from '../../common/services/error-handling.service';
import { OrderStatus, UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';

export interface CancellationResult {
  success: boolean;
  order?: any;
  message: string;
  emailSent?: boolean;
}

export interface CancellationAuditLog {
  orderId: string;
  orderNumber: string;
  userId?: string;
  userRole?: UserRole;
  reason?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Order Cancellation Service
 *
 * Handles order cancellation business logic including status validation,
 * access control, audit logging, and email notifications.
 */
@Injectable()
export class OrderCancellationService {
  private readonly logger = new Logger(OrderCancellationService.name);

  constructor(
    private prisma: PrismaService,
    private accessControlService: AccessControlService,
    @Inject(forwardRef(() => EmailEventPublisher))
    private emailEventPublisher: EmailEventPublisher,
    private errorHandlingService: ErrorHandlingService,
  ) {}

  /**
   * Cancel an order with comprehensive validation and audit logging
   *
   * @param orderId - The order ID to cancel
   * @param context - User context including userId, role, and session information
   * @param reason - Optional cancellation reason
   * @returns Promise<CancellationResult> - Result of the cancellation operation
   * @throws NotFoundException if order doesn't exist
   * @throws ForbiddenException if user doesn't have permission
   * @throws BadRequestException if order cannot be cancelled
   */
  async cancelOrder(
    orderId: string,
    context: OrderAccessContext,
    reason?: string,
  ): Promise<CancellationResult> {
    const { userId, userRole, ipAddress, userAgent } = context;
    const startTime = Date.now();
    let order: any = null; // Declare order variable for error handling

    try {
      // Validate access control first
      await this.accessControlService.validateOrderAccess(orderId, context);

      // Fetch the order with necessary details
      order = await this.prisma.order.findUnique({
        where: { id: orderId },
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
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Validate that order can be cancelled
      if (!this.isOrderCancellable(order)) {
        const message = `Order ${order.orderNumber} cannot be cancelled. Current status: ${order.status}`;

        // Log failed cancellation attempt
        await this.logCancellationAttempt({
          orderId,
          orderNumber: order.orderNumber,
          userId,
          userRole,
          reason,
          timestamp: new Date(),
          ipAddress,
          userAgent,
          success: false,
          errorMessage: message,
        });

        throw new BadRequestException(message);
      }

      // Validate cancellation permissions
      const canCancel = await this.accessControlService.canCancelOrder(orderId, context);
      if (!canCancel) {
        const message = `You do not have permission to cancel order ${order.orderNumber}`;

        // Log unauthorized cancellation attempt
        await this.logCancellationAttempt({
          orderId,
          orderNumber: order.orderNumber,
          userId,
          userRole,
          reason,
          timestamp: new Date(),
          ipAddress,
          userAgent,
          success: false,
          errorMessage: message,
        });

        throw new ForbiddenException(message);
      }

      // Perform the cancellation in a transaction
      const cancelledOrder = await this.prisma.$transaction(async (tx) => {
        // Update order status to CANCELLED
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: reason,
            cancelledBy: userId || 'guest',
          },
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
        });

        // Restore inventory for cancelled items
        for (const item of order.items) {
          // Only restore inventory for non-zero-price products
          const isZeroPrice = Number(item.price) === 0;
          if (!isZeroPrice) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: item.quantity,
                },
              },
            });
          }
        }

        return updatedOrder;
      });

      // Log successful cancellation
      await this.logCancellationAttempt({
        orderId,
        orderNumber: order.orderNumber,
        userId,
        userRole,
        reason,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        success: true,
      });

      // Send cancellation notification emails
      let emailSent = false;
      try {
        await this.sendCancellationNotifications(cancelledOrder);
        emailSent = true;
      } catch (emailError) {
        // Handle email service failures gracefully
        const emailErrorDetails = this.errorHandlingService.handleEmailServiceFailure(
          emailError,
          {
            userId,
            userRole,
            orderId,
            orderNumber: order.orderNumber,
            ipAddress,
            userAgent,
            endpoint: 'cancelOrder',
            method: 'PATCH',
            timestamp: new Date(),
          }
        );

        // Log email failure but don't fail the cancellation
        this.errorHandlingService.logError(emailError, {
          userId,
          userRole,
          orderId,
          orderNumber: order.orderNumber,
          ipAddress,
          userAgent,
          endpoint: 'cancelOrder',
          method: 'PATCH',
          timestamp: new Date(),
        }, {
          operation: 'sendCancellationNotifications',
          gracefulDegradation: true,
        });

        this.logger.warn(`Email service degraded for order ${order.orderNumber} - cancellation completed without notifications`, {
          orderId,
          orderNumber: order.orderNumber,
          userId,
          userRole,
          emailErrorCode: emailErrorDetails.code,
          emailErrorMessage: emailErrorDetails.message,
        });
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`Order ${order.orderNumber} cancelled successfully by ${userId || 'guest'} in ${processingTime}ms`, {
        orderId,
        orderNumber: order.orderNumber,
        userId,
        userRole,
        reason,
        processingTime,
        emailSent,
      });

      return {
        success: true,
        order: cancelledOrder,
        message: `Order ${order.orderNumber} has been cancelled successfully`,
        emailSent,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Enhanced error logging with classification
      const errorContext = {
        userId,
        userRole,
        orderId,
        orderNumber: order?.orderNumber || 'unknown',
        ipAddress,
        userAgent,
        endpoint: 'cancelOrder',
        method: 'PATCH',
        timestamp: new Date(),
      };

      this.errorHandlingService.logError(error, errorContext, {
        operation: 'cancelOrder',
        processingTime,
        reason,
      });

      // Log the error with additional context
      this.logger.error(`Failed to cancel order ${orderId}:`, {
        orderId,
        userId,
        userRole,
        reason,
        processingTime,
        error: error.message,
        errorType: error.constructor.name,
      });

      // Re-throw the error to be handled by the controller
      throw error;
    }
  }

  /**
   * Check if an order can be cancelled based on its current status
   *
   * @param order - The order object to check
   * @returns boolean - True if the order can be cancelled
   */
  isOrderCancellable(order: any): boolean {
    return CONSTANTS.ORDER_STATUS_GROUPS.CANCELLABLE.includes(order.status as any);
  }

  /**
   * Send cancellation notification emails to customer and admin
   *
   * @param order - The cancelled order object
   * @returns Promise<void>
   */
  async sendCancellationNotifications(order: any): Promise<void> {
    try {
      const locale = 'en' as 'en' | 'vi'; // Default to English, could be enhanced to use user preference

      // Send customer cancellation notification
      const customerJobId = await this.emailEventPublisher.sendOrderCancellation(
        order.id,
        order.orderNumber,
        order.email,
        order.shippingAddress?.fullName || order.email || 'Customer',
        locale,
        order.cancellationReason
      );

      this.logger.log(`Customer cancellation notification queued for order ${order.orderNumber} (Job ID: ${customerJobId})`);

      // Send admin cancellation notification
      const adminJobId = await this.emailEventPublisher.sendAdminCancellationNotification(
        order.id,
        order.orderNumber,
        locale,
        order.cancellationReason
      );

      this.logger.log(`Admin cancellation notification queued for order ${order.orderNumber} (Job ID: ${adminJobId})`);

    } catch (error) {
      this.logger.error(`Failed to queue cancellation notifications for order ${order.orderNumber}:`, error);
      throw error;
    }
  }

  /**
   * Log cancellation attempt for audit purposes
   *
   * @param auditLog - The audit log data
   * @returns Promise<void>
   */
  private async logCancellationAttempt(auditLog: CancellationAuditLog): Promise<void> {
    try {
      // Log to application logger
      const logLevel = auditLog.success ? 'log' : 'warn';
      this.logger[logLevel](`Order cancellation attempt: ${auditLog.success ? 'SUCCESS' : 'FAILED'}`, {
        orderId: auditLog.orderId,
        orderNumber: auditLog.orderNumber,
        userId: auditLog.userId,
        userRole: auditLog.userRole,
        reason: auditLog.reason,
        timestamp: auditLog.timestamp,
        ipAddress: auditLog.ipAddress,
        success: auditLog.success,
        errorMessage: auditLog.errorMessage,
      });

      // In a production system, this could also:
      // - Store audit logs in a dedicated database table
      // - Send to external audit/monitoring systems
      // - Trigger security alerts for suspicious patterns
      // - Generate compliance reports

    } catch (error) {
      // Don't fail the operation if audit logging fails
      this.logger.error('Failed to log cancellation attempt:', error);
    }
  }

  /**
   * Get cancellation statistics for monitoring and reporting
   *
   * @param startDate - Start date for statistics
   * @param endDate - End date for statistics
   * @returns Promise<any> - Cancellation statistics
   */
  async getCancellationStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = {
      status: CONSTANTS.STATUS.ORDER_STATUS.CANCELLED,
    };

    if (startDate || endDate) {
      where.cancelledAt = {};
      if (startDate) {
        where.cancelledAt.gte = startDate;
      }
      if (endDate) {
        where.cancelledAt.lte = endDate;
      }
    }

    const [totalCancelled, cancellationsByReason] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({
        by: ['cancellationReason'],
        where,
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalCancelled,
      cancellationsByReason: cancellationsByReason.map(item => ({
        reason: item.cancellationReason || 'No reason provided',
        count: item._count.id,
      })),
    };
  }
}