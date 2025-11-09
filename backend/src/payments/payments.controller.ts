import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('refund')
  @Roles(UserRole.ADMIN)
  processRefund(@Body() refundDto: RefundPaymentDto) {
    return this.paymentsService.processRefund(refundDto);
  }

  @Get('refund-info/:orderId')
  @Roles(UserRole.ADMIN)
  getRefundInfo(@Param('orderId') orderId: string) {
    return this.paymentsService.getRefundInfo(orderId);
  }
}
