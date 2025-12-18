#!/usr/bin/env ts-node

/**
 * Script to verify PDF currency formatting consistency
 *
 * This script generates sample PDFs with various order types and amounts
 * to manually verify that all monetary amounts display with 'đ' symbol
 * and consistent formatting across all PDF document types.
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PDFGeneratorService } from '../src/pdf-generator/pdf-generator.service';
import { OrderPDFData } from '../src/pdf-generator/types/pdf.types';
import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  name: string;
  orderData: OrderPDFData;
  locale: 'en' | 'vi';
  description: string;
}

async function main() {
  console.log('🔍 Starting PDF currency formatting verification...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const pdfGeneratorService = app.get(PDFGeneratorService);

  // Create test cases with various order types and amounts
  const testCases: TestCase[] = [
    {
      name: 'standard-order-en',
      locale: 'en',
      description: 'Standard order with multiple items (English locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-001-EN',
        items: [
          { name: 'Product A', unitPrice: 150000, quantity: 2 },
          { name: 'Product B', unitPrice: 75000, quantity: 1 },
          { name: 'Product C', unitPrice: 250000, quantity: 1 }
        ],
        shippingCost: 25000,
        discountAmount: 50000,
        locale: 'en'
      })
    },
    {
      name: 'standard-order-vi',
      locale: 'vi',
      description: 'Standard order with multiple items (Vietnamese locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-001-VI',
        items: [
          { name: 'Sản phẩm A', unitPrice: 150000, quantity: 2 },
          { name: 'Sản phẩm B', unitPrice: 75000, quantity: 1 },
          { name: 'Sản phẩm C', unitPrice: 250000, quantity: 1 }
        ],
        shippingCost: 25000,
        discountAmount: 50000,
        locale: 'vi'
      })
    },
    {
      name: 'zero-price-order-en',
      locale: 'en',
      description: 'Order with zero-price items (English locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-002-EN',
        items: [
          { name: 'Free Sample', unitPrice: 0, quantity: 1 },
          { name: 'Promotional Item', unitPrice: 0, quantity: 2 },
          { name: 'Regular Product', unitPrice: 100000, quantity: 1 }
        ],
        shippingCost: 0,
        discountAmount: 0,
        locale: 'en'
      })
    },
    {
      name: 'zero-price-order-vi',
      locale: 'vi',
      description: 'Order with zero-price items (Vietnamese locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-002-VI',
        items: [
          { name: 'Mẫu miễn phí', unitPrice: 0, quantity: 1 },
          { name: 'Sản phẩm khuyến mãi', unitPrice: 0, quantity: 2 },
          { name: 'Sản phẩm thường', unitPrice: 100000, quantity: 1 }
        ],
        shippingCost: 0,
        discountAmount: 0,
        locale: 'vi'
      })
    },
    {
      name: 'large-amounts-en',
      locale: 'en',
      description: 'Order with large monetary amounts (English locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-003-EN',
        items: [
          { name: 'Premium Product', unitPrice: 5000000, quantity: 1 },
          { name: 'Luxury Item', unitPrice: 12500000, quantity: 2 }
        ],
        shippingCost: 500000,
        discountAmount: 2000000,
        locale: 'en'
      })
    },
    {
      name: 'large-amounts-vi',
      locale: 'vi',
      description: 'Order with large monetary amounts (Vietnamese locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-003-VI',
        items: [
          { name: 'Sản phẩm cao cấp', unitPrice: 5000000, quantity: 1 },
          { name: 'Mặt hàng xa xỉ', unitPrice: 12500000, quantity: 2 }
        ],
        shippingCost: 500000,
        discountAmount: 2000000,
        locale: 'vi'
      })
    },
    {
      name: 'bank-transfer-payment-en',
      locale: 'en',
      description: 'Order with bank transfer payment method (English locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-004-EN',
        items: [
          { name: 'Electronics', unitPrice: 1500000, quantity: 1 }
        ],
        shippingCost: 50000,
        discountAmount: 100000,
        paymentType: 'bank_transfer',
        locale: 'en'
      })
    },
    {
      name: 'bank-transfer-payment-vi',
      locale: 'vi',
      description: 'Order with bank transfer payment method (Vietnamese locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-004-VI',
        items: [
          { name: 'Điện tử', unitPrice: 1500000, quantity: 1 }
        ],
        shippingCost: 50000,
        discountAmount: 100000,
        paymentType: 'bank_transfer',
        locale: 'vi'
      })
    },
    {
      name: 'cash-on-delivery-en',
      locale: 'en',
      description: 'Order with cash on delivery payment (English locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-005-EN',
        items: [
          { name: 'Home Goods', unitPrice: 350000, quantity: 3 }
        ],
        shippingCost: 30000,
        discountAmount: 25000,
        paymentType: 'cash_on_delivery',
        locale: 'en'
      })
    },
    {
      name: 'cash-on-delivery-vi',
      locale: 'vi',
      description: 'Order with cash on delivery payment (Vietnamese locale)',
      orderData: createTestOrderData({
        orderNumber: 'TEST-005-VI',
        items: [
          { name: 'Đồ gia dụng', unitPrice: 350000, quantity: 3 }
        ],
        shippingCost: 30000,
        discountAmount: 25000,
        paymentType: 'cash_on_delivery',
        locale: 'vi'
      })
    }
  ];

  const results: Array<{
    testCase: string;
    success: boolean;
    filePath?: string;
    error?: string;
    amounts: string[];
  }> = [];

  // Generate PDFs for each test case
  for (const testCase of testCases) {
    console.log(`📄 Generating PDF: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Locale: ${testCase.locale}`);

    try {
      // Generate order PDF
      const orderResult = await pdfGeneratorService.generateOrderPDF(testCase.orderData, testCase.locale);

      if (orderResult.success) {
        console.log(`   ✅ Order PDF generated: ${orderResult.fileName}`);

        // Extract monetary amounts from the order data for verification
        const amounts = extractMonetaryAmounts(testCase.orderData);

        results.push({
          testCase: testCase.name,
          success: true,
          filePath: orderResult.filePath,
          amounts
        });

        // Also generate invoice PDF for comparison
        try {
          const invoiceResult = await pdfGeneratorService.generateInvoicePDF(testCase.orderData, testCase.locale);
          if (invoiceResult.success) {
            console.log(`   ✅ Invoice PDF generated: ${invoiceResult.fileName}`);
          } else {
            console.log(`   ⚠️  Invoice PDF failed: ${invoiceResult.error}`);
          }
        } catch (invoiceError) {
          console.log(`   ⚠️  Invoice PDF error: ${invoiceError.message}`);
        }

      } else {
        console.log(`   ❌ Failed: ${orderResult.error}`);
        results.push({
          testCase: testCase.name,
          success: false,
          error: orderResult.error,
          amounts: []
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message,
        amounts: []
      });
    }

    console.log('');
  }

  // Generate verification report
  generateVerificationReport(results);

  await app.close();
  console.log('✅ PDF currency formatting verification completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Check the generated PDFs in uploads/pdfs/ directory');
  console.log('2. Manually verify all monetary amounts display with "đ" symbol');
  console.log('3. Ensure consistent formatting across all document types');
  console.log('4. Review the verification report: uploads/pdfs/currency-verification-report.txt');
}

function createTestOrderData(config: {
  orderNumber: string;
  items: Array<{ name: string; unitPrice: number; quantity: number }>;
  shippingCost: number;
  discountAmount: number;
  paymentType?: 'bank_transfer' | 'cash_on_delivery' | 'qr_code';
  locale: 'en' | 'vi';
}): OrderPDFData {
  const subtotal = config.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const total = subtotal + config.shippingCost - config.discountAmount;

  return {
    orderNumber: config.orderNumber,
    orderDate: new Date().toISOString(),
    customerInfo: {
      name: config.locale === 'vi' ? 'Nguyễn Văn A' : 'John Doe',
      email: 'test@example.com',
      phone: '+84 123 456 789'
    },
    billingAddress: {
      fullName: config.locale === 'vi' ? 'Nguyễn Văn A' : 'John Doe',
      addressLine1: config.locale === 'vi' ? '123 Đường ABC' : '123 Main Street',
      city: config.locale === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh City',
      state: config.locale === 'vi' ? 'TP.HCM' : 'Ho Chi Minh',
      postalCode: '70000',
      country: config.locale === 'vi' ? 'Việt Nam' : 'Vietnam',
      phone: '+84 123 456 789'
    },
    shippingAddress: {
      fullName: config.locale === 'vi' ? 'Nguyễn Văn A' : 'John Doe',
      addressLine1: config.locale === 'vi' ? '123 Đường ABC' : '123 Main Street',
      city: config.locale === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh City',
      state: config.locale === 'vi' ? 'TP.HCM' : 'Ho Chi Minh',
      postalCode: '70000',
      country: config.locale === 'vi' ? 'Việt Nam' : 'Vietnam',
      phone: '+84 123 456 789'
    },
    items: config.items.map((item, index) => ({
      id: `item-${index + 1}`,
      name: item.name,
      description: config.locale === 'vi' ? 'Mô tả sản phẩm' : 'Product description',
      sku: `SKU-${index + 1}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      category: config.locale === 'vi' ? 'Danh mục' : 'Category'
    })),
    pricing: {
      subtotal,
      shippingCost: config.shippingCost,
      discountAmount: config.discountAmount,
      total
    },
    paymentMethod: {
      type: config.paymentType || 'bank_transfer',
      displayName: getPaymentDisplayName(config.paymentType || 'bank_transfer', config.locale),
      status: 'pending',
      details: config.locale === 'vi' ? 'Chi tiết thanh toán' : 'Payment details'
    },
    shippingMethod: {
      name: config.locale === 'vi' ? 'Giao hàng tiêu chuẩn' : 'Standard Shipping',
      description: config.locale === 'vi' ? 'Giao hàng trong 3-5 ngày' : 'Delivery in 3-5 days',
      estimatedDelivery: config.locale === 'vi' ? '3-5 ngày làm việc' : '3-5 business days'
    },
    businessInfo: {
      companyName: config.locale === 'vi' ? 'Công ty ABC' : 'ABC Company',
      contactEmail: 'contact@example.com',
      contactPhone: '+84 123 456 789',
      website: 'https://example.com',
      address: {
        fullName: config.locale === 'vi' ? 'Công ty ABC' : 'ABC Company',
        addressLine1: config.locale === 'vi' ? '456 Đường Kinh Doanh' : '456 Business Street',
        city: config.locale === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh City',
        state: config.locale === 'vi' ? 'TP.HCM' : 'Ho Chi Minh',
        postalCode: '70000',
        country: config.locale === 'vi' ? 'Việt Nam' : 'Vietnam'
      }
    },
    locale: config.locale
  };
}

function getPaymentDisplayName(type: string, locale: 'en' | 'vi'): string {
  const names: Record<string, { en: string; vi: string }> = {
    bank_transfer: { en: 'Bank Transfer', vi: 'Chuyển khoản ngân hàng' },
    cash_on_delivery: { en: 'Cash on Delivery', vi: 'Thanh toán khi nhận hàng' },
    qr_code: { en: 'QR Code Payment', vi: 'Thanh toán QR Code' }
  };
  return names[type]?.[locale] || type;
}

function extractMonetaryAmounts(orderData: OrderPDFData): string[] {
  const amounts: string[] = [];

  // Item prices
  orderData.items.forEach(item => {
    amounts.push(`Unit price: ${item.unitPrice}`);
    amounts.push(`Total price: ${item.totalPrice}`);
  });

  // Pricing breakdown
  amounts.push(`Subtotal: ${orderData.pricing.subtotal}`);
  amounts.push(`Shipping: ${orderData.pricing.shippingCost}`);
  if (orderData.pricing.discountAmount) {
    amounts.push(`Discount: ${orderData.pricing.discountAmount}`);
  }
  if (orderData.pricing.taxAmount) {
    amounts.push(`Tax: ${orderData.pricing.taxAmount}`);
  }
  amounts.push(`Total: ${orderData.pricing.total}`);

  return amounts;
}

function generateVerificationReport(results: Array<{
  testCase: string;
  success: boolean;
  filePath?: string;
  error?: string;
  amounts: string[];
}>) {
  const reportPath = path.join(process.cwd(), 'uploads', 'pdfs', 'currency-verification-report.txt');

  let report = 'PDF Currency Formatting Verification Report\n';
  report += '===========================================\n\n';
  report += `Generated on: ${new Date().toISOString()}\n\n`;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  report += `Summary:\n`;
  report += `- Total test cases: ${results.length}\n`;
  report += `- Successful: ${successful.length}\n`;
  report += `- Failed: ${failed.length}\n\n`;

  if (successful.length > 0) {
    report += 'Successfully Generated PDFs:\n';
    report += '============================\n';
    successful.forEach(result => {
      report += `\n${result.testCase}:\n`;
      report += `  File: ${result.filePath}\n`;
      report += `  Monetary amounts to verify:\n`;
      result.amounts.forEach(amount => {
        report += `    - ${amount}\n`;
      });
    });
    report += '\n';
  }

  if (failed.length > 0) {
    report += 'Failed PDF Generations:\n';
    report += '======================\n';
    failed.forEach(result => {
      report += `\n${result.testCase}:\n`;
      report += `  Error: ${result.error}\n`;
    });
    report += '\n';
  }

  report += 'Manual Verification Checklist:\n';
  report += '==============================\n';
  report += '□ All monetary amounts display with "đ" symbol (not "$")\n';
  report += '□ Currency symbol appears AFTER the amount (e.g., "100,000 đ")\n';
  report += '□ Vietnamese number formatting with comma separators\n';
  report += '□ Zero amounts display as "0 đ" (not "$0.00")\n';
  report += '□ Consistent formatting across order confirmations\n';
  report += '□ Consistent formatting across invoices\n';
  report += '□ Consistent formatting across payment information sections\n';
  report += '□ Both English and Vietnamese locales use same currency format\n';
  report += '□ Large amounts (millions) format correctly\n';
  report += '□ Decimal handling is appropriate (no decimals for VND)\n\n';

  report += 'Requirements Validation:\n';
  report += '=======================\n';
  report += '□ Requirement 2.2: Order confirmation PDFs format all amounts consistently\n';
  report += '□ Requirement 2.3: Invoice PDFs format unit and total prices consistently\n';
  report += '□ Requirement 2.4: Multiple items use consistent currency formatting\n';
  report += '□ Requirement 2.5: Payment information uses correct currency symbol\n';

  // Ensure directory exists
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, report);
  console.log(`📋 Verification report generated: ${reportPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}