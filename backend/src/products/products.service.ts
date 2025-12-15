import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '@prisma/client';
import { ProductsImageService } from './products-image.service';
import { CACHE_KEYS } from '../common/constants';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private productsImageService: ProductsImageService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: createProductDto.slug },
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this slug already exists');
    }

    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new BadRequestException('Product with this SKU already exists');
    }

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // Invalidate product list cache
    await this.invalidateProductCache();

    return product;
  }

  async createWithImages(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    altTextEn?: string,
    altTextVi?: string,
  ) {
    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: createProductDto.slug },
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this slug already exists');
    }

    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new BadRequestException('Product with this SKU already exists');
    }

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Use a transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: createProductDto,
        include: {
          category: true,
        },
      });

      // Upload images if provided
      let imageResult;
      if (files && files.length > 0) {
        try {
          imageResult = await this.productsImageService.uploadMultipleImages(
            product.id,
            files,
            0,
            altTextEn,
            altTextVi,
            true, // Skip product check since we're in a transaction
            tx, // Pass transaction client
          );
        } catch (error) {
          // If image upload fails, the transaction will rollback
          throw error;
        }
      }

      // Fetch the complete product with images
      const completeProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      // Invalidate product list cache
      await this.invalidateProductCache();

      return {
        ...completeProduct,
        imageErrors: imageResult?.errors,
      };
    });
  }

  async findAll(query: QueryProductsDto) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // Generate cache key based on query parameters
    const cacheKey = `${CACHE_KEYS.PRODUCTS.LIST}:${JSON.stringify(query)}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Search filter - full-text search on name and description
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameVi: { contains: search, mode: 'insensitive' } },
        { descriptionEn: { contains: search, mode: 'insensitive' } },
        { descriptionVi: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Stock filter
    if (inStock !== undefined) {
      if (inStock) {
        where.stockQuantity = { gt: 0 };
      } else {
        where.stockQuantity = { lte: 0 };
      }
    }
    // Featured filter
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.nameEn = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: { displayOrder: 'asc' },
            take: 1,
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: {
        productId: id,
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
    });

    return {
      ...product,
      averageRating: avgRating._avg.rating || 0,
    };
  }

  async findBySlug(slug: string) {
    // Try to get from cache
    const cacheKey = CACHE_KEYS.PRODUCTS.BY_SLUG(slug);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: {
        productId: product.id,
        isApproved: true,
      },
      _avg: {
        rating: true,
      },
    });

    // Get related products from same category
    const relatedProducts = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const result = {
      ...product,
      averageRating: avgRating._avg.rating || 0,
      relatedProducts,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If slug is being updated, check for conflicts
    if (
      updateProductDto.slug !== undefined &&
      updateProductDto.slug !== product.slug
    ) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug: updateProductDto.slug },
      });

      if (existingProduct) {
        throw new BadRequestException('Product with this slug already exists');
      }
    }

    // If SKU is being updated, check for conflicts
    if (
      updateProductDto.sku !== undefined &&
      updateProductDto.sku !== product.sku
    ) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });

      if (existingSku) {
        throw new BadRequestException('Product with this SKU already exists');
      }
    }

    // If category is being updated, verify it exists
    if (updateProductDto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // Invalidate cache for this product
    await this.cacheManager.del(CACHE_KEYS.PRODUCTS.BY_SLUG(product.slug));
    await this.cacheManager.del(CACHE_KEYS.PRODUCTS.BY_ID(id));
    await this.invalidateProductCache();

    return updatedProduct;
  }

  async remove(id: string) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            cartItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product has been ordered
    if (product._count.orderItems > 0) {
      throw new BadRequestException(
        'Cannot delete product that has been ordered. Consider deactivating it instead.',
      );
    }

    // Remove from carts before deleting
    if (product._count.cartItems > 0) {
      await this.prisma.cartItem.deleteMany({
        where: { productId: id },
      });
    }

    const deleted = await this.prisma.product.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cacheManager.del(CACHE_KEYS.PRODUCTS.BY_SLUG(product.slug));
    await this.cacheManager.del(CACHE_KEYS.PRODUCTS.BY_ID(id));
    await this.invalidateProductCache();

    return deleted;
  }

  async search(searchTerm: string, limit: number = 10) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { nameEn: { contains: searchTerm, mode: 'insensitive' } },
          { nameVi: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
      },
      take: limit,
    });
  }

  async getCount() {
    const count = await this.prisma.product.count();
    return { count };
  }

  /**
   * Check if a product is a contact-for-price product (zero price)
   */
  isContactForPrice(product: { price: any }): boolean {
    return Number(product.price) === 0;
  }

  // Helper method to invalidate product list cache
  // Note: This is a simplified approach. In production, consider using:
  // - Cache tags for better invalidation
  // - A separate cache namespace for products
  // - Redis SCAN command for pattern-based deletion
  private async invalidateProductCache() {
    // For now, we rely on TTL expiration for list caches
    // Individual product caches are deleted explicitly in update/delete methods
  }
}