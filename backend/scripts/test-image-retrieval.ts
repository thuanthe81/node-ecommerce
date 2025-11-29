import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Image Retrieval Script
 *
 * This script tests image retrieval after migration to ensure:
 * 1. Images in new hierarchical structure are accessible
 * 2. Images in legacy flat structure are accessible (backward compatibility)
 * 3. Database URLs are correct
 */

async function testImageRetrieval(prisma: PrismaService) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              Test Image Retrieval                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get all product images
  const images = await prisma.productImage.findMany({
    include: {
      product: {
        select: {
          id: true,
          nameEn: true,
        },
      },
    },
  });

  console.log(`📊 Found ${images.length} images in database\n`);

  let successCount = 0;
  let failureCount = 0;
  let legacyCount = 0;
  let newFormatCount = 0;
  let externalCount = 0;

  for (const image of images) {
    const url = image.url;

    // Check if it's an external URL (placeholder)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log(`🌐 External URL: ${url}`);
      externalCount++;
      continue;
    }

    // Check if it follows new format (contains product ID in path)
    const isNewFormat = url.includes(`/products/${image.productId}/`);

    if (isNewFormat) {
      newFormatCount++;
      console.log(`✅ New format: ${url}`);
    } else {
      legacyCount++;
      console.log(`📦 Legacy format: ${url}`);
    }

    // Check if file exists
    const filePath = path.join(__dirname, '..', url);

    if (fs.existsSync(filePath)) {
      successCount++;
      console.log(`   ✓ File exists at: ${filePath}`);
    } else {
      failureCount++;
      console.log(`   ✗ File NOT found at: ${filePath}`);
    }

    console.log('');
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Summary                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Total images: ${images.length}`);
  console.log(`✅ Files found: ${successCount}`);
  console.log(`❌ Files missing: ${failureCount}`);
  console.log(`📦 Legacy format: ${legacyCount}`);
  console.log(`🆕 New format: ${newFormatCount}`);
  console.log(`🌐 External URLs: ${externalCount}\n`);

  if (failureCount === 0) {
    console.log('✅ All images are accessible!\n');
    return true;
  } else {
    console.log(`⚠️  ${failureCount} images are not accessible\n`);
    return false;
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const prisma = app.get(PrismaService);
    const success = await testImageRetrieval(prisma);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error testing image retrieval:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
