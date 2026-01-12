import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from '../../src/content/content.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { BlogCategoryService } from '../../src/blog-category/blog-category.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ContentType } from '@prisma/client';

describe('ContentService - Image Background Integration', () => {
  let service: ContentService;
  let prismaService: PrismaService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    content: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    blogCategory: {
      findMany: jest.fn(),
    },
  };

  const mockBlogCategoryService = {
    associateCategories: jest.fn(),
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

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create blog post with imageBackground', () => {
    it('should create blog post with imageBackground field', async () => {
      const blogPostData = {
        slug: 'test-blog-with-background',
        type: ContentType.BLOG,
        titleEn: 'Test Blog Post',
        titleVi: 'Bài viết test',
        contentEn: 'Test content',
        contentVi: 'Nội dung test',
        excerptEn: 'Test excerpt',
        excerptVi: 'Tóm tắt test',
        authorName: 'Test Author',
        imageUrl: '/uploads/featured-image.jpg',
        imageBackground: '/uploads/background-image.jpg',
        isPublished: true,
        categoryIds: [],
      };

      const expectedCreatedPost = {
        id: 'post-123',
        ...blogPostData,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.content.findUnique.mockResolvedValue(null);
      mockPrismaService.content.create.mockResolvedValue(expectedCreatedPost);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([]);

      const result = await service.create(blogPostData);

      expect(mockPrismaService.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'test-blog-with-background',
          type: ContentType.BLOG,
          titleEn: 'Test Blog Post',
          titleVi: 'Bài viết test',
          contentEn: 'Test content',
          contentVi: 'Nội dung test',
          excerptEn: 'Test excerpt',
          excerptVi: 'Tóm tắt test',
          authorName: 'Test Author',
          imageUrl: '/uploads/featured-image.jpg',
          imageBackground: '/uploads/background-image.jpg',
          isPublished: true,
          publishedAt: expect.any(Date),
        }),
      });

      expect(result).toEqual(expectedCreatedPost);
    });

    it('should create blog post without imageBackground field', async () => {
      const blogPostData = {
        slug: 'test-blog-no-background',
        type: ContentType.BLOG,
        titleEn: 'Test Blog Post',
        titleVi: 'Bài viết test',
        contentEn: 'Test content',
        contentVi: 'Nội dung test',
        excerptEn: 'Test excerpt',
        excerptVi: 'Tóm tắt test',
        authorName: 'Test Author',
        imageUrl: '/uploads/featured-image.jpg',
        isPublished: true,
        categoryIds: [],
      };

      const expectedCreatedPost = {
        id: 'post-124',
        ...blogPostData,
        imageBackground: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.content.findUnique.mockResolvedValue(null);
      mockPrismaService.content.create.mockResolvedValue(expectedCreatedPost);
      mockPrismaService.blogCategory.findMany.mockResolvedValue([]);

      const result = await service.create(blogPostData);

      expect(mockPrismaService.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'test-blog-no-background',
          type: ContentType.BLOG,
          titleEn: 'Test Blog Post',
          titleVi: 'Bài viết test',
          contentEn: 'Test content',
          contentVi: 'Nội dung test',
          excerptEn: 'Test excerpt',
          excerptVi: 'Tóm tắt test',
          authorName: 'Test Author',
          imageUrl: '/uploads/featured-image.jpg',
          isPublished: true,
          publishedAt: expect.any(Date),
        }),
      });

      expect(result).toEqual(expectedCreatedPost);
    });
  });

  describe('update blog post with imageBackground', () => {
    it('should update blog post with imageBackground field', async () => {
      const existingPost = {
        id: 'post-123',
        slug: 'existing-blog',
        type: ContentType.BLOG,
        titleEn: 'Existing Post',
        titleVi: 'Bài viết có sẵn',
        contentEn: 'Existing content',
        contentVi: 'Nội dung có sẵn',
        excerptEn: 'Existing excerpt',
        excerptVi: 'Tóm tắt có sẵn',
        authorName: 'Existing Author',
        imageUrl: '/uploads/old-featured.jpg',
        imageBackground: null,
        isPublished: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        imageBackground: '/uploads/new-background.jpg',
        isPublished: true,
      };

      const expectedUpdatedPost = {
        ...existingPost,
        ...updateData,
        publishedAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.content.findUnique.mockResolvedValue(existingPost);
      mockPrismaService.content.update.mockResolvedValue(expectedUpdatedPost);
      mockBlogCategoryService.getCategoriesForPost.mockResolvedValue([]);

      const result = await service.update('post-123', updateData);

      expect(mockPrismaService.content.update).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        data: expect.objectContaining({
          imageBackground: '/uploads/new-background.jpg',
          isPublished: true,
          publishedAt: expect.any(Date),
        }),
      });

      expect(result).toEqual(expectedUpdatedPost);
    });
  });
});