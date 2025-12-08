import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContentService } from '../src/content/content.service';
import { BlogCategoryService } from '../src/blog-category/blog-category.service';
import { ContentType } from '@prisma/client';

async function testBlogEndpoints() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contentService = app.get(ContentService);
  const blogCategoryService = app.get(BlogCategoryService);

  try {
    console.log('Testing Blog Endpoints Implementation\n');
    console.log('=' .repeat(50));

    // Clean up any existing test data
    console.log('\n1. Cleaning up existing test data...');
    const existingPosts = await contentService.findAll(ContentType.BLOG);
    for (const post of existingPosts) {
      await contentService.remove(post.id);
    }
    const existingCategories = await blogCategoryService.findAll();
    for (const category of existingCategories) {
      await blogCategoryService.remove(category.id);
    }
    console.log('✓ Cleanup complete');

    // Create test categories
    console.log('\n2. Creating test categories...');
    const category1 = await blogCategoryService.create({
      slug: 'craftsmanship',
      nameEn: 'Craftsmanship',
      nameVi: 'Nghề thủ công',
    });
    const category2 = await blogCategoryService.create({
      slug: 'materials',
      nameEn: 'Materials',
      nameVi: 'Nguyên liệu',
    });
    console.log('✓ Created categories:', category1.nameEn, category2.nameEn);

    // Create test blog posts
    console.log('\n3. Creating test blog posts...');
    const post1 = await contentService.create({
      type: ContentType.BLOG,
      slug: 'pottery-techniques',
      titleEn: 'Traditional Pottery Techniques',
      titleVi: 'Kỹ thuật gốm truyền thống',
      contentEn: '<p>Learn about traditional pottery techniques...</p>',
      contentVi: '<p>Tìm hiểu về kỹ thuật gốm truyền thống...</p>',
      excerptEn: 'A guide to traditional pottery making',
      excerptVi: 'Hướng dẫn làm gốm truyền thống',
      authorName: 'John Smith',
      imageUrl: '/uploads/blog/pottery.jpg',
      categoryIds: [category1.id, category2.id],
      displayOrder: 1,
      isPublished: true,
    });
    console.log('✓ Created published post:', post1.titleEn);

    const post2 = await contentService.create({
      type: ContentType.BLOG,
      slug: 'weaving-basics',
      titleEn: 'Weaving Basics',
      titleVi: 'Cơ bản về dệt',
      contentEn: '<p>Introduction to weaving...</p>',
      contentVi: '<p>Giới thiệu về dệt...</p>',
      excerptEn: 'Learn the basics of weaving',
      excerptVi: 'Học cơ bản về dệt',
      authorName: 'Jane Doe',
      imageUrl: '/uploads/blog/weaving.jpg',
      categoryIds: [category1.id],
      displayOrder: 2,
      isPublished: true,
    });
    console.log('✓ Created published post:', post2.titleEn);

    const post3 = await contentService.create({
      type: ContentType.BLOG,
      slug: 'draft-post',
      titleEn: 'Draft Post',
      titleVi: 'Bài viết nháp',
      contentEn: '<p>This is a draft...</p>',
      contentVi: '<p>Đây là bản nháp...</p>',
      excerptEn: 'A draft post',
      excerptVi: 'Một bài viết nháp',
      authorName: 'Admin',
      categoryIds: [category2.id],
      displayOrder: 3,
      isPublished: false,
    });
    console.log('✓ Created draft post:', post3.titleEn);

    // Test 1: GET /content/blog (pagination)
    console.log('\n4. Testing GET /content/blog (pagination)...');
    const blogPosts = await contentService.findBlogPosts({
      page: 1,
      limit: 10,
      published: true,
    });
    console.log('✓ Found', blogPosts.posts.length, 'published posts');
    console.log('  Total:', blogPosts.total);
    console.log('  Page:', blogPosts.page, 'of', blogPosts.totalPages);
    if (blogPosts.posts.length !== 2) {
      throw new Error('Expected 2 published posts, got ' + blogPosts.posts.length);
    }

    // Test 2: GET /content/blog?categorySlug=craftsmanship
    console.log('\n5. Testing GET /content/blog?categorySlug=craftsmanship...');
    const categoryPosts = await contentService.findBlogPosts({
      categorySlug: 'craftsmanship',
      published: true,
    });
    console.log('✓ Found', categoryPosts.posts.length, 'posts in category');
    if (categoryPosts.posts.length !== 2) {
      throw new Error('Expected 2 posts in craftsmanship category, got ' + categoryPosts.posts.length);
    }

    // Test 3: GET /content/blog/:slug
    console.log('\n6. Testing GET /content/blog/:slug...');
    const postBySlug = await contentService.findBlogPostBySlug('pottery-techniques', true);
    console.log('✓ Found post by slug:', postBySlug.titleEn);
    console.log('  Categories:', postBySlug.categories.map((c: any) => c.nameEn).join(', '));
    if (!postBySlug || postBySlug.slug !== 'pottery-techniques') {
      throw new Error('Failed to find post by slug');
    }

    // Test 4: GET /content/blog/:id/related
    console.log('\n7. Testing GET /content/blog/:id/related...');
    const relatedPosts = await contentService.findRelatedPosts(post1.id, 3);
    console.log('✓ Found', relatedPosts.length, 'related posts');
    if (relatedPosts.length > 0) {
      console.log('  Related:', relatedPosts.map((p: any) => p.titleEn).join(', '));
    }

    // Test 5: Verify draft post is not accessible publicly
    console.log('\n8. Testing draft post is not publicly accessible...');
    try {
      await contentService.findBlogPostBySlug('draft-post', true);
      throw new Error('Draft post should not be accessible publicly');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        console.log('✓ Draft post correctly hidden from public access');
      } else {
        throw error;
      }
    }

    // Test 6: Verify existing POST /content works for blog creation
    console.log('\n9. Testing POST /content for blog creation...');
    const newPost = await contentService.create({
      type: ContentType.BLOG,
      slug: 'new-blog-post',
      titleEn: 'New Blog Post',
      titleVi: 'Bài viết mới',
      contentEn: '<p>New content...</p>',
      contentVi: '<p>Nội dung mới...</p>',
      excerptEn: 'New excerpt',
      excerptVi: 'Trích đoạn mới',
      authorName: 'Test Author',
      categoryIds: [category1.id],
      isPublished: true,
    });
    console.log('✓ Created new blog post via POST /content:', newPost.titleEn);

    // Test 7: Verify existing PATCH /content/:id works for blog updates
    console.log('\n10. Testing PATCH /content/:id for blog updates...');
    const updatedPost = await contentService.update(newPost.id, {
      titleEn: 'Updated Blog Post',
      excerptEn: 'Updated excerpt',
    });
    console.log('✓ Updated blog post via PATCH /content/:id:', updatedPost.titleEn);

    // Test 8: Verify existing DELETE /content/:id works for blog deletion
    console.log('\n11. Testing DELETE /content/:id for blog deletion...');
    await contentService.remove(newPost.id);
    console.log('✓ Deleted blog post via DELETE /content/:id');

    console.log('\n' + '='.repeat(50));
    console.log('✅ All blog endpoint tests passed!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

testBlogEndpoints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
