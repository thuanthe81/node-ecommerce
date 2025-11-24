/**
 * Verification script for caching implementation
 * Tests that homepage sections and footer settings caching is working
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContentService } from '../src/content/content.service';
import { FooterSettingsService } from '../src/footer-settings/footer-settings.service';

async function verifyCaching() {
  console.log('🔍 Verifying caching implementation...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const contentService = app.get(ContentService);
    const footerSettingsService = app.get(FooterSettingsService);

    // Test 1: Homepage sections caching
    console.log('📝 Test 1: Homepage sections caching');
    console.log('Fetching homepage sections (first call - should hit database)...');
    const start1 = Date.now();
    const sections1 = await contentService.getHomepageSections();
    const time1 = Date.now() - start1;
    console.log(`✓ Found ${sections1.length} sections in ${time1}ms`);

    console.log('Fetching homepage sections (second call - should hit cache)...');
    const start2 = Date.now();
    const sections2 = await contentService.getHomepageSections();
    const time2 = Date.now() - start2;
    console.log(`✓ Found ${sections2.length} sections in ${time2}ms`);

    if (time2 < time1) {
      console.log('✅ Cache is working! Second call was faster.\n');
    } else {
      console.log('⚠️  Cache might not be working as expected.\n');
    }

    // Test 2: Footer settings caching
    console.log('📝 Test 2: Footer settings caching');
    console.log('Fetching footer settings (first call - should hit database)...');
    const start3 = Date.now();
    const footer1 = await footerSettingsService.getFooterSettings();
    const time3 = Date.now() - start3;
    console.log(`✓ Found footer settings in ${time3}ms`);

    console.log('Fetching footer settings (second call - should hit cache)...');
    const start4 = Date.now();
    const footer2 = await footerSettingsService.getFooterSettings();
    const time4 = Date.now() - start4;
    console.log(`✓ Found footer settings in ${time4}ms`);

    if (time4 < time3) {
      console.log('✅ Cache is working! Second call was faster.\n');
    } else {
      console.log('⚠️  Cache might not be working as expected.\n');
    }

    console.log('✅ Caching verification complete!');
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

verifyCaching();
