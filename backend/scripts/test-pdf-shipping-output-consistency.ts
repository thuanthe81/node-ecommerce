#!/usr/bin/env ts-node

/**
 * PDF Shipping Output Consistency Test Script
 *
 * This script generates sample PDFs with various shipping configurations
 * to verify consistent translation usage across all shipping data variations.
 *
 * Requirements: 1.1, 1.2, 2.2, 2.3
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PDFGeneratorService } from '../src/pdf-generator/pdf-generator.service';
import { PDFDocumentStructureService } from '../src/pdf-generator/pdf-document-structure.service';
import { PDFTemplateEngine } from '../src/pdf-generator/pdf-template.engine';
import { OrderPDFData, ShippingMethodData } from '../src/pdf-generator/types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';

interface TestShippingConfiguration {
  name: string;
  shippingMethod: ShippingMethodData;
  description: string;
}

// Various shipping configurations to test
const testShippingConfigurations: TestShippingConfiguration[] = [
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
    name: 'tracking-only',
    description: 'Shipping with tracking number only',
    shippingMethod: {
      name: 'Economy Shipping',
      trackingNumber: 'ECO987654321'
    }
  },
  {
    name: 'carrier-and-delivery',
    description: 'Shipping with carrier and estimated delivery',
    shippingMethod: {
      name: 'Premium Shipping',
      estimatedDelivery: '2024-12-19',
      carrier: 'FedEx'
    }
  },
  {
    name: 'description-only',
    description: 'Shipping with description only',
    shippingMethod: {
      name: 'Local Delivery',
      description: 'Hand delivery by local courier'
    }
  },
  {
    name: 'vietnamese-characters',
    description: 'Shipping with Vietnamese characters in fields',
    shippingMethod: {
      name: 'Giao hàng nhanh',
      description: 'Giao hàng trong ngày tại Hà Nội và TP.HCM',
      estimatedDelivery: '2024-12-21',
      trackingNumber: 'VN123456789',
      carrier: 'Viettel Post'
    }
  },
  {
    name: 'special-characters',
    description: 'Shipping with special characters and symbols',
    shippingMethod: {
      name: 'Express & Priority',
      description: 'Next-day delivery (Mon-Fri) - Signature required',
      trackingNumber: 'EXP-2024-001',
      carrier: 'UPS Express'
    }
  }
];

// Base order data template
const createBaseOrderData = (shippingMethod: ShippingMethodData, locale: 'en' | 'vi' = 'en'): OrderPDFData => ({
  orderId: 'test-order-id-' + Date.now(),
  orderNumber: 'TEST-' + Date.now(),
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
      category: 'Electronics',
      imageUrl: 'https://example.com/test-product.jpg'
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
    contactPhone: '+84 987 654 321',
    logoUrl: 'https://example.com/logo.jpg'
  }
});

async function generateTestPDFs() {
  console.log('🚀 Starting PDF Shipping Output Consistency Test');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const pdfGeneratorService = app.get(PDFGeneratorService);
  const documentStructureService = app.get(PDFDocumentStructureService);
  const templateEngine = app.get(PDFTemplateEngine);

  // Create output directory
  const outputDir = path.join(process.cwd(), 'uploads', 'test-pdfs', 'shipping-consistency');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: Array<{
    config: string;
    locale: 'en' | 'vi';
    success: boolean;
    filePath?: string;
    error?: string;
    shippingContent?: string;
  }> = [];

  // Test each shipping configuration in both locales
  for (const config of testShippingConfigurations) {
    console.log(`\n📦 Testing configuration: ${config.name}`);
    console.log(`   Description: ${config.description}`);

    for (const locale of ['en', 'vi'] as const) {
      console.log(`   🌐 Locale: ${locale}`);

      try {
        const orderData = createBaseOrderData(config.shippingMethod, locale);

        // Generate PDF using the full service
        const pdfResult = await pdfGeneratorService.generateOrderPDF(orderData, locale);

        if (pdfResult.success && pdfResult.filePath) {
          const fileName = `${config.name}-${locale}.pdf`;
          const targetPath = path.join(outputDir, fileName);

          // Copy the generated PDF to our test directory
          if (fs.existsSync(pdfResult.filePath)) {
            fs.copyFileSync(pdfResult.filePath, targetPath);
            console.log(`   ✅ Generated: ${fileName}`);

            results.push({
              config: config.name,
              locale,
              success: true,
              filePath: targetPath
            });
          } else {
            throw new Error('Generated PDF file not found');
          }
        } else {
          throw new Error(pdfResult.error || 'PDF generation failed');
        }

        // Also test the shipping section HTML generation directly
        const shippingHTML = (documentStructureService as any).generateShippingSection(orderData, locale);

        // Save the shipping section HTML for analysis
        const htmlFileName = `${config.name}-${locale}-shipping.html`;
        const htmlPath = path.join(outputDir, htmlFileName);
        fs.writeFileSync(htmlPath, shippingHTML);

        console.log(`   📄 Shipping HTML: ${htmlFileName}`);

        // Update result with shipping content
        const lastResult = results[results.length - 1];
        if (lastResult) {
          lastResult.shippingContent = shippingHTML;
        }

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.push({
          config: config.name,
          locale,
          success: false,
          error: error.message
        });
      }
    }
  }

  // Generate summary report
  const reportPath = path.join(outputDir, 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    configurations: testShippingConfigurations.map(c => ({
      name: c.name,
      description: c.description,
      shippingMethod: c.shippingMethod
    })),
    results
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total tests: ${report.totalTests}`);
  console.log(`Successful: ${report.successful}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Success rate: ${((report.successful / report.totalTests) * 100).toFixed(1)}%`);

  if (report.failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.config} (${r.locale}): ${r.error}`);
    });
  }

  console.log(`\n📁 Output directory: ${outputDir}`);
  console.log(`📋 Full report: ${reportPath}`);

  await app.close();

  return report;
}

// Analyze translation consistency across generated content
async function analyzeTranslationConsistency() {
  console.log('\n🔍 Analyzing Translation Consistency');
  console.log('=' .repeat(60));

  const outputDir = path.join(process.cwd(), 'uploads', 'test-pdfs', 'shipping-consistency');
  const analysisResults: Array<{
    locale: 'en' | 'vi';
    translationKeys: Record<string, string[]>;
    inconsistencies: string[];
  }> = [];

  for (const locale of ['en', 'vi'] as const) {
    console.log(`\n🌐 Analyzing ${locale} translations...`);

    const translationKeys: Record<string, string[]> = {
      shippingInformation: [],
      shippingMethod: [],
      description: [],
      estimatedDelivery: [],
      trackingNumber: [],
      carrier: []
    };

    const inconsistencies: string[] = [];

    // Read all shipping HTML files for this locale
    const htmlFiles = fs.readdirSync(outputDir)
      .filter(file => file.endsWith(`-${locale}-shipping.html`));

    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8');

      // Extract translation usage patterns
      const patterns = {
        shippingInformation: content.match(/<h2[^>]*class="section-title"[^>]*>([^<]+)<\/h2>/),
        shippingMethod: content.match(/<span[^>]*class="shipping-label"[^>]*>([^<]+):<\/span>/),
        description: content.match(/class="shipping-label"[^>]*>([^<]*Description[^<]*)</),
        estimatedDelivery: content.match(/class="shipping-label"[^>]*>([^<]*Delivery[^<]*)</),
        trackingNumber: content.match(/class="shipping-label"[^>]*>([^<]*Tracking[^<]*)</),
        carrier: content.match(/class="shipping-label"[^>]*>([^<]*Carrier[^<]*)</)
      };

      Object.entries(patterns).forEach(([key, match]) => {
        if (match && match[1]) {
          const text = match[1].trim().replace(':', '');
          translationKeys[key].push(text);
        }
      });
    }

    // Check for inconsistencies
    Object.entries(translationKeys).forEach(([key, values]) => {
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length > 1) {
        inconsistencies.push(`${key}: Found ${uniqueValues.length} different translations: ${uniqueValues.join(', ')}`);
      }
    });

    analysisResults.push({
      locale,
      translationKeys,
      inconsistencies
    });

    console.log(`   Found ${inconsistencies.length} inconsistencies`);
    if (inconsistencies.length > 0) {
      inconsistencies.forEach(inc => console.log(`   ⚠️  ${inc}`));
    } else {
      console.log(`   ✅ All translations consistent`);
    }
  }

  // Save analysis report
  const analysisPath = path.join(outputDir, 'translation-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analysisResults, null, 2));

  console.log(`\n📋 Translation analysis: ${analysisPath}`);

  return analysisResults;
}

// Main execution
if (require.main === module) {
  generateTestPDFs()
    .then(analyzeTranslationConsistency)
    .then(() => {
      console.log('\n🎉 PDF Shipping Output Consistency Test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { generateTestPDFs, analyzeTranslationConsistency };