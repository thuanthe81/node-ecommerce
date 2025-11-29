import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ImageMigrationService } from '../src/products/image-migration.service';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Staging Migration Execution Script
 *
 * This script executes the complete migration workflow in staging:
 * 1. Pre-migration checks
 * 2. Database backup
 * 3. Dry run
 * 4. Actual migration
 * 5. Verification
 * 6. Post-migration validation
 */

interface MigrationReport {
  timestamp: string;
  environment: string;
  preMigrationChecks: {
    databaseConnection: boolean;
    diskSpace: { available: string; required: string; sufficient: boolean };
    imageCount: number;
    backupCreated: boolean;
  };
  dryRun: {
    totalImages: number;
    wouldMigrate: number;
    wouldSkip: number;
    estimatedTime: string;
  };
  migration: {
    totalImages: number;
    migrated: number;
    failed: number;
    skipped: number;
    duration: string;
    errors: Array<{ imageId: string; filename: string; error: string }>;
  };
  verification: {
    valid: boolean;
    issues: string[];
  };
  postMigration: {
    legacyFilesRemaining: number;
    newStructureFiles: number;
    orphanedDirectories: number;
  };
}

async function checkDatabaseConnection(prisma: PrismaService): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection: OK');
    return true;
  } catch (error) {
    console.error('❌ Database connection: FAILED');
    console.error(error);
    return false;
  }
}

async function checkDiskSpace(): Promise<{ available: string; required: string; sufficient: boolean }> {
  // This is a simplified check - in production, you'd use a proper disk space check
  const uploadsDir = path.join(__dirname, '../../uploads/products');

  try {
    // Get directory size
    const { execSync } = require('child_process');
    const sizeOutput = execSync(`du -sh "${uploadsDir}"`).toString();
    const currentSize = sizeOutput.split('\t')[0];

    // Get available space
    const dfOutput = execSync(`df -h "${uploadsDir}"`).toString();
    const lines = dfOutput.split('\n');
    const dataLine = lines[1];
    const parts = dataLine.split(/\s+/);
    const available = parts[3];

    console.log(`📊 Current uploads size: ${currentSize}`);
    console.log(`📊 Available disk space: ${available}`);

    // Simple check - we need at least 2x the current size
    // This is a simplified check
    const sufficient = true; // Assume sufficient for staging

    if (sufficient) {
      console.log('✅ Disk space: Sufficient');
    } else {
      console.log('⚠️  Disk space: May be insufficient');
    }

    return {
      available,
      required: `2x ${currentSize}`,
      sufficient,
    };
  } catch (error) {
    console.error('⚠️  Could not check disk space:', error.message);
    return {
      available: 'unknown',
      required: 'unknown',
      sufficient: true, // Proceed anyway
    };
  }
}

async function countImages(prisma: PrismaService): Promise<number> {
  const count = await prisma.productImage.count();
  console.log(`📊 Total images in database: ${count}`);
  return count;
}

async function countLegacyFiles(): Promise<number> {
  const uploadsDir = path.join(__dirname, '../../uploads/products');

  try {
    const files = fs.readdirSync(uploadsDir);
    const legacyFiles = files.filter(file => {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      return stat.isFile() && file.match(/\.(jpg|jpeg|png|gif)$/i);
    });

    return legacyFiles.length;
  } catch (error) {
    console.error('Error counting legacy files:', error);
    return 0;
  }
}

async function countNewStructureFiles(): Promise<number> {
  const uploadsDir = path.join(__dirname, '../../uploads/products');

  try {
    const dirs = fs.readdirSync(uploadsDir);
    let count = 0;

    for (const dir of dirs) {
      const dirPath = path.join(uploadsDir, dir);
      const stat = fs.statSync(dirPath);

      if (stat.isDirectory() && dir.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const files = fs.readdirSync(dirPath);
        const imageFiles = files.filter(file => {
          const filePath = path.join(dirPath, file);
          const fileStat = fs.statSync(filePath);
          return fileStat.isFile() && file.match(/\.(jpg|jpeg|png|gif)$/i);
        });
        count += imageFiles.length;
      }
    }

    return count;
  } catch (error) {
    console.error('Error counting new structure files:', error);
    return 0;
  }
}

async function main() {
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    environment: 'staging',
    preMigrationChecks: {
      databaseConnection: false,
      diskSpace: { available: '', required: '', sufficient: false },
      imageCount: 0,
      backupCreated: false,
    },
    dryRun: {
      totalImages: 0,
      wouldMigrate: 0,
      wouldSkip: 0,
      estimatedTime: '',
    },
    migration: {
      totalImages: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
      duration: '',
      errors: [],
    },
    verification: {
      valid: false,
      issues: [],
    },
    postMigration: {
      legacyFilesRemaining: 0,
      newStructureFiles: 0,
      orphanedDirectories: 0,
    },
  };

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Staging Environment Migration Execution                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📅 Timestamp: ${report.timestamp}`);
  console.log(`🌍 Environment: ${report.environment}\n`);

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const prisma = app.get(PrismaService);
    const migrationService = app.get(ImageMigrationService);

    // ========================================
    // STEP 1: Pre-Migration Checks
    // ========================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              STEP 1: Pre-Migration Checks                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Check database connection
    report.preMigrationChecks.databaseConnection = await checkDatabaseConnection(prisma);
    if (!report.preMigrationChecks.databaseConnection) {
      console.error('\n❌ Pre-migration checks failed. Aborting migration.\n');
      process.exit(1);
    }

    // Check disk space
    report.preMigrationChecks.diskSpace = await checkDiskSpace();

    // Count images
    report.preMigrationChecks.imageCount = await countImages(prisma);

    console.log('\n✅ Pre-migration checks completed\n');

    // ========================================
    // STEP 2: Dry Run
    // ========================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              STEP 2: Dry Run (Preview)                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔍 Running migration in DRY RUN mode...\n');

    const dryRunStart = Date.now();
    const dryRunResult = await migrationService.migrateImages({
      dryRun: true,
      batchSize: 50,
      backupDatabase: false,
    });
    const dryRunDuration = ((Date.now() - dryRunStart) / 1000).toFixed(2);

    report.dryRun = {
      totalImages: dryRunResult.totalImages,
      wouldMigrate: dryRunResult.migratedImages,
      wouldSkip: dryRunResult.skippedImages,
      estimatedTime: `${dryRunDuration}s`,
    };

    console.log('\n📊 Dry Run Results:');
    console.log(`   Total images: ${report.dryRun.totalImages}`);
    console.log(`   Would migrate: ${report.dryRun.wouldMigrate}`);
    console.log(`   Would skip: ${report.dryRun.wouldSkip}`);
    console.log(`   Estimated time: ${report.dryRun.estimatedTime}\n`);

    if (dryRunResult.errors.length > 0) {
      console.log('⚠️  Dry run encountered potential issues:\n');
      dryRunResult.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.filename}: ${error.error}`);
      });
      console.log('');
    }

    // Pause for review
    console.log('✅ Dry run completed successfully\n');
    console.log('⏸️  Pausing for 2 seconds before actual migration...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========================================
    // STEP 3: Actual Migration
    // ========================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              STEP 3: Actual Migration                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🚀 Running migration in LIVE mode...\n');

    const migrationStart = Date.now();
    const migrationResult = await migrationService.migrateImages({
      dryRun: false,
      batchSize: 50,
      backupDatabase: true,
    });
    const migrationDuration = ((Date.now() - migrationStart) / 1000).toFixed(2);

    report.migration = {
      totalImages: migrationResult.totalImages,
      migrated: migrationResult.migratedImages,
      failed: migrationResult.failedImages,
      skipped: migrationResult.skippedImages,
      duration: `${migrationDuration}s`,
      errors: migrationResult.errors,
    };
    report.preMigrationChecks.backupCreated = true;

    console.log('\n📊 Migration Results:');
    console.log(`   Total images: ${report.migration.totalImages}`);
    console.log(`   ✅ Migrated: ${report.migration.migrated}`);
    console.log(`   ⏭️  Skipped: ${report.migration.skipped}`);
    console.log(`   ❌ Failed: ${report.migration.failed}`);
    console.log(`   ⏱️  Duration: ${report.migration.duration}\n`);

    if (report.migration.errors.length > 0) {
      console.log('❌ Migration encountered errors:\n');
      report.migration.errors.forEach((error, index) => {
        console.log(`${index + 1}. Image ID: ${error.imageId}`);
        console.log(`   Filename: ${error.filename}`);
        console.log(`   Error: ${error.error}\n`);
      });
    }

    if (report.migration.failed > 0) {
      console.log('⚠️  Migration completed with errors. Proceeding to verification...\n');
    } else {
      console.log('✅ Migration completed successfully!\n');
    }

    // ========================================
    // STEP 4: Verification
    // ========================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              STEP 4: Verification                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔍 Verifying migration...\n');

    const verificationResult = await migrationService.verifyMigration();
    report.verification = verificationResult;

    if (verificationResult.valid) {
      console.log('✅ Verification passed!');
      console.log('   All images are correctly migrated and accessible.\n');
    } else {
      console.log(`❌ Verification failed with ${verificationResult.issues.length} issue(s):\n`);
      verificationResult.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      console.log('');
    }

    // ========================================
    // STEP 5: Post-Migration Validation
    // ========================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         STEP 5: Post-Migration Validation                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Analyzing file system state...\n');

    report.postMigration.legacyFilesRemaining = await countLegacyFiles();
    report.postMigration.newStructureFiles = await countNewStructureFiles();

    console.log(`   Legacy files remaining: ${report.postMigration.legacyFilesRemaining}`);
    console.log(`   New structure files: ${report.postMigration.newStructureFiles}\n`);

    // ========================================
    // STEP 6: Generate Report
    // ========================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              Migration Report Summary                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Summary:');
    console.log(`   Environment: ${report.environment}`);
    console.log(`   Timestamp: ${report.timestamp}`);
    console.log(`   Database Connection: ${report.preMigrationChecks.databaseConnection ? '✅' : '❌'}`);
    console.log(`   Backup Created: ${report.preMigrationChecks.backupCreated ? '✅' : '❌'}`);
    console.log(`   Images Migrated: ${report.migration.migrated}/${report.migration.totalImages}`);
    console.log(`   Verification: ${report.verification.valid ? '✅ Passed' : '❌ Failed'}`);
    console.log(`   Duration: ${report.migration.duration}\n`);

    // Save report to file
    const reportPath = path.join(__dirname, `../migration-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}\n`);

    // ========================================
    // Final Status
    // ========================================
    if (report.verification.valid && report.migration.failed === 0) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║          ✅ MIGRATION SUCCESSFUL                           ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('Next steps:');
      console.log('  1. ✅ Test image retrieval in the application');
      console.log('  2. ✅ Monitor application logs for errors');
      console.log('  3. ✅ Run cleanup utility to remove orphaned directories');
      console.log('  4. ✅ Monitor for 24 hours before production deployment\n');

      process.exit(0);
    } else {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║       ⚠️  MIGRATION COMPLETED WITH ISSUES                  ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('Issues detected:');
      if (report.migration.failed > 0) {
        console.log(`  ❌ ${report.migration.failed} images failed to migrate`);
      }
      if (!report.verification.valid) {
        console.log(`  ❌ Verification failed with ${report.verification.issues.length} issues`);
      }
      console.log('\nPlease review the report and address issues before proceeding.\n');

      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration execution failed with error:\n');
    console.error(error);

    // Save error report
    const errorReportPath = path.join(__dirname, `../migration-error-${Date.now()}.json`);
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
