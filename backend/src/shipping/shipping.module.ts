import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ShippingService } from './shipping.service';
import { ShippingMethodsService } from './shipping-methods.service';
import { ShippingController } from './shipping.controller';
import { ShippingMethodsController } from './shipping-methods.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ShippingController, ShippingMethodsController],
  providers: [ShippingService, ShippingMethodsService],
  exports: [ShippingService, ShippingMethodsService],
})
export class ShippingModule {}
