import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ValidatePromotionDto } from './dto/validate-promotion.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { STATUS } from '../common/constants';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles(STATUS.USER_ROLES.ADMIN)
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @Roles(STATUS.USER_ROLES.ADMIN)
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  @Roles(STATUS.USER_ROLES.ADMIN)
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(STATUS.USER_ROLES.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @Roles(STATUS.USER_ROLES.ADMIN)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }

  @Post('validate')
  @Public()
  validate(
    @Body() validatePromotionDto: ValidatePromotionDto,
    @CurrentUser() user?: any,
  ) {
    // Add userId if user is authenticated
    if (user) {
      validatePromotionDto.userId = user.userId;
    }
    return this.promotionsService.validate(validatePromotionDto);
  }
}
