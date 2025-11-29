import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this slug already exists');
    }

    // If parentId is provided, verify parent exists
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    // Invalidate category cache
    await this.invalidateCategoryCache();

    return category;
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAllTree() {
    // Try to get from cache
    const cacheKey = 'categories:tree';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get all root categories (no parent)
    const rootCategories = await this.prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
            },
            _count: {
              select: { products: true },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, rootCategories, 1800000);

    return rootCategories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    // Try to get from cache
    const cacheKey = `category:slug:${slug}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, category, 1800000);

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // If slug is being updated, check for conflicts
    if (
      updateCategoryDto.slug !== undefined &&
      updateCategoryDto.slug !== category.slug
    ) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });

      if (existingCategory) {
        throw new BadRequestException('Category with this slug already exists');
      }
    }

    // If parentId is being updated, verify parent exists and prevent circular reference
    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parent = await this.prisma.category.findUnique({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }

      // Check if the new parent is a descendant of this category
      const isDescendant = await this.isDescendant(
        id,
        updateCategoryDto.parentId,
      );
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set a descendant category as parent',
        );
      }
    }

    // If imageUrl is being updated, validate it references an existing product image
    if (updateCategoryDto.imageUrl !== undefined && updateCategoryDto.imageUrl !== null && updateCategoryDto.imageUrl !== '') {
      const isValid = await this.validateProductImageUrl(updateCategoryDto.imageUrl);
      if (!isValid) {
        throw new BadRequestException(
          'Invalid image URL. Must reference an existing product image.',
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`category:slug:${category.slug}`);
    await this.cacheManager.del(`category:id:${id}`);
    await this.invalidateCategoryCache();

    return updated;
  }

  async remove(id: string) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has children
    if (category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories',
      );
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new BadRequestException('Cannot delete category with products');
    }

    const deleted = await this.prisma.category.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cacheManager.del(`category:slug:${category.slug}`);
    await this.cacheManager.del(`category:id:${id}`);
    await this.invalidateCategoryCache();

    return deleted;
  }

  // Helper method to check if a category is a descendant of another
  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    const descendant = await this.prisma.category.findUnique({
      where: { id: descendantId },
      include: { parent: true },
    });

    if (!descendant) {
      return false;
    }

    if (!descendant.parentId) {
      return false;
    }

    if (descendant.parentId === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parentId);
  }

  // Get all available product images with metadata
  async getAvailableProductImages() {
    const productImages = await this.prisma.productImage.findMany({
      include: {
        product: {
          select: {
            id: true,
            nameEn: true,
            nameVi: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Deduplicate by URL - keep first occurrence of each unique URL
    const seenUrls = new Set<string>();
    const uniqueImages = productImages.filter((image) => {
      if (seenUrls.has(image.url)) {
        return false;
      }
      seenUrls.add(image.url);
      return true;
    });

    // Map to response format
    return uniqueImages.map((image) => ({
      id: image.id,
      url: image.url,
      productId: image.productId,
      productNameEn: image.product.nameEn,
      productNameVi: image.product.nameVi,
      altTextEn: image.altTextEn,
      altTextVi: image.altTextVi,
    }));
  }

  // Validate that an imageUrl references an existing product image
  async validateProductImageUrl(imageUrl: string): Promise<boolean> {
    // Check if it's a relative path (starts with / or ./)
    const isRelativePath = imageUrl.startsWith('/') || imageUrl.startsWith('./') || imageUrl.startsWith('../');

    if (isRelativePath) {
      // For relative paths, check if any product image URL ends with this path
      // This handles cases where the database stores full URLs but the form uses relative paths
      const images = await this.prisma.productImage.findMany({
        where: {
          url: {
            endsWith: imageUrl.startsWith('/') ? imageUrl : imageUrl.replace(/^\.\.?\//, ''),
          },
        },
      });
      return images.length > 0;
    }

    // For absolute URLs, check for exact match
    const image = await this.prisma.productImage.findFirst({
      where: { url: imageUrl },
    });
    return !!image;
  }

  // Helper method to invalidate category cache
  private async invalidateCategoryCache() {
    // Delete the main category tree cache
    await this.cacheManager.del('categories:tree');
    // Note: Individual category caches are deleted explicitly in update/delete methods
    // In production, consider using cache tags or Redis SCAN for pattern-based deletion
  }
}
