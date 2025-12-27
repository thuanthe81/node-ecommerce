import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('refund')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  processRefund(@Body() refundDto: RefundPaymentDto) {
    return this.paymentsService.processRefund(refundDto);
  }

  @Get('refund-info/:orderId')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  getRefundInfo(@Param('orderId') orderId: string) {
    return this.paymentsService.getRefundInfo(orderId);
  }
}
