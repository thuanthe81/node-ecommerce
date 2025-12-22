#!/usr/bin/env ts-node

/**
 * Comprehensive test script for email formatting fixes
 * Tests HTML escaping, CSS formatting, and email template validation
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { HTMLEscapingService } from './src/common/services/html-escaping.service';
import { EmailAttachmentService } from './src/pdf-generator/services/email-attachment.service';
import { PrismaService } from './src/prisma/prisma.service';
import { OrderPDFData } from './src/pdf-generator/types/pdf.types';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  warnings?: string[];
}

class EmailFormattingTester {
  private htmlEscapingService: HTMLEscapingService;
  private emailAttachmentService: EmailAttachmentService;
  private prismaService: PrismaService;
  private results: TestResult[] = [];

  constructor(
    htmlEscapingService: HTMLEscapingService,
    emailAttachmentService: EmailAttachmentService,
    prismaService: PrismaService,
  ) {
    this.htmlEscapingService = htmlEscapingService;
    this.emailAttachmentService = emailAttachmentService;
    this.prismaService = prismaService;
  }

  /**
   * Run all email formatting tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Email Formatting Tests...\n');

    // Test HTML escaping functionality
    await this.testHtmlEscaping();

    // Test CSS formatting and validation
    await this.testCssFormatting();

    // Test email template generation
    await this.testEmailTemplateGeneration();

    // Test email client compatibility
    await this.testEmailClientCompatibility();

    // Test with real order data
    await this.testWithRealOrderData();

    return this.results;
  }

  /**
   * Test HTML escaping with special characters
   */
  private async testHtmlEscaping(): Promise<void> {
    console.log('📝 Testing HTML Escaping...');

    const testCases = [
      {
        name: 'Basic special characters',
        input: 'John & Jane <script>alert("xss")</script> "quoted" \'single\'',
        expectedContains: ['&amp;', '&lt;', '&gt;', '&quot;', '&#39;'],
      },
      {
        name: 'Vietnamese characters with special symbols',
        input: 'Nguyễn Văn A & "Công ty TNHH" <test@example.com>',
        expectedContains: ['&amp;', '&quot;', '&lt;', '&gt;'],
      },
      {
        name: 'CSS-breaking characters',
        input: 'Product "Name" with \'quotes\' & symbols',
        expectedContains: ['&quot;', '&#39;', '&amp;'],
      },
      {
        name: 'Empty and null inputs',
        input: '',
        expectedContains: [],
      },
    ];

    for (const testCase of testCases) {
      try {
        const escaped = this.htmlEscapingService.escapeHtmlContent(testCase.input);

        let passed = true;
        let details = `Input: "${testCase.input}" → Output: "${escaped}"`;

        // Check that all expected entities are present
        for (const expected of testCase.expectedContains) {
          if (!escaped.includes(expected)) {
            passed = false;
            details += `\n❌ Missing expected entity: ${expected}`;
          }
        }

        // Check that no unescaped special characters remain
        if (testCase.input && (escaped.includes('<script') || escaped.includes('javascript:'))) {
          passed = false;
          details += '\n❌ Potentially dangerous content not properly escaped';
        }

        this.results.push({
          testName: `HTML Escaping: ${testCase.name}`,
          passed,
          details,
        });

        console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}`);
      } catch (error) {
        this.results.push({
          testName: `HTML Escaping: ${testCase.name}`,
          passed: false,
          details: `Error: ${error.message}`,
        });
        console.log(`  ❌ ${testCase.name} - Error: ${error.message}`);
      }
    }
  }

  /**
   * Test CSS formatting and validation
   */
  private async testCssFormatting(): Promise<void> {
    console.log('\n🎨 Testing CSS Formatting...');

    const testCases = [
      {
        name: 'CSS with unescaped quotes',
        css: 'font-family: "Arial", \'Helvetica\'; content: "Hello "World"";',
        shouldPass: false,
      },
      {
        name: 'Clean CSS',
        css: 'font-family: Arial, sans-serif; color: #333; margin: 10px;',
        shouldPass: true,
      },
      {
        name: 'CSS with dangerous content',
        css: 'background: url(javascript:alert("xss")); expression(alert("xss"));',
        shouldPass: false,
      },
      {
        name: 'CSS with @import',
        css: '@import url("malicious.css"); color: red;',
        shouldPass: false,
      },
    ];

    for (const testCase of testCases) {
      try {
        const sanitized = this.htmlEscapingService.sanitizeCSS(testCase.css);

        let passed = true;
        let details = `Input: "${testCase.css}" → Output: "${sanitized}"`;

        // Check for dangerous content removal
        if (sanitized.includes('javascript:') || sanitized.includes('expression(') || sanitized.includes('@import')) {
          passed = false;
          details += '\n❌ Dangerous CSS content not removed';
        }

        // Check for proper quote escaping
        if (testCase.css.includes('"') && !testCase.shouldPass) {
          if (sanitized.includes('"') && !sanitized.includes('\\"')) {
            passed = false;
            details += '\n❌ Quotes not properly escaped';
          }
        }

        this.results.push({
          testName: `CSS Formatting: ${testCase.name}`,
          passed,
          details,
        });

        console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}`);
      } catch (error) {
        this.results.push({
          testName: `CSS Formatting: ${testCase.name}`,
          passed: false,
          details: `Error: ${error.message}`,
        });
        console.log(`  ❌ ${testCase.name} - Error: ${error.message}`);
      }
    }
  }

  /**
   * Test email template generation with special characters
   */
  private async testEmailTemplateGeneration(): Promise<void> {
    console.log('\n📧 Testing Email Template Generation...');

    const testOrderData: OrderPDFData = {
      orderNumber: 'TEST-001',
      orderDate: '2024-01-01',
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
      ],
      pricing: {
        subtotal: 59.98,
        shippingCost: 10.00,
        taxAmount: 5.60,
        discountAmount: 0,
        total: 75.58,
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

    const locales: ('en' | 'vi')[] = ['en', 'vi'];

    for (const locale of locales) {
      try {
        const template = this.emailAttachmentService.generateSimplifiedEmailTemplate(
          testOrderData,
          locale,
        );

        let passed = true;
        let details = `Generated template for locale: ${locale}`;
        const warnings: string[] = [];

        // Check that HTML content doesn't contain unescaped special characters
        if (template.htmlContent.includes('<script') ||
            template.htmlContent.includes('javascript:') ||
            template.htmlContent.includes('John & Jane "Smith"') ||
            template.htmlContent.includes('<Apt 4>')) {
          passed = false;
          details += '\n❌ HTML content contains unescaped special characters';
        }

        // Check that HTML structure is valid
        const validation = this.htmlEscapingService.validateHtmlStructure(template.htmlContent);
        if (!validation.isValid) {
          passed = false;
          details += `\n❌ HTML validation failed: ${validation.htmlIssues.join(', ')}`;
        }

        if (validation.cssIssues.length > 0) {
          warnings.push(`CSS issues: ${validation.cssIssues.join(', ')}`);
        }

        // Check that subject line is properly formatted
        if (!template.subject.includes('TEST-001')) {
          passed = false;
          details += '\n❌ Subject line missing order number';
        }

        // Check that text content is present
        if (!template.textContent || template.textContent.length < 50) {
          passed = false;
          details += '\n❌ Text content is missing or too short';
        }

        this.results.push({
          testName: `Email Template Generation: ${locale.toUpperCase()}`,
          passed,
          details,
          warnings: warnings.length > 0 ? warnings : undefined,
        });

        console.log(`  ${passed ? '✅' : '❌'} Template generation (${locale.toUpperCase()})`);
        if (warnings.length > 0) {
          console.log(`    ⚠️  Warnings: ${warnings.join(', ')}`);
        }
      } catch (error) {
        this.results.push({
          testName: `Email Template Generation: ${locale.toUpperCase()}`,
          passed: false,
          details: `Error: ${error.message}`,
        });
        console.log(`  ❌ Template generation (${locale.toUpperCase()}) - Error: ${error.message}`);
      }
    }
  }

  /**
   * Test email client compatibility
   */
  private async testEmailClientCompatibility(): Promise<void> {
    console.log('\n📱 Testing Email Client Compatibility...');

    const testHtmlContents = [
      {
        name: 'Clean HTML',
        html: '<html><body><p>Hello World</p></body></html>',
        shouldPass: true,
      },
      {
        name: 'HTML with script tags',
        html: '<html><body><script>alert("test")</script><p>Hello</p></body></html>',
        shouldPass: false,
      },
      {
        name: 'HTML with external stylesheets',
        html: '<html><head><link rel="stylesheet" href="external.css"></head><body><p>Hello</p></body></html>',
        shouldPass: false,
      },
      {
        name: 'HTML with complex positioning',
        html: '<html><body><div style="position: absolute; top: 0;">Hello</div></body></html>',
        shouldPass: false,
      },
      {
        name: 'HTML with very long lines',
        html: '<html><body><p style="' + 'a'.repeat(1500) + '">Hello</p></body></html>',
        shouldPass: false,
      },
    ];

    for (const testCase of testHtmlContents) {
      try {
        const compatibilityResult = (this.emailAttachmentService as any).testEmailClientCompatibility(testCase.html);

        const passed = testCase.shouldPass ? compatibilityResult.isCompatible : !compatibilityResult.isCompatible;
        let details = `Expected ${testCase.shouldPass ? 'compatible' : 'incompatible'}, got ${compatibilityResult.isCompatible ? 'compatible' : 'incompatible'}`;

        if (compatibilityResult.warnings.length > 0) {
          details += `\nWarnings: ${compatibilityResult.warnings.join(', ')}`;
        }

        this.results.push({
          testName: `Email Client Compatibility: ${testCase.name}`,
          passed,
          details,
          warnings: compatibilityResult.warnings.length > 0 ? compatibilityResult.warnings : undefined,
        });

        console.log(`  ${passed ? '✅' : '❌'} ${testCase.name}`);
      } catch (error) {
        this.results.push({
          testName: `Email Client Compatibility: ${testCase.name}`,
          passed: false,
          details: `Error: ${error.message}`,
        });
        console.log(`  ❌ ${testCase.name} - Error: ${error.message}`);
      }
    }
  }

  /**
   * Test with real order data from database
   */
  private async testWithRealOrderData(): Promise<void> {
    console.log('\n🗄️  Testing with Real Order Data...');

    try {
      // Get a recent order from the database
      const recentOrder = await this.prismaService.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  nameEn: true,
                  nameVi: true,
                  descriptionEn: true,
                  descriptionVi: true,
                  sku: true,
                  price: true,
                  images: true,
                  category: {
                    select: {
                      nameEn: true,
                      nameVi: true,
                    },
                  },
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      if (!recentOrder) {
        this.results.push({
          testName: 'Real Order Data Test',
          passed: false,
          details: 'No orders found in database',
        });
        console.log('  ❌ No orders found in database');
        return;
      }

      // Convert to PDF data format (simplified)
      const orderPDFData: OrderPDFData = {
        orderNumber: recentOrder.orderNumber,
        orderDate: recentOrder.createdAt.toISOString().split('T')[0],
        customerInfo: {
          name: recentOrder.shippingAddress?.fullName || 'Customer',
          email: recentOrder.email,
          phone: recentOrder.shippingAddress?.phone,
        },
        billingAddress: recentOrder.billingAddress ? {
          fullName: recentOrder.billingAddress.fullName,
          addressLine1: recentOrder.billingAddress.addressLine1,
          addressLine2: recentOrder.billingAddress.addressLine2 || undefined,
          city: recentOrder.billingAddress.city,
          state: recentOrder.billingAddress.state,
          postalCode: recentOrder.billingAddress.postalCode,
          country: recentOrder.billingAddress.country,
          phone: recentOrder.billingAddress.phone || undefined,
        } : {
          fullName: 'Not provided',
          addressLine1: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          postalCode: 'Not provided',
          country: 'VN',
        },
        shippingAddress: recentOrder.shippingAddress ? {
          fullName: recentOrder.shippingAddress.fullName,
          addressLine1: recentOrder.shippingAddress.addressLine1,
          addressLine2: recentOrder.shippingAddress.addressLine2 || undefined,
          city: recentOrder.shippingAddress.city,
          state: recentOrder.shippingAddress.state,
          postalCode: recentOrder.shippingAddress.postalCode,
          country: recentOrder.shippingAddress.country,
          phone: recentOrder.shippingAddress.phone || undefined,
        } : {
          fullName: 'Not provided',
          addressLine1: 'Not provided',
          city: 'Not provided',
          state: 'Not provided',
          postalCode: 'Not provided',
          country: 'VN',
        },
        items: recentOrder.items.map((item: any) => ({
          id: item.product.id,
          name: item.product.nameEn,
          description: item.product.descriptionEn,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          totalPrice: Number(item.total || item.price * item.quantity),
          category: item.product.category?.nameEn,
        })),
        pricing: {
          subtotal: Number(recentOrder.subtotal),
          shippingCost: Number(recentOrder.shippingCost),
          taxAmount: Number(recentOrder.taxAmount || 0),
          discountAmount: Number(recentOrder.discountAmount || 0),
          total: Number(recentOrder.total),
        },
        paymentMethod: {
          type: recentOrder.paymentMethod as any,
          displayName: recentOrder.paymentMethod,
          status: recentOrder.paymentStatus as any,
        },
        shippingMethod: {
          name: recentOrder.shippingMethod || 'Standard',
          description: 'Standard delivery',
        },
        businessInfo: {
          companyName: 'Test Company',
          contactEmail: 'info@testcompany.com',
          contactPhone: '+1-555-123-4567',
          website: 'https://testcompany.com',
          address: {
            fullName: 'Test Company',
            addressLine1: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            postalCode: '12345',
            country: 'VN',
          },
        },
        locale: 'en',
      };

      // Generate template with real data
      const template = this.emailAttachmentService.generateSimplifiedEmailTemplate(
        orderPDFData,
        'en',
      );

      let passed = true;
      let details = `Tested with real order: ${recentOrder.orderNumber}`;
      const warnings: string[] = [];

      // Validate the generated HTML
      const validation = this.htmlEscapingService.validateHtmlStructure(template.htmlContent);
      if (!validation.isValid) {
        passed = false;
        details += `\n❌ HTML validation failed: ${validation.htmlIssues.join(', ')}`;
      }

      if (validation.cssIssues.length > 0) {
        warnings.push(`CSS issues: ${validation.cssIssues.join(', ')}`);
      }

      // Check for proper escaping in real data
      const customerName = orderPDFData.customerInfo.name;
      if (customerName && (customerName.includes('&') || customerName.includes('<') || customerName.includes('"'))) {
        if (template.htmlContent.includes(customerName)) {
          passed = false;
          details += '\n❌ Customer name not properly escaped in HTML';
        }
      }

      this.results.push({
        testName: 'Real Order Data Test',
        passed,
        details,
        warnings: warnings.length > 0 ? warnings : undefined,
      });

      console.log(`  ${passed ? '✅' : '❌'} Real order data test (${recentOrder.orderNumber})`);
      if (warnings.length > 0) {
        console.log(`    ⚠️  Warnings: ${warnings.join(', ')}`);
      }
    } catch (error) {
      this.results.push({
        testName: 'Real Order Data Test',
        passed: false,
        details: `Error: ${error.message}`,
      });
      console.log(`  ❌ Real order data test - Error: ${error.message}`);
    }
  }

  /**
   * Print test summary
   */
  printSummary(): void {
    console.log('\n📊 Test Summary');
    console.log('================');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`  • ${result.testName}`);
          console.log(`    ${result.details}`);
        });
    }

    const testsWithWarnings = this.results.filter(r => r.warnings && r.warnings.length > 0);
    if (testsWithWarnings.length > 0) {
      console.log('\n⚠️  Tests with Warnings:');
      testsWithWarnings.forEach(result => {
        console.log(`  • ${result.testName}`);
        result.warnings!.forEach(warning => {
          console.log(`    - ${warning}`);
        });
      });
    }
  }
}

async function main() {
  try {
    console.log('🚀 Initializing Email Formatting Test Suite...\n');

    const app = await NestFactory.createApplicationContext(AppModule);

    const htmlEscapingService = app.get(HTMLEscapingService);
    const emailAttachmentService = app.get(EmailAttachmentService);
    const prismaService = app.get(PrismaService);

    const tester = new EmailFormattingTester(
      htmlEscapingService,
      emailAttachmentService,
      prismaService,
    );

    const results = await tester.runAllTests();
    tester.printSummary();

    await app.close();

    // Exit with error code if any tests failed
    const failedTests = results.filter(r => !r.passed).length;
    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite failed to initialize:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}