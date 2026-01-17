import { Injectable, Logger, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { isAbsolute } from 'path';
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
export class PDFGeneratorService implements OnModuleInit {
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
  ) {
    this.logger.log('PDFGeneratorService constructor completed');
  }

  /**
   * Initialize the service after all dependencies are injected
   */
  onModuleInit() {
    try {
      // Configure template engine to use file-based templates by default
      this.templateEngine.setTemplateMode(true);
      this.logger.log('PDFGeneratorService initialized with file-based template system');
    } catch (error) {
      this.logger.error('Failed to initialize PDFGeneratorService', error);
      throw error;
    }
  }

  /**
   * Get the base upload directory path from environment variable
   * @returns The absolute path to the upload directory
   */
  private getUploadPath(): string {
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    return isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);
  }

  /**
   * Initialize Puppeteer browser instance
   * Uses headless mode for server environments
   * Includes connection recovery for closed browsers
   */
  private async initializeBrowser(): Promise<puppeteer.Browser> {
    // Check if existing browser is still connected
    if (this.browser) {
      try {
        // Test if browser is still responsive
        await this.browser.version();
      } catch (error) {
        this.logger.warn(`Browser connection lost: ${error.message}. Reinitializing...`);
        this.browser = null;
      }
    }

    if (!this.browser) {
      this.logger.log('Launching new Puppeteer browser instance');
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

      // Add error handler for unexpected disconnections
      this.browser.on('disconnected', () => {
        this.logger.warn('Browser disconnected unexpectedly');
        this.closeBrowser();
      });
    }
    return this.browser;
  }

  /**
   * Set page content with retry logic to handle frame detachment
   * @param page - Puppeteer page instance
   * @param htmlContent - HTML content to set
   * @returns Promise<void>
   */
  private async setPageContentWithRetry(page: puppeteer.Page, htmlContent: string): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if page is still connected
        if (page.isClosed()) {
          throw new Error('Page is closed');
        }

        // Set content with shorter timeout and retry on failure
        await page.setContent(htmlContent, {
          waitUntil: 'domcontentloaded', // Less strict than 'networkidle0'
          timeout: 15000 // 15 seconds timeout
        });

        // Success - exit retry loop
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Failed to set page content (attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));

          // If page is closed, we need to create a new one
          if (page.isClosed()) {
            throw new Error('Page closed during content setting - needs new page');
          }
        }
      }
    }

    throw new Error(`Failed to set page content after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Create a new page with retry logic for connection failures
   * @returns Promise<puppeteer.Page>
   */
  private async createPageWithRetry(): Promise<puppeteer.Page> {
    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.browser = await this.initializeBrowser();
        const page = await this.browser.newPage();

        // Set up page error handlers to prevent frame detachment
        page.on('error', (error) => {
          this.logger.warn(`Page error detected: ${error.message}`);
        });

        page.on('pageerror', (error: Error) => {
          this.logger.warn(`Page script error: ${error.message}`);
        });

        // Set reasonable timeouts
        page.setDefaultTimeout(30000); // 30 seconds
        page.setDefaultNavigationTimeout(30000);

        return page;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Failed to create page (attempt ${attempt}/${maxRetries}): ${error.message}`);

        if (attempt < maxRetries) {
          // Reset browser connection and try again
          await this.closeBrowser();
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed to create page after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
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

      // Optimize order data for smaller PDF size using enhanced image optimization with compressed storage
      const optimizationStartTime = Date.now();
      let optimizedData = orderData;
      let optimizations: any[] = [];
      let sizeSavings = 0;

      try {
        const optimizationResult = await this.compressionService.optimizeOrderDataForPDF(orderData);
        optimizedData = optimizationResult.optimizedData;
        optimizations = optimizationResult.optimizations;
        sizeSavings = optimizationResult.sizeSavings;

        this.logger.log(`Enhanced order PDF optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);
      } catch (optimizationError) {
        this.logger.warn(`Image optimization failed, using original data: ${optimizationError.message}`);
        // Continue with original data if optimization fails
        optimizedData = orderData;
        optimizations = [];
        sizeSavings = 0;
      }

      const optimizationEndTime = Date.now();

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const page = await this.createPageWithRetry();

      // Set page format for A4 printing
      await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels at 96 DPI

      // Generate HTML content using template engine with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale, 'order-confirmation');

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

      await this.closeBrowser();

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `order-${orderData.orderNumber}-${timestamp}.pdf`;
      const filePath = path.join(this.getUploadPath(), 'pdfs', fileName);

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

      // Validate template system before generation
      const templateValidation = await this.validateTemplateSystem();
      if (!templateValidation.isValid) {
        return {
          success: false,
          error: `Template system validation failed: ${templateValidation.errors.join(', ')}`,
          metadata: {
            generatedAt: new Date(),
            locale,
            orderNumber: orderData.orderNumber,
          },
        };
      }

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

      // Optimize order data for smaller PDF size using enhanced image optimization with compressed storage
      const optimizationStartTime = Date.now();
      const { optimizedData, optimizations, sizeSavings } = await this.compressionService.optimizeOrderDataForPDF(orderData);
      const optimizationEndTime = Date.now();

      this.logger.log(`Enhanced invoice optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const page = await this.createPageWithRetry();

      // Set page format for A4 printing
      await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels at 96 DPI

      // Generate HTML content using template engine for invoice with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale, 'invoice');

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

      await this.closeBrowser();

      // Generate unique filename for invoice
      const timestamp = Date.now();
      const fileName = `invoice-${orderData.orderNumber}-${timestamp}.pdf`;
      const filePath = path.join(this.getUploadPath(), 'pdfs', fileName);

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

      // Validate template system before generation
      const templateValidation = await this.validateTemplateSystem();
      if (!templateValidation.isValid) {
        return {
          success: false,
          error: `Template system validation failed: ${templateValidation.errors.join(', ')}`,
          metadata: {
            generatedAt: new Date(),
            locale,
            orderNumber: orderData.orderNumber,
          },
        };
      }

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

      // Optimize order data for smaller PDF size using enhanced image optimization with compressed storage
      const optimizationStartTime = Date.now();
      const { optimizedData, optimizations, sizeSavings } = await this.compressionService.optimizeOrderDataForPDF(orderData);
      const optimizationEndTime = Date.now();

      this.logger.log(`Enhanced order data optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const page = await this.createPageWithRetry();

      // Set page format for A4 printing
      await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions in pixels at 96 DPI

      // Generate HTML content using template engine with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale, 'order-confirmation');

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

      await this.closeBrowser();

      // Generate unique filename with compression level
      const timestamp = Date.now();
      const fileName = `order-${orderData.orderNumber}-${compressionLevel}-${timestamp}.pdf`;
      const filePath = path.join(this.getUploadPath(), 'pdfs', fileName);

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

      // Validate template system before generation
      const templateValidation = await this.validateTemplateSystem();
      if (!templateValidation.isValid) {
        return {
          success: false,
          error: `Template system validation failed: ${templateValidation.errors.join(', ')}`,
          metadata: {
            generatedAt: new Date(),
            locale,
            orderNumber: orderData.orderNumber,
          },
        };
      }

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

      // Optimize order data for smaller PDF size using enhanced image optimization with compressed storage
      const optimizationStartTime = Date.now();
      const { optimizedData, optimizations, sizeSavings } = await this.compressionService.optimizeOrderDataForPDF(orderData);
      const optimizationEndTime = Date.now();

      this.logger.log(`Enhanced ${deviceType} PDF optimization completed. Optimizations: ${optimizations.length}, Size savings: ${this.formatFileSize(sizeSavings)}`);

      // Enhance payment method data with actual settings
      const enhancedOrderData = await this.enhancePaymentMethodData(optimizedData);

      const page = await this.createPageWithRetry();

      // Set viewport based on device type
      const viewportSettings = this.getDeviceViewport(deviceType);
      await page.setViewport(viewportSettings);

      // Generate HTML content using template engine with document structure
      let htmlContent = await this.templateEngine.generateHTMLFromOrderData(enhancedOrderData, locale, 'order-confirmation');

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

      await this.closeBrowser();

      // Generate unique filename with device type
      const timestamp = Date.now();
      const fileName = `order-${orderData.orderNumber}-${deviceType}-${timestamp}.pdf`;
      const filePath = path.join(this.getUploadPath(), 'pdfs', fileName);

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
   * Generate storage and optimization metadata for PDF generation results
   */
  private async generatePDFMetadata(
    orderData: OrderPDFData,
    locale: string,
    optimizations: string[],
    sizeSavings: number,
    pdfBuffer: Buffer,
    optimizationStartTime: number,
    optimizationEndTime: number
  ) {

    return {
      generatedAt: new Date(),
      locale,
      orderNumber: orderData.orderNumber,
    };
  }

  /**
   * Set template generation mode
   * @param useFileBasedTemplates - Whether to use file-based templates
   */
  setTemplateMode(useFileBasedTemplates: boolean): void {
    this.templateEngine.setTemplateMode(useFileBasedTemplates);
    this.logger.log(`Template mode set to: ${useFileBasedTemplates ? 'file-based' : 'programmatic'}`);
  }

  /**
   * Get current template generation mode
   * @returns Whether file-based templates are enabled
   */
  getTemplateMode(): boolean {
    return this.templateEngine.getTemplateMode();
  }

  /**
   * Validate template system availability
   * @returns Promise<ValidationResult> - Template system validation result
   */
  async validateTemplateSystem(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test template loading
      await this.templateEngine.loadTemplateFile('order-confirmation');
      await this.templateEngine.loadTemplateFile('invoice');
    } catch (error) {
      errors.push(`Template file loading failed: ${error.message}`);
    }

    try {
      // Test template processing with minimal data
      const testData = this.createMinimalTestData();
      await this.templateEngine.generateHTMLFromTemplateFile('order-confirmation', testData, 'en');
    } catch (error) {
      errors.push(`Template processing failed: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create minimal test data for template validation
   * @returns Minimal OrderPDFData for testing
   */
  private createMinimalTestData(): any {
    return {
      orderNumber: 'TEST-001',
      orderDate: new Date().toISOString(),
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
      },
      billingAddress: {
        fullName: 'Test Customer',
        addressLine1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
      },
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country',
      },
      items: [
        {
          id: '1',
          name: 'Test Product',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        },
      ],
      pricing: {
        subtotal: 100,
        shippingCost: 10,
        total: 110,
      },
      paymentMethod: {
        type: 'bank_transfer',
        displayName: 'Bank Transfer',
        status: 'pending',
      },
      shippingMethod: {
        name: 'Standard Shipping',
      },
      businessInfo: {
        companyName: 'Test Company',
        contactEmail: 'contact@example.com',
        address: {
          fullName: 'Test Company',
          addressLine1: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'Test Country',
        },
      },
      locale: 'en' as const,
    };
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