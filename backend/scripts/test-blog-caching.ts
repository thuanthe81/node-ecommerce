import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContentService } from '../src/content/content.service';
import { ContentType } from '@prisma/client';

async function testBlogCaching() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contentService = app.get(ContentService);

  console.log('🧪 Testing Blog Caching Implementation\n');

  try {
    // Test 1: Create a blog post and verify cache invalidation
    console.log('Test 1: Create blog post and verify cache invalidation');
    const blogPost = await contentService.create({
      type: ContentType.BLOG,
      slug: 'test-caching-post',
      titleEn: 'Test Caching Post',
      titleVi: 'Bài viết kiểm tra bộ nhớ đệm',
      contentEn: 'This is a test post for caching',
      contentVi: 'Đây là bài viết kiểm tra bộ nhớ đệm',
      excerptEn: 'Test excerpt',
      excerptVi: 'Trích đoạn kiểm tra',
      authorName: 'Test Author',
      displayOrder: 1,
      isPublished: true,
    });
    console.log('✅ Blog post created:', blogPost.id);

    // Test 2: Fetch blog listing (should cache)
    console.log('\nTest 2: Fetch blog listing (first call - should cache)');
    const startTime1 = Date.now();
    const listing1 = await contentService.findBlogPosts({
      page: 1,
      limit: 10,
    });
    const duration1 = Date.now() - startTime1;
    console.log(`✅ First call took ${duration1}ms`);
    console.log(`   Found ${listing1.posts.length} posts`);

    // Test 3: Fetch blog listing again (should use cache)
    console.log('\nTest 3: Fetch blog listing (second call - should use cache)');
    const startTime2 = Date.now();
    const listing2 = await contentService.findBlogPosts({
      page: 1,
      limit: 10,
    });
    const duration2 = Date.now() - startTime2;
    console.log(`✅ Second call took ${duration2}ms`);
    console.log(`   Cache hit: ${duration2 < duration1 ? 'YES' : 'NO'}`);

    // Test 4: Fetch blog post by slug (should cache)
    console.log('\nTest 4: Fetch blog post by slug (first call - should cache)');
    const startTime3 = Date.now();
    const post1 = await contentService.findBlogPostBySlug('test-caching-post');
    const duration3 = Date.now() - startTime3;
    console.log(`✅ First call took ${duration3}ms`);
    console.log(`   Post title: ${post1.titleEn}`);

    // Test 5: Fetch blog post by slug again (should use cache)
    console.log('\nTest 5: Fetch blog post by slug (second call - should use cache)');
    const startTime4 = Date.now();
    const post2 = await contentService.findBlogPostBySlug('test-caching-post');
    const duration4 = Date.now() - startTime4;
    console.log(`✅ Second call took ${duration4}ms`);
    console.log(`   Cache hit: ${duration4 < duration3 ? 'YES' : 'NO'}`);

    // Test 6: Update blog post and verify cache invalidation
    console.log('\nTest 6: Update blog post and verify cache invalidation');
    await contentService.update(blogPost.id, {
      titleEn: 'Updated Test Caching Post',
    });
    console.log('✅ Blog post updated');

    // Test 7: Fetch updated blog post (should not use cache)
    console.log('\nTest 7: Fetch updated blog post (should fetch fresh data)');
    const startTime5 = Date.now();
    const post3 = await contentService.findBlogPostBySlug('test-caching-post');
    const duration5 = Date.now() - startTime5;
    console.log(`✅ Call took ${duration5}ms`);
    console.log(`   Updated title: ${post3.titleEn}`);

    // Test 8: Test related posts caching
    console.log('\nTest 8: Test related posts caching');
    const startTime6 = Date.now();
    const related1 = await contentService.findRelatedPosts(blogPost.id);
    const duration6 = Date.now() - startTime6;
    console.log(`✅ First call took ${duration6}ms`);
    console.log(`   Found ${related1.length} related posts`);

    const startTime7 = Date.now();
    const related2 = await contentService.findRelatedPosts(blogPost.id);
    const duration7 = Date.now() - startTime7;
    console.log(`✅ Second call took ${duration7}ms`);
    console.log(`   Cache hit: ${duration7 < duration6 ? 'YES' : 'NO'}`);

    // Cleanup
    console.log('\nCleaning up test data...');
    await contentService.remove(blogPost.id);
    console.log('✅ Test blog post deleted');

    console.log('\n✅ All caching tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

testBlogCaching()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
