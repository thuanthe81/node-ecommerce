import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('Verifying database setup...\n');

  try {
    // Check users
    const userCount = await prisma.user.count();
    console.log(`✓ Users: ${userCount} records`);

    // Check categories
    const categoryCount = await prisma.category.count();
    console.log(`✓ Categories: ${categoryCount} records`);

    // Check products
    const productCount = await prisma.product.count();
    console.log(`✓ Products: ${productCount} records`);

    // Check product images
    const imageCount = await prisma.productImage.count();
    console.log(`✓ Product Images: ${imageCount} records`);

    // Check promotions
    const promotionCount = await prisma.promotion.count();
    console.log(`✓ Promotions: ${promotionCount} records`);

    // Check content pages
    const contentCount = await prisma.content.count();
    console.log(`✓ Content Pages: ${contentCount} records`);

    // Test a query
    const featuredProducts = await prisma.product.findMany({
      where: { isFeatured: true },
      include: {
        category: true,
        images: true,
      },
    });
    console.log(`✓ Featured Products: ${featuredProducts.length} records`);

    console.log('\n✅ Database setup verified successfully!');
    console.log('\nSample data:');
    console.log('- Admin: admin@handmade.com / admin123');
    console.log('- Customer: customer@example.com / customer123');
    console.log('- Promotion Code: WELCOME10 (10% off orders over $50)');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
