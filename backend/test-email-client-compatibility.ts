#!/usr/bin/env ts-node

/**
 * Test email client compatibility by generating sample emails
 * and saving them as HTML files for manual testing
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EmailAttachmentService } from './src/pdf-generator/services/email-attachment.service';
import { OrderPDFData } from './src/pdf-generator/types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🧪 Testing Email Client Compatibility...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const emailAttachmentService = app.get(EmailAttachmentService);

  // Create test order data with special characters
  const testOrderData: OrderPDFData = {
    orderId: 'test-order-id-' + Date.now(),
    orderNumber: 'TEST-EMAIL-001',
    orderDate: '2024-12-22',
    customerInfo: {
      name: 'John & Jane "Smith" <test@example.com>',
      email: 'test@example.com',
      phone: '+1-234-567-8900',
    },
    billingAddress: {
      fullName: 'John & Jane "Smith"',
      addressLine1: '123 Main St. <Apt 4>',
      addressLine2: 'Building "A" & Suite \'B\'',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'US',
      phone: '+1-234-567-8900',
    },
    shippingAddress: {
      fullName: 'John & Jane "Smith"',
      addressLine1: '123 Main St. <Apt 4>',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'US',
    },
    items: [
      {
        id: '1',
        name: 'Product "Special" & <Unique>',
        description: 'A product with "quotes" & <symbols>',
        sku: 'SKU-001',
        quantity: 2,
        unitPrice: 29.99,
        totalPrice: 59.98,
        category: 'Test Category',
      },
      {
        id: '2',
        name: 'Another Product with \'Single Quotes\'',
        description: 'Description with & ampersands',
        sku: 'SKU-002',
        quantity: 1,
        unitPrice: 15.50,
        totalPrice: 15.50,
        category: 'Special Characters',
      },
    ],
    pricing: {
      subtotal: 75.48,
      shippingCost: 10.00,
      taxAmount: 6.84,
      discountAmount: 5.00,
      total: 87.32,
    },
    paymentMethod: {
      type: 'bank_transfer',
      displayName: 'Bank Transfer',
      status: 'pending',
    },
    shippingMethod: {
      name: 'Standard',
      description: 'Standard Delivery (3-5 business days)',
    },
    businessInfo: {
      companyName: 'Test Company & "Associates"',
      contactEmail: 'info@testcompany.com',
      contactPhone: '+1-555-123-4567',
      website: 'https://testcompany.com',
      address: {
        fullName: 'Test Company & "Associates"',
        addressLine1: '456 Business St. <Suite 100>',
        addressLine2: 'Building "A" & Suite \'B\'',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'US',
        phone: '+1-555-123-4567',
      },
    },
    locale: 'en',
  };

  // Create output directory
  const outputDir = path.join(__dirname, 'email-client-tests');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const locales: ('en' | 'vi')[] = ['en', 'vi'];

  for (const locale of locales) {
    console.log(`📧 Generating ${locale.toUpperCase()} email template...`);

    try {
      // Generate email template
      const template = emailAttachmentService.generateSimplifiedEmailTemplate(
        { ...testOrderData, locale },
        locale,
      );

      // Save HTML file for manual testing
      const htmlFileName = `order-confirmation-${locale}.html`;
      const htmlFilePath = path.join(outputDir, htmlFileName);

      fs.writeFileSync(htmlFilePath, template.htmlContent, 'utf8');

      // Save text version
      const textFileName = `order-confirmation-${locale}.txt`;
      const textFilePath = path.join(outputDir, textFileName);

      fs.writeFileSync(textFilePath, template.textContent, 'utf8');

      console.log(`  ✅ Generated ${htmlFileName} (${template.htmlContent.length} chars)`);
      console.log(`  ✅ Generated ${textFileName} (${template.textContent.length} chars)`);

      // Validate HTML structure
      console.log(`  📋 Subject: ${template.subject}`);

      // Check for proper escaping
      const hasUnescapedChars = template.htmlContent.includes('John & Jane "Smith"') ||
                               template.htmlContent.includes('<Apt 4>') ||
                               template.htmlContent.includes('Product "Special" & <Unique>');

      if (hasUnescapedChars) {
        console.log(`  ❌ Warning: Unescaped special characters found`);
      } else {
        console.log(`  ✅ All special characters properly escaped`);
      }

    } catch (error) {
      console.log(`  ❌ Error generating ${locale.toUpperCase()} template: ${error.message}`);
    }
  }

  // Generate a comprehensive test report
  const reportContent = `# Email Client Compatibility Test Report

Generated on: ${new Date().toISOString()}

## Test Overview

This report contains email templates generated with special characters to test HTML escaping and CSS formatting fixes.

## Test Data Used

- Customer Name: John & Jane "Smith" <test@example.com>
- Address: 123 Main St. <Apt 4>, Building "A" & Suite 'B'
- Product Names: Product "Special" & <Unique>, Another Product with 'Single Quotes'
- Company: Test Company & "Associates"

## Files Generated

- \`order-confirmation-en.html\` - English email template
- \`order-confirmation-en.txt\` - English text version
- \`order-confirmation-vi.html\` - Vietnamese email template
- \`order-confirmation-vi.txt\` - Vietnamese text version

## Manual Testing Instructions

1. Open the HTML files in different email clients:
   - Gmail (web and mobile)
   - Outlook (desktop and web)
   - Apple Mail
   - Yahoo Mail
   - Thunderbird

2. Verify that:
   - Special characters are displayed correctly (not as HTML entities)
   - CSS styling is applied properly
   - No raw CSS code is visible
   - Layout is responsive and readable
   - All text content is properly formatted

3. Check for common email client issues:
   - CSS not rendering properly
   - Images not displaying (if any)
   - Text overflow or layout breaks
   - Font rendering issues

## Expected Results

- All special characters should display correctly as regular text
- No HTML entities (&amp;, &lt;, &gt;, &quot;) should be visible to users
- CSS styling should render consistently across email clients
- No raw CSS code should appear in the email content
- Email should be readable and professional-looking

## Troubleshooting

If issues are found:
1. Check the HTML source for unescaped characters
2. Verify CSS is properly formatted and escaped
3. Test in multiple email clients to identify client-specific issues
4. Review the email template generation logic for any missed escaping

---

Generated by Email Formatting Test Suite
`;

  const reportPath = path.join(outputDir, 'README.md');
  fs.writeFileSync(reportPath, reportContent, 'utf8');

  console.log(`\n📊 Test completed successfully!`);
  console.log(`📁 Files saved to: ${outputDir}`);
  console.log(`📋 Test report: ${reportPath}`);
  console.log(`\n🔍 Manual Testing Instructions:`);
  console.log(`1. Open the HTML files in different email clients`);
  console.log(`2. Verify special characters display correctly`);
  console.log(`3. Check that CSS styling works properly`);
  console.log(`4. Ensure no raw HTML/CSS code is visible`);

  await app.close();
}

if (require.main === module) {
  main().catch(console.error);
}