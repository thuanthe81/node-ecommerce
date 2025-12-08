import { PrismaClient, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

async function testBlogContentService() {
  console.log('Testing Blog Content Service Extensions...\n');

  try {
    // Test 1: Create a blog category
    console.log('1. Creating blog category...');
    const category = await prisma.blogCategory.create({
      data: {
        slug: 'test-category',
        nameEn: 'Test Category',
        nameVi: 'Danh mục thử nghiệm',
      },
    });
    console.log('✓ Blog category created:', category.id);

    // Test 2: Create a blog post with all required fields
    console.log('\n2. Creating blog post...');
    const blogPost = await prisma.content.create({
      data: {
        slug: 'test-blog-post',
        type: ContentType.BLOG,
        titleEn: 'Test Blog Post',
        titleVi: 'Bài viết blog thử nghiệm',
        contentEn: '<p>This is test content in English</p>',
        contentVi: '<p>Đây là nội dung thử nghiệm bằng tiếng Việt</p>',
        excerptEn: 'Test excerpt in English',
        excerptVi: 'Trích đoạn thử nghiệm bằng tiếng Việt',
        authorName: 'Test Author',
        isPublished: true,
        publishedAt: new Date(),
        displayOrder: 1,
      },
    });
    console.log('✓ Blog post created:', blogPost.id);

    // Test 3: Associate category with blog post
    console.log('\n3. Associating category with blog post...');
    await prisma.blogCategoryAssociation.create({
      data: {
        contentId: blogPost.id,
        categoryId: category.id,
      },
    });
    console.log('✓ Category associated with blog post');

    // Test 4: Query blog post with categories
    console.log('\n4. Querying blog post with categories...');
    const postWithCategories = await prisma.content.findUnique({
      where: { id: blogPost.id },
      include: {
        blogCategories: {
          include: {
            category: true,
          },
        },
      },
    });
    console.log('✓ Blog post retrieved with categories:', {
      id: postWithCategories?.id,
      title: postWithCategories?.titleEn,
      categories: postWithCategories?.blogCategories.map((bc) => bc.category.nameEn),
    });

    // Test 5: Query published blog posts
    console.log('\n5. Querying published blog posts...');
    const publishedPosts = await prisma.content.findMany({
      where: {
        type: ContentType.BLOG,
        isPublished: true,
      },
      include: {
        blogCategories: {
          include: {
            category: true,
          },
        },
      },
    });
    console.log('✓ Found', publishedPosts.length, 'published blog post(s)');

    // Test 6: Update blog post
    console.log('\n6. Updating blog post...');
    const updatedPost = await prisma.content.update({
      where: { id: blogPost.id },
      data: {
        titleEn: 'Updated Test Blog Post',
        isPublished: false,
        publishedAt: null,
      },
    });
    console.log('✓ Blog post updated:', {
      id: updatedPost.id,
      title: updatedPost.titleEn,
      isPublished: updatedPost.isPublished,
    });

    // Cleanup
    console.log('\n7. Cleaning up test data...');
    await prisma.blogCategoryAssociation.deleteMany({
      where: { contentId: blogPost.id },
    });
    await prisma.content.delete({ where: { id: blogPost.id } });
    await prisma.blogCategory.delete({ where: { id: category.id } });
    console.log('✓ Test data cleaned up');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testBlogContentService();
