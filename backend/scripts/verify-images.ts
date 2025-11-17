import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying product images in database...\n');

  const products = await prisma.product.findMany({
    include: {
      images: true,
    },
    orderBy: {
      nameEn: 'asc',
    },
  });

  console.log(`Total products: ${products.length}\n`);

  for (const product of products) {
    console.log(`Product: ${product.nameEn}`);
    console.log(`  Slug: ${product.slug}`);
    console.log(`  Images: ${product.images.length}`);

    if (product.images.length > 0) {
      product.images.forEach((img, idx) => {
        console.log(`    [${idx}] URL: ${img.url}`);
        console.log(`        Alt (EN): ${img.altTextEn}`);
        console.log(`        Alt (VI): ${img.altTextVi}`);
      });
    } else {
      console.log('    No images found!');
    }
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
