#!/usr/bin/env ts-node

/**
 * PDF Output Before/After Comparison Script
 *
 * This script compares PDF output before and after the localization fix
 * to ensure that the visual output remains identical while using proper localization.
 *
 * Requirements: 1.3, 2.1
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PDFDocumentStructureService } from '../src/pdf-generator/pdf-document-structure.service';
import { OrderPDFData, ShippingMethodData } from '../src/pdf-generator/types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';

// Simulate the "before" implementation with hardcoded translations
class LegacyPDFDocumentStructureService {
  /**
   * Legacy generateShippingSection with hardcoded translations (BEFORE fix)
   */
  generateShippingSection(orderData: OrderPDFData, locale: 'en' | 'vi'): string {
    const isVietnamese = locale === 'vi';

    return `
      <section class="shipping-section">
        <h2 class="section-title">${isVietnamese ? 'Thông tin vận chuyển' : 'Shipping Information'}</h2>
        <div class="shipping-content">
          <div class="shipping-row">
            <span class="shipping-label">${isVietnamese ? 'Phương thức vận chuyển' : 'Shipping Method'}:</span>
            <span class="shipping-value">${orderData.shippingMethod.name}</span>
          </div>
          ${orderData.shippingMethod.description ? `
            <div class="shipping-row">
              <span class="shipping-label">${isVietnamese ? 'Mô tả' : 'Description'}:</span>
              <span class="shipping-value">${orderData.shippingMethod.description}</span>
            </div>
          ` : ''}
          ${orderData.shippingMethod.estimatedDelivery ? `
            <div class="shipping-row">
              <span class="shipping-label">${isVietnamese ? 'Dự kiến giao hàng' : 'Estimated Delivery'}:</span>
              <span class="shipping-value">${orderData.shippingMethod.estimatedDelivery}</span>
            </div>
          ` : ''}
          ${orderData.shippingMethod.trackingNumber ? `
            <div class="shipping-row">
              <span class="shipping-label">${isVietnamese ? 'Mã vận đơn' : 'Tracking Number'}:</span>
              <span class="shipping-value tracking-number">${orderData.shippingMethod.trackingNumber}</span>
            </div>
          ` : ''}
          ${orderData.shippingMethod.carrier ? `
            <div class="shipping-row">
              <span class="shipping-label">${isVietnamese ? 'Đơn vị vận chuyển' : 'Carrier'}:</span>
              <span class="shipping-value">${orderData.shippingMethod.carrier}</span>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }
}

interface ComparisonTestCase {
  name: string;
  description: string;
  shippingMethod: ShippingMethodData;
}

const testCases: ComparisonTestCase[] = [
  {
    name: 'basic-shipping',
    description: 'Basic shipping with minimal information',
    shippingMethod: {
      name: 'Standard Shipping',
    }
  },
  {
    name: 'complete-shipping',
    description: 'Complete shipping with all fields',
    shippingMethod: {
      name: 'Express Delivery',
      description: 'Fast delivery within 24 hours',
      estimatedDelivery: '2024-12-20',
      trackingNumber: 'TRK123456789',
      carrier: 'DHL Express'
    }
  },
  {
    name: 'vietnamese-content',
    description: 'Shipping with Vietnamese content',
    shippingMethod: {
      name: 'Giao hàng nhanh',
      description: 'Giao hàng trong ngày tại Hà Nội và TP.HCM',
      estimatedDelivery: '2024-12-21',
      trackingNumber: 'VN123456789',
      carrier: 'Viettel Post'
    }
  }
];

// Base order data template
const createOrderData = (shippingMethod: ShippingMethodData, locale: 'en' | 'vi' = 'en'): OrderPDFData => ({
  orderId: 'test-order-id-' + Date.now(),
  orderNumber: 'COMP-' + Date.now(),
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

function normalizeHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/>\s+</g, '><')  // Remove whitespace between tags
    .trim();
}

function extractTranslationLabels(html: string): Record<string, string> {
  const labels: Record<string, string> = {};

  // Extract section title
  const titleMatch = html.match(/<h2[^>]*class="section-title"[^>]*>([^<]+)<\/h2>/);
  if (titleMatch) {
    labels.sectionTitle = titleMatch[1].trim();
  }

  // Extract all shipping labels
  const labelMatches = html.matchAll(/<span[^>]*class="shipping-label"[^>]*>([^<]+):<\/span>/g);
  const labelTexts: string[] = [];
  for (const match of labelMatches) {
    labelTexts.push(match[1].trim());
  }

  // Map labels to their semantic meaning
  labelTexts.forEach((label, index) => {
    if (label.toLowerCase().includes('method') || label.toLowerCase().includes('phương thức')) {
      labels.shippingMethod = label;
    } else if (label.toLowerCase().includes('description') || label.toLowerCase().includes('mô tả')) {
      labels.description = label;
    } else if (label.toLowerCase().includes('delivery') || label.toLowerCase().includes('giao hàng')) {
      labels.estimatedDelivery = label;
    } else if (label.toLowerCase().includes('tracking') || label.toLowerCase().includes('vận đơn')) {
      labels.trackingNumber = label;
    } else if (label.toLowerCase().includes('carrier') || label.toLowerCase().includes('vận chuyển')) {
      labels.carrier = label;
    }
  });

  return labels;
}

async function compareBeforeAfter() {
  console.log('🔄 Starting PDF Output Before/After Comparison');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const currentService = app.get(PDFDocumentStructureService);
  const legacyService = new LegacyPDFDocumentStructureService();

  // Create output directory
  const outputDir = path.join(process.cwd(), 'uploads', 'test-pdfs', 'before-after-comparison');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const comparisonResults: Array<{
    testCase: string;
    locale: 'en' | 'vi';
    visuallyIdentical: boolean;
    translationsMatch: boolean;
    structureMatch: boolean;
    beforeLabels: Record<string, string>;
    afterLabels: Record<string, string>;
    differences: string[];
  }> = [];

  // Test each case in both locales
  for (const testCase of testCases) {
    console.log(`\n📦 Testing: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);

    for (const locale of ['en', 'vi'] as const) {
      console.log(`   🌐 Locale: ${locale}`);

      const orderData = createOrderData(testCase.shippingMethod, locale);

      // Generate "before" HTML (legacy hardcoded)
      const beforeHTML = legacyService.generateShippingSection(orderData, locale);

      // Generate "after" HTML (current localization service)
      const afterHTML = (currentService as any).generateShippingSection(orderData, locale);

      // Save both versions for inspection
      const beforeFile = `${testCase.name}-${locale}-before.html`;
      const afterFile = `${testCase.name}-${locale}-after.html`;

      fs.writeFileSync(path.join(outputDir, beforeFile), beforeHTML);
      fs.writeFileSync(path.join(outputDir, afterFile), afterHTML);

      // Normalize for comparison
      const normalizedBefore = normalizeHTML(beforeHTML);
      const normalizedAfter = normalizeHTML(afterHTML);

      // Extract translation labels
      const beforeLabels = extractTranslationLabels(beforeHTML);
      const afterLabels = extractTranslationLabels(afterHTML);

      // Compare
      const visuallyIdentical = normalizedBefore === normalizedAfter;
      const translationsMatch = JSON.stringify(beforeLabels) === JSON.stringify(afterLabels);

      // Check structure (ignoring specific translation text)
      const beforeStructure = beforeHTML.replace(/>([^<]+)</g, '><');
      const afterStructure = afterHTML.replace(/>([^<]+)</g, '><');
      const structureMatch = beforeStructure === afterStructure;

      const differences: string[] = [];

      if (!visuallyIdentical) {
        differences.push('HTML content differs');
      }

      if (!translationsMatch) {
        Object.keys(beforeLabels).forEach(key => {
          if (beforeLabels[key] !== afterLabels[key]) {
            differences.push(`${key}: "${beforeLabels[key]}" vs "${afterLabels[key]}"`);
          }
        });
      }

      const result = {
        testCase: testCase.name,
        locale,
        visuallyIdentical,
        translationsMatch,
        structureMatch,
        beforeLabels,
        afterLabels,
        differences
      };

      comparisonResults.push(result);

      if (visuallyIdentical && translationsMatch) {
        console.log(`   ✅ Perfect match - visually identical`);
      } else if (translationsMatch && structureMatch) {
        console.log(`   ✅ Translations match, structure preserved`);
      } else {
        console.log(`   ⚠️  Differences found: ${differences.join(', ')}`);
      }
    }
  }

  // Generate comparison report
  const reportPath = path.join(outputDir, 'before-after-comparison-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: comparisonResults.length,
      visuallyIdentical: comparisonResults.filter(r => r.visuallyIdentical).length,
      translationsMatch: comparisonResults.filter(r => r.translationsMatch).length,
      structureMatch: comparisonResults.filter(r => r.structureMatch).length,
      perfectMatches: comparisonResults.filter(r => r.visuallyIdentical && r.translationsMatch).length
    },
    testCases: testCases.map(tc => ({
      name: tc.name,
      description: tc.description,
      shippingMethod: tc.shippingMethod
    })),
    results: comparisonResults
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMPARISON SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total tests: ${report.summary.totalTests}`);
  console.log(`Visually identical: ${report.summary.visuallyIdentical}`);
  console.log(`Translations match: ${report.summary.translationsMatch}`);
  console.log(`Structure preserved: ${report.summary.structureMatch}`);
  console.log(`Perfect matches: ${report.summary.perfectMatches}`);

  const successRate = (report.summary.perfectMatches / report.summary.totalTests) * 100;
  console.log(`Success rate: ${successRate.toFixed(1)}%`);

  if (report.summary.perfectMatches < report.summary.totalTests) {
    console.log('\n⚠️  Tests with differences:');
    comparisonResults.filter(r => !r.visuallyIdentical || !r.translationsMatch).forEach(r => {
      console.log(`   - ${r.testCase} (${r.locale}): ${r.differences.join(', ')}`);
    });
  }

  console.log(`\n📁 Output directory: ${outputDir}`);
  console.log(`📋 Full report: ${reportPath}`);

  await app.close();

  return report;
}

// Analyze specific differences in detail
async function analyzeTranslationDifferences() {
  console.log('\n🔍 Analyzing Translation Differences in Detail');
  console.log('=' .repeat(60));

  const outputDir = path.join(process.cwd(), 'uploads', 'test-pdfs', 'before-after-comparison');

  // Check if we have any differences to analyze
  const reportPath = path.join(outputDir, 'before-after-comparison-report.json');
  if (!fs.existsSync(reportPath)) {
    console.log('No comparison report found. Run comparison first.');
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const problemResults = report.results.filter((r: any) => !r.visuallyIdentical || !r.translationsMatch);

  if (problemResults.length === 0) {
    console.log('✅ No differences found - all outputs are identical!');
    return;
  }

  console.log(`Found ${problemResults.length} tests with differences:`);

  problemResults.forEach((result: any) => {
    console.log(`\n📋 ${result.testCase} (${result.locale}):`);
    console.log(`   Visually identical: ${result.visuallyIdentical ? '✅' : '❌'}`);
    console.log(`   Translations match: ${result.translationsMatch ? '✅' : '❌'}`);
    console.log(`   Structure preserved: ${result.structureMatch ? '✅' : '❌'}`);

    if (result.differences.length > 0) {
      console.log(`   Differences:`);
      result.differences.forEach((diff: string) => {
        console.log(`     - ${diff}`);
      });
    }

    // Show label comparison
    console.log(`   Before labels:`, result.beforeLabels);
    console.log(`   After labels:`, result.afterLabels);
  });

  // Check for systematic issues
  const systematicIssues: Record<string, number> = {};
  problemResults.forEach((result: any) => {
    result.differences.forEach((diff: string) => {
      systematicIssues[diff] = (systematicIssues[diff] || 0) + 1;
    });
  });

  if (Object.keys(systematicIssues).length > 0) {
    console.log('\n🔍 Systematic Issues:');
    Object.entries(systematicIssues).forEach(([issue, count]) => {
      console.log(`   ${issue}: ${count} occurrences`);
    });
  }
}

// Main execution
if (require.main === module) {
  compareBeforeAfter()
    .then(analyzeTranslationDifferences)
    .then(() => {
      console.log('\n🎉 PDF Output Before/After Comparison completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Comparison failed:', error);
      process.exit(1);
    });
}

export { compareBeforeAfter, analyzeTranslationDifferences };