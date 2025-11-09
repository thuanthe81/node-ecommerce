import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ProductsImageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'products');
  private readonly thumbnailDir = path.join(
    process.cwd(),
    'uploads',
    'products',
    'thumbnails',
  );

  constructor(private prisma: PrismaService) {
    this.ensureUploadDirectories();
  }

  private async ensureUploadDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  async uploadProductImage(
    productId: string,
    file: Express.Multer.File,
    imageDto?: CreateProductImageDto,
  ) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${productId}-${timestamp}${ext}`;
    const filepath = path.join(this.uploadDir, filename);
    const thumbnailPath = path.join(this.thumbnailDir, filename);

    try {
      // Save original image
      await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toFile(filepath);

      // Generate thumbnail
      await sharp(file.buffer)
        .resize(300, 300, {
          fit: 'cover',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Get the next display order
      const lastImage = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { displayOrder: 'desc' },
      });

      const displayOrder =
        imageDto?.displayOrder ?? (lastImage?.displayOrder ?? -1) + 1;

      // Save to database
      const imageUrl = `/uploads/products/${filename}`;
      const productImage = await this.prisma.productImage.create({
        data: {
          productId,
          url: imageUrl,
          altTextEn: imageDto?.altTextEn,
          altTextVi: imageDto?.altTextVi,
          displayOrder,
        },
      });

      return productImage;
    } catch (error) {
      // Clean up files if database operation fails
      try {
        await fs.unlink(filepath);
        await fs.unlink(thumbnailPath);
      } catch (unlinkError) {
        console.error('Error cleaning up files:', unlinkError);
      }
      throw error;
    }
  }

  async deleteProductImage(productId: string, imageId: string) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Find the image
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete from database
    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    // Delete files
    try {
      const filename = path.basename(image.url);
      const filepath = path.join(this.uploadDir, filename);
      const thumbnailPath = path.join(this.thumbnailDir, filename);

      await fs.unlink(filepath).catch(() => {});
      await fs.unlink(thumbnailPath).catch(() => {});
    } catch (error) {
      console.error('Error deleting image files:', error);
    }

    return { message: 'Image deleted successfully' };
  }

  async updateImageOrder(
    productId: string,
    imageId: string,
    displayOrder: number,
  ) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Find the image
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { displayOrder },
    });
  }

  async getProductImages(productId: string) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
