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
  private uploadDir: string;
  private thumbnailDir: string;

  constructor(private prisma: PrismaService) {
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = path.isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);

    this.uploadDir = path.join(baseUploadPath, 'products');
    this.thumbnailDir = path.join(baseUploadPath, 'products', 'thumbnails');

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

      // Use product name as default alt text if not provided
      const defaultAltTextEn = imageDto?.altTextEn || product.nameEn;
      const defaultAltTextVi = imageDto?.altTextVi || product.nameVi;

      const productImage = await this.prisma.productImage.create({
        data: {
          productId,
          url: imageUrl,
          altTextEn: defaultAltTextEn,
          altTextVi: defaultAltTextVi,
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

  async uploadMultipleImages(
    productId: string,
    files: Express.Multer.File[],
    startOrder: number = 0,
    altTextEn?: string,
    altTextVi?: string,
    skipProductCheck: boolean = false,
    prismaClient?: any,
  ) {
    // Fetch product for validation and default alt text
    let product = null;
    if (!skipProductCheck) {
      product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate all files first and collect errors
    const validationErrors: Array<{ filename: string; error: string }> = [];
    const validFiles: Express.Multer.File[] = [];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        validationErrors.push({
          filename: file.originalname,
          error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        });
      } else if (file.size > maxSize) {
        validationErrors.push({
          filename: file.originalname,
          error: 'File size exceeds 5MB limit',
        });
      } else {
        validFiles.push(file);
      }
    }

    // If no valid files, throw error with all validation errors
    if (validFiles.length === 0 && validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'All files failed validation',
        errors: validationErrors,
      });
    }

    // Process valid files in parallel
    const uploadPromises = validFiles.map(async (file, index) => {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.originalname);
      const filename = `${productId}-${timestamp}-${randomSuffix}${ext}`;
      const filepath = path.join(this.uploadDir, filename);
      const thumbnailPath = path.join(this.thumbnailDir, filename);

      try {
        // Save original image and generate thumbnail in parallel
        await Promise.all([
          sharp(file.buffer)
            .resize(1200, 1200, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({ quality: 90 })
            .toFile(filepath),
          sharp(file.buffer)
            .resize(300, 300, {
              fit: 'cover',
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath),
        ]);

        const imageUrl = `/uploads/products/${filename}`;
        const displayOrder = startOrder + index;

        // Use product name as default alt text if not provided
        const defaultAltTextEn = altTextEn || product?.nameEn || '';
        const defaultAltTextVi = altTextVi || product?.nameVi || '';

        return {
          productId,
          url: imageUrl,
          altTextEn: defaultAltTextEn,
          altTextVi: defaultAltTextVi,
          displayOrder,
          filepath,
          thumbnailPath,
        };
      } catch (error) {
        // Clean up files on error
        try {
          await fs.unlink(filepath).catch(() => {});
          await fs.unlink(thumbnailPath).catch(() => {});
        } catch (unlinkError) {
          console.error('Error cleaning up files:', unlinkError);
        }
        throw new BadRequestException({
          filename: file.originalname,
          error: 'Failed to process image',
        });
      }
    });

    try {
      const processedImages = await Promise.all(uploadPromises);

      // Use transaction client if provided, otherwise use default prisma client
      const client = prismaClient || this.prisma;

      // Save all images to database in a single operation
      const createdImages = await client.productImage.createMany({
        data: processedImages.map(({ filepath, thumbnailPath, ...data }) => data),
      });

      // Fetch the created images to return with IDs
      const images = await client.productImage.findMany({
        where: {
          productId,
          displayOrder: {
            gte: startOrder,
            lt: startOrder + validFiles.length,
          },
        },
        orderBy: { displayOrder: 'asc' },
      });

      return {
        images,
        errors: validationErrors.length > 0 ? validationErrors : undefined,
      };
    } catch (error) {
      // Clean up all uploaded files if database operation fails
      const processedImages = await Promise.allSettled(uploadPromises);
      for (const result of processedImages) {
        if (result.status === 'fulfilled') {
          try {
            await fs.unlink(result.value.filepath).catch(() => {});
            await fs.unlink(result.value.thumbnailPath).catch(() => {});
          } catch (unlinkError) {
            console.error('Error cleaning up files:', unlinkError);
          }
        }
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

    // Store file paths for cleanup
    const filename = path.basename(image.url);
    const filepath = path.join(this.uploadDir, filename);
    const thumbnailPath = path.join(this.thumbnailDir, filename);

    try {
      // Delete from database and normalize display order in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete the image record
        await tx.productImage.delete({
          where: { id: imageId },
        });

        // Get remaining images and normalize their display order
        const remainingImages = await tx.productImage.findMany({
          where: { productId },
          orderBy: { displayOrder: 'asc' },
        });

        // Update display orders to be sequential (0, 1, 2, ...)
        await Promise.all(
          remainingImages.map((img, index) =>
            tx.productImage.update({
              where: { id: img.id },
              data: { displayOrder: index },
            }),
          ),
        );
      });

      // Delete files after successful database transaction
      // File cleanup happens outside transaction to ensure it occurs even if normalization fails
      try {
        await fs.unlink(filepath).catch(() => {});
        await fs.unlink(thumbnailPath).catch(() => {});
      } catch (error) {
        console.error('Error deleting image files:', error);
        // Don't throw - database deletion was successful
      }

      return { message: 'Image deleted successfully' };
    } catch (error) {
      // If database transaction fails, ensure files are still cleaned up
      try {
        await fs.unlink(filepath).catch(() => {});
        await fs.unlink(thumbnailPath).catch(() => {});
      } catch (cleanupError) {
        console.error('Error cleaning up files after failed deletion:', cleanupError);
      }
      throw error;
    }
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

  async updateImageMetadata(
    productId: string,
    imageId: string,
    updateData: {
      altTextEn?: string;
      altTextVi?: string;
      displayOrder?: number;
    },
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

    // Update the image with provided fields
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: updateData,
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

  async reorderImages(
    productId: string,
    orderMap: Array<{ imageId: string; displayOrder: number }>,
  ) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate all images belong to the product
    const imageIds = orderMap.map((item) => item.imageId);
    const images = await this.prisma.productImage.findMany({
      where: {
        id: { in: imageIds },
        productId,
      },
    });

    if (images.length !== imageIds.length) {
      throw new BadRequestException(
        'One or more images do not belong to this product',
      );
    }

    // Update display orders in a transaction
    await this.prisma.$transaction(
      orderMap.map((item) =>
        this.prisma.productImage.update({
          where: { id: item.imageId },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    // Return updated images in new order
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  private async normalizeDisplayOrder(productId: string): Promise<void> {
    // Query all images for the product ordered by displayOrder
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });

    // Update display orders to be sequential (0, 1, 2, ...) in a transaction
    await this.prisma.$transaction(
      images.map((image, index) =>
        this.prisma.productImage.update({
          where: { id: image.id },
          data: { displayOrder: index },
        }),
      ),
    );
  }
}