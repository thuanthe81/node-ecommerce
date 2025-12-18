import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShippingMethodsService } from './shipping-methods.service';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { STATUS } from '../common/constants';

@Controller('shipping-methods')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(STATUS.USER_ROLES.ADMIN)
export class ShippingMethodsController {
  constructor(
    private readonly shippingMethodsService: ShippingMethodsService,
  ) {}

  /**
   * Create a new shipping method
   * POST /shipping-methods
   * Admin only
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createShippingMethodDto: CreateShippingMethodDto) {
    return this.shippingMethodsService.create(createShippingMethodDto);
  }

  /**
   * Get all shipping methods (including inactive)
   * GET /shipping-methods
   * Admin only
   */
  @Get()
  async findAll() {
    return this.shippingMethodsService.findAll();
  }

  /**
   * Get all active shipping methods
   * GET /shipping-methods/active
   * Admin only
   */
  @Get('active')
  async findAllActive() {
    return this.shippingMethodsService.findAllActive();
  }

  /**
   * Get a single shipping method by ID
   * GET /shipping-methods/:id
   * Admin only
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shippingMethodsService.findOne(id);
  }

  /**
   * Update a shipping method
   * PATCH /shipping-methods/:id
   * Admin only
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateShippingMethodDto: UpdateShippingMethodDto,
  ) {
    return this.shippingMethodsService.update(id, updateShippingMethodDto);
  }

  /**
   * Delete a shipping method
   * DELETE /shipping-methods/:id
   * Admin only
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.shippingMethodsService.remove(id);
  }

  /**
   * Get translation validation warnings
   * GET /shipping-methods/validation/warnings
   * Admin only
   */
  @Get('validation/warnings')
  async getTranslationWarnings() {
    const warnings = await this.shippingMethodsService.getTranslationWarnings();
    return {
      warnings,
      hasWarnings: warnings.length > 0,
    };
  }

  /**
   * Validate all shipping method translations
   * GET /shipping-methods/validation/translations
   * Admin only
   */
  @Get('validation/translations')
  async validateTranslations() {
    return this.shippingMethodsService.validateTranslations();
  }
}
