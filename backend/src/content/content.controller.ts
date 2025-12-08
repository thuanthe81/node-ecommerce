import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Get('types')
  @Public()
  getContentTypes() {
    return this.contentService.getContentTypes();
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

  @Get('homepage-sections')
  @Public()
  getHomepageSections() {
    return this.contentService.getHomepageSections();
  }

  @Get('blog')
  @Public()
  getBlogPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categorySlug') categorySlug?: string,
  ) {
    return this.contentService.findBlogPosts({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      categorySlug,
      published: true,
    });
  }

  @Get('blog/:slug')
  @Public()
  getBlogPostBySlug(@Param('slug') slug: string) {
    return this.contentService.findBlogPostBySlug(slug, true);
  }

  @Get('blog/:id/related')
  @Public()
  getRelatedPosts(@Param('id') id: string) {
    return this.contentService.findRelatedPosts(id, 3);
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

  @Post('upload-image')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.contentService.uploadContentImage(file);
  }
}
