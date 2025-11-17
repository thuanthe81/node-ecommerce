import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up old placeholder image URLs...\n');

  // Find all product images with placeholder URLs
  const oldImages = await prisma.productImage.findMany({
    where: {
      url: {
        contains: 'placeholder.com',
      },
    },
  });

  console.log(`Found ${oldImages.length} old placeholder images to remove\n`);

  for (const image of oldImages) {
    console.log(`Deleting image: ${image.url}`);
    await prisma.productImage.delete({
      where: { id: image.id },
    });
  }

  console.log('\nCleanup completed!');

  // Verify results
  const remainingImages = await prisma.productImage.findMany({
    include: {
      product: {
        select: {
          nameEn: true,
        },
      },
    },
  });

  console.log(`\nRemaining images: ${remainingImages.length}`);
  remainingImages.forEach((img) => {
    console.log(`  - ${img.product.nameEn}: ${img.url}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
