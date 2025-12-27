import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BlogCategoryService } from './blog-category.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CONSTANTS } from '@alacraft/shared';

@Controller('blog-categories')
export class BlogCategoryController {
  constructor(private readonly blogCategoryService: BlogCategoryService) {}

  @Post()
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  create(@Body() createBlogCategoryDto: CreateBlogCategoryDto) {
    return this.blogCategoryService.create(createBlogCategoryDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.blogCategoryService.findAll();
  }

  @Get(':slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.blogCategoryService.findBySlug(slug);
  }

  @Patch(':id')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateBlogCategoryDto: UpdateBlogCategoryDto,
  ) {
    return this.blogCategoryService.update(id, updateBlogCategoryDto);
  }

  @Delete(':id')
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  remove(@Param('id') id: string) {
    return this.blogCategoryService.remove(id);
  }
}
