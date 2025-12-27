import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, OrderStatus } from '@prisma/client';
import { STATUS } from '../../common/constants';

export interface OrderAccessContext {
  userId?: string;
  userRole?: UserRole;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AccessValidationResult {
  canView: boolean;
  canCancel: boolean;
  canModify: boolean;
  reason?: string;
}

/**
 * Access Control Service for Order Management
 *
 * Handles order access validation for authenticated users, guest users, and administrators.
 * Implements comprehensive access control rules for viewing and modifying orders.
 */
@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Validate if a user has access to view an order
   *
   * @param orderId - The order ID to validate access for
   * @param context - User context including userId, role, and session information
   * @returns Promise<boolean> - True if access is granted, false otherwise
   * @throws ForbiddenException if access is denied
   * @throws NotFoundException if order doesn't exist
   */
  async validateOrderAccess(
    orderId: string,
    context: OrderAccessContext,
  ): Promise<boolean> {
    const { userId, userRole, sessionId, ipAddress, userAgent } = context;

    // Fetch the order with minimal data needed for access control
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    if (!order) {
      this.logger.warn(`Order access denied: Order ${orderId} not found`, {
        orderId,
        userId,
        userRole,
        ipAddress,
      });
      throw new NotFoundException('Order not found');
    }

    // Admin users can access any order
    if (userRole === STATUS.USER_ROLES.ADMIN) {
      this.logger.log(`Order access granted: Admin user ${userId} accessing order ${orderId}`, {
        orderId,
        userId,
        userRole,
        orderUserId: order.userId,
      });
      return true;
    }

    // Authenticated user access validation
    if (userId) {
      // User can only access their own orders
      if (order.userId === userId) {
        this.logger.log(`Order access granted: User ${userId} accessing own order ${orderId}`, {
          orderId,
          userId,
          userRole,
        });
        return true;
      }

      // Authenticated user trying to access another user's order or guest order
      this.logger.warn(`Order access denied: User ${userId} attempting to access order ${orderId} belonging to ${order.userId || 'guest'}`, {
        orderId,
        userId,
        userRole,
        orderUserId: order.userId,
        ipAddress,
      });
      throw new ForbiddenException('You do not have access to this order');
    }

    // Guest user access validation
    if (!userId) {
      // Guest users can only access guest orders (orders with null userId)
      if (!order.userId) {
        // TODO: In a production system, we would validate session ownership here
        // For now, we allow guest access to guest orders
        this.logger.log(`Order access granted: Guest user accessing guest order ${orderId}`, {
          orderId,
          sessionId,
          ipAddress,
        });
        return true;
      }

      // Guest user trying to access authenticated user's order
      this.logger.warn(`Order access denied: Guest user attempting to access authenticated user's order ${orderId}`, {
        orderId,
        orderUserId: order.userId,
        sessionId,
        ipAddress,
      });
      throw new ForbiddenException('You do not have access to this order');
    }

    // Default deny
    this.logger.warn(`Order access denied: Default deny for order ${orderId}`, {
      orderId,
      userId,
      userRole,
      sessionId,
      ipAddress,
    });
    throw new ForbiddenException('Access denied');
  }

  /**
   * Check if a user can cancel a specific order
   *
   * @param orderId - The order ID to check cancellation permissions for
   * @param context - User context including userId, role, and session information
   * @returns Promise<boolean> - True if cancellation is allowed, false otherwise
   */
  async canCancelOrder(
    orderId: string,
    context: OrderAccessContext,
  ): Promise<boolean> {
    const { userId, userRole } = context;

    try {
      // First validate that the user has access to view the order
      await this.validateOrderAccess(orderId, context);

      // Fetch order with status information
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          userId: true,
        },
      });

      if (!order) {
        return false;
      }

      // Check if order status allows cancellation
      const cancellableStatuses = [
        STATUS.ORDER_STATUS.PENDING,
        STATUS.ORDER_STATUS.PROCESSING,
      ];

      if (!cancellableStatuses.includes(order.status as any)) {
        this.logger.log(`Order cancellation denied: Order ${orderId} has non-cancellable status ${order.status}`, {
          orderId,
          userId,
          userRole,
          orderStatus: order.status,
        });
        return false;
      }

      // Admin users can cancel any order (that they have access to)
      if (userRole === STATUS.USER_ROLES.ADMIN) {
        this.logger.log(`Order cancellation allowed: Admin user ${userId} can cancel order ${orderId}`, {
          orderId,
          userId,
          userRole,
          orderStatus: order.status,
        });
        return true;
      }

      // Regular users and guests can cancel their own orders
      this.logger.log(`Order cancellation allowed: User can cancel order ${orderId}`, {
        orderId,
        userId,
        userRole,
        orderStatus: order.status,
      });
      return true;

    } catch (error) {
      // If access validation fails, cancellation is not allowed
      this.logger.warn(`Order cancellation denied: Access validation failed for order ${orderId}`, {
        orderId,
        userId,
        userRole,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get comprehensive access permissions for an order
   *
   * @param orderId - The order ID to get permissions for
   * @param context - User context including userId, role, and session information
   * @returns Promise<AccessValidationResult> - Detailed permissions object
   */
  async getOrderPermissions(
    orderId: string,
    context: OrderAccessContext,
  ): Promise<AccessValidationResult> {
    const { userId, userRole } = context;

    try {
      // Check view access
      const canView = await this.validateOrderAccess(orderId, context);

      // Check cancellation access
      const canCancel = await this.canCancelOrder(orderId, context);

      // Check modification access (admin only)
      const canModify = userRole === STATUS.USER_ROLES.ADMIN;

      return {
        canView,
        canCancel,
        canModify,
      };

    } catch (error) {
      return {
        canView: false,
        canCancel: false,
        canModify: false,
        reason: error.message,
      };
    }
  }

  /**
   * Validate order ownership for authenticated users
   *
   * @param orderId - The order ID to validate ownership for
   * @param userId - The user ID to validate ownership against
   * @returns Promise<boolean> - True if user owns the order
   * @throws NotFoundException if order doesn't exist
   * @throws ForbiddenException if user doesn't own the order
   */
  async validateOrderOwnership(
    orderId: string,
    userId: string,
  ): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      this.logger.warn(`Order ownership validation failed: User ${userId} does not own order ${orderId}`, {
        orderId,
        userId,
        orderUserId: order.userId,
      });
      throw new ForbiddenException('You do not own this order');
    }

    return true;
  }

  /**
   * Log security violation for monitoring and audit purposes
   *
   * @param violation - Type of security violation
   * @param orderId - The order ID involved in the violation
   * @param context - User context for the violation
   * @param details - Additional details about the violation
   */
  logSecurityViolation(
    violation: string,
    orderId: string,
    context: OrderAccessContext,
    details?: any,
  ): void {
    const { userId, userRole, sessionId, ipAddress, userAgent } = context;

    this.logger.error(`Security violation: ${violation}`, {
      violation,
      orderId,
      userId,
      userRole,
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      details,
    });

    // In a production system, this could also:
    // - Send alerts to security monitoring systems
    // - Store violations in a dedicated audit table
    // - Trigger rate limiting or account suspension
  }
}