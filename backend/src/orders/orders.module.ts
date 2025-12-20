import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';
import { PDFGeneratorModule } from '../pdf-generator/pdf-generator.module';
import { ShippingModule } from '../shipping/shipping.module';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
  imports: [PrismaModule, FooterSettingsModule, PDFGeneratorModule, ShippingModule, EmailQueueModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
