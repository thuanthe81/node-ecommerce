import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';

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
    if (user.role === UserRole.CUSTOMER) {
      return this.ordersService.findAllByUser(user.userId);
    }

    // Admins can see all orders
    return this.ordersService.findAll();
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  findAllAdmin(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
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

    return this.ordersService.findAll(filters);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { userId: string; role: UserRole },
  ) {
    return this.ordersService.findOne(id, user?.userId, user?.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
