import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { ProductsImageService } from './products-image.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CONSTANTS } from '@alacraft/shared';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productsImageService: ProductsImageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // If files are provided, use createWithImages, otherwise use regular create
    if (files && files.length > 0) {
      // Validate files
      const allowedMimeTypes = [CONSTANTS.SYSTEM.MIME_TYPES.JPEG, CONSTANTS.SYSTEM.MIME_TYPES.PNG, CONSTANTS.SYSTEM.MIME_TYPES.WEBP];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const invalidFiles = files.filter(
        (file) =>
          !allowedMimeTypes.includes(file.mimetype as any) || file.size > maxSize,
      );

      if (invalidFiles.length === files.length) {
        // All files are invalid
        throw new Error('All uploaded files are invalid');
      }

      // Extract alt text from body if provided
      const altTextEn = createProductDto['altTextEn' as keyof CreateProductDto];
      const altTextVi = createProductDto['altTextVi' as keyof CreateProductDto];

      return this.productsService.createWithImages(
        createProductDto,
        files,
        altTextEn as string | undefined,
        altTextVi as string | undefined,
      );
    }

    return this.productsService.create(createProductDto);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  getCount() {
    return this.productsService.getCount();
  }

  @Get()
  @Public()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @Public()
  search(@Query('q') searchTerm: string, @Query('limit') limit?: number) {
    return this.productsService.search(searchTerm, limit);
  }

  @Get(':slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Image management endpoints
  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('id') productId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() imageDto?: CreateProductImageDto,
  ) {
    return this.productsImageService.uploadProductImage(
      productId,
      file,
      imageDto,
    );
  }

  @Get(':id/images')
  @Public()
  getImages(@Param('id') productId: string) {
    return this.productsImageService.getProductImages(productId);
  }

  @Patch(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  updateImageMetadata(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
    @Body() updateDto: UpdateProductImageDto,
  ) {
    return this.productsImageService.updateImageMetadata(
      productId,
      imageId,
      updateDto,
    );
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  deleteImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsImageService.deleteProductImage(productId, imageId);
  }

  @Patch(':id/images/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CONSTANTS.STATUS.USER_ROLES.ADMIN)
  reorderImages(
    @Param('id') productId: string,
    @Body() reorderDto: ReorderImagesDto,
  ) {
    return this.productsImageService.reorderImages(productId, reorderDto.images);
  }
}
