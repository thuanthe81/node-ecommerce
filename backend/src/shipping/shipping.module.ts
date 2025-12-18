import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ShippingService } from './shipping.service';
import { ShippingMethodsService } from './shipping-methods.service';
import { ShippingController } from './shipping.controller';
import { ShippingMethodsController } from './shipping-methods.controller';
import { ShippingValidationService } from './services/shipping-validation.service';
import { ShippingResilienceService } from './services/shipping-resilience.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, CacheModule.register()],
  controllers: [ShippingController, ShippingMethodsController],
  providers: [ShippingService, ShippingMethodsService, ShippingValidationService, ShippingResilienceService],
  exports: [ShippingService, ShippingMethodsService, ShippingValidationService, ShippingResilienceService],
})
export class ShippingModule {}
