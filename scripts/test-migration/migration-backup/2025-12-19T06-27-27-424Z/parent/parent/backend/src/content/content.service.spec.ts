import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlogCategoryService } from '../blog-category/blog-category.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';
import { ContentType } from '@prisma/client';

describe('ContentService - Blog Extensions', () => {
  let service: ContentService;
  let prismaService: PrismaService;
  let blogCategoryService: BlogCategoryService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    content: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    blogCategory: {
      findMany: jest.fn(),
    },
  };

  const mockBlogCategoryService = {
    associateCategories: jest.fn(),
    dissociateCategories: jest.fn(),
    getCategoriesForPost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BlogCategoryService,
          useValue: mockBlogCategoryService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    prismaService = module.get<PrismaService>(PrismaService);
    blogCategoryService = module.get<BlogCategoryService>(BlogCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Blog Post Validation', () => {
    it('should validate required fields for blog posts', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);

      const invalidBlogPost = {
        slug: 'test-blog',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        // Missing excerptEn, excerptVi, authorName
      };

      await expect(service.create(invalidBlogPost as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate slug format for blog posts', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);

      const invalidSlugPost = {
        slug: 'Invalid Slug With Spaces',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
      };

      await expect(service.create(invalidSlugPost as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept valid blog post with proper slug format', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([]);
      mockPrismaService.content.create.mockResolvedValue({
        id: '123',
        slug: 'valid-blog-slug',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        isPublished: true,
        publishedAt: new Date(),
      });

      const validBlogPost = {
        slug: 'valid-blog-slug',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        isPublished: true,
      };

      const result = await service.create(validBlogPost as any);
      expect(result).toBeDefined();
      expect(result.slug).toBe('valid-blog-slug');
    });

    it('should validate category IDs exist', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([
        { id: 'cat1', slug: 'category-1', nameEn: 'Category 1', nameVi: 'Danh mục 1' },
      ]);

      const blogPostWithInvalidCategories = {
        slug: 'test-blog',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        categoryIds: ['cat1', 'cat2', 'cat3'], // cat2 and cat3 don't exist
      };

      await expect(
        service.create(blogPostWithInvalidCategories as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Blog Post Creation', () => {
    it('should create blog post and associate categories', async () => {
      const categoryIds = ['cat1', 'cat2'];
      mockPrismaService.content.findUnique.mockResolvedValue(null);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([
        { id: 'cat1', slug: 'category-1', nameEn: 'Category 1', nameVi: 'Danh mục 1' },
        { id: 'cat2', slug: 'category-2', nameEn: 'Category 2', nameVi: 'Danh mục 2' },
      ]);
      mockPrismaService.content.create.mockResolvedValue({
        id: 'post123',
        slug: 'test-blog',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        isPublished: true,
        publishedAt: new Date(),
      });

      const blogPost = {
        slug: 'test-blog',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        categoryIds,
        isPublished: true,
      };

      await service.create(blogPost as any);

      expect(mockBlogCategoryService.associateCategories).toHaveBeenCalledWith(
        'post123',
        categoryIds,
      );
    });

    it('should set publishedAt when isPublished is true', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([]);
      mockPrismaService.content.create.mockImplementation((args) => {
        return Promise.resolve({
          id: 'post123',
          ...args.data,
        });
      });

      const blogPost = {
        slug: 'test-blog',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        isPublished: true,
      };

      await service.create(blogPost as any);

      expect(mockPrismaService.content.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('Blog Post Update', () => {
    it('should update category associations', async () => {
      const postId = 'post123';
      const existingPost = {
        id: postId,
        type: ContentType.BLOG,
        slug: 'test-blog',
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        isPublished: true,
      };

      mockPrismaService.content.findUnique.mockResolvedValue(existingPost);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([
        { id: 'cat2', slug: 'category-2', nameEn: 'Category 2', nameVi: 'Danh mục 2' },
        { id: 'cat3', slug: 'category-3', nameEn: 'Category 3', nameVi: 'Danh mục 3' },
      ]);
      mockBlogCategoryService.getCategoriesForPost.mockResolvedValue([
        { id: 'cat1', slug: 'category-1', nameEn: 'Category 1', nameVi: 'Danh mục 1' },
        { id: 'cat2', slug: 'category-2', nameEn: 'Category 2', nameVi: 'Danh mục 2' },
      ]);
      mockPrismaService.content.update.mockResolvedValue(existingPost);

      await service.update(postId, {
        categoryIds: ['cat2', 'cat3'],
      } as any);

      expect(mockBlogCategoryService.associateCategories).toHaveBeenCalledWith(
        postId,
        ['cat3'],
      );
      expect(mockBlogCategoryService.dissociateCategories).toHaveBeenCalledWith(
        postId,
        ['cat1'],
      );
    });

    it('should clear publishedAt when unpublishing', async () => {
      const postId = 'post123';
      const existingPost = {
        id: postId,
        type: ContentType.BLOG,
        slug: 'test-blog',
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Content',
        contentVi: 'Content',
        excerptEn: 'Excerpt',
        excerptVi: 'Excerpt',
        authorName: 'Author',
        isPublished: true,
        publishedAt: new Date(),
      };

      mockPrismaService.content.findUnique.mockResolvedValue(existingPost);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([]);
      mockPrismaService.content.update.mockImplementation((args) => {
        return Promise.resolve({
          ...existingPost,
          ...args.data,
        });
      });

      await service.update(postId, {
        isPublished: false,
      } as any);

      expect(mockPrismaService.content.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: null,
          }),
        }),
      );
    });
  });
});
