import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { Content, ContentType } from '@prisma/client';
import { BlogCategoryService } from '../blog-category/blog-category.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CONSTANTS } from '@alacraft/shared';

@Injectable()
export class ContentService {
  private readonly HOMEPAGE_SECTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Blog cache keys and TTLs
  private readonly BLOG_LIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly BLOG_POST_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly BLOG_RELATED_CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private blogCategoryService: BlogCategoryService,
  ) {}

  async getContentTypes(): Promise<string[]> {
    // Return all available content types from the ContentType enum
    return Object.values(ContentType);
  }

  async create(createContentDto: CreateContentDto): Promise<Content> {
    // Check if slug already exists
    const existing = await this.prisma.content.findUnique({
      where: { slug: createContentDto.slug },
    });

    if (existing) {
      throw new BadRequestException('Content with this slug already exists');
    }

    // Validate homepage section specific requirements
    if (createContentDto.type === ContentType.HOMEPAGE_SECTION) {
      this.validateHomepageSection(createContentDto);
    }

    // Validate blog post specific requirements
    if (createContentDto.type === ContentType.BLOG) {
      await this.validateBlogPost(createContentDto);
    }

    // Extract categoryIds before creating content (not a database field)
    const { categoryIds, ...contentData } = createContentDto as any;

    const content = await this.prisma.content.create({
      data: {
        ...contentData,
        publishedAt: createContentDto.isPublished ? new Date() : null,
      },
    });

    // Associate categories for blog posts
    if (createContentDto.type === ContentType.BLOG && categoryIds?.length > 0) {
      await this.blogCategoryService.associateCategories(
        content.id,
        categoryIds,
      );
    }

    // Invalidate homepage sections cache if creating a homepage section
    if (createContentDto.type === ContentType.HOMEPAGE_SECTION) {
      await this.invalidateHomepageSectionsCache();
    }

    // Invalidate blog caches if creating a blog post
    if (createContentDto.type === ContentType.BLOG) {
      await this.invalidateBlogCaches();
    }

    return content;
  }

  private validateHomepageSection(contentDto: any): void {
    // Validate required fields
    if (!contentDto.titleEn || !contentDto.titleVi) {
      throw new BadRequestException(
        'Homepage section requires title in both languages',
      );
    }

    if (!contentDto.contentEn || !contentDto.contentVi) {
      throw new BadRequestException(
        'Homepage section requires description in both languages',
      );
    }

    if (!contentDto.buttonTextEn || !contentDto.buttonTextVi) {
      throw new BadRequestException(
        'Homepage section requires button text in both languages',
      );
    }

    if (!contentDto.linkUrl) {
      throw new BadRequestException(
        'Homepage section requires button URL (linkUrl)',
      );
    }

    if (!contentDto.layout) {
      throw new BadRequestException('Homepage section requires layout type');
    }

    // Validate conditional image requirement based on layout
    if (
      (contentDto.layout === 'image-left' ||
        contentDto.layout === 'image-right') &&
      !contentDto.imageUrl
    ) {
      throw new BadRequestException(
        `Homepage section with layout '${contentDto.layout}' requires an image`,
      );
    }
  }

  private async validateBlogPost(contentDto: any): Promise<void> {
    // Validate required fields
    if (!contentDto.titleEn || !contentDto.titleVi) {
      throw new BadRequestException(
        'Blog post requires title in both languages',
      );
    }

    if (!contentDto.contentEn || !contentDto.contentVi) {
      throw new BadRequestException(
        'Blog post requires content in both languages',
      );
    }

    if (!contentDto.excerptEn || !contentDto.excerptVi) {
      throw new BadRequestException(
        'Blog post requires excerpt in both languages',
      );
    }

    if (!contentDto.authorName) {
      throw new BadRequestException('Blog post requires author name');
    }

    // Validate slug format for SEO-friendliness
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(contentDto.slug)) {
      throw new BadRequestException(
        'Blog post slug must be lowercase, alphanumeric, and use hyphens only (e.g., "my-blog-post")',
      );
    }

    // Validate categoryIds exist in database if provided
    if (contentDto.categoryIds && contentDto.categoryIds.length > 0) {
      const categories = await this.prisma.blogCategory.findMany({
        where: { id: { in: contentDto.categoryIds } },
      });

      if (categories.length !== contentDto.categoryIds.length) {
        const foundIds = categories.map((c) => c.id);
        const missingIds = contentDto.categoryIds.filter(
          (id: string) => !foundIds.includes(id),
        );
        throw new BadRequestException(
          `Blog categories not found: ${missingIds.join(', ')}`,
        );
      }
    }
  }

  async findAll(type?: ContentType): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findPublished(type?: ContentType): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: {
        isPublished: true,
        type: type || undefined,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        blogCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async findBySlug(slug: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { slug },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async update(
    id: string,
    updateContentDto: UpdateContentDto,
  ): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check if slug is being changed and if it already exists
    if (updateContentDto.slug && updateContentDto.slug !== content.slug) {
      const existing = await this.prisma.content.findUnique({
        where: { slug: updateContentDto.slug },
      });

      if (existing) {
        throw new BadRequestException('Content with this slug already exists');
      }
    }

    // Validate homepage section specific requirements if updating a homepage section
    if (content.type === ContentType.HOMEPAGE_SECTION) {
      // Merge existing content with updates for validation
      const mergedData = { ...content, ...updateContentDto };
      this.validateHomepageSection(mergedData);
    }

    // Validate blog post specific requirements if updating a blog post
    if (content.type === ContentType.BLOG) {
      // Merge existing content with updates for validation
      const mergedData = { ...content, ...updateContentDto };
      await this.validateBlogPost(mergedData);
    }

    // Extract categoryIds before updating content (not a database field)
    const { categoryIds, ...contentData } = updateContentDto as any;

    const updateData: any = { ...contentData };

    // Update publishedAt if isPublished is being set to true
    if (updateContentDto.isPublished === true && !content.isPublished) {
      updateData.publishedAt = new Date();
    } else if (updateContentDto.isPublished === false) {
      updateData.publishedAt = null;
    }

    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: updateData,
    });

    // Handle category association updates for blog posts
    if (content.type === ContentType.BLOG && categoryIds !== undefined) {
      // Get current categories
      const currentCategories =
        await this.blogCategoryService.getCategoriesForPost(id);
      const currentCategoryIds = currentCategories.map((c) => c.id);

      // Determine which categories to add and remove
      const categoriesToAdd = categoryIds.filter(
        (catId: string) => !currentCategoryIds.includes(catId),
      );
      const categoriesToRemove = currentCategoryIds.filter(
        (catId) => !categoryIds.includes(catId),
      );

      // Add new associations
      if (categoriesToAdd.length > 0) {
        await this.blogCategoryService.associateCategories(id, categoriesToAdd);
      }

      // Remove old associations
      if (categoriesToRemove.length > 0) {
        await this.blogCategoryService.dissociateCategories(
          id,
          categoriesToRemove,
        );
      }
    }

    // Invalidate homepage sections cache if updating a homepage section
    if (content.type === ContentType.HOMEPAGE_SECTION) {
      await this.invalidateHomepageSectionsCache();
    }

    // Invalidate blog caches if updating a blog post
    if (content.type === ContentType.BLOG) {
      await this.invalidateBlogCaches(content.slug);
    }

    return updatedContent;
  }

  async remove(id: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Delete content - category associations will be cascade deleted automatically
    // due to onDelete: Cascade in the Prisma schema
    const deletedContent = await this.prisma.content.delete({
      where: { id },
    });

    // Invalidate homepage sections cache if deleting a homepage section
    if (content.type === ContentType.HOMEPAGE_SECTION) {
      await this.invalidateHomepageSectionsCache();
    }

    // Invalidate blog caches if deleting a blog post
    if (content.type === ContentType.BLOG) {
      await this.invalidateBlogCaches(content.slug);
    }

    return deletedContent;
  }

  async getBanners(): Promise<Content[]> {
    return this.findPublished(ContentType.BANNER);
  }

  async getHomepageSections(): Promise<Content[]> {
    // Try to get from cache first
    const cached = await this.cacheManager.get<Content[]>(
      CONSTANTS.CACHE_KEYS.CONTENT.HOMEPAGE_SECTIONS,
    );

    if (cached) {
      return cached;
    }

    // If not in cache, fetch from database
    const sections = await this.prisma.content.findMany({
      where: {
        type: ContentType.HOMEPAGE_SECTION,
        isPublished: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Store in cache with 5-minute TTL
    await this.cacheManager.set(
      CONSTANTS.CACHE_KEYS.CONTENT.HOMEPAGE_SECTIONS,
      sections,
      this.HOMEPAGE_SECTIONS_CACHE_TTL,
    );

    return sections;
  }

  async findBlogPosts(options: {
    page?: number;
    limit?: number;
    categorySlug?: string;
    published?: boolean;
  }): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = this.getBlogListCacheKey(
      page,
      limit,
      options.categorySlug,
    );

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Build where clause
    const where: any = {
      type: ContentType.BLOG,
    };

    if (options.published !== undefined) {
      where.isPublished = options.published;
    }

    // Add category filter if provided
    if (options.categorySlug) {
      where.blogCategories = {
        some: {
          category: {
            slug: options.categorySlug,
          },
        },
      };
    }

    // Get total count
    const total = await this.prisma.content.count({ where });

    // Get paginated posts with categories
    const posts = await this.prisma.content.findMany({
      where,
      include: {
        blogCategories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
      skip,
      take: limit,
    });

    // Transform posts to include categories array
    const transformedPosts = posts.map((post) => ({
      ...post,
      categories: post.blogCategories.map((bc) => bc.category),
      blogCategories: undefined,
    }));

    const result = {
      posts: transformedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Store in cache with 5-minute TTL
    await this.cacheManager.set(cacheKey, result, this.BLOG_LIST_CACHE_TTL);

    return result;
  }

  async findBlogPostBySlug(slug: string, publicAccess = true): Promise<any> {
    // Generate cache key
    const cacheKey = this.getBlogPostCacheKey(slug);

    // Try to get from cache first (only for public access)
    if (publicAccess) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const where: any = {
      slug,
      type: ContentType.BLOG,
    };

    // For public access, only return published posts
    if (publicAccess) {
      where.isPublished = true;
    }

    const post = await this.prisma.content.findFirst({
      where,
      include: {
        blogCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    // Transform post to include categories array
    const result = {
      ...post,
      categories: post.blogCategories.map((bc) => bc.category),
      blogCategories: undefined,
    };

    // Store in cache with 10-minute TTL (only for public access)
    if (publicAccess) {
      await this.cacheManager.set(
        cacheKey,
        result,
        this.BLOG_POST_CACHE_TTL,
      );
    }

    return result;
  }

  async findRelatedPosts(postId: string, limit = 3): Promise<any[]> {
    // Generate cache key
    const cacheKey = this.getBlogRelatedCacheKey(postId);

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as any[];
    }

    // Get categories for the given post
    const categories = await this.blogCategoryService.getCategoriesForPost(
      postId,
    );

    if (categories.length === 0) {
      return [];
    }

    const categoryIds = categories.map((c) => c.id);

    // Find other published blog posts sharing at least one category
    const relatedPosts = await this.prisma.content.findMany({
      where: {
        type: ContentType.BLOG,
        isPublished: true,
        id: { not: postId },
        blogCategories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      },
      include: {
        blogCategories: {
          include: {
            category: true,
          },
        },
      },
      take: limit * 2, // Get more than needed to sort by shared categories
    });

    // Calculate shared category count for each post and sort
    const postsWithSharedCount = relatedPosts.map((post) => {
      const postCategoryIds = post.blogCategories.map((bc) => bc.categoryId);
      const sharedCount = postCategoryIds.filter((id) =>
        categoryIds.includes(id),
      ).length;

      return {
        ...post,
        categories: post.blogCategories.map((bc) => bc.category),
        blogCategories: undefined,
        sharedCategoryCount: sharedCount,
      };
    });

    // Sort by shared category count DESC, then publishedAt DESC
    postsWithSharedCount.sort((a, b) => {
      if (b.sharedCategoryCount !== a.sharedCategoryCount) {
        return b.sharedCategoryCount - a.sharedCategoryCount;
      }
      return (
        new Date(b.publishedAt || 0).getTime() -
        new Date(a.publishedAt || 0).getTime()
      );
    });

    // Return only the requested limit
    const result = postsWithSharedCount.slice(0, limit).map((post) => {
      const { sharedCategoryCount, ...postWithoutCount } = post;
      return postWithoutCount;
    });

    // Store in cache with 10-minute TTL
    await this.cacheManager.set(
      cacheKey,
      result,
      this.BLOG_RELATED_CACHE_TTL,
    );

    return result;
  }

  /**
   * Invalidate homepage sections cache
   * Called when homepage sections are created, updated, or deleted
   */
  private async invalidateHomepageSectionsCache(): Promise<void> {
    await this.cacheManager.del(CONSTANTS.CACHE_KEYS.CONTENT.HOMEPAGE_SECTIONS);
  }

  /**
   * Generate cache key for blog listing
   */
  private getBlogListCacheKey(
    page: number,
    limit: number,
    categorySlug?: string,
  ): string {
    return CONSTANTS.CACHE_KEYS.CONTENT.BLOG_LIST(page, limit, categorySlug);
  }

  /**
   * Generate cache key for blog post detail
   */
  private getBlogPostCacheKey(slug: string): string {
    return CONSTANTS.CACHE_KEYS.CONTENT.BLOG_POST(slug);
  }

  /**
   * Generate cache key for related posts
   */
  private getBlogRelatedCacheKey(postId: string): string {
    return CONSTANTS.CACHE_KEYS.CONTENT.BLOG_RELATED(postId);
  }

  /**
   * Invalidate all blog caches
   * Called when blog posts are created, updated, or deleted
   */
  private async invalidateBlogCaches(slug?: string): Promise<void> {
    // Invalidate all blog listing caches (we use a pattern to delete all variations)
    // Since we can't use pattern matching with the cache manager, we'll delete known patterns
    // In a production environment, you might want to use Redis SCAN or maintain a list of cache keys

    // For now, we'll delete common pagination combinations
    for (let page = 1; page <= 10; page++) {
      for (const limit of [10, 20, 50]) {
        await this.cacheManager.del(this.getBlogListCacheKey(page, limit));
        await this.cacheManager.del(
          this.getBlogListCacheKey(page, limit, 'all'),
        );
      }
    }

    // Invalidate specific blog post cache if slug is provided
    if (slug) {
      await this.cacheManager.del(this.getBlogPostCacheKey(slug));
    }

    // Invalidate all related posts caches
    // In a production environment, you might want to maintain a list of post IDs
    // For now, we'll rely on the TTL to expire these caches naturally
    // or implement a more sophisticated cache invalidation strategy
  }

  /**
   * Upload an image for content editor
   * @param file - The uploaded image file
   * @returns Object containing the public URL and filename
   */
  async uploadContentImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    // Validate file type
    const allowedMimeTypes = [
      CONSTANTS.SYSTEM.MIME_TYPES.JPEG,
      CONSTANTS.SYSTEM.MIME_TYPES.PNG,
      'image/gif',
      CONSTANTS.SYSTEM.MIME_TYPES.WEBP,
    ];
    if (!allowedMimeTypes.includes(file.mimetype as any)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Determine upload directory
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = path.isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);

    const contentUploadDir = path.join(baseUploadPath, 'content');

    // Ensure content upload directory exists
    await fs.mkdir(contentUploadDir, { recursive: true });

    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const filename = `content-${timestamp}-${randomSuffix}${ext}`;
    const filepath = path.join(contentUploadDir, filename);

    try {
      // Save file to disk
      await fs.writeFile(filepath, file.buffer);

      // Return public URL and filename
      const url = `/uploads/content/${filename}`;

      return {
        url,
        filename,
      };
    } catch (error) {
      // Clean up file if something goes wrong
      try {
        await fs.unlink(filepath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
      throw new BadRequestException('Failed to save image file');
    }
  }
}