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
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { SetOrderItemPriceDto } from './dto/set-order-item-price.dto';
import { ResendEmailDto } from './dto/resend-email.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { STATUS } from '../common/constants';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
    if (user.role === STATUS.USER_ROLES.CUSTOMER) {
      return this.ordersService.findAllByUser(user.userId);
    }

    // Admins can see all orders
    return this.ordersService.findAll();
  }

  @Get('admin/all')
  @Roles(STATUS.USER_ROLES.ADMIN)
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
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { userId: string; role: UserRole },
  ) {
    return this.ordersService.findOne(id, user?.userId, user?.role);
  }

  @Patch(':id/status')
  @Roles(STATUS.USER_ROLES.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Patch(':id/payment-status')
  @Roles(STATUS.USER_ROLES.ADMIN)
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, updatePaymentStatusDto);
  }

  @Patch(':orderId/items/:orderItemId/price')
  @Roles(STATUS.USER_ROLES.ADMIN)
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
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while resending the email',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}