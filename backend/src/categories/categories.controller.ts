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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get('product-images')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  getProductImages() {
    return this.categoriesService.getAvailableProductImages();
  }

  @Get()
  @Public()
  findAll() {
    return this.categoriesService.findAllTree();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
