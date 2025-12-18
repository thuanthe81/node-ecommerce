import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';
import { PDFGeneratorModule } from '../pdf-generator/pdf-generator.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [PrismaModule, NotificationsModule, FooterSettingsModule, PDFGeneratorModule, ShippingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
