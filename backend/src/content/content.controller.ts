import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ContentType } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query('type') type?: ContentType) {
    return this.contentService.findAll(type);
  }

  @Get('published')
  @Public()
  findPublished(@Query('type') type?: ContentType) {
    return this.contentService.findPublished(type);
  }

  @Get('banners')
  @Public()
  getBanners() {
    return this.contentService.getBanners();
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.contentService.findBySlug(slug);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
