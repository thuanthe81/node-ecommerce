import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AccessControlService } from './services/access-control.service';
import { OrderCancellationService } from './services/order-cancellation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';
import { PDFGeneratorModule } from '../pdf-generator/pdf-generator.module';
import { ShippingModule } from '../shipping/shipping.module';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
  imports: [PrismaModule, FooterSettingsModule, forwardRef(() => PDFGeneratorModule), ShippingModule, forwardRef(() => EmailQueueModule)],
  controllers: [OrdersController],
  providers: [OrdersService, AccessControlService, OrderCancellationService],
  exports: [OrdersService, AccessControlService, OrderCancellationService],
})
export class OrdersModule {}
