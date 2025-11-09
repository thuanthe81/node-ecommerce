import { Controller, Post, Body } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate')
  @Public()
  async calculateShipping(@Body() calculateShippingDto: CalculateShippingDto) {
    return this.shippingService.calculateShipping(calculateShippingDto);
  }
}
