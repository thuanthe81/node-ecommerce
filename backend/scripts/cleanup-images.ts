import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ImageCleanupService } from '../src/products/image-cleanup.service';

interface CliOptions {
  dryRun: boolean;
  confirm: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    confirm: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--confirm') {
      options.confirm = true;
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
Product Image Cleanup Script

Usage: npm run cleanup:orphaned-images [options]

Options:
  --dry-run    Scan for orphaned directories without deleting them (preview mode)
  --confirm    Confirm deletion of orphaned directories (required for actual cleanup)
  --help, -h   Show this help message

Examples:
  npm run cleanup:orphaned-images --dry-run
  npm run cleanup:orphaned-images --confirm
  npm run cleanup:orphaned-images --dry-run --confirm  (dry-run takes precedence)

Description:
  This script identifies and removes orphaned product image directories.
  An orphaned directory is one that exists in uploads/products/[product-id]/
  but the product ID no longer exists in the database.

  The cleanup process:
  1. Scans uploads/products/ for product-specific directories
  2. Checks each directory against the database
  3. Identifies directories for non-existent products
  4. Calculates total disk space used by orphaned directories
  5. Optionally removes orphaned directories (with --confirm)

  Safety features:
  - Validates directory names are valid UUIDs
  - Verifies product doesn't exist before deletion
  - Requires explicit --confirm flag for deletion
  - Continues processing even if individual deletions fail

  It is recommended to run with --dry-run first to preview what will be deleted.
  Always ensure you have a backup before running cleanup with --confirm.
`);
}

async function main() {
  const options = parseArgs();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Product Image Cleanup Script                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (options.dryRun) {
    console.log('🔍 Running in DRY RUN mode - scanning only, no deletions\n');
  } else if (options.confirm) {
    console.log('⚠️  Running in CLEANUP mode - orphaned directories will be DELETED\n');
  } else {
    console.log('ℹ️  Running in SCAN mode - use --confirm to delete orphaned directories\n');
  }

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    // Get the cleanup service
    const cleanupService = app.get(ImageCleanupService);

    console.log('Scanning for orphaned directories...\n');
    const startTime = Date.now();

    let result;

    if (options.dryRun || !options.confirm) {
      // Just scan and report
      result = await cleanupService.findOrphanedDirectories();

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Display results
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                   Scan Results                             ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      if (result.orphanedDirectories.length === 0) {
        console.log('✅ No orphaned directories found - system is clean!\n');
      } else {
        console.log(`Found ${result.orphanedDirectories.length} orphaned directories:\n`);

        result.orphanedDirectories.forEach((productId, index) => {
          console.log(`  ${index + 1}. ${productId}`);
        });

        console.log(`\nTotal disk space used: ${formatBytes(result.totalSize)}`);
        console.log(`⏱️  Scan duration: ${duration}s\n`);

        console.log('Recommendations:');
        result.recommendations.forEach((rec) => {
          console.log(`  • ${rec}`);
        });
        console.log('');

        if (!options.confirm) {
          console.log('💡 To remove these directories, run:');
          console.log('   npm run cleanup:orphaned-images --confirm\n');
        }
      }
    } else {
      // Perform actual cleanup
      console.log('⚠️  WARNING: This will permanently delete orphaned directories!\n');
      console.log('Starting cleanup in 3 seconds... (Press Ctrl+C to cancel)\n');

      // Give user a chance to cancel
      await new Promise((resolve) => setTimeout(resolve, 3000));

      result = await cleanupService.cleanupAllOrphaned(true);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Display results
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                   Cleanup Results                          ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log(`⏱️  Duration: ${duration}s\n`);

      console.log('Results:');
      result.recommendations.forEach((rec) => {
        console.log(`  ${rec}`);
      });
      console.log('');

      console.log('✨ Cleanup completed!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed with error:\n');
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

main();
