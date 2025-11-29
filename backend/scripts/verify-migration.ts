import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ImageMigrationService } from '../src/products/image-migration.service';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        Product Image Migration Verification               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    // Get the migration service
    const migrationService = app.get(ImageMigrationService);

    console.log('Verifying migration...\n');

    // Run verification
    const result = await migrationService.verifyMigration();

    // Display results
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 Verification Results                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (result.valid) {
      console.log('✅ Verification passed!');
      console.log('   All images are correctly migrated and accessible.\n');
      process.exit(0);
    } else {
      console.log(`❌ Verification failed with ${result.issues.length} issue(s):\n`);

      result.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });

      console.log('\nPlease review and fix the issues above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Verification failed with error:\n');
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main();
