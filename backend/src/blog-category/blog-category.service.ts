import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@Injectable()
export class BlogCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createBlogCategoryDto: CreateBlogCategoryDto) {
    // Check if slug already exists
    const existingCategory = await this.prisma.blogCategory.findUnique({
      where: { slug: createBlogCategoryDto.slug },
    });

    if (existingCategory) {
      throw new BadRequestException(
        'Blog category with this slug already exists',
      );
    }

    const category = await this.prisma.blogCategory.create({
      data: createBlogCategoryDto,
    });

    return category;
  }

  async findAll() {
    return this.prisma.blogCategory.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    return category;
  }

  async update(id: string, updateBlogCategoryDto: UpdateBlogCategoryDto) {
    // Check if category exists
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    // If slug is being updated, check for conflicts
    if (
      updateBlogCategoryDto.slug !== undefined &&
      updateBlogCategoryDto.slug !== category.slug
    ) {
      const existingCategory = await this.prisma.blogCategory.findUnique({
        where: { slug: updateBlogCategoryDto.slug },
      });

      if (existingCategory) {
        throw new BadRequestException(
          'Blog category with this slug already exists',
        );
      }
    }

    const updated = await this.prisma.blogCategory.update({
      where: { id },
      data: updateBlogCategoryDto,
    });

    return updated;
  }

  async remove(id: string) {
    // Check if category exists
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    // Delete category - associations will be cascade deleted
    const deleted = await this.prisma.blogCategory.delete({
      where: { id },
    });

    return deleted;
  }

  async associateCategories(contentId: string, categoryIds: string[]) {
    // Validate that all category IDs exist
    const categories = await this.prisma.blogCategory.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      const foundIds = categories.map((c) => c.id);
      const missingIds = categoryIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Blog categories not found: ${missingIds.join(', ')}`,
      );
    }

    // Create associations
    await this.prisma.blogCategoryAssociation.createMany({
      data: categoryIds.map((categoryId) => ({
        contentId,
        categoryId,
      })),
      skipDuplicates: true,
    });
  }

  async dissociateCategories(contentId: string, categoryIds: string[]) {
    // Delete associations
    await this.prisma.blogCategoryAssociation.deleteMany({
      where: {
        contentId,
        categoryId: { in: categoryIds },
      },
    });
  }

  async getCategoriesForPost(contentId: string) {
    const associations = await this.prisma.blogCategoryAssociation.findMany({
      where: { contentId },
      include: {
        category: true,
      },
    });

    return associations.map((assoc) => assoc.category);
  }
}
