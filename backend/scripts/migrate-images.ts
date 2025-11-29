import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ImageMigrationService } from '../src/products/image-migration.service';

interface CliOptions {
  dryRun: boolean;
  batchSize: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    batchSize: 50,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--batch-size') {
      const nextArg = args[i + 1];
      if (nextArg && !isNaN(parseInt(nextArg, 10))) {
        options.batchSize = parseInt(nextArg, 10);
        i++; // Skip next arg since we consumed it
      } else {
        console.error('Error: --batch-size requires a numeric value');
        process.exit(1);
      }
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Error: Unknown option '${arg}'`);
      printHelp();
      process.exit(1);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Product Image Migration Script

Usage: npm run migrate:images [options]

Options:
  --dry-run           Run migration without making any changes (preview mode)
  --batch-size <num>  Number of images to process per batch (default: 50)
  --help, -h          Show this help message

Examples:
  npm run migrate:images --dry-run
  npm run migrate:images --batch-size 100
  npm run migrate:images --dry-run --batch-size 25

Description:
  This script migrates product images from the flat directory structure
  (uploads/products/) to a hierarchical structure organized by product ID
  (uploads/products/[product-id]/).

  The migration process:
  1. Creates a database backup (unless --dry-run)
  2. Identifies all images in the database
  3. Extracts product IDs from filenames
  4. Moves images to product-specific directories
  5. Updates database URLs to reflect new paths
  6. Reports migration results

  It is recommended to run with --dry-run first to preview the changes.
`);
}

async function main() {
  const options = parseArgs();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Product Image Migration Script                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (options.dryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
  } else {
    console.log('⚠️  Running in LIVE mode - changes will be applied\n');
  }

  console.log(`Configuration:`);
  console.log(`  - Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log(`  - Batch Size: ${options.batchSize}`);
  console.log('');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    // Get the migration service
    const migrationService = app.get(ImageMigrationService);

    // Display progress indicator
    console.log('Starting migration...\n');
    const startTime = Date.now();

    // Run migration
    const result = await migrationService.migrateImages({
      dryRun: options.dryRun,
      batchSize: options.batchSize,
      backupDatabase: !options.dryRun, // Only backup in live mode
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Display results
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   Migration Results                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Images:     ${result.totalImages}`);
    console.log(`✅ Migrated:      ${result.migratedImages}`);
    console.log(`⏭️  Skipped:       ${result.skippedImages}`);
    console.log(`❌ Failed:        ${result.failedImages}`);
    console.log(`⏱️  Duration:      ${duration}s\n`);

    // Display errors if any
    if (result.errors.length > 0) {
      console.log('Errors encountered:\n');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. Image ID: ${error.imageId}`);
        console.log(`   Filename: ${error.filename}`);
        console.log(`   Error: ${error.error}\n`);
      });
    }

    // Display summary message
    if (options.dryRun) {
      console.log('✨ Dry run completed successfully!');
      console.log('   Run without --dry-run to apply changes.\n');
    } else {
      if (result.failedImages === 0) {
        console.log('✨ Migration completed successfully!\n');

        // Suggest verification
        console.log('Next steps:');
        console.log('  1. Verify migration: npm run verify:migration');
        console.log('  2. Test image retrieval in the application');
        console.log('  3. Monitor for any issues\n');
      } else {
        console.log('⚠️  Migration completed with errors.');
        console.log('   Please review the errors above and retry failed images.\n');
      }
    }

    // Exit with appropriate code
    process.exit(result.failedImages > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Migration failed with error:\n');
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
