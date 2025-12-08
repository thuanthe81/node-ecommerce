import { PrismaClient, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyBlogSchema() {
  console.log('Verifying blog schema changes...\n');

  try {
    // Test 1: Verify BLOG content type exists
    console.log('✓ Test 1: BLOG content type is available');
    console.log(`  ContentType.BLOG = ${ContentType.BLOG}\n`);

    // Test 2: Create a test blog category
    console.log('✓ Test 2: Creating test blog category...');
    const testCategory = await prisma.blogCategory.create({
      data: {
        slug: 'test-category',
        nameEn: 'Test Category',
        nameVi: 'Danh mục thử nghiệm',
      },
    });
    console.log(`  Created category: ${testCategory.nameEn} (${testCategory.slug})\n`);

    // Test 3: Create a test blog post with new fields
    console.log('✓ Test 3: Creating test blog post with new fields...');
    const testBlogPost = await prisma.content.create({
      data: {
        slug: 'test-blog-post',
        type: ContentType.BLOG,
        titleEn: 'Test Blog Post',
        titleVi: 'Bài viết blog thử nghiệm',
        contentEn: 'This is test content',
        contentVi: 'Đây là nội dung thử nghiệm',
        excerptEn: 'Test excerpt',
        excerptVi: 'Trích đoạn thử nghiệm',
        authorName: 'Test Author',
        isPublished: false,
      },
    });
    console.log(`  Created blog post: ${testBlogPost.titleEn}`);
    console.log(`  Author: ${testBlogPost.authorName}`);
    console.log(`  Excerpt (EN): ${testBlogPost.excerptEn}\n`);

    // Test 4: Create category association
    console.log('✓ Test 4: Creating blog category association...');
    const association = await prisma.blogCategoryAssociation.create({
      data: {
        contentId: testBlogPost.id,
        categoryId: testCategory.id,
      },
    });
    console.log(`  Associated blog post with category\n`);

    // Test 5: Query blog post with categories
    console.log('✓ Test 5: Querying blog post with categories...');
    const blogWithCategories = await prisma.content.findUnique({
      where: { id: testBlogPost.id },
      include: {
        blogCategories: {
          include: {
            category: true,
          },
        },
      },
    });
    console.log(`  Blog post: ${blogWithCategories?.titleEn}`);
    console.log(`  Categories: ${blogWithCategories?.blogCategories.map(bc => bc.category.nameEn).join(', ')}\n`);

    // Test 6: Verify composite indexes work
    console.log('✓ Test 6: Testing composite index queries...');
    const publishedBlogs = await prisma.content.findMany({
      where: {
        type: ContentType.BLOG,
        isPublished: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { publishedAt: 'desc' },
      ],
    });
    console.log(`  Query executed successfully (found ${publishedBlogs.length} published blogs)\n`);

    // Cleanup
    console.log('Cleaning up test data...');
    await prisma.blogCategoryAssociation.delete({ where: { id: association.id } });
    await prisma.content.delete({ where: { id: testBlogPost.id } });
    await prisma.blogCategory.delete({ where: { id: testCategory.id } });
    console.log('✓ Cleanup complete\n');

    console.log('✅ All schema verification tests passed!');
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyBlogSchema()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
