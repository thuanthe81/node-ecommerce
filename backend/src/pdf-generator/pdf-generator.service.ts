import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { PDFGenerationResult, OrderPDFData } from './types/pdf.types';
import { PDFTemplateEngine } from './pdf-template.engine';
import { PDFLocalizationService } from './services/pdf-localization.service';
import { PDFAccessibilityService } from './services/pdf-accessibility.service';
import { PDFDeviceOptimizationService } from './services/pdf-device-optimization.service';
import { PDFCompressionService } from './services/pdf-compression.service';
import { PDFErrorHandlerService } from './services/pdf-error-handler.service';
import { PDFMonitoringService } from './services/pdf-monitoring.service';
import { PDFAuditService } from './services/pdf-audit.service';
import { PDFImageConverterService } from './services/pdf-image-converter.service';
import { PaymentSettingsService } from '../payment-settings/payment-settings.service';

@Injectable()
export class PDFGeneratorService {
  private readonly logger = new Logger(PDFGeneratorService.name);
  private browser: puppeteer.Browser | null = null;

  constructor(
    private templateEngine: PDFTemplateEngine,
    private localization: PDFLocalizationService,
    private accessibilityService: PDFAccessibilityService,
    private deviceOptimization: PDFDeviceOptimizationService,
    private compressionService: PDFCompressionService,
    @Inject(forwardRef(() => PDFErrorHandlerService))
    private errorHandlerService: PDFErrorHandlerService,
    @Inject(forwardRef(() => PDFMonitoringService))
    private monitoringService: PDFMonitoringService,
    private auditService: PDFAuditService,
    private imageConverter: PDFImageConverterService,
    private paymentSettingsService: PaymentSettingsService
  ) {}

  /**
   * Initialize Puppeteer browser instance
   * Uses headless mode for server environments
   */
  private async initializeBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from order data
   * @param orderData - Complete order information
   * @param locale - Language locale for the PDF
   * @returns Promise<PDFGenerationResult> - Result with file path or error
   */
  async generateOrderPDF(
    orderData: OrderPDFData,
    locale: 'en' | 'vi' = 'en'
  ): Promise<PDFGenerationResult> {
    const startTime = Date.now();
    let auditId: string | undefined;

    try {
      this.logger.log(`Generating PDF for order ${orderData.orderNumber} in locale ${locale}`);

      // Start audit logging
      auditId = await this.auditService.logPDFGeneration(
        orderData.orderNumber,
        orderData.customerInfo?.email || 'unknown',
        locale,
        'order',
        'started',
        {
          itemCount: orderData.items?.length || 0,
          totalAmount: orderData.pricing?.total || 0,
          paymentMethod: orderData.paymentMethod?.type || 'unknown',
        }
      );

      // Validate order data before generation
      const validationResult = this.validateOrderData(orderData);
      if (!validationResult.isValid) {
        const error = `Invalid order data: ${validationResult.errors.join(', ')}`;
        const duration = Date.now() - startTime;

        // Log validation failure
        if (auditId) {
          await this.auditService.logPDFGeneration(
            orderData.orderNumber,
            orderData.customerInfo.email,
            locale,
            'order',
            'failed',
            {},
            duration,
            error
          );
        }

        // Record performance metric
        this.monitoringService.recordPerformanceMetric('pdf_generation', duration, false, {
          error: 'validation_failed',
          orderNumber: orderData.orderNumber,
        });

        return {
          success: false,
          error,
          metadata: {
            generatedAt: new Date(),
            locale,
            orderNumber: orderData.orderNumber,
          },
        };
      }

      // Optimize order data for smaller PDF size using enhanced image optimization
      const { optimizedData, optimizations, sizeSavings } = await this.compressionService.optimizeOrderDataForPDF(orderData);
      this.logger.log(`Enhanced order PDF optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      // Set page format for A4 printing
      await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels at 96 DPI

      // Generate HTML content using template engine with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale);

      // Enhance HTML with accessibility features
      htmlContent = this.accessibilityService.enhanceHTMLAccessibility(htmlContent, locale);
      htmlContent = this.accessibilityService.enhanceImageAltText(htmlContent, enhancedOrderData, locale);

      // Add device optimization features
      htmlContent = this.deviceOptimization.addNavigationAnchors(htmlContent);

      // Set HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate accessibility metadata
      const accessibilityMetadata = this.accessibilityService.generateAccessibilityMetadata(enhancedOrderData, locale);

      // Generate PDF with print-optimized settings and accessibility features
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>', // Empty header
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;" role="contentinfo" aria-label="Page information">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
        // Add accessibility metadata to PDF
        tagged: true, // Enable tagged PDF for screen readers
      });

      await page.close();

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `order-${orderData.orderNumber}-${timestamp}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'pdfs', fileName);

      // Ensure directory exists
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save PDF to file
      fs.writeFileSync(filePath, pdfBuffer);

      const duration = Date.now() - startTime;

      // Log successful completion
      if (auditId) {
        await this.auditService.logPDFGeneration(
          orderData.orderNumber,
          orderData.customerInfo.email,
          locale,
          'order',
          'completed',
          {
            fileSize: pdfBuffer.length,
            filePath,
            itemCount: orderData.items.length,
            totalAmount: orderData.pricing.total,
            paymentMethod: orderData.paymentMethod.type,
          },
          duration
        );
      }

      // Record performance metric
      this.monitoringService.recordPerformanceMetric('pdf_generation', duration, true, {
        orderNumber: orderData.orderNumber,
        fileSize: pdfBuffer.length,
        locale,
      });

      this.logger.log(`PDF generated successfully: ${filePath} (${duration}ms)`);

      return {
        success: true,
        filePath,
        fileName,
        fileSize: pdfBuffer.length,
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error completion
      if (auditId) {
        await this.auditService.logPDFGeneration(
          orderData.orderNumber,
          orderData.customerInfo.email,
          locale,
          'order',
          'failed',
          {
            itemCount: orderData.items.length,
            totalAmount: orderData.pricing.total,
            paymentMethod: orderData.paymentMethod.type,
          },
          duration,
          error.message
        );
      }

      // Record performance metric
      this.monitoringService.recordPerformanceMetric('pdf_generation', duration, false, {
        error: error.message,
        orderNumber: orderData.orderNumber,
      });

      // Handle error with comprehensive error handling
      const errorHandlingResult = await this.errorHandlerService.handlePDFGenerationError(
        error,
        orderData,
        locale,
        { metadata: { auditId, duration } }
      );

      this.logger.error(`Failed to generate PDF for order ${orderData.orderNumber}:`, error);

      return {
        success: false,
        error: errorHandlingResult.error || error.message || 'Unknown error occurred during PDF generation',
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    }
  }

  /**
   * Generate invoice PDF from order data
   * @param orderData - Complete order information
   * @param locale - Language locale for the PDF
   * @returns Promise<PDFGenerationResult> - Result with file path or error
   */
  async generateInvoicePDF(
    orderData: OrderPDFData,
    locale: 'en' | 'vi' = 'en'
  ): Promise<PDFGenerationResult> {
    try {
      this.logger.log(`Generating invoice PDF for order ${orderData.orderNumber} in locale ${locale}`);

      // Validate order data before generation
      const validationResult = this.validateOrderData(orderData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Invalid order data: ${validationResult.errors.join(', ')}`,
          metadata: {
            generatedAt: new Date(),
            locale,
            orderNumber: orderData.orderNumber,
          },
        };
      }

      // Optimize order data for smaller PDF size using enhanced image optimization
      const { optimizedData, optimizations, sizeSavings } = await this.compressionService.optimizeOrderDataForPDF(orderData);
      this.logger.log(`Enhanced invoice optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      // Set page format for A4 printing
      await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels at 96 DPI

      // Generate HTML content using template engine for invoice with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale);

      // Enhance HTML with accessibility features
      htmlContent = this.accessibilityService.enhanceHTMLAccessibility(htmlContent, locale);
      htmlContent = this.accessibilityService.enhanceImageAltText(htmlContent, enhancedOrderData, locale);

      // Add device optimization features
      htmlContent = this.deviceOptimization.addNavigationAnchors(htmlContent);

      // Set HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate accessibility metadata
      const accessibilityMetadata = this.accessibilityService.generateAccessibilityMetadata(enhancedOrderData, locale);

      // Generate PDF with print-optimized settings and accessibility features
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>', // Empty header
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;" role="contentinfo" aria-label="Page information">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
        // Add accessibility metadata to PDF
        tagged: true, // Enable tagged PDF for screen readers
      });

      await page.close();

      // Generate unique filename for invoice
      const timestamp = Date.now();
      const fileName = `invoice-${orderData.orderNumber}-${timestamp}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'pdfs', fileName);

      // Ensure directory exists
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save PDF to file
      fs.writeFileSync(filePath, pdfBuffer);

      this.logger.log(`Invoice PDF generated successfully: ${filePath}`);

      return {
        success: true,
        filePath,
        fileName,
        fileSize: pdfBuffer.length,
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to generate invoice PDF for order ${orderData.orderNumber}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during invoice PDF generation',
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    }
  }

  /**
   * Validate order data before PDF generation
   * @param orderData - Order data to validate
   * @returns Validation result with errors if any
   */
  validateOrderData(orderData: OrderPDFData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!orderData.orderNumber) {
      errors.push('Order number is required');
    }

    if (!orderData.orderDate) {
      errors.push('Order date is required');
    }

    if (!orderData.customerInfo?.name) {
      errors.push('Customer name is required');
    }

    if (!orderData.customerInfo?.email) {
      errors.push('Customer email is required');
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    if (!orderData.pricing) {
      errors.push('Pricing information is required');
    }

    if (!orderData.shippingAddress) {
      errors.push('Shipping address is required');
    }

    if (!orderData.billingAddress) {
      errors.push('Billing address is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Enhance payment method data with actual payment settings
   * @param orderData - Original order data
   * @returns Enhanced order data with complete payment information
   */
  private async enhancePaymentMethodData(orderData: OrderPDFData): Promise<OrderPDFData> {
    try {
      // Clone the order data to avoid mutations
      const enhancedData = { ...orderData };

      // Enhance bank transfer payment methods with actual settings
      if (orderData.paymentMethod.type === 'bank_transfer') {
        const bankSettings = await this.paymentSettingsService.getBankTransferSettings();

        enhancedData.paymentMethod = {
          ...orderData.paymentMethod,
          accountName: bankSettings.accountName,
          accountNumber: bankSettings.accountNumber,
          bankName: bankSettings.bankName,
          qrCodeUrl: bankSettings.qrCodeUrl || undefined,
          details: bankSettings.accountName && bankSettings.accountNumber
            ? `${bankSettings.bankName} - ${bankSettings.accountName} (${bankSettings.accountNumber})`
            : orderData.paymentMethod.details,
          instructions: orderData.paymentMethod.instructions || this.generateBankTransferInstructions(bankSettings, orderData.locale),
        };
      }

      return enhancedData;
    } catch (error) {
      this.logger.warn(`Failed to enhance payment method data: ${error.message}`);
      // Return original data if enhancement fails
      return orderData;
    }
  }

  /**
   * Generate bank transfer instructions based on settings and locale
   */
  private generateBankTransferInstructions(bankSettings: any, locale: 'en' | 'vi'): string {
    return this.localization.generateBankTransferInstructions(bankSettings, locale);
  }

  /**
   * Generate compressed PDF with size optimization
   * @param orderData - Complete order information
   * @param locale - Language locale for the PDF
   * @param compressionLevel - Compression level (low, medium, high)
   * @returns Promise<PDFGenerationResult> - Result with file path or error
   */
  async generateCompressedPDF(
    orderData: OrderPDFData,
    locale: 'en' | 'vi' = 'en',
    compressionLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<PDFGenerationResult> {
    try {
      this.logger.log(`Generating compressed PDF (${compressionLevel}) for order ${orderData.orderNumber} in locale ${locale}`);

      // Validate order data before generation
      const validationResult = this.validateOrderData(orderData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Invalid order data: ${validationResult.errors.join(', ')}`,
          metadata: {
            generatedAt: new Date(),
            locale,
            orderNumber: orderData.orderNumber,
          },
        };
      }

      // Optimize order data for smaller PDF size using enhanced image optimization
      const { optimizedData, optimizations, sizeSavings } = await this.compressionService.optimizeOrderDataForPDF(orderData);
      this.logger.log(`Enhanced order data optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      // Set page format for A4 printing
      await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels at 96 DPI

      // Generate HTML content using template engine with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale);

      // Enhance HTML with accessibility features
      htmlContent = this.accessibilityService.enhanceHTMLAccessibility(htmlContent, locale);
      htmlContent = this.accessibilityService.enhanceImageAltText(htmlContent, enhancedOrderData, locale);

      // Add device optimization features
      htmlContent = this.deviceOptimization.addNavigationAnchors(htmlContent);

      // Set HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate accessibility metadata
      const accessibilityMetadata = this.accessibilityService.generateAccessibilityMetadata(enhancedOrderData, locale);

      // Generate PDF with compression-optimized settings
      const pdfOptions = this.compressionService.getCompressionOptimizedPDFOptions(compressionLevel);
      const pdfBuffer = await page.pdf(pdfOptions);

      await page.close();

      // Generate unique filename with compression level
      const timestamp = Date.now();
      const fileName = `order-${orderData.orderNumber}-${compressionLevel}-${timestamp}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'pdfs', fileName);

      // Ensure directory exists
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save PDF to file
      fs.writeFileSync(filePath, pdfBuffer);

      // Validate PDF size and provide warnings if necessary
      const sizeValidation = this.compressionService.validatePDFSize(filePath);

      if (!sizeValidation.isValid) {
        this.logger.warn(`Generated PDF exceeds size limits: ${sizeValidation.warnings.join(', ')}`);

        // Generate alternative delivery methods for oversized files
        const alternatives = this.compressionService.generateAlternativeDeliveryMethods(filePath, enhancedOrderData);
        this.logger.log(`Alternative delivery methods available: ${alternatives.methods.length}`);
      }

      this.logger.log(`Compressed PDF generated successfully: ${filePath} (${this.formatFileSize(pdfBuffer.length)})`);

      return {
        success: true,
        filePath,
        fileName,
        fileSize: pdfBuffer.length,
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to generate compressed PDF for order ${orderData.orderNumber}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during compressed PDF generation',
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    }
  }

  /**
   * Generate PDF optimized for specific device type
   * @param orderData - Complete order information
   * @param locale - Language locale for the PDF
   * @param deviceType - Target device type for optimization
   * @returns Promise<PDFGenerationResult> - Result with file path or error
   */
  async generateDeviceOptimizedPDF(
    orderData: OrderPDFData,
    locale: 'en' | 'vi' = 'en',
    deviceType: 'mobile' | 'desktop' | 'print' = 'print'
  ): Promise<PDFGenerationResult> {
    try {
      this.logger.log(`Generating ${deviceType}-optimized PDF for order ${orderData.orderNumber} in locale ${locale}`);

      // Validate order data before generation
      const validationResult = this.validateOrderData(orderData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Invalid order data: ${validationResult.errors.join(', ')}`,
          metadata: {
            generatedAt: new Date(),
            locale,
            orderNumber: orderData.orderNumber,
          },
        };
      }

      // Optimize order data for smaller PDF size using enhanced image optimization
      const { optimizedData, optimizations, sizeSavings } = await this.compressionService.optimizeOrderDataForPDF(orderData);
      this.logger.log(`Enhanced ${deviceType} PDF optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      // Set viewport based on device type
      const viewportSettings = this.getDeviceViewport(deviceType);
      await page.setViewport(viewportSettings);

      // Generate HTML content using template engine with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale);

      // Enhance HTML with accessibility features
      htmlContent = this.accessibilityService.enhanceHTMLAccessibility(htmlContent, locale);
      htmlContent = this.accessibilityService.enhanceImageAltText(htmlContent, enhancedOrderData, locale);

      // Add device optimization features
      htmlContent = this.deviceOptimization.addNavigationAnchors(htmlContent);

      // Set HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate accessibility metadata
      const accessibilityMetadata = this.accessibilityService.generateAccessibilityMetadata(enhancedOrderData, locale);

      // Generate PDF with device-optimized settings and accessibility features
      const pdfOptions = this.deviceOptimization.getDeviceOptimizedPDFOptions(deviceType);
      const pdfBuffer = await page.pdf(pdfOptions);

      await page.close();

      // Generate unique filename with device type
      const timestamp = Date.now();
      const fileName = `order-${orderData.orderNumber}-${deviceType}-${timestamp}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'pdfs', fileName);

      // Ensure directory exists
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save PDF to file
      fs.writeFileSync(filePath, pdfBuffer);

      this.logger.log(`${deviceType}-optimized PDF generated successfully: ${filePath}`);

      return {
        success: true,
        filePath,
        fileName,
        fileSize: pdfBuffer.length,
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to generate ${deviceType}-optimized PDF for order ${orderData.orderNumber}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during PDF generation',
        metadata: {
          generatedAt: new Date(),
          locale,
          orderNumber: orderData.orderNumber,
        },
      };
    }
  }

  /**
   * Get viewport settings based on device type
   */
  private getDeviceViewport(deviceType: 'mobile' | 'desktop' | 'print'): { width: number; height: number } {
    switch (deviceType) {
      case 'mobile':
        return { width: 375, height: 667 }; // iPhone-like dimensions
      case 'desktop':
        return { width: 1200, height: 800 }; // Desktop dimensions
      case 'print':
      default:
        return { width: 794, height: 1123 }; // A4 dimensions in pixels at 96 DPI
    }
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clean up browser instance on service destruction
   */
  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}