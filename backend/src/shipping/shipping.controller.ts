import { Controller, Post, Body } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { GenerateLabelDto } from './dto/generate-label.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate')
  @Public()
  async calculateShipping(@Body() calculateShippingDto: CalculateShippingDto) {
    return this.shippingService.calculateShipping(calculateShippingDto);
  }

  @Post('generate-label')
  @Roles(UserRole.ADMIN)
  async generateLabel(@Body() generateLabelDto: GenerateLabelDto) {
    return this.shippingService.generateShippingLabel(generateLabelDto);
  }
}
