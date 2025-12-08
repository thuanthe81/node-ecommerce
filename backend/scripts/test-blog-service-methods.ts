import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContentService } from '../src/content/content.service';
import { BlogCategoryService } from '../src/blog-category/blog-category.service';
import { ContentType } from '@prisma/client';

async function testBlogServiceMethods() {
  console.log('Testing Blog Service Methods...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const contentService = app.get(ContentService);
  const blogCategoryService = app.get(BlogCategoryService);

  try {
    // Test 1: Create blog categories
    console.log('1. Creating blog categories...');
    const category1 = await blogCategoryService.create({
      slug: 'craftsmanship',
      nameEn: 'Craftsmanship',
      nameVi: 'Nghề thủ công',
    });
    const category2 = await blogCategoryService.create({
      slug: 'materials',
      nameEn: 'Materials',
      nameVi: 'Vật liệu',
    });
    console.log('✓ Categories created:', category1.id, category2.id);

    // Test 2: Create blog post with validation
    console.log('\n2. Creating blog post with all required fields...');
    const blogPost1 = await contentService.create({
      slug: 'handmade-pottery-techniques',
      type: ContentType.BLOG,
      titleEn: 'Handmade Pottery Techniques',
      titleVi: 'Kỹ thuật làm gốm thủ công',
      contentEn: '<p>Learn about traditional pottery techniques...</p>',
      contentVi: '<p>Tìm hiểu về kỹ thuật làm gốm truyền thống...</p>',
      excerptEn: 'Discover the art of handmade pottery',
      excerptVi: 'Khám phá nghệ thuật làm gốm thủ công',
      authorName: 'John Smith',
      categoryIds: [category1.id, category2.id],
      isPublished: true,
      displayOrder: 1,
    } as any);
    console.log('✓ Blog post created:', blogPost1.id);

    // Test 3: Create another blog post
    console.log('\n3. Creating second blog post...');
    const blogPost2 = await contentService.create({
      slug: 'choosing-quality-materials',
      type: ContentType.BLOG,
      titleEn: 'Choosing Quality Materials',
      titleVi: 'Chọn vật liệu chất lượng',
      contentEn: '<p>How to select the best materials...</p>',
      contentVi: '<p>Cách chọn vật liệu tốt nhất...</p>',
      excerptEn: 'Guide to selecting quality materials',
      excerptVi: 'Hướng dẫn chọn vật liệu chất lượng',
      authorName: 'Jane Doe',
      categoryIds: [category2.id],
      isPublished: true,
      displayOrder: 2,
    } as any);
    console.log('✓ Second blog post created:', blogPost2.id);

    // Test 4: Create draft blog post
    console.log('\n4. Creating draft blog post...');
    const draftPost = await contentService.create({
      slug: 'upcoming-workshop',
      type: ContentType.BLOG,
      titleEn: 'Upcoming Workshop',
      titleVi: 'Hội thảo sắp tới',
      contentEn: '<p>Join our upcoming workshop...</p>',
      contentVi: '<p>Tham gia hội thảo sắp tới của chúng tôi...</p>',
      excerptEn: 'Workshop announcement',
      excerptVi: 'Thông báo hội thảo',
      authorName: 'Admin',
      categoryIds: [category1.id],
      isPublished: false,
    } as any);
    console.log('✓ Draft post created:', draftPost.id);

    // Test 5: Find blog posts (published only)
    console.log('\n5. Finding published blog posts...');
    const publishedPosts = await contentService.findBlogPosts({
      page: 1,
      limit: 10,
      published: true,
    });
    console.log('✓ Found', publishedPosts.total, 'published posts');
    console.log('  Posts:', publishedPosts.posts.map(p => p.titleEn));

    // Test 6: Find blog posts by category
    console.log('\n6. Finding blog posts by category (materials)...');
    const categoryPosts = await contentService.findBlogPosts({
      categorySlug: 'materials',
      published: true,
    });
    console.log('✓ Found', categoryPosts.total, 'posts in materials category');
    console.log('  Posts:', categoryPosts.posts.map(p => p.titleEn));

    // Test 7: Find blog post by slug
    console.log('\n7. Finding blog post by slug...');
    const postBySlug = await contentService.findBlogPostBySlug(
      'handmade-pottery-techniques',
      true,
    );
    console.log('✓ Found post:', postBySlug.titleEn);
    console.log('  Categories:', postBySlug.categories.map((c: any) => c.nameEn));

    // Test 8: Find related posts
    console.log('\n8. Finding related posts...');
    const relatedPosts = await contentService.findRelatedPosts(blogPost1.id, 3);
    console.log('✓ Found', relatedPosts.length, 'related post(s)');
    console.log('  Related:', relatedPosts.map(p => p.titleEn));

    // Test 9: Update blog post
    console.log('\n9. Updating blog post...');
    const updatedPost = await contentService.update(blogPost1.id, {
      titleEn: 'Advanced Pottery Techniques',
      categoryIds: [category1.id], // Remove category2
    } as any);
    console.log('✓ Post updated:', updatedPost.titleEn);

    // Test 10: Unpublish blog post
    console.log('\n10. Unpublishing blog post...');
    await contentService.update(blogPost2.id, {
      isPublished: false,
    });
    const unpublishedPost = await contentService.findOne(blogPost2.id);
    console.log('✓ Post unpublished:', {
      title: unpublishedPost.titleEn,
      isPublished: unpublishedPost.isPublished,
      publishedAt: unpublishedPost.publishedAt,
    });

    // Test 11: Validate slug format
    console.log('\n11. Testing slug validation...');
    try {
      await contentService.create({
        slug: 'Invalid Slug With Spaces',
        type: ContentType.BLOG,
        titleEn: 'Test',
        titleVi: 'Test',
        contentEn: 'Test',
        contentVi: 'Test',
        excerptEn: 'Test',
        excerptVi: 'Test',
        authorName: 'Test',
        isPublished: false,
      } as any);
      console.log('✗ Slug validation failed - invalid slug was accepted');
    } catch (error: any) {
      console.log('✓ Slug validation working:', error.message);
    }

    // Cleanup
    console.log('\n12. Cleaning up test data...');
    await contentService.remove(blogPost1.id);
    await contentService.remove(blogPost2.id);
    await contentService.remove(draftPost.id);
    await blogCategoryService.remove(category1.id);
    await blogCategoryService.remove(category2.id);
    console.log('✓ Test data cleaned up');

    console.log('\n✅ All service method tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

testBlogServiceMethods();
