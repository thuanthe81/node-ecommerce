import { Controller, Get, Patch, Body } from '@nestjs/common';
import { FooterSettingsService } from './footer-settings.service';
import { UpdateFooterSettingsDto } from './dto/update-footer-settings.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';

@Controller('footer-settings')
export class FooterSettingsController {
  constructor(
    private readonly footerSettingsService: FooterSettingsService,
  ) {}

  /**
   * Get footer settings
   * Public endpoint - accessible to all users
   */
  @Get()
  @Public()
  async getFooterSettings() {
    return this.footerSettingsService.getFooterSettings();
  }

  /**
   * Update footer settings
   * Admin only endpoint
   */
  @Patch()
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  async updateFooterSettings(@Body() updateDto: UpdateFooterSettingsDto) {
    return this.footerSettingsService.updateFooterSettings(updateDto);
  }
}
