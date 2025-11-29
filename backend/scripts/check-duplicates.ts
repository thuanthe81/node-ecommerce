import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const prisma = app.get(PrismaService);

    const duplicates = await prisma.$queryRaw<Array<{ url: string; count: bigint }>>`
      SELECT url, COUNT(*) as count
      FROM product_images
      GROUP BY url
      HAVING COUNT(*) > 1
    `;

    console.log('Duplicate URLs:');
    for (const dup of duplicates) {
      console.log(`  ${dup.url}: ${dup.count} occurrences`);

      const images = await prisma.productImage.findMany({
        where: { url: dup.url },
        include: { product: { select: { id: true, nameEn: true } } },
      });

      console.log('    Images:');
      for (const img of images) {
        console.log(`      - ID: ${img.id}, Product: ${img.product.nameEn} (${img.productId})`);
      }
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
