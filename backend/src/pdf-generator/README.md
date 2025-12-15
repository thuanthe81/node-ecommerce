# PDF Generation System Documentation

## Overview

The PDF Generation System is a comprehensive solution for creating professional, branded PDF documents from order data. It addresses HTML syntax errors with the swaks email command by generating PDF attachments instead of complex HTML emails. The system provides multi-language support, accessibility features, and cross-platform compatibility.

## Architecture

The PDF generation system consists of several interconnected services:

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  PDFGeneratorService │────│ PDFTemplateEngine    │────│ PDFDocumentStructure│
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│ DocumentStorage     │    │ PDFLocalization      │    │ PDFAccessibility    │
│ Service             │    │ Service              │    │ Service             │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│ EmailAttachment     │    │ PDFCompression       │    │ PDFMonitoring       │
│ Service             │    │ Service              │    │ Service             │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## Core Components

### 1. PDFGeneratorService

**Location**: `backend/src/pdf-generator/pdf-generator.service.ts`

The main service responsible for PDF generation using Puppeteer. Provides methods for:

- `generateOrderPDF(orderData, locale)` - Generate order confirmation PDFs
- `generateInvoicePDF(orderData, locale)` - Generate invoice PDFs
- `generateCompressedPDF(orderData, locale, compressionLevel)` - Generate size-optimized PDFs
- `generateDeviceOptimizedPDF(orderData, locale, deviceType)` - Generate device-specific PDFs

**Key Features**:
- Puppeteer-based PDF generation with headless Chrome
- A4/Letter format support with proper margins
- Accessibility features (tagged PDFs, screen reader support)
- Error handling and retry logic
- Performance monitoring and audit logging

**Configuration Options**:
```typescript
// Puppeteer launch options
{
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
}

// PDF generation options
{
  format: 'A4',
  printBackground: true,
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm',
  },
  displayHeaderFooter: true,
  tagged: true, // Enable accessibility
}
```

### 2. PDFTemplateEngine

**Location**: `backend/src/pdf-generator/pdf-template.engine.ts`

Handles PDF template creation and HTML generation with consistent branding.

**Methods**:
- `createOrderTemplate(data, locale)` - Create order confirmation template
- `createInvoiceTemplate(data, locale)` - Create invoice template
- `applyBranding(template)` - Apply AlaCraft branding
- `generateHTMLFromOrderData(orderData, locale)` - Generate complete HTML

**Branding Configuration**:
```typescript
const branding = {
  colors: {
    primary: '#2c3e50',      // Dark blue-gray for headers
    secondary: '#3498db',    // Blue for accents
    text: '#2c3e50',         // Dark text for readability
    background: '#ffffff',   // White background
    border: '#bdc3c7',       // Light gray for borders
  },
  fonts: {
    primary: 'Arial, sans-serif',
    heading: 'Arial, sans-serif',
    monospace: 'Courier New, monospace',
  }
};
```

### 3. PDFDocumentStructureService

**Location**: `backend/src/pdf-generator/pdf-document-structure.service.ts`

Generates complete document structure with responsive layout and proper formatting.

**Features**:
- Responsive CSS for different screen sizes
- Print-optimized layouts
- Professional header/footer sections
- Product image handling with fallbacks
- Zero-price product support
- Multi-language address formatting

### 4. PDFLocalizationService

**Location**: `backend/src/pdf-generator/services/pdf-localization.service.ts`

Provides translation and localization support for English and Vietnamese.

**Supported Locales**:
- `en` - English (US format)
- `vi` - Vietnamese (VN format)

**Features**:
- Currency formatting (USD/VND)
- Date formatting (MM/DD/YYYY vs DD/MM/YYYY)
- Address formatting
- Payment method translations
- Status translations

### 5. DocumentStorageService

**Location**: `backend/src/pdf-generator/services/document-storage.service.ts`

Manages temporary PDF file storage with security and cleanup features.

**Features**:
- Unique filename generation
- Storage capacity monitoring
- Automatic cleanup scheduling
- File permission management
- Security path validation

**Configuration**:
```typescript
const config = {
  uploadDir: 'uploads/pdfs',
  maxStorageSize: 1024 * 1024 * 1024, // 1GB
  retentionHours: 24, // Files kept for 24 hours
  cleanupInterval: 3600000, // Cleanup every hour
};
```

## Data Models

### OrderPDFData Interface

```typescript
interface OrderPDFData {
  orderNumber: string;
  orderDate: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress: AddressData;
  shippingAddress: AddressData;
  items: OrderItemData[];
  pricing: {
    subtotal: number;
    shippingCost: number;
    taxAmount?: number;
    discountAmount?: number;
    total: number;
  };
  paymentMethod: PaymentMethodData;
  shippingMethod: ShippingMethodData;
  businessInfo: BusinessInfoData;
  locale: 'en' | 'vi';
}
```

### PaymentMethodData Interface

```typescript
interface PaymentMethodData {
  type: 'bank_transfer' | 'cash_on_delivery' | 'qr_code';
  displayName: string;
  details?: string;
  qrCodeUrl?: string;
  instructions?: string;
  status: 'pending' | 'completed' | 'failed';
  // Bank transfer specific fields
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}
```

## Usage Examples

### Basic PDF Generation

```typescript
import { PDFGeneratorService } from './pdf-generator.service';

// Inject the service
constructor(private pdfGenerator: PDFGeneratorService) {}

// Generate order PDF
async generateOrderPDF(orderData: OrderPDFData) {
  const result = await this.pdfGenerator.generateOrderPDF(orderData, 'en');

  if (result.success) {
    console.log(`PDF generated: ${result.filePath}`);
    console.log(`File size: ${result.fileSize} bytes`);
  } else {
    console.error(`PDF generation failed: ${result.error}`);
  }
}
```

### Compressed PDF Generation

```typescript
// Generate compressed PDF for email attachment
async generateCompressedPDF(orderData: OrderPDFData) {
  const result = await this.pdfGenerator.generateCompressedPDF(
    orderData,
    'vi',
    'medium' // compression level: low, medium, high
  );

  return result;
}
```

### Device-Optimized PDF

```typescript
// Generate mobile-optimized PDF
async generateMobilePDF(orderData: OrderPDFData) {
  const result = await this.pdfGenerator.generateDeviceOptimizedPDF(
    orderData,
    'en',
    'mobile' // device type: mobile, desktop, print
  );

  return result;
}
```

## Configuration

### Environment Variables

```bash
# PDF Generation Settings
PDF_UPLOAD_DIR=uploads/pdfs
PDF_MAX_STORAGE_SIZE=1073741824  # 1GB in bytes
PDF_RETENTION_HOURS=24
PDF_CLEANUP_INTERVAL=3600000     # 1 hour in milliseconds

# Puppeteer Settings
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000          # 30 seconds

# Compression Settings
PDF_COMPRESSION_QUALITY=0.8
PDF_IMAGE_COMPRESSION=true
PDF_MAX_FILE_SIZE=10485760       # 10MB in bytes
```

### Module Configuration

```typescript
// pdf-generator.module.ts
@Module({
  imports: [
    PaymentSettingsModule,
    NotificationsModule,
  ],
  providers: [
    PDFGeneratorService,
    PDFTemplateEngine,
    PDFDocumentStructureService,
    PDFLocalizationService,
    PDFAccessibilityService,
    PDFDeviceOptimizationService,
    PDFCompressionService,
    PDFErrorHandlerService,
    PDFMonitoringService,
    PDFAuditService,
    DocumentStorageService,
    EmailAttachmentService,
    ResendEmailHandlerService,
    StorageErrorHandlerService,
    PDFCleanupService,
  ],
  exports: [
    PDFGeneratorService,
    EmailAttachmentService,
    ResendEmailHandlerService,
  ],
})
export class PDFGeneratorModule {}
```

## Error Handling

### Common Error Scenarios

1. **PDF Generation Failures**
   - Invalid order data
   - Puppeteer launch failures
   - Template rendering errors
   - Image loading failures

2. **Storage Issues**
   - Disk space limitations
   - File permission problems
   - Concurrent access conflicts

3. **Email Attachment Problems**
   - File size limitations
   - SMTP delivery failures
   - Encoding issues

### Error Recovery Strategies

```typescript
// Automatic retry with exponential backoff
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

// Fallback notification methods
const fallbackMethods = [
  'simplified_email_without_attachment',
  'sms_notification',
  'admin_notification',
];
```

## Performance Optimization

### PDF Generation Performance

- **Browser Instance Reuse**: Single Puppeteer instance for multiple PDFs
- **Template Caching**: Reuse compiled templates
- **Image Optimization**: Compress and resize product images
- **Concurrent Generation**: Process multiple PDFs in parallel

### Storage Optimization

- **Automatic Cleanup**: Remove expired PDFs
- **Compression**: Reduce file sizes
- **Capacity Monitoring**: Prevent storage overflow

### Monitoring Metrics

```typescript
const metrics = {
  pdfGenerationTime: 'Average time to generate PDF',
  pdfFileSize: 'Average PDF file size',
  storageUtilization: 'Storage space usage percentage',
  emailDeliveryRate: 'Successful email delivery rate',
  errorRate: 'PDF generation error rate',
};
```

## Troubleshooting

### Common Issues

1. **Puppeteer Launch Failures**
   ```bash
   # Install required dependencies on Linux
   sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2
   ```

2. **Font Rendering Issues**
   ```typescript
   // Ensure fonts are available
   const fonts = ['Arial', 'Times New Roman', 'Courier New'];
   ```

3. **Memory Issues**
   ```typescript
   // Configure memory limits
   const puppeteerOptions = {
     args: ['--max-old-space-size=4096'],
   };
   ```

4. **File Permission Errors**
   ```bash
   # Set proper permissions
   chmod 755 uploads/pdfs
   chown -R app:app uploads/pdfs
   ```

### Debug Mode

```typescript
// Enable debug logging
const debugConfig = {
  logLevel: 'debug',
  saveFailedPDFs: true,
  includeStackTraces: true,
  monitorPerformance: true,
};
```

## Security Considerations

### File Security

- Path validation to prevent directory traversal
- File permission restrictions (644 for PDFs)
- Temporary file cleanup
- Storage capacity limits

### Data Security

- Customer data sanitization
- Secure PDF metadata
- Audit logging for compliance
- Rate limiting for resend functionality

### Access Control

- Authentication required for resend operations
- Admin-only access to monitoring endpoints
- Encrypted storage for sensitive payment data

## Testing

### Unit Tests

```typescript
// Test PDF generation
describe('PDFGeneratorService', () => {
  it('should generate valid PDF from order data', async () => {
    const result = await service.generateOrderPDF(mockOrderData, 'en');
    expect(result.success).toBe(true);
    expect(result.filePath).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Test complete PDF workflow
describe('PDF Generation Workflow', () => {
  it('should generate, store, and attach PDF to email', async () => {
    const result = await emailAttachmentService.sendOrderConfirmationWithPDF(
      'customer@example.com',
      mockOrderData,
      'en'
    );
    expect(result.success).toBe(true);
  });
});
```

## Maintenance

### Regular Tasks

1. **Storage Cleanup**: Automated via PDFCleanupService
2. **Performance Monitoring**: Check generation times and error rates
3. **Capacity Planning**: Monitor storage usage trends
4. **Template Updates**: Update branding and layout as needed

### Health Checks

```typescript
// Health check endpoint
@Get('health')
async checkHealth() {
  return {
    status: 'healthy',
    puppeteerStatus: await this.checkPuppeteerHealth(),
    storageStatus: await this.checkStorageHealth(),
    lastPDFGenerated: await this.getLastGenerationTime(),
  };
}
```

This documentation provides a comprehensive guide to the PDF generation system, covering architecture, configuration, usage, and maintenance aspects.