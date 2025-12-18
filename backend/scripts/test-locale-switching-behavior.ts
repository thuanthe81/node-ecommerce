#!/usr/bin/env ts-node

/**
 * Locale Switching Behavior Test Script
 *
 * This script tests locale switching behavior to verify proper translation
 * switching and no cross-contamination between English and Vietnamese locales.
 *
 * Requirements: 2.2, 2.3, 3.1, 3.2
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PDFDocumentStructureService } from '../src/pdf-generator/pdf-document-structure.service';
import { PDFTemplateEngine } from '../src/pdf-generator/pdf-template.engine';
import { PDFLocalizationService } from '../src/pdf-generator/services/pdf-localization.service';
import { OrderPDFData, ShippingMethodData } from '../src/pdf-generator/types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';

interface LocaleSwitchingTest {
  name: string;
  description: string;
  shippingMethod: ShippingMethodData;
  testSequence: ('en' | 'vi')[];
}

const localeSwitchingTests: LocaleSwitchingTest[] = [
  {
    name: 'rapid-switching',
    description: 'Rapid switching between locales',
    shippingMethod: {
      name: 'Express Delivery',
      description: 'Fast delivery within 24 hours',
      estimatedDelivery: '2024-12-20',
      trackingNumber: 'TRK123456789',
      carrier: 'DHL Express'
    },
    testSequence: ['en', 'vi', 'en', 'vi', 'en']
  },
  {
    name: 'vietnamese-first',
    description: 'Starting with Vietnamese then switching to English',
    shippingMethod: {
      name: 'Giao hàng nhanh',
      description: 'Giao hàng trong ngày',
      trackingNumber: 'VN123456789'
    },
    testSequence: ['vi', 'en', 'vi']
  },
  {
    name: 'english-first',
    description: 'Starting with English then switching to Vietnamese',
    shippingMethod: {
      name: 'Standard Shipping',
      carrier: 'FedEx'
    },
    testSequence: ['en', 'vi', 'en']
  },
  {
    name: 'multiple-cycles',
    description: 'Multiple complete cycles of locale switching',
    shippingMethod: {
      name: 'Premium Delivery',
      description: 'Premium service with tracking',
      estimatedDelivery: '2024-12-19',
      trackingNumber: 'PREM789',
      carrier: 'UPS'
    },
    testSequence: ['en', 'vi', 'en', 'vi', 'en', 'vi']
  }
];

// Expected translations for validation
const expectedTranslations = {
  en: {
    shippingInformation: 'Shipping Information',
    shippingMethod: 'Method',
    description: 'Description',
    estimatedDelivery: 'Estimated Delivery',
    trackingNumber: 'Tracking Number',
    carrier: 'Carrier'
  },
  vi: {
    shippingInformation: 'Thông tin vận chuyển',
    shippingMethod: 'Phương thức',
    description: 'Mô tả',
    estimatedDelivery: 'Dự kiến giao hàng',
    trackingNumber: 'Mã vận đơn',
    carrier: 'Đơn vị vận chuyển'
  }
};

// Base order data template
const createOrderData = (shippingMethod: ShippingMethodData, locale: 'en' | 'vi' = 'en'): OrderPDFData => ({
  orderNumber: 'LOCALE-' + Date.now(),
  orderDate: new Date().toISOString().split('T')[0],
  customerInfo: {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+84 123 456 789'
  },
  shippingAddress: {
    fullName: 'Test Customer',
    addressLine1: '123 Test Street',
    addressLine2: 'Apartment 4B',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    postalCode: '700000',
    country: 'Vietnam',
    phone: '+84 123 456 789'
  },
  billingAddress: {
    fullName: 'Test Customer',
    addressLine1: '123 Test Street',
    addressLine2: 'Apartment 4B',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    postalCode: '700000',
    country: 'Vietnam',
    phone: '+84 123 456 789'
  },
  items: [
    {
      id: 'test-product-1',
      name: 'Test Product',
      description: 'A sample product for testing',
      sku: 'TEST-001',
      quantity: 2,
      unitPrice: 150000,
      totalPrice: 300000,
      category: 'Electronics'
    }
  ],
  pricing: {
    subtotal: 300000,
    shippingCost: 50000,
    taxAmount: 0,
    discountAmount: 0,
    total: 350000
  },
  paymentMethod: {
    type: 'bank_transfer',
    status: 'pending',
    displayName: 'Bank Transfer'
  },
  shippingMethod,
  locale,
  businessInfo: {
    companyName: 'Test Company',
    address: {
      fullName: 'Test Company',
      addressLine1: '456 Business Street',
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      postalCode: '700000',
      country: 'Vietnam'
    },
    contactEmail: 'business@example.com',
    contactPhone: '+84 987 654 321'
  }
});

function extractTranslationsFromHTML(html: string): Record<string, string> {
  const translations: Record<string, string> = {};

  // Extract section title
  const titleMatch = html.match(/<h2[^>]*class="section-title"[^>]*>([^<]+)<\/h2>/);
  if (titleMatch) {
    translations.shippingInformation = titleMatch[1].trim();
  }

  // Extract shipping labels
  const labelMatches = html.matchAll(/<span[^>]*class="shipping-label"[^>]*>([^<]+):<\/span>/g);
  for (const match of labelMatches) {
    const label = match[1].trim();

    // Map to semantic keys based on content
    if (label === 'Method' || label === 'Phương thức') {
      translations.shippingMethod = label;
    } else if (label === 'Description' || label === 'Mô tả') {
      translations.description = label;
    } else if (label === 'Estimated Delivery' || label === 'Dự kiến giao hàng') {
      translations.estimatedDelivery = label;
    } else if (label === 'Tracking Number' || label === 'Mã vận đơn') {
      translations.trackingNumber = label;
    } else if (label === 'Carrier' || label === 'Đơn vị vận chuyển') {
      translations.carrier = label;
    }
  }

  return translations;
}

function validateTranslations(extracted: Record<string, string>, expected: Record<string, string>, locale: 'en' | 'vi'): string[] {
  const errors: string[] = [];

  Object.entries(expected).forEach(([key, expectedValue]) => {
    if (extracted[key] && extracted[key] !== expectedValue) {
      errors.push(`${key}: expected "${expectedValue}", got "${extracted[key]}"`);
    }
  });

  // Check for cross-contamination (English text in Vietnamese locale or vice versa)
  if (locale === 'vi') {
    Object.values(extracted).forEach(value => {
      if (Object.values(expectedTranslations.en).includes(value)) {
        errors.push(`Cross-contamination: Found English text "${value}" in Vietnamese locale`);
      }
    });
  } else {
    Object.values(extracted).forEach(value => {
      if (Object.values(expectedTranslations.vi).includes(value)) {
        errors.push(`Cross-contamination: Found Vietnamese text "${value}" in English locale`);
      }
    });
  }

  return errors;
}

async function testLocaleSwitchingBehavior() {
  console.log('🔄 Starting Locale Switching Behavior Test');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const documentStructureService = app.get(PDFDocumentStructureService);
  const templateEngine = app.get(PDFTemplateEngine);
  const localizationService = app.get(PDFLocalizationService);

  // Create output directory
  const outputDir = path.join(process.cwd(), 'uploads', 'test-pdfs', 'locale-switching');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const testResults: Array<{
    testName: string;
    sequence: ('en' | 'vi')[];
    results: Array<{
      step: number;
      locale: 'en' | 'vi';
      service: 'document-structure' | 'template-engine';
      success: boolean;
      extractedTranslations: Record<string, string>;
      validationErrors: string[];
    }>;
    overallSuccess: boolean;
    crossContaminationDetected: boolean;
  }> = [];

  // Test each locale switching scenario
  for (const test of localeSwitchingTests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Sequence: ${test.testSequence.join(' → ')}`);

    const testResult = {
      testName: test.name,
      sequence: test.testSequence,
      results: [] as any[],
      overallSuccess: true,
      crossContaminationDetected: false
    };

    // Execute the locale switching sequence
    for (let step = 0; step < test.testSequence.length; step++) {
      const locale = test.testSequence[step];
      console.log(`   Step ${step + 1}: ${locale.toUpperCase()}`);

      const orderData = createOrderData(test.shippingMethod, locale);

      // Test both services
      for (const serviceName of ['document-structure', 'template-engine'] as const) {
        let html: string;

        if (serviceName === 'document-structure') {
          html = (documentStructureService as any).generateShippingSection(orderData, locale);
        } else {
          html = (templateEngine as any).generateShippingInfoHTML(orderData, locale);
        }

        // Save HTML for inspection
        const fileName = `${test.name}-step${step + 1}-${locale}-${serviceName}.html`;
        fs.writeFileSync(path.join(outputDir, fileName), html);

        // Extract and validate translations
        const extractedTranslations = extractTranslationsFromHTML(html);
        const validationErrors = validateTranslations(extractedTranslations, expectedTranslations[locale], locale);

        const stepResult = {
          step: step + 1,
          locale,
          service: serviceName,
          success: validationErrors.length === 0,
          extractedTranslations,
          validationErrors
        };

        testResult.results.push(stepResult);

        if (validationErrors.length > 0) {
          testResult.overallSuccess = false;

          // Check for cross-contamination specifically
          const hasCrossContamination = validationErrors.some(error =>
            error.includes('Cross-contamination')
          );
          if (hasCrossContamination) {
            testResult.crossContaminationDetected = true;
          }

          console.log(`     ❌ ${serviceName}: ${validationErrors.length} errors`);
          validationErrors.forEach(error => {
            console.log(`       - ${error}`);
          });
        } else {
          console.log(`     ✅ ${serviceName}: All translations correct`);
        }
      }
    }

    testResults.push(testResult);

    if (testResult.overallSuccess) {
      console.log(`   🎉 Test passed: No cross-contamination detected`);
    } else {
      console.log(`   ⚠️  Test issues: ${testResult.crossContaminationDetected ? 'Cross-contamination detected' : 'Translation errors found'}`);
    }
  }

  // Test direct localization service behavior
  console.log('\n🔍 Testing Direct Localization Service Behavior');
  console.log('-' .repeat(40));

  const directServiceResults: Array<{
    key: string;
    enValue: string;
    viValue: string;
    consistent: boolean;
  }> = [];

  const keysToTest: (keyof typeof expectedTranslations.en)[] = ['shippingInformation', 'shippingMethod', 'description', 'estimatedDelivery', 'trackingNumber', 'carrier'];

  for (const key of keysToTest) {
    const enValue = localizationService.translate(key, 'en');
    const viValue = localizationService.translate(key, 'vi');

    const consistent = enValue === expectedTranslations.en[key] && viValue === expectedTranslations.vi[key];

    directServiceResults.push({
      key,
      enValue,
      viValue,
      consistent
    });

    console.log(`   ${key}:`);
    console.log(`     EN: "${enValue}" ${enValue === expectedTranslations.en[key] ? '✅' : '❌'}`);
    console.log(`     VI: "${viValue}" ${viValue === expectedTranslations.vi[key] ? '✅' : '❌'}`);
  }

  // Generate comprehensive report
  const reportPath = path.join(outputDir, 'locale-switching-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.length,
      successfulTests: testResults.filter(t => t.overallSuccess).length,
      testsWithCrossContamination: testResults.filter(t => t.crossContaminationDetected).length,
      totalSteps: testResults.reduce((sum, t) => sum + t.results.length, 0),
      successfulSteps: testResults.reduce((sum, t) => sum + t.results.filter(r => r.success).length, 0)
    },
    directServiceTest: {
      allKeysConsistent: directServiceResults.every(r => r.consistent),
      results: directServiceResults
    },
    testResults,
    expectedTranslations
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print final summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 LOCALE SWITCHING TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total tests: ${report.summary.totalTests}`);
  console.log(`Successful tests: ${report.summary.successfulTests}`);
  console.log(`Tests with cross-contamination: ${report.summary.testsWithCrossContamination}`);
  console.log(`Total steps: ${report.summary.totalSteps}`);
  console.log(`Successful steps: ${report.summary.successfulSteps}`);

  const stepSuccessRate = (report.summary.successfulSteps / report.summary.totalSteps) * 100;
  console.log(`Step success rate: ${stepSuccessRate.toFixed(1)}%`);

  const testSuccessRate = (report.summary.successfulTests / report.summary.totalTests) * 100;
  console.log(`Test success rate: ${testSuccessRate.toFixed(1)}%`);

  console.log(`\nDirect localization service: ${report.directServiceTest.allKeysConsistent ? '✅ All keys consistent' : '❌ Inconsistencies found'}`);

  if (report.summary.testsWithCrossContamination > 0) {
    console.log('\n⚠️  Cross-contamination detected in:');
    testResults.filter(t => t.crossContaminationDetected).forEach(t => {
      console.log(`   - ${t.testName}`);
    });
  } else {
    console.log('\n✅ No cross-contamination detected');
  }

  console.log(`\n📁 Output directory: ${outputDir}`);
  console.log(`📋 Full report: ${reportPath}`);

  await app.close();

  return report;
}

// Main execution
if (require.main === module) {
  testLocaleSwitchingBehavior()
    .then(() => {
      console.log('\n🎉 Locale Switching Behavior Test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testLocaleSwitchingBehavior };