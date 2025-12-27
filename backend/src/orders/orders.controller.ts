import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { AccessControlService } from './services/access-control.service';
import { OrderCancellationService } from './services/order-cancellation.service';
import { ErrorHandlingService } from '../common/services/error-handling.service';
import { EnhancedRateLimitGuard } from '../common/guards/enhanced-rate-limit.guard';
import { EnhancedRateLimit } from '../common/decorators/enhanced-rate-limit.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { SetOrderItemPriceDto } from './dto/set-order-item-price.dto';
import { ResendEmailDto } from './dto/resend-email.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';
import type { Request } from 'express';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly accessControlService: AccessControlService,
    private readonly orderCancellationService: OrderCancellationService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}

  @Post()
  @Public()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user?: { userId: string },
  ) {
    return this.ordersService.create(createOrderDto, user?.userId);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string; role: UserRole }) {
    // Regular users get their own orders
    if (user.role === CONSTANTS.STATUS.USER_ROLES.CUSTOMER) {
      return this.ordersService.findAllByUser(user.userId);
    }

    // Admins can see all orders
    return this.ordersService.findAll();
  }

  @Get('admin/all')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  findAllAdmin(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (paymentStatus) {
      filters.paymentStatus = paymentStatus;
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    if (search) {
      filters.search = search;
    }

    return this.ordersService.findAll(filters);
  }

  @Get(':id')
  @Public()
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { userId: string; role: UserRole },
    @Req() request?: Request,
  ) {
    try {
      // Build access context from request
      const accessContext = {
        userId: user?.userId,
        userRole: user?.role,
        sessionId: (request as any)?.sessionID || (request as any)?.session?.id,
        ipAddress: request?.ip || (request?.connection as any)?.remoteAddress,
        userAgent: request?.get('User-Agent'),
      };

      // Validate access using the access control service
      await this.accessControlService.validateOrderAccess(id, accessContext);

      // If access is granted, fetch the order using the existing service method
      const order = await this.ordersService.findOne(id, user?.userId, user?.role);

      // Get additional permissions for the response
      const permissions = await this.accessControlService.getOrderPermissions(id, accessContext);

      return {
        ...order,
        permissions,
      };

    } catch (error) {
      // Log security violations
      if (error.status === HttpStatus.FORBIDDEN) {
        this.accessControlService.logSecurityViolation(
          'UNAUTHORIZED_ORDER_ACCESS',
          id,
          {
            userId: user?.userId,
            userRole: user?.role,
            sessionId: (request as any)?.sessionID || (request as any)?.session?.id,
            ipAddress: request?.ip || (request?.connection as any)?.remoteAddress,
            userAgent: request?.get('User-Agent'),
          },
          { errorMessage: error.message }
        );
      }

      // Re-throw the error to maintain existing error handling
      throw error;
    }
  }

  @Patch(':id/cancel')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 cancellation attempts per minute (NestJS throttler)
  @UseGuards(EnhancedRateLimitGuard) // Additional enhanced rate limiting
  @EnhancedRateLimit({
    windowMs: 60000, // 1 minute window
    maxRequests: 2, // More restrictive: 2 requests per minute with enhanced tracking
  })
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @CurrentUser() user?: { userId: string; role: UserRole },
    @Req() request?: Request,
  ) {
    try {
      // Build access context from request
      const accessContext = {
        userId: user?.userId,
        userRole: user?.role,
        sessionId: (request as any)?.sessionID || (request as any)?.session?.id,
        ipAddress: request?.ip || (request?.connection as any)?.remoteAddress,
        userAgent: request?.get('User-Agent'),
      };

      // Perform the cancellation
      const result = await this.orderCancellationService.cancelOrder(
        id,
        accessContext,
        cancelOrderDto.reason,
      );

      if (!result.success) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: result.message,
        order: result.order,
        emailSent: result.emailSent,
        success: true,
      };

    } catch (error) {
      // Build error context for comprehensive logging
      const errorContext = {
        userId: user?.userId,
        userRole: user?.role,
        orderId: id,
        ipAddress: request?.ip || (request?.connection as any)?.remoteAddress,
        userAgent: request?.get('User-Agent'),
        endpoint: `/orders/${id}/cancel`,
        method: 'PATCH',
        timestamp: new Date(),
      };

      // Log security violations and cancellation failures
      if (error.status === HttpStatus.FORBIDDEN) {
        this.accessControlService.logSecurityViolation(
          'UNAUTHORIZED_ORDER_CANCELLATION',
          id,
          {
            userId: user?.userId,
            userRole: user?.role,
            sessionId: (request as any)?.sessionID || (request as any)?.session?.id,
            ipAddress: request?.ip || (request?.connection as any)?.remoteAddress,
            userAgent: request?.get('User-Agent'),
          },
          {
            errorMessage: error.message,
            reason: cancelOrderDto.reason,
          }
        );
      }

      // Enhanced error handling and logging
      this.errorHandlingService.logError(error, errorContext, {
        operation: 'cancelOrder',
        reason: cancelOrderDto.reason,
        throttleInfo: {
          limit: 3,
          ttl: 60000,
        },
      });

      // Classify error and create appropriate response
      const errorDetails = this.errorHandlingService.classifyError(error, errorContext);
      const httpException = this.errorHandlingService.createHttpException(errorDetails);

      // Log cancellation attempt failures with enhanced details
      this.logger.error(`Order cancellation failed for order ${id}:`, {
        orderId: id,
        userId: user?.userId,
        userRole: user?.role,
        reason: cancelOrderDto.reason,
        errorCode: errorDetails.code,
        errorMessage: errorDetails.message,
        statusCode: errorDetails.statusCode,
        isRetryable: errorDetails.isRetryable,
        retryAfter: errorDetails.retryAfter,
        timestamp: new Date().toISOString(),
      });

      throw httpException;
    }
  }

  @Patch(':id/status')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Patch(':id/payment-status')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, updatePaymentStatusDto);
  }

  @Patch(':orderId/items/:orderItemId/price')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  setOrderItemPrice(
    @Param('orderId') orderId: string,
    @Param('orderItemId') orderItemId: string,
    @Body() setOrderItemPriceDto: SetOrderItemPriceDto,
  ) {
    return this.ordersService.setOrderItemPrice(
      orderId,
      orderItemId,
      setOrderItemPriceDto,
    );
  }

  @Post(':orderNumber/resend-email')
  @Public()
  @UseGuards(EnhancedRateLimitGuard)
  @EnhancedRateLimit({
    windowMs: 300000, // 5 minute window
    maxRequests: 3, // 3 email resend requests per 5 minutes
  })
  async resendEmail(
    @Param('orderNumber') orderNumber: string,
    @Body() resendEmailDto: ResendEmailDto,
  ) {
    try {
      const result = await this.ordersService.resendOrderConfirmationEmail(
        orderNumber,
        resendEmailDto.email,
        resendEmailDto.locale || 'vi'
      );

      if (!result.success) {
        if (result.rateLimited) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: result.message,
              error: 'Too Many Requests',
              rateLimited: true,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: result.error || 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: result.message,
        success: true,
      };

    } catch (error) {
      // Enhanced error handling for email resend
      const errorContext = {
        orderNumber,
        endpoint: `/orders/${orderNumber}/resend-email`,
        method: 'POST',
        timestamp: new Date(),
      };

      this.errorHandlingService.logError(error, errorContext, {
        operation: 'resendEmail',
        email: resendEmailDto.email,
        locale: resendEmailDto.locale,
      });

      // Handle email service failures gracefully
      if (error.message?.includes('email') || error.code === 'EMAIL_SERVICE_UNAVAILABLE') {
        const emailErrorDetails = this.errorHandlingService.handleEmailServiceFailure(error, errorContext);
        const httpException = this.errorHandlingService.createHttpException(emailErrorDetails);
        throw httpException;
      }

      if (error instanceof HttpException) {
        throw error;
      }

      // Classify and handle other errors
      const errorDetails = this.errorHandlingService.classifyError(error, errorContext);
      const httpException = this.errorHandlingService.createHttpException(errorDetails);
      throw httpException;
    }
  }
}