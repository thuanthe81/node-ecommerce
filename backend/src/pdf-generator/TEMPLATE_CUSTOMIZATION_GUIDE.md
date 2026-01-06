# Template Customization Guide

## Overview

This guide provides comprehensive instructions for customizing PDF templates to meet specific business needs while maintaining system compatibility, brand consistency, and performance standards.

## Before You Begin

### Prerequisites
- Understanding of HTML and CSS
- Basic knowledge of Handlebars template syntax
- Access to the template files in `backend/src/pdf-generator/templates/`
- Development environment with template monitoring enabled

### Safety Checklist
- [ ] Create backup before making changes
- [ ] Enable template monitoring in development
- [ ] Test changes with sample data
- [ ] Validate templates after modifications
- [ ] Test both English and Vietnamese locales

## Customization Workflow

### 1. Preparation Phase

#### Create Backup
```bash
# Using the backup service
npm run template:backup order-confirmation "Pre-customization backup"
```

Or manually:
```bash
cp backend/src/pdf-generator/templates/order-confirmation.html \
   backend/src/pdf-generator/templates/backups/order-confirmation_$(date +%Y%m%d%H%M%S).html
```

#### Enable Development Monitoring
```bash
export NODE_ENV=development
export TEMPLATE_MONITORING_ENABLED=true
npm run dev
```

### 2. Customization Phase

#### Make Template Changes
Edit the template files using your preferred editor. Changes are automatically detected and validated in development mode.

#### Validate Changes
```bash
npm run template:validate order-confirmation
```

#### Test Rendering
```bash
npm run template:test order-confirmation
```

### 3. Deployment Phase

#### Final Validation
```bash
npm run template:validate:all
```

#### Deploy to Production
```bash
npm run deploy:templates
```

## Common Customization Scenarios

### 1. Brand Customization

#### Logo and Company Information

**Objective**: Update company branding elements

**Files to Modify**:
- `order-confirmation.html`
- `invoice.html`
- `pdf-styles.css`

**Steps**:

1. **Update Logo Section**:
```html
<!-- In both order-confirmation.html and invoice.html -->
<div class="logo-section">
  {{#if businessInfo.logoUrl}}
    <img src="{{businessInfo.logoUrl}}" alt="{{companyName}}" class="company-logo">
  {{else}}
    <h1 class="company-name">{{companyName}}</h1>
  {{/if}}
  <!-- Add custom branding elements -->
  <p class="company-tagline">Your Custom Tagline</p>
</div>
```

2. **Update CSS Styling**:
```css
/* In pdf-styles.css */
.company-logo {
  max-height: 80px; /* Adjust logo size */
  max-width: 250px;
}

.company-tagline {
  font-size: 10px;
  color: #666;
  font-style: italic;
  margin-top: 4px;
}

/* Custom brand colors */
:root {
  --brand-primary: #your-primary-color;
  --brand-secondary: #your-secondary-color;
}

.pdf-header {
  border-bottom-color: var(--brand-primary);
}

.items-table th {
  background-color: var(--brand-primary);
}
```

3. **Add Custom Footer**:
```html
<!-- In footer section -->
<footer class="pdf-footer">
  <div class="footer-content">
    <div class="footer-note">
      <p class="small-text">{{thankYouMessage}}</p>
    </div>
    <!-- Custom footer content -->
    <div class="custom-footer">
      <p class="small-text">Follow us on social media: @yourcompany</p>
      <p class="small-text">Visit our website: www.yourcompany.com</p>
    </div>
  </div>
</footer>
```

#### Color Scheme Customization

**Update Brand Colors**:
```css
/* Primary brand colors */
.pdf-header {
  border-bottom: 2px solid #your-primary-color;
}

.items-table th {
  background-color: #your-primary-color;
  color: #ffffff;
}

.total-row {
  border-top: 2px solid #your-primary-color;
}

/* Secondary colors for accents */
.document-title h1 {
  color: #your-secondary-color;
}

h3 {
  color: #your-secondary-color;
}

/* Custom color classes */
.text-brand-primary {
  color: #your-primary-color;
}

.text-brand-secondary {
  color: #your-secondary-color;
}

.bg-brand-light {
  background-color: #your-light-background;
}
```

### 2. Layout Customization

#### Two-Column Layout

**Objective**: Create a two-column layout for better space utilization

**Implementation**:
```html
<!-- Replace single-column customer info with two-column layout -->
<div class="order-info-section two-column-layout">
  <div class="left-column">
    <div class="customer-info">
      <h3>{{customerInformationTitle}}</h3>
      <p><strong>{{nameLabel}}:</strong> {{customerInfo.name}}</p>
      <p><strong>{{emailLabel}}:</strong> {{customerInfo.email}}</p>
      {{#if customerInfo.phone}}
        <p><strong>{{phoneLabel}}:</strong> {{formattedPhone}}</p>
      {{/if}}
    </div>
  </div>

  <div class="right-column">
    <div class="order-details">
      <h3>{{orderDetailsTitle}}</h3>
      <p><strong>{{orderNumberLabel}}:</strong> {{orderNumber}}</p>
      <p><strong>{{orderDateLabel}}:</strong> {{formattedOrderDate}}</p>
      <p><strong>{{paymentStatusLabel}}:</strong> {{formattedPaymentStatus}}</p>
    </div>
  </div>
</div>
```

**CSS Support**:
```css
.two-column-layout {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.left-column,
.right-column {
  flex: 1;
}

/* Responsive behavior */
@media screen and (max-width: 768px) {
  .two-column-layout {
    flex-direction: column;
    gap: 16px;
  }
}

@media print {
  .two-column-layout {
    display: flex;
    flex-direction: row;
  }
}
```

#### Custom Product Display

**Objective**: Enhanced product information display

**Implementation**:
```html
<!-- Enhanced product table -->
<table class="items-table enhanced-items">
  <thead>
    <tr>
      <th class="product-col">{{productLabel}}</th>
      <th class="details-col">{{detailsLabel}}</th>
      <th class="quantity-col">{{quantityLabel}}</th>
      <th class="price-col">{{priceLabel}}</th>
    </tr>
  </thead>
  <tbody>
    {{#each items}}
      <tr>
        <td class="product-col">
          <div class="product-info enhanced">
            {{#if imageUrl}}
              <div class="product-image-container">
                <img src="{{imageUrl}}" alt="{{name}}" class="product-image">
              </div>
            {{/if}}
            <div class="product-details">
              <strong class="product-name">{{name}}</strong>
              {{#if category}}
                <span class="product-category">{{category}}</span>
              {{/if}}
            </div>
          </div>
        </td>
        <td class="details-col">
          {{#if description}}
            <p class="product-description">{{description}}</p>
          {{/if}}
          {{#if sku}}
            <p class="product-sku">SKU: {{sku}}</p>
          {{/if}}
        </td>
        <td class="quantity-col text-center">
          <span class="quantity-badge">{{quantity}}</span>
        </td>
        <td class="price-col text-right">
          <div class="price-info">
            <p class="unit-price">{{formattedUnitPrice}} each</p>
            <p class="total-price"><strong>{{formattedTotalPrice}}</strong></p>
          </div>
        </td>
      </tr>
    {{/each}}
  </tbody>
</table>
```

**CSS Support**:
```css
.enhanced-items {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

.enhanced-items th {
  background: linear-gradient(135deg, #your-primary-color, #your-secondary-color);
  color: white;
  padding: 12px 8px;
  font-weight: bold;
}

.product-image-container {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
}

.product-category {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.quantity-badge {
  display: inline-block;
  background-color: #your-primary-color;
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: bold;
}

.price-info .unit-price {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
}

.price-info .total-price {
  font-size: 14px;
  color: #your-primary-color;
}
```

### 3. Content Customization

#### Additional Information Sections

**Objective**: Add custom business information sections

**Implementation**:
```html
<!-- Add after shipping information -->
<div class="custom-sections">
  <!-- Warranty Information -->
  {{#if warrantyInfo}}
    <div class="warranty-section">
      <h3>{{warrantyTitle}}</h3>
      <p class="small-text">{{warrantyInfo}}</p>
    </div>
  {{/if}}

  <!-- Care Instructions -->
  {{#if careInstructions}}
    <div class="care-instructions">
      <h3>{{careInstructionsTitle}}</h3>
      <ul class="care-list">
        {{#each careInstructions}}
          <li class="small-text">{{this}}</li>
        {{/each}}
      </ul>
    </div>
  {{/if}}

  <!-- Social Media -->
  <div class="social-media-section">
    <h3>{{followUsTitle}}</h3>
    <div class="social-links">
      {{#if socialMedia.facebook}}
        <p class="small-text">Facebook: {{socialMedia.facebook}}</p>
      {{/if}}
      {{#if socialMedia.instagram}}
        <p class="small-text">Instagram: {{socialMedia.instagram}}</p>
      {{/if}}
      {{#if socialMedia.website}}
        <p class="small-text">Website: {{socialMedia.website}}</p>
      {{/if}}
    </div>
  </div>
</div>
```

**Data Structure Extension**:
```typescript
// Extend OrderPDFData interface
interface ExtendedOrderPDFData extends OrderPDFData {
  warrantyInfo?: string;
  careInstructions?: string[];
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    website?: string;
  };
}
```

#### Custom Payment Instructions

**Objective**: Add detailed payment instructions for different methods

**Implementation**:
```html
<!-- Enhanced payment information -->
<div class="payment-info enhanced-payment">
  <h3>{{paymentInformationTitle}}</h3>
  <p><strong>{{paymentMethodLabel}}:</strong> {{paymentMethod.displayName}}</p>
  <p><strong>{{paymentStatusLabel}}:</strong> {{formattedPaymentStatus}}</p>

  {{#if paymentMethod.type === 'bank_transfer'}}
    <div class="bank-transfer-details">
      <h4>{{bankTransferInstructionsTitle}}</h4>
      <div class="bank-info">
        <p><strong>{{bankNameLabel}}:</strong> {{paymentMethod.bankName}}</p>
        <p><strong>{{accountNameLabel}}:</strong> {{paymentMethod.accountName}}</p>
        <p><strong>{{accountNumberLabel}}:</strong> {{paymentMethod.accountNumber}}</p>
        <p><strong>{{transferAmountLabel}}:</strong> {{formattedTotal}}</p>
        <p><strong>{{referenceLabel}}:</strong> {{orderNumber}}</p>
      </div>
      <div class="transfer-note">
        <p class="small-text">{{transferNoteText}}</p>
      </div>
    </div>
  {{/if}}

  {{#if paymentMethod.qrCodeUrl}}
    <div class="qr-code-section enhanced-qr">
      <h4>{{paymentQRCodeLabel}}</h4>
      <div class="qr-container">
        <img src="{{paymentMethod.qrCodeUrl}}" alt="Payment QR Code" class="qr-code">
        <p class="qr-instructions small-text">{{qrInstructionsText}}</p>
      </div>
    </div>
  {{/if}}
</div>
```

### 4. Localization Customization

#### Custom Translation Keys

**Objective**: Add custom localized content

**Steps**:

1. **Add Translation Keys**:
```typescript
// In template variable processor
const customLocalizationKeys = {
  warrantyTitle: 'warranty',
  careInstructionsTitle: 'careInstructions',
  followUsTitle: 'followUs',
  bankTransferInstructionsTitle: 'bankTransferInstructions',
  bankNameLabel: 'bankName',
  accountNameLabel: 'accountName',
  accountNumberLabel: 'accountNumber',
  transferAmountLabel: 'transferAmount',
  referenceLabel: 'reference',
  transferNoteText: 'transferNote',
  qrInstructionsText: 'qrInstructions'
};
```

2. **Add Translations**:
```json
// In localization service
{
  "en": {
    "warranty": "Warranty Information",
    "careInstructions": "Care Instructions",
    "followUs": "Follow Us",
    "bankTransferInstructions": "Bank Transfer Instructions",
    "bankName": "Bank Name",
    "accountName": "Account Name",
    "accountNumber": "Account Number",
    "transferAmount": "Transfer Amount",
    "reference": "Reference",
    "transferNote": "Please include the order number as reference when making the transfer.",
    "qrInstructions": "Scan this QR code with your banking app to make payment."
  },
  "vi": {
    "warranty": "Thông Tin Bảo Hành",
    "careInstructions": "Hướng Dẫn Bảo Quản",
    "followUs": "Theo Dõi Chúng Tôi",
    "bankTransferInstructions": "Hướng Dẫn Chuyển Khoản",
    "bankName": "Tên Ngân Hàng",
    "accountName": "Tên Tài Khoản",
    "accountNumber": "Số Tài Khoản",
    "transferAmount": "Số Tiền Chuyển",
    "reference": "Nội Dung Chuyển Khoản",
    "transferNote": "Vui lòng ghi số đơn hàng làm nội dung chuyển khoản.",
    "qrInstructions": "Quét mã QR này bằng ứng dụng ngân hàng để thanh toán."
  }
}
```

#### Regional Formatting

**Objective**: Customize formatting for different regions

**Implementation**:
```typescript
// Custom formatting functions
export class CustomLocalizationService extends PDFLocalizationService {
  formatCurrency(amount: number, locale: 'en' | 'vi', region?: string): string {
    if (region === 'US') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    } else if (region === 'VN') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    }

    return super.formatCurrency(amount, locale);
  }

  formatAddress(address: AddressData, locale: 'en' | 'vi', region?: string): string {
    if (region === 'VN') {
      // Vietnamese address format
      return [
        address.fullName,
        address.addressLine1,
        address.addressLine2,
        `${address.city}, ${address.state}`,
        address.postalCode,
        address.country
      ].filter(Boolean).join('\n');
    }

    return super.formatAddress(address, locale);
  }
}
```

## Advanced Customization

### 1. Conditional Content Based on Order Type

**Objective**: Show different content based on order characteristics

**Implementation**:
```html
<!-- Conditional sections based on order type -->
{{#if isQuoteOrder}}
  <div class="quote-notice">
    <h3>{{quoteNoticeTitle}}</h3>
    <p class="notice-text">{{quoteNoticeText}}</p>
  </div>
{{/if}}

{{#if isRushOrder}}
  <div class="rush-order-notice">
    <h3>{{rushOrderTitle}}</h3>
    <p class="notice-text">{{rushOrderText}}</p>
  </div>
{{/if}}

{{#if hasCustomItems}}
  <div class="custom-items-notice">
    <h3>{{customItemsTitle}}</h3>
    <p class="notice-text">{{customItemsText}}</p>
  </div>
{{/if}}

<!-- Different styling for different order values -->
<div class="order-summary {{#if isHighValueOrder}}high-value{{/if}}">
  <!-- Order summary content -->
</div>
```

**CSS Support**:
```css
.quote-notice,
.rush-order-notice,
.custom-items-notice {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 24px;
}

.rush-order-notice {
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.high-value .total-row {
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.high-value .total-row td {
  font-size: 16px;
  font-weight: bold;
}
```

### 2. Dynamic Styling Based on Data

**Objective**: Apply different styles based on order data

**Implementation**:
```html
<!-- Dynamic CSS classes -->
<div class="pdf-container {{locale}} {{paymentMethod.type}} {{#if isHighValueOrder}}high-value{{/if}}">
  <!-- Template content -->
</div>

<!-- Conditional styling for payment methods -->
<div class="payment-info payment-{{paymentMethod.type}}">
  <!-- Payment content -->
</div>

<!-- Order status styling -->
<div class="order-status status-{{paymentMethod.status}}">
  <p><strong>{{paymentStatusLabel}}:</strong>
    <span class="status-badge">{{formattedPaymentStatus}}</span>
  </p>
</div>
```

**CSS Support**:
```css
/* Locale-specific styling */
.pdf-container.vi {
  font-family: 'Times New Roman', serif; /* Better Vietnamese font support */
}

.pdf-container.en {
  font-family: Arial, sans-serif;
}

/* Payment method specific styling */
.payment-bank_transfer .bank-info {
  background-color: #e3f2fd;
  padding: 12px;
  border-radius: 4px;
}

.payment-qr_code .qr-container {
  text-align: center;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

/* Status-based styling */
.status-completed .status-badge {
  background-color: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-pending .status-badge {
  background-color: #ffc107;
  color: #212529;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-failed .status-badge {
  background-color: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}
```

### 3. Custom Page Layouts

**Objective**: Create different page layouts for different document types

**Implementation**:
```html
<!-- Multi-page layout with page breaks -->
<div class="pdf-container multi-page">
  <!-- Page 1: Order Summary -->
  <div class="page page-1">
    <header class="pdf-header">
      <!-- Header content -->
    </header>

    <main class="pdf-content">
      <!-- Customer info and order summary -->
    </main>
  </div>

  <div class="page-break"></div>

  <!-- Page 2: Detailed Items -->
  <div class="page page-2">
    <header class="pdf-header-minimal">
      <h2>{{orderItemsTitle}} - {{orderNumber}}</h2>
    </header>

    <main class="pdf-content">
      <!-- Detailed items table -->
    </main>
  </div>

  <div class="page-break"></div>

  <!-- Page 3: Terms and Conditions -->
  <div class="page page-3">
    <header class="pdf-header-minimal">
      <h2>{{termsAndConditionsTitle}}</h2>
    </header>

    <main class="pdf-content">
      <!-- Terms content -->
    </main>

    <footer class="pdf-footer">
      <!-- Footer content -->
    </footer>
  </div>
</div>
```

**CSS Support**:
```css
.multi-page .page {
  min-height: 100vh;
  page-break-after: always;
}

.multi-page .page:last-child {
  page-break-after: auto;
}

.page-break {
  page-break-before: always;
  height: 0;
  visibility: hidden;
}

.pdf-header-minimal {
  border-bottom: 1px solid #ccc;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

@media print {
  .page {
    page-break-after: always;
  }

  .page:last-child {
    page-break-after: auto;
  }
}
```

## Brand Consistency Guidelines

### 1. Color Palette

**Primary Colors**:
- Use consistent primary and secondary colors throughout
- Maintain sufficient contrast for accessibility
- Consider print color reproduction

**Implementation**:
```css
:root {
  /* Brand colors */
  --brand-primary: #your-primary-color;
  --brand-secondary: #your-secondary-color;
  --brand-accent: #your-accent-color;

  /* Neutral colors */
  --text-primary: #2c3e50;
  --text-secondary: #666;
  --text-muted: #999;

  /* Background colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-accent: #f0f0f0;

  /* Border colors */
  --border-primary: #bdc3c7;
  --border-secondary: #e0e0e0;
}

/* Apply brand colors consistently */
.pdf-header {
  border-bottom-color: var(--brand-primary);
}

.items-table th {
  background-color: var(--brand-primary);
}

.total-row {
  border-top-color: var(--brand-primary);
}

h1, h2, h3 {
  color: var(--brand-secondary);
}
```

### 2. Typography

**Font Hierarchy**:
```css
/* Typography scale */
.pdf-container {
  font-family: 'Your-Brand-Font', Arial, sans-serif;
  font-size: 12px;
  line-height: 1.4;
}

h1 {
  font-size: 28px;
  font-weight: bold;
  line-height: 1.2;
}

h2 {
  font-size: 20px;
  font-weight: bold;
  line-height: 1.3;
}

h3 {
  font-size: 16px;
  font-weight: bold;
  line-height: 1.3;
}

h4 {
  font-size: 14px;
  font-weight: bold;
  line-height: 1.3;
}

.small-text {
  font-size: 10px;
  line-height: 1.3;
}

.large-text {
  font-size: 14px;
  line-height: 1.4;
}
```

### 3. Spacing and Layout

**Consistent Spacing**:
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

/* Apply consistent spacing */
.pdf-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
}

.order-info-section {
  margin-bottom: var(--spacing-lg);
}

.items-section {
  margin-bottom: var(--spacing-lg);
}

.items-table th,
.items-table td {
  padding: var(--spacing-sm);
}

.summary-table td {
  padding: var(--spacing-xs) var(--spacing-sm);
}
```

## Performance Considerations

### 1. Image Optimization

**Best Practices**:
- Use appropriate image sizes (max 200px for product images)
- Implement lazy loading for large catalogs
- Provide fallbacks for missing images
- Use compressed formats (WebP with JPEG fallback)

**Implementation**:
```html
<!-- Optimized image loading -->
{{#if imageUrl}}
  <picture class="product-image-container">
    <source srcset="{{imageUrl}}.webp" type="image/webp">
    <img src="{{imageUrl}}" alt="{{name}}" class="product-image"
         loading="lazy"
         onerror="this.style.display='none';"
         onload="this.style.display='block';">
  </picture>
{{/if}}
```

**CSS Support**:
```css
.product-image {
  max-width: 100px;
  max-height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.product-image-container {
  display: inline-block;
  background-color: #f0f0f0;
  border: 1px dashed #ccc;
  border-radius: 4px;
}
```

### 2. CSS Optimization

**Efficient Selectors**:
```css
/* Good - specific and efficient */
.items-table th {
  background-color: #2c3e50;
}

.product-info .product-name {
  font-weight: bold;
}

/* Avoid - overly complex selectors */
.pdf-container .pdf-content .items-section .items-table tbody tr td .product-info .product-name {
  font-weight: bold;
}
```

**Minimize CSS Size**:
```css
/* Use CSS custom properties for repeated values */
:root {
  --table-border: 1px solid #bdc3c7;
  --section-margin: 24px;
}

.items-table,
.summary-table {
  border: var(--table-border);
}

.items-section,
.order-summary,
.payment-info {
  margin-bottom: var(--section-margin);
}
```

### 3. Template Caching

**Cache Strategy**:
- Templates are automatically cached after first load
- Cache is invalidated when files change in development
- Production cache persists until application restart

**Manual Cache Management**:
```typescript
// Clear specific template cache
templateLoader.invalidateCache('order-confirmation');

// Clear all template cache
templateLoader.invalidateCache();

// Check cache status
const stats = templateLoader.getCacheStats();
console.log(`Cached templates: ${stats.size}`);
```

## Testing Procedures

### 1. Template Validation

**Automated Validation**:
```bash
# Validate specific template
npm run template:validate order-confirmation

# Validate all templates
npm run template:validate:all

# Get validation report
npm run template:report order-confirmation
```

**Manual Validation Checklist**:
- [ ] HTML structure is valid
- [ ] All required placeholders are present
- [ ] Handlebars syntax is correct
- [ ] CSS classes are properly defined
- [ ] Images have proper fallbacks
- [ ] Accessibility features are included

### 2. Visual Testing

**Test with Sample Data**:
```bash
# Generate test PDF with sample data
npm run template:test order-confirmation --sample-data

# Generate test PDF with specific order
npm run template:test order-confirmation --order-id ORD-123
```

**Visual Checklist**:
- [ ] Layout renders correctly
- [ ] Images display properly
- [ ] Text is readable and properly formatted
- [ ] Colors match brand guidelines
- [ ] Print layout is optimized
- [ ] Mobile view is responsive

### 3. Cross-Language Testing

**Test Both Locales**:
```bash
# Test English version
npm run template:test order-confirmation --locale en

# Test Vietnamese version
npm run template:test order-confirmation --locale vi
```

**Localization Checklist**:
- [ ] All text is properly translated
- [ ] Date formats are locale-appropriate
- [ ] Currency formats are correct
- [ ] Address formats follow local conventions
- [ ] Text length doesn't break layout

### 4. Performance Testing

**Measure Generation Time**:
```bash
# Performance test with timing
npm run template:perf order-confirmation

# Load test with multiple generations
npm run template:load-test order-confirmation --count 100
```

**Performance Checklist**:
- [ ] Template loads within acceptable time
- [ ] PDF generation completes quickly
- [ ] Memory usage is reasonable
- [ ] Cache hit rate is high

## Deployment Guidelines

### 1. Pre-Deployment Checklist

**Validation**:
- [ ] All templates pass validation
- [ ] Visual tests pass for both locales
- [ ] Performance tests meet requirements
- [ ] Backup created before deployment

**Testing**:
- [ ] Test with real order data
- [ ] Verify email attachment works
- [ ] Check print output quality
- [ ] Validate accessibility compliance

### 2. Deployment Process

**Staging Deployment**:
```bash
# Deploy to staging
npm run deploy:templates:staging

# Run integration tests
npm run test:integration:templates

# Verify staging functionality
npm run verify:templates:staging
```

**Production Deployment**:
```bash
# Deploy to production
npm run deploy:templates:production

# Monitor deployment
npm run monitor:templates

# Verify production functionality
npm run verify:templates:production
```

### 3. Post-Deployment Monitoring

**Health Checks**:
```bash
# Check template health
npm run template:health-check

# Monitor performance
npm run template:monitor

# Check error rates
npm run template:errors
```

**Monitoring Checklist**:
- [ ] Template loading times are normal
- [ ] Error rates are within acceptable limits
- [ ] Cache hit rates are optimal
- [ ] PDF generation success rate is high

## Rollback Procedures

### 1. Emergency Rollback

**Quick Rollback**:
```bash
# Rollback to previous version
npm run template:rollback order-confirmation

# Rollback all templates
npm run template:rollback:all
```

### 2. Selective Rollback

**Restore from Backup**:
```bash
# List available backups
npm run template:backups order-confirmation

# Restore specific version
npm run template:restore order-confirmation 20240102120000
```

### 3. Validation After Rollback

**Post-Rollback Checks**:
- [ ] Templates load correctly
- [ ] PDF generation works
- [ ] Email attachments function
- [ ] No validation errors

## Troubleshooting

### Common Issues

#### Template Not Loading
**Symptoms**: Template fails to load or render
**Solutions**:
1. Check file permissions
2. Verify file paths
3. Validate template syntax
4. Check cache status

#### Styling Issues
**Symptoms**: CSS not applying correctly
**Solutions**:
1. Verify CSS file inclusion
2. Check CSS selector specificity
3. Validate CSS syntax
4. Clear template cache

#### Localization Problems
**Symptoms**: Text not translating correctly
**Solutions**:
1. Verify translation keys
2. Check locale parameter
3. Validate template variables
4. Test with both locales

#### Performance Issues
**Symptoms**: Slow template rendering
**Solutions**:
1. Optimize CSS selectors
2. Reduce image sizes
3. Check cache configuration
4. Profile template processing

### Debug Tools

**Template Debugging**:
```bash
# Debug template processing
npm run template:debug order-confirmation

# Trace variable processing
npm run template:trace order-confirmation --verbose

# Profile performance
npm run template:profile order-confirmation
```

**Log Analysis**:
```bash
# View template logs
npm run logs:templates

# Filter error logs
npm run logs:templates --level error

# Monitor real-time logs
npm run logs:templates --follow
```

## Best Practices Summary

### Development
1. **Always create backups** before making changes
2. **Enable monitoring** in development environment
3. **Validate templates** after every change
4. **Test both locales** thoroughly
5. **Use semantic HTML** structure
6. **Follow accessibility** guidelines

### Design
1. **Maintain brand consistency** across all templates
2. **Use responsive design** principles
3. **Optimize for print** output
4. **Consider mobile viewing** experience
5. **Implement proper error handling** for missing data
6. **Use efficient CSS** selectors

### Performance
1. **Optimize images** for web and print
2. **Minimize CSS** file size
3. **Use template caching** effectively
4. **Monitor performance** metrics
5. **Profile template processing** regularly

### Maintenance
1. **Regular health checks** of templates
2. **Monitor error rates** and performance
3. **Keep backups** organized and accessible
4. **Document customizations** thoroughly
5. **Update templates** when business requirements change

This comprehensive customization guide provides the foundation for safely and effectively customizing PDF templates while maintaining system integrity and performance standards.