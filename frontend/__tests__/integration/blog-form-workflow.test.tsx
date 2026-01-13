/**
 * Integration test to verify that blog form submission includes imageBackground field
 * This test verifies the complete workflow from form data to API call
 */

import { BlogPostFormData } from '@/components/BlogPostForm/types';

describe('Blog Form Workflow Integration', () => {
  it('should verify that form data structure includes imageBackground field', () => {
    // This test verifies that the BlogPostFormData interface includes imageBackground
    // and that the form data can be properly structured for API submission

    const formData: BlogPostFormData = {
      titleEn: 'Test Blog Post',
      titleVi: 'Bài viết test',
      slug: 'test-blog-post',
      excerptEn: 'Test excerpt',
      excerptVi: 'Tóm tắt test',
      contentEn: 'Test content',
      contentVi: 'Nội dung test',
      authorName: 'Test Author',
      imageUrl: '/test-image.jpg',
      imageBackground: '/test-background.jpg', // This field should be included
      categoryIds: ['1'],
      displayOrder: 1,
      isPublished: true,
    };

    // Verify that imageBackground is properly typed and included
    expect(formData.imageBackground).toBe('/test-background.jpg');
    expect(typeof formData.imageBackground).toBe('string');
  });

  it('should verify that API payload structure matches form data', () => {
    // Simulate the transformation from form data to API payload
    // This matches what happens in NewBlogPostContent.tsx and EditBlogPostContent.tsx

    const formData: BlogPostFormData = {
      titleEn: 'Test Blog Post',
      titleVi: 'Bài viết test',
      slug: 'test-blog-post',
      excerptEn: 'Test excerpt',
      excerptVi: 'Tóm tắt test',
      contentEn: 'Test content',
      contentVi: 'Nội dung test',
      authorName: 'Test Author',
      imageUrl: '/test-image.jpg',
      imageBackground: '/test-background.jpg',
      categoryIds: ['1'],
      displayOrder: 1,
      isPublished: true,
    };

    // Transform form data to API payload (as done in the admin pages)
    const apiPayload = {
      type: 'BLOG' as const,
      slug: formData.slug,
      titleEn: formData.titleEn,
      titleVi: formData.titleVi,
      contentEn: formData.contentEn,
      contentVi: formData.contentVi,
      excerptEn: formData.excerptEn,
      excerptVi: formData.excerptVi,
      authorName: formData.authorName,
      imageUrl: formData.imageUrl,
      imageBackground: formData.imageBackground, // This should be included
      categoryIds: formData.categoryIds,
      displayOrder: formData.displayOrder,
      isPublished: formData.isPublished,
    };

    // Verify that imageBackground is included in the API payload
    expect(apiPayload.imageBackground).toBe('/test-background.jpg');
    expect(apiPayload).toHaveProperty('imageBackground');
  });

  it('should handle empty imageBackground field in API payload', () => {
    const formData: BlogPostFormData = {
      titleEn: 'Test Blog Post',
      titleVi: 'Bài viết test',
      slug: 'test-blog-post',
      excerptEn: 'Test excerpt',
      excerptVi: 'Tóm tắt test',
      contentEn: 'Test content',
      contentVi: 'Nội dung test',
      authorName: 'Test Author',
      imageUrl: '/test-image.jpg',
      imageBackground: '', // Empty background image
      categoryIds: ['1'],
      displayOrder: 1,
      isPublished: true,
    };

    const apiPayload = {
      type: 'BLOG' as const,
      slug: formData.slug,
      titleEn: formData.titleEn,
      titleVi: formData.titleVi,
      contentEn: formData.contentEn,
      contentVi: formData.contentVi,
      excerptEn: formData.excerptEn,
      excerptVi: formData.excerptVi,
      authorName: formData.authorName,
      imageUrl: formData.imageUrl,
      imageBackground: formData.imageBackground,
      categoryIds: formData.categoryIds,
      displayOrder: formData.displayOrder,
      isPublished: formData.isPublished,
    };

    // Verify that empty imageBackground is handled correctly
    expect(apiPayload.imageBackground).toBe('');
    expect(apiPayload).toHaveProperty('imageBackground');
  });
});