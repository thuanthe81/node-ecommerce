import { Controller, Post, Body, Get } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { GenerateLabelDto } from './dto/generate-label.dto';
import { ShippingResilienceService } from './services/shipping-resilience.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { STATUS } from '../common/constants';

@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly shippingResilienceService: ShippingResilienceService,
  ) {}

  @Post('calculate')
  @Public()
  async calculateShipping(@Body() calculateShippingDto: CalculateShippingDto) {
    return this.shippingService.calculateShipping(calculateShippingDto);
  }

  @Post('generate-label')
  @Roles(STATUS.USER_ROLES.ADMIN)
  async generateLabel(@Body() generateLabelDto: GenerateLabelDto) {
    return this.shippingService.generateShippingLabel(generateLabelDto);
  }

  @Get('health')
  @Roles(STATUS.USER_ROLES.ADMIN)
  async healthCheck() {
    return this.shippingResilienceService.healthCheck();
  }
}
