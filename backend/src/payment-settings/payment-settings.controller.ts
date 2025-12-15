import {
  Controller,
  Get,
  Put,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentSettingsService } from './payment-settings.service';
import { UpdateBankTransferSettingsDto } from './dto/update-bank-transfer-settings.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { STATUS } from '../common/constants';

@Controller('payment-settings')
export class PaymentSettingsController {
  constructor(
    private readonly paymentSettingsService: PaymentSettingsService,
  ) {}

  /**
   * Get bank transfer settings
   * Public endpoint - accessible to all users
   */
  @Get('bank-transfer')
  @Public()
  async getBankTransferSettings() {
    return this.paymentSettingsService.getBankTransferSettings();
  }

  /**
   * Update bank transfer settings
   * Admin only endpoint
   * Supports file upload for QR code image
   */
  @Put('bank-transfer')
  @Roles(STATUS.USER_ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('qrCodeImage'))
  async updateBankTransferSettings(
    @Body() updateDto: UpdateBankTransferSettingsDto,
    @UploadedFile() qrCodeImage?: Express.Multer.File,
  ) {
    return this.paymentSettingsService.updateBankTransferSettings(
      updateDto,
      qrCodeImage,
    );
  }
}
