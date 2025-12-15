import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SYSTEM } from '../common/constants';

@Injectable()
export class ProductsImageService {
  private readonly logger = new Logger(ProductsImageService.name);
  private uploadDir: string;
  private thumbnailDir: string;
  private legacyUploadDir: string;
  private legacyThumbnailDir: string;

  constructor(private prisma: PrismaService) {
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = path.isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);

    this.uploadDir = path.join(baseUploadPath, 'products');
    this.thumbnailDir = path.join(baseUploadPath, 'products', 'thumbnails');

    // Legacy directories for backward compatibility
    this.legacyUploadDir = path.join(baseUploadPath, 'products');
    this.legacyThumbnailDir = path.join(baseUploadPath, 'products', 'thumbnails');

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

  /**
   * Get the upload directory path for a specific product
   * @param productId - The UUID of the product
   * @returns Path to the product's upload directory (e.g., uploads/products/[product-id]/)
   */
  private getProductUploadDir(productId: string): string {
    return path.join(this.uploadDir, productId);
  }

  /**
   * Get the thumbnail directory path for a specific product
   * @param productId - The UUID of the product
   * @returns Path to the product's thumbnail directory (e.g., uploads/products/[product-id]/thumbnails/)
   */
  private getProductThumbnailDir(productId: string): string {
    return path.join(this.uploadDir, productId, 'thumbnails');
  }

  /**
   * Ensure product-specific directories exist
   * @param productId - The UUID of the product
   */
  private async ensureProductDirectories(productId: string): Promise<void> {
    try {
      const productUploadDir = this.getProductUploadDir(productId);
      const productThumbnailDir = this.getProductThumbnailDir(productId);

      await fs.mkdir(productUploadDir, { recursive: true });
      await fs.mkdir(productThumbnailDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directories for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve the physical file path for an image with backward compatibility
   * Checks hierarchical location first, then falls back to legacy flat directory
   * @param imageUrl - The image URL from the database (e.g., /uploads/products/[product-id]/image.jpg)
   * @param isThumbnail - Whether to resolve the thumbnail path
   * @returns Object containing the resolved file path and whether it was found in legacy location
   */
  async resolveImagePath(
    imageUrl: string,
    isThumbnail: boolean = false,
  ): Promise<{ filePath: string; isLegacy: boolean } | null> {
    // Extract the filename and product ID from the URL
    // URL format: /uploads/products/[product-id]/[filename] (new)
    // URL format: /uploads/products/[product-id]/thumbnails/[filename] (new thumbnail)
    // or: /uploads/products/[filename] (legacy)
    // or: /uploads/products/thumbnails/[filename] (legacy thumbnail)
    const urlParts = imageUrl.split('/');

    // Remove empty strings and 'uploads', 'products' from the path
    const relevantParts = urlParts.filter(part => part && part !== 'uploads' && part !== 'products');

    let productId: string | null = null;
    let filename: string;
    let hasThumbnailsInPath = false;

    // Check if 'thumbnails' is in the path
    const thumbnailsIndex = relevantParts.indexOf('thumbnails');
    if (thumbnailsIndex !== -1) {
      hasThumbnailsInPath = true;
      // Remove 'thumbnails' from relevant parts for processing
      relevantParts.splice(thumbnailsIndex, 1);
    }

    if (relevantParts.length === 2) {
      // New format: [product-id]/[filename]
      productId = relevantParts[0];
      filename = relevantParts[1];
    } else if (relevantParts.length === 1) {
      // Legacy format: [filename]
      filename = relevantParts[0];
    } else {
      this.logger.warn(`Invalid image URL format: ${imageUrl}`);
      return null;
    }

    // Determine if we should look for thumbnail based on URL path or parameter
    const lookForThumbnail = isThumbnail || hasThumbnailsInPath;

    // First, try the hierarchical location (new structure)
    if (productId) {
      const hierarchicalPath = lookForThumbnail
        ? path.join(this.getProductThumbnailDir(productId), filename)
        : path.join(this.getProductUploadDir(productId), filename);

      try {
        await fs.access(hierarchicalPath);
        return { filePath: hierarchicalPath, isLegacy: false };
      } catch (error) {
        // File not found in hierarchical location, will try legacy
      }
    }

    // Fall back to legacy flat directory location
    const legacyPath = lookForThumbnail
      ? path.join(this.legacyThumbnailDir, filename)
      : path.join(this.legacyUploadDir, filename);

    try {
      await fs.access(legacyPath);
      this.logger.warn(
        `Image served from legacy location: ${imageUrl}. Consider running migration.`,
      );
      return { filePath: legacyPath, isLegacy: true };
    } catch (error) {
      // File not found in either location
      this.logger.error(`Image file not found in any location: ${imageUrl}`);
      return null;
    }
  }

  /**
   * Check if an image exists at the given URL (with backward compatibility)
   * @param imageUrl - The image URL from the database
   * @returns True if the image exists in either hierarchical or legacy location
   */
  async imageExists(imageUrl: string): Promise<boolean> {
    const resolved = await this.resolveImagePath(imageUrl, false);
    return resolved !== null;
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
    const allowedMimeTypes = [SYSTEM.MIME_TYPES.JPEG, SYSTEM.MIME_TYPES.PNG, SYSTEM.MIME_TYPES.WEBP];
    if (!allowedMimeTypes.includes(file.mimetype as any)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Ensure product-specific directories exist
    await this.ensureProductDirectories(productId);

    // Generate unique filename (without product ID prefix since it's in the directory path)
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}${ext}`;
    const filepath = path.join(this.getProductUploadDir(productId), filename);
    const thumbnailPath = path.join(this.getProductThumbnailDir(productId), filename);

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

      // Save to database with new URL format including product ID in path
      const imageUrl = `/uploads/products/${productId}/${filename}`;

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

    // Ensure product-specific directories exist
    await this.ensureProductDirectories(productId);

    const allowedMimeTypes = [SYSTEM.MIME_TYPES.JPEG, SYSTEM.MIME_TYPES.PNG, SYSTEM.MIME_TYPES.WEBP];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate all files first and collect errors
    const validationErrors: Array<{ filename: string; error: string }> = [];
    const validFiles: Express.Multer.File[] = [];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype as any)) {
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
      // Filename without product ID prefix (since it's in the directory path)
      const filename = `${timestamp}-${randomSuffix}${ext}`;
      const filepath = path.join(this.getProductUploadDir(productId), filename);
      const thumbnailPath = path.join(this.getProductThumbnailDir(productId), filename);

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

        // Database URL format includes product ID in path
        const imageUrl = `/uploads/products/${productId}/${filename}`;
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

    // Check if this is the last image for the product
    const imageCount = await this.prisma.productImage.count({
      where: { productId },
    });

    const isLastImage = imageCount === 1;

    // Store file paths for cleanup
    const filename = path.basename(image.url);
    const productUploadDir = this.getProductUploadDir(productId);
    const filepath = path.join(productUploadDir, filename);
    const thumbnailPath = path.join(this.getProductThumbnailDir(productId), filename);

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
      try {
        if (isLastImage) {
          // If this was the last image, remove the entire product directory
          await fs.rm(productUploadDir, { recursive: true, force: true });
        } else {
          // Otherwise, just remove the specific image files
          await fs.unlink(filepath).catch(() => {});
          await fs.unlink(thumbnailPath).catch(() => {});
        }
      } catch (error) {
        console.error('Error deleting image files:', error);
        // Don't throw - database deletion was successful
      }

      return { message: 'Image deleted successfully' };
    } catch (error) {
      // If database transaction fails, ensure files are still cleaned up
      try {
        if (isLastImage) {
          await fs.rm(productUploadDir, { recursive: true, force: true });
        } else {
          await fs.unlink(filepath).catch(() => {});
          await fs.unlink(thumbnailPath).catch(() => {});
        }
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