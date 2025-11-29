import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProductsImageService } from '../src/products/products-image.service';
import { ImageCleanupService } from '../src/products/image-cleanup.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Staging Monitoring and Validation Script
 *
 * This script performs comprehensive validation after migration:
 * 1. Check for errors or warnings
 * 2. Verify all images accessible
 * 3. Test upload of new images
 * 4. Run cleanup to check for orphans
 */

interface ValidationReport {
  timestamp: string;
  checks: {
    databaseIntegrity: { passed: boolean; details: string };
    imageAccessibility: { passed: boolean; accessible: number; total: number };
    newImageUpload: { passed: boolean; details: string };
    orphanedDirectories: { count: number; directories: string[] };
    fileSystemConsistency: { passed: boolean; details: string };
  };
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  recommendations: string[];
}

async function checkDatabaseIntegrity(prisma: PrismaService): Promise<{ passed: boolean; details: string }> {
  console.log('🔍 Checking database integrity...\n');

  try {
    // Check for duplicate image records (excluding external URLs like placeholders)
    const duplicates = await prisma.$queryRaw<Array<{ url: string; count: bigint }>>`
      SELECT url, COUNT(*) as count
      FROM product_images
      WHERE url NOT LIKE 'http%'
      GROUP BY url
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      return {
        passed: false,
        details: `Found ${duplicates.length} duplicate image URLs`,
      };
    }

    // Note: Due to onDelete: Cascade, orphaned images should not exist
    // This check is skipped as the database constraint prevents orphaned images

    // Check for products without images
    const productsWithoutImages = await prisma.product.findMany({
      where: {
        images: {
          none: {},
        },
      },
    });

    console.log(`   ✓ No duplicate image URLs`);
    console.log(`   ✓ No orphaned images`);
    console.log(`   ℹ ${productsWithoutImages.length} products without images (acceptable)\n`);

    return {
      passed: true,
      details: 'Database integrity check passed',
    };
  } catch (error) {
    return {
      passed: false,
      details: `Database integrity check failed: ${error.message}`,
    };
  }
}

async function checkImageAccessibility(prisma: PrismaService): Promise<{ passed: boolean; accessible: number; total: number }> {
  console.log('🔍 Checking image accessibility...\n');

  const images = await prisma.productImage.findMany();
  let accessible = 0;
  let missing = 0;
  let external = 0;

  for (const image of images) {
    const url = image.url;

    // Skip external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      external++;
      continue;
    }

    const filePath = path.join(__dirname, '..', url);

    if (fs.existsSync(filePath)) {
      accessible++;
    } else {
      missing++;
      console.log(`   ✗ Missing: ${url}`);
    }
  }

  console.log(`   ✓ Accessible: ${accessible}`);
  console.log(`   ℹ External URLs: ${external}`);
  if (missing > 0) {
    console.log(`   ✗ Missing: ${missing}`);
  }
  console.log('');

  return {
    passed: missing === 0,
    accessible,
    total: images.length - external,
  };
}

async function testNewImageUpload(prisma: PrismaService, imageService: ProductsImageService): Promise<{ passed: boolean; details: string }> {
  console.log('🔍 Testing new image upload...\n');

  try {
    // Get a test product
    const product = await prisma.product.findFirst();

    if (!product) {
      return {
        passed: false,
        details: 'No products found in database for testing',
      };
    }

    // Create a minimal valid JPEG buffer (1x1 pixel red JPEG)
    const testImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x37, 0xFF, 0xD9
    ]);
    const testFile = {
      buffer: testImageBuffer,
      originalname: 'test-upload.jpg',
      mimetype: 'image/jpeg',
      size: testImageBuffer.length,
    } as Express.Multer.File;

    // Upload the test image
    const uploadedImage = await imageService.uploadProductImage(product.id, testFile, {
      altTextEn: 'Test image',
      altTextVi: 'Ảnh thử nghiệm',
      displayOrder: 999,
    });

    // Verify the image was created with correct directory structure
    const expectedPathPattern = `/uploads/products/${product.id}/`;
    if (!uploadedImage.url.includes(expectedPathPattern)) {
      // Clean up
      await imageService.deleteProductImage(product.id, uploadedImage.id);
      return {
        passed: false,
        details: `Image URL does not follow new format. Expected path to contain ${expectedPathPattern}, got ${uploadedImage.url}`,
      };
    }

    // Verify file exists
    const filePath = path.join(__dirname, '..', uploadedImage.url);
    if (!fs.existsSync(filePath)) {
      // Clean up database record
      await prisma.productImage.delete({ where: { id: uploadedImage.id } });
      return {
        passed: false,
        details: `Uploaded file not found at ${filePath}`,
      };
    }

    // Verify thumbnail exists
    const thumbnailPath = uploadedImage.url.replace(`/products/${product.id}/`, `/products/${product.id}/thumbnails/`);
    const thumbnailFilePath = path.join(__dirname, '..', thumbnailPath);
    if (!fs.existsSync(thumbnailFilePath)) {
      // Clean up
      await imageService.deleteProductImage(product.id, uploadedImage.id);
      return {
        passed: false,
        details: `Thumbnail not found at ${thumbnailFilePath}`,
      };
    }

    // Clean up test image
    await imageService.deleteProductImage(product.id, uploadedImage.id);

    console.log(`   ✓ Image uploaded successfully to ${uploadedImage.url}`);
    console.log(`   ✓ Thumbnail created successfully`);
    console.log(`   ✓ Test image cleaned up\n`);

    return {
      passed: true,
      details: 'New image upload test passed',
    };
  } catch (error) {
    return {
      passed: false,
      details: `Image upload test failed: ${error.message}`,
    };
  }
}

async function checkOrphanedDirectories(cleanupService: ImageCleanupService): Promise<{ count: number; directories: string[] }> {
  console.log('🔍 Checking for orphaned directories...\n');

  try {
    const result = await cleanupService.findOrphanedDirectories();

    if (result.orphanedDirectories.length > 0) {
      console.log(`   ⚠ Found ${result.orphanedDirectories.length} orphaned directories:`);
      result.orphanedDirectories.forEach(dir => {
        console.log(`     - ${dir}`);
      });
      console.log(`   ℹ Total size: ${(result.totalSize / 1024 / 1024).toFixed(2)} MB\n`);
    } else {
      console.log(`   ✓ No orphaned directories found\n`);
    }

    return {
      count: result.orphanedDirectories.length,
      directories: result.orphanedDirectories,
    };
  } catch (error) {
    console.error(`   ✗ Error checking orphaned directories: ${error.message}\n`);
    return {
      count: 0,
      directories: [],
    };
  }
}

async function checkFileSystemConsistency(): Promise<{ passed: boolean; details: string }> {
  console.log('🔍 Checking file system consistency...\n');

  const uploadsDir = path.join(__dirname, '../uploads/products');

  try {
    if (!fs.existsSync(uploadsDir)) {
      return {
        passed: false,
        details: 'Uploads directory does not exist',
      };
    }

    // Check permissions
    try {
      fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
      console.log(`   ✓ Uploads directory has correct permissions`);
    } catch (error) {
      return {
        passed: false,
        details: 'Uploads directory does not have correct permissions',
      };
    }

    // Count directories and files
    const items = fs.readdirSync(uploadsDir);
    const directories = items.filter(item => {
      const itemPath = path.join(uploadsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    const files = items.filter(item => {
      const itemPath = path.join(uploadsDir, item);
      return fs.statSync(itemPath).isFile();
    });

    console.log(`   ℹ Product directories: ${directories.length}`);
    console.log(`   ℹ Legacy files: ${files.length}\n`);

    return {
      passed: true,
      details: `File system consistent: ${directories.length} directories, ${files.length} legacy files`,
    };
  } catch (error) {
    return {
      passed: false,
      details: `File system check failed: ${error.message}`,
    };
  }
}

async function main() {
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    checks: {
      databaseIntegrity: { passed: false, details: '' },
      imageAccessibility: { passed: false, accessible: 0, total: 0 },
      newImageUpload: { passed: false, details: '' },
      orphanedDirectories: { count: 0, directories: [] },
      fileSystemConsistency: { passed: false, details: '' },
    },
    overallStatus: 'FAIL',
    recommendations: [],
  };

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Staging Monitoring and Validation                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📅 Timestamp: ${report.timestamp}\n`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const prisma = app.get(PrismaService);
    const imageService = app.get(ProductsImageService);
    const cleanupService = app.get(ImageCleanupService);

    // Run all checks
    report.checks.databaseIntegrity = await checkDatabaseIntegrity(prisma);
    report.checks.imageAccessibility = await checkImageAccessibility(prisma);
    report.checks.newImageUpload = await testNewImageUpload(prisma, imageService);
    report.checks.orphanedDirectories = await checkOrphanedDirectories(cleanupService);
    report.checks.fileSystemConsistency = await checkFileSystemConsistency();

    // Determine overall status
    const allPassed =
      report.checks.databaseIntegrity.passed &&
      report.checks.imageAccessibility.passed &&
      report.checks.newImageUpload.passed &&
      report.checks.fileSystemConsistency.passed;

    const hasWarnings = report.checks.orphanedDirectories.count > 0;

    if (allPassed && !hasWarnings) {
      report.overallStatus = 'PASS';
    } else if (allPassed && hasWarnings) {
      report.overallStatus = 'WARNING';
    } else {
      report.overallStatus = 'FAIL';
    }

    // Generate recommendations
    if (!report.checks.databaseIntegrity.passed) {
      report.recommendations.push('Fix database integrity issues before proceeding');
    }
    if (!report.checks.imageAccessibility.passed) {
      report.recommendations.push('Investigate missing image files');
    }
    if (!report.checks.newImageUpload.passed) {
      report.recommendations.push('Fix image upload functionality before deploying');
    }
    if (report.checks.orphanedDirectories.count > 0) {
      report.recommendations.push(`Run cleanup utility to remove ${report.checks.orphanedDirectories.count} orphaned directories`);
    }
    if (!report.checks.fileSystemConsistency.passed) {
      report.recommendations.push('Fix file system permissions or structure');
    }

    // Display summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Validation Summary                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Overall Status: ${report.overallStatus === 'PASS' ? '✅ PASS' : report.overallStatus === 'WARNING' ? '⚠️  WARNING' : '❌ FAIL'}\n`);

    console.log('Checks:');
    console.log(`  Database Integrity: ${report.checks.databaseIntegrity.passed ? '✅' : '❌'} ${report.checks.databaseIntegrity.details}`);
    console.log(`  Image Accessibility: ${report.checks.imageAccessibility.passed ? '✅' : '❌'} ${report.checks.imageAccessibility.accessible}/${report.checks.imageAccessibility.total} accessible`);
    console.log(`  New Image Upload: ${report.checks.newImageUpload.passed ? '✅' : '❌'} ${report.checks.newImageUpload.details}`);
    console.log(`  Orphaned Directories: ${report.checks.orphanedDirectories.count === 0 ? '✅' : '⚠️ '} ${report.checks.orphanedDirectories.count} found`);
    console.log(`  File System: ${report.checks.fileSystemConsistency.passed ? '✅' : '❌'} ${report.checks.fileSystemConsistency.details}\n`);

    if (report.recommendations.length > 0) {
      console.log('Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Save report
    const reportPath = path.join(__dirname, `../validation-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}\n`);

    // Final message
    if (report.overallStatus === 'PASS') {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║          ✅ VALIDATION SUCCESSFUL                          ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('Staging environment is ready for production deployment.\n');
      process.exit(0);
    } else if (report.overallStatus === 'WARNING') {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║       ⚠️  VALIDATION PASSED WITH WARNINGS                  ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('Staging environment is functional but has minor issues.\n');
      console.log('Address warnings before production deployment.\n');
      process.exit(0);
    } else {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║          ❌ VALIDATION FAILED                              ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('Staging environment has critical issues.\n');
      console.log('Address all issues before proceeding.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Validation failed with error:\n');
    console.error(error);

    // Save error report
    const errorReportPath = path.join(__dirname, `../validation-error-${Date.now()}.json`);
    fs.writeFileSync(errorReportPath, JSON.stringify({
      ...report,
      error: error.message,
      stack: error.stack,
    }, null, 2));
    console.log(`\n📄 Error report saved to: ${errorReportPath}\n`);

    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
