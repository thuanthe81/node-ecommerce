import React from 'react';
import { blogApi } from '@/lib/blog-api';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import apiClient from '@/lib/api-client';

describe('Blog API Integration - Background Image Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include imageBackground field when creating a blog post', async () => {
    const mockResponse = { data: { id: '1', slug: 'test-post' } };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const blogPostData = {
      type: 'BLOG' as const,
      slug: 'test-post',
      titleEn: 'Test Post',
      titleVi: 'Bài viết test',
      contentEn: 'Test content',
      contentVi: 'Nội dung test',
      excerptEn: 'Test excerpt',
      excerptVi: 'Tóm tắt test',
      authorName: 'Test Author',
      imageUrl: '/test-image.jpg',
      imageBackground: '/test-background.jpg',
      categoryIds: ['1'],
      displayOrder: 1,
      isPublished: true,
    };

    await blogApi.createBlogPost(blogPostData);

    expect(apiClient.post).toHaveBeenCalledWith('/content', blogPostData);
    expect(apiClient.post).toHaveBeenCalledWith('/content',
      expect.objectContaining({
        imageBackground: '/test-background.jpg'
      })
    );
  });

  it('should include imageBackground field when updating a blog post', async () => {
    const mockResponse = { data: { id: '1', slug: 'test-post' } };
    (apiClient.patch as jest.Mock).mockResolvedValue(mockResponse);

    const updateData = {
      type: 'BLOG' as const,
      slug: 'updated-post',
      titleEn: 'Updated Post',
      titleVi: 'Bài viết cập nhật',
      contentEn: 'Updated content',
      contentVi: 'Nội dung cập nhật',
      excerptEn: 'Updated excerpt',
      excerptVi: 'Tóm tắt cập nhật',
      authorName: 'Updated Author',
      imageUrl: '/updated-image.jpg',
      imageBackground: '/updated-background.jpg',
      categoryIds: ['1'],
      displayOrder: 2,
      isPublished: false,
    };

    await blogApi.updateBlogPost('1', updateData);

    expect(apiClient.patch).toHaveBeenCalledWith('/content/1', updateData);
    expect(apiClient.patch).toHaveBeenCalledWith('/content/1',
      expect.objectContaining({
        imageBackground: '/updated-background.jpg'
      })
    );
  });

  it('should handle empty imageBackground field', async () => {
    const mockResponse = { data: { id: '1', slug: 'test-post' } };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const blogPostData = {
      type: 'BLOG' as const,
      slug: 'test-post',
      titleEn: 'Test Post',
      titleVi: 'Bài viết test',
      contentEn: 'Test content',
      contentVi: 'Nội dung test',
      excerptEn: 'Test excerpt',
      excerptVi: 'Tóm tắt test',
      authorName: 'Test Author',
      imageUrl: '/test-image.jpg',
      imageBackground: '', // Empty background image
      categoryIds: ['1'],
      displayOrder: 1,
      isPublished: true,
    };

    await blogApi.createBlogPost(blogPostData);

    expect(apiClient.post).toHaveBeenCalledWith('/content', blogPostData);
    expect(apiClient.post).toHaveBeenCalledWith('/content',
      expect.objectContaining({
        imageBackground: ''
      })
    );
  });

  it('should handle undefined imageBackground field', async () => {
    const mockResponse = { data: { id: '1', slug: 'test-post' } };
    (apiClient.patch as jest.Mock).mockResolvedValue(mockResponse);

    const updateData = {
      type: 'BLOG' as const,
      slug: 'updated-post',
      titleEn: 'Updated Post',
      titleVi: 'Bài viết cập nhật',
      // imageBackground is undefined (not provided)
      categoryIds: ['1'],
    };

    await blogApi.updateBlogPost('1', updateData);

    expect(apiClient.patch).toHaveBeenCalledWith('/content/1', updateData);
    // Should not include imageBackground when undefined
    expect(apiClient.patch).toHaveBeenCalledWith('/content/1',
      expect.not.objectContaining({
        imageBackground: expect.anything()
      })
    );
  });
});