# PDF Template Documentation

## Overview

This document provides comprehensive documentation for the PDF template system used in the order attachment functionality. The system uses file-based HTML templates with Handlebars syntax to generate professional PDF documents for order confirmations and invoices.

## Template File Structure

### Directory Layout

Templates are organized in the following structure:

```
backend/src/pdf-generator/templates/
├── order-confirmation.html    # Order confirmation template
├── invoice.html              # Invoice template
└── pdf-styles.css           # Shared CSS stylesheet
```

### Template Types

The system supports two main template types:

1. **Order Confirmation Template** (`order-confirmation.html`)
   - Used for initial order confirmation PDFs
   - Focuses on order acknowledgment and basic information
   - Sent immediately after order placement

2. **Invoice Template** (`invoice.html`)
   - Used for formal invoice PDFs with finalized pricing
   - Includes additional business information and terms
   - Sent after pricing is confirmed for quote orders

### CSS Stylesheet

The `pdf-styles.css` file contains:
- Base typography and layout styles
- Print optimization rules
- Mobile and desktop responsive styles
- Accessibility enhancements
- Dark mode support (for viewing)
- High DPI display support

## Template Syntax

### Handlebars Template Engine

Templates use Handlebars syntax for dynamic content rendering:

#### Basic Variables
```html
{{variableName}}
```

Examples:
```html
<h1>{{orderConfirmationTitle}}</h1>
<p>Order Number: <strong>{{orderNumber}}</strong></p>
<p>Date: <strong>{{formattedOrderDate}}</strong></p>
```

#### Nested Object Properties
```html
{{object.property}}
```

Examples:
```html
<p>Customer: {{customerInfo.name}}</p>
<p>Email: {{customerInfo.email}}</p>
<p>Company: {{businessInfo.companyName}}</p>
```

#### Conditional Rendering
```html
{{#if condition}}
  Content to show when condition is true
{{/if}}
```

Examples:
```html
{{#if customerInfo.phone}}
  <p><strong>{{phoneLabel}}:</strong> {{formattedPhone}}</p>
{{/if}}

{{#if businessInfo.logoUrl}}
  <img src="{{businessInfo.logoUrl}}" alt="{{companyName}}" class="company-logo">
{{else}}
  <h1 class="company-name">{{companyName}}</h1>
{{/if}}
```

#### Loop Rendering
```html
{{#each arrayName}}
  Content repeated for each item
  {{this.property}} or {{property}}
{{/each}}
```

Examples:
```html
{{#each items}}
  <tr>
    <td>{{name}}</td>
    <td>{{quantity}}</td>
    <td>{{formattedUnitPrice}}</td>
    <td>{{formattedTotalPrice}}</td>
  </tr>
{{/each}}

{{#each formattedShippingAddressLines}}
  <p>{{this}}</p>
{{/each}}
```

#### Partial Includes
```html
{{> partialName}}
```

Examples:
```html
<style>
  {{> pdf-styles}}
</style>
```

#### Special Loop Variables
- `{{@index}}` - Current loop index (0-based)
- `{{this}}` - Current item in primitive arrays
- `{{this.property}}` - Property of current object in array

## Available Data Variables

### Order Information
```typescript
orderNumber: string          // Order number (e.g., "ORD-001")
formattedOrderDate: string   // Localized order date
documentTitle: string        // Document title for PDF metadata
```

### Customer Information
```typescript
customerInfo: {
  name: string              // Customer full name
  email: string             // Customer email address
  phone?: string            // Customer phone (optional)
}
formattedPhone: string      // Formatted phone number
```

### Address Information
```typescript
// Shipping Address
formattedShippingAddressLines: string[]  // Array of address lines
shippingAddress: {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

// Billing Address
formattedBillingAddressLines: string[]   // Array of address lines
billingAddress: {
  // Same structure as shippingAddress
}
```

### Order Items
```typescript
items: Array<{
  id: string
  name: string              // Product name
  description?: string      // Product description
  sku?: string             // Product SKU
  quantity: number         // Quantity ordered
  unitPrice: number        // Unit price (raw number)
  totalPrice: number       // Total price (raw number)
  formattedUnitPrice: string   // Formatted unit price
  formattedTotalPrice: string  // Formatted total price
  imageUrl?: string        // Product image URL
  category?: string        // Product category
}>
```

### Pricing Information
```typescript
pricing: {
  subtotal: number         // Raw subtotal
  shippingCost: number     // Raw shipping cost
  taxAmount?: number       // Raw tax amount (optional)
  discountAmount?: number  // Raw discount amount (optional)
  total: number           // Raw total
}

// Formatted versions
formattedSubtotal: string
formattedShippingCost: string
formattedTaxAmount: string      // Only if taxAmount exists
formattedDiscountAmount: string // Only if discountAmount exists
formattedTotal: string
```

### Payment Information
```typescript
paymentMethod: {
  type: 'bank_transfer' | 'cash_on_delivery' | 'qr_code'
  displayName: string      // Localized payment method name
  details?: string         // Payment details
  qrCodeUrl?: string      // QR code image URL
  instructions?: string    // Payment instructions
  status: 'pending' | 'completed' | 'failed'
}
formattedPaymentStatus: string  // Localized payment status
```

### Shipping Information
```typescript
shippingMethod: {
  name: string             // Shipping method name
  description?: string     // Shipping description
  estimatedDelivery?: string   // Estimated delivery date
  trackingNumber?: string  // Tracking number
  carrier?: string         // Shipping carrier
}
formattedEstimatedDelivery: string  // Formatted delivery date
```

### Business Information
```typescript
businessInfo: {
  companyName: string      // Company name
  logoUrl?: string         // Company logo URL
  contactEmail: string     // Contact email
  contactPhone?: string    // Contact phone
  website?: string         // Company website
  address: AddressData     // Company address
  returnPolicy?: string    // Return policy text
  termsAndConditions?: string  // Terms and conditions
}
companyName: string         // Fallback company name
```

### Localization Variables
```typescript
isVietnamese: boolean       // True if locale is 'vi'
locale: 'en' | 'vi'        // Current locale

// Localized labels (automatically translated)
orderConfirmationTitle: string
invoiceTitle: string
orderNumberLabel: string
invoiceNumberLabel: string
orderDateLabel: string
issueDateLabel: string
dueDateLabel: string
customerInformationTitle: string
nameLabel: string
emailLabel: string
phoneLabel: string
shippingAddressTitle: string
billingAddressTitle: string
orderItemsTitle: string
invoiceItemsTitle: string
productLabel: string
skuLabel: string
quantityLabel: string
unitPriceLabel: string
totalLabel: string
orderSummaryTitle: string
invoiceSummaryTitle: string
subtotalLabel: string
shippingLabel: string
taxLabel: string
discountLabel: string
totalAmountDueLabel: string
paymentInformationTitle: string
paymentMethodLabel: string
paymentStatusLabel: string
paymentDetailsLabel: string
paymentInstructionsLabel: string
paymentQRCodeLabel: string
shippingInformationTitle: string
shippingMethodLabel: string
descriptionLabel: string
estimatedDeliveryLabel: string
trackingNumberLabel: string
carrierLabel: string
termsAndConditionsTitle: string
returnPolicyTitle: string
contactUsLabel: string
websiteLabel: string
thankYouMessage: string
```

## Required Template Structure

### HTML Document Structure
All templates must include:

```html
<!DOCTYPE html>
<html lang="{{#if isVietnamese}}vi{{else}}en{{/if}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{documentTitle}}</title>
  <style>
    {{> pdf-styles}}
  </style>
</head>
<body>
  <div class="pdf-container">
    <!-- Template content -->
  </div>
</body>
</html>
```

### Required CSS Classes
Templates must use these CSS classes for proper styling:

- `.pdf-container` - Main container
- `.pdf-header` - Header section
- `.pdf-content` - Main content area
- `.pdf-footer` - Footer section
- `.items-table` - Order items table
- `.summary-table` - Order summary table
- `.product-image` - Product images
- `.qr-code` - QR code images
- `.company-logo` - Company logo

### Essential Template Sections

#### 1. Header Section
```html
<header class="pdf-header">
  <div class="header-container">
    <div class="logo-section">
      {{#if businessInfo.logoUrl}}
        <img src="{{businessInfo.logoUrl}}" alt="{{companyName}}" class="company-logo">
      {{else}}
        <h1 class="company-name">{{companyName}}</h1>
      {{/if}}
    </div>
    <div class="document-title">
      <h1>{{orderConfirmationTitle}}</h1>
      <p class="order-number">{{orderNumberLabel}}: <strong>{{orderNumber}}</strong></p>
      <p class="order-date">{{orderDateLabel}}: <strong>{{formattedOrderDate}}</strong></p>
    </div>
  </div>
</header>
```

#### 2. Customer Information Section
```html
<div class="customer-info">
  <h3>{{customerInformationTitle}}</h3>
  <p><strong>{{nameLabel}}:</strong> {{customerInfo.name}}</p>
  <p><strong>{{emailLabel}}:</strong> {{customerInfo.email}}</p>
  {{#if customerInfo.phone}}
    <p><strong>{{phoneLabel}}:</strong> {{formattedPhone}}</p>
  {{/if}}
</div>
```

#### 3. Order Items Table
```html
<div class="items-section">
  <h3>{{orderItemsTitle}}</h3>
  <table class="items-table">
    <thead>
      <tr>
        <th>{{productLabel}}</th>
        <th>{{skuLabel}}</th>
        <th>{{quantityLabel}}</th>
        <th>{{unitPriceLabel}}</th>
        <th>{{totalLabel}}</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
        <tr>
          <td>
            <div class="product-info">
              {{#if imageUrl}}
                <img src="{{imageUrl}}" alt="{{name}}" class="product-image">
              {{/if}}
              <div class="product-details">
                <strong>{{name}}</strong>
                {{#if description}}
                  <br><small>{{description}}</small>
                {{/if}}
              </div>
            </div>
          </td>
          <td>{{#if sku}}{{sku}}{{else}}-{{/if}}</td>
          <td class="text-center">{{quantity}}</td>
          <td class="text-right">{{formattedUnitPrice}}</td>
          <td class="text-right"><strong>{{formattedTotalPrice}}</strong></td>
        </tr>
      {{/each}}
    </tbody>
  </table>
</div>
```

#### 4. Order Summary Section
```html
<div class="order-summary">
  <h3>{{orderSummaryTitle}}</h3>
  <table class="summary-table">
    <tr>
      <td>{{subtotalLabel}}:</td>
      <td class="text-right">{{formattedSubtotal}}</td>
    </tr>
    <tr>
      <td>{{shippingLabel}}:</td>
      <td class="text-right">{{formattedShippingCost}}</td>
    </tr>
    {{#if pricing.taxAmount}}
      <tr>
        <td>{{taxLabel}}:</td>
        <td class="text-right">{{formattedTaxAmount}}</td>
      </tr>
    {{/if}}
    {{#if pricing.discountAmount}}
      <tr>
        <td>{{discountLabel}}:</td>
        <td class="text-right">-{{formattedDiscountAmount}}</td>
      </tr>
    {{/if}}
    <tr class="total-row">
      <td><strong>{{totalLabel}}:</strong></td>
      <td class="text-right"><strong>{{formattedTotal}}</strong></td>
    </tr>
  </table>
</div>
```

#### 5. Footer Section
```html
<footer class="pdf-footer">
  <div class="footer-content">
    <div class="footer-note">
      <p class="small-text">{{thankYouMessage}}</p>
    </div>
  </div>
</footer>
```

## Data Types Reference

### TypeScript Interfaces

The template system uses these TypeScript interfaces:

```typescript
interface OrderPDFData {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customerInfo: CustomerInfo;
  billingAddress: AddressData;
  shippingAddress: AddressData;
  items: OrderItemData[];
  pricing: PricingData;
  paymentMethod: PaymentMethodData;
  shippingMethod: ShippingMethodData;
  businessInfo: BusinessInfoData;
  locale: 'en' | 'vi';
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface AddressData {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface OrderItemData {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  category?: string;
}

interface PricingData {
  subtotal: number;
  shippingCost: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
}

interface PaymentMethodData {
  type: 'bank_transfer' | 'cash_on_delivery' | 'qr_code';
  displayName: string;
  details?: string;
  qrCodeUrl?: string;
  instructions?: string;
  status: 'pending' | 'completed' | 'failed';
}

interface ShippingMethodData {
  name: string;
  description?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  carrier?: string;
}

interface BusinessInfoData {
  companyName: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  address: AddressData;
  returnPolicy?: string;
  termsAndConditions?: string;
}
```

## Template Validation

### Required Elements
All templates must include:

1. **HTML Structure**
   - `<!DOCTYPE html>` declaration
   - `<html>`, `<head>`, `<body>` elements
   - Proper meta tags for charset and viewport

2. **CSS Classes**
   - `.pdf-container` - Main wrapper
   - `.pdf-header` - Header section
   - `.pdf-content` - Content area
   - `.pdf-footer` - Footer section

3. **Essential Placeholders**
   - `{{orderNumber}}` - Order identification
   - `{{customerInfo.name}}` - Customer name
   - `{{customerInfo.email}}` - Customer email
   - `{{items}}` - Order items (in loop context)
   - `{{formattedTotal}}` - Total amount

4. **Handlebars Syntax**
   - Properly closed conditionals (`{{#if}}...{{/if}}`)
   - Properly closed loops (`{{#each}}...{{/each}}`)
   - Valid variable references
   - Proper partial includes

### Validation Process
Templates are automatically validated for:
- HTML structure and syntax
- Required CSS classes and sections
- Essential placeholder presence
- Handlebars syntax correctness
- Accessibility compliance
- Print optimization

## Error Handling

### Image Loading Errors
Templates include error handling for missing images:

```html
<img src="{{imageUrl}}" alt="{{name}}" class="product-image"
     onerror="this.style.display='none';"
     onload="this.style.display='block';">
```

### Missing Data Handling
Use conditional rendering for optional data:

```html
{{#if optionalField}}
  <p>{{optionalField}}</p>
{{/if}}

{{#if sku}}{{sku}}{{else}}-{{/if}}
```

### Fallback Content
Provide fallbacks for critical content:

```html
{{#if businessInfo.logoUrl}}
  <img src="{{businessInfo.logoUrl}}" alt="{{companyName}}" class="company-logo">
{{else}}
  <h1 class="company-name">{{companyName}}</h1>
{{/if}}
```

## Best Practices

### Template Development
1. **Use Semantic HTML**: Follow HTML5 semantic structure
2. **Include Alt Text**: Provide alt text for all images
3. **Handle Missing Data**: Use conditionals for optional fields
4. **Test Both Languages**: Validate templates in English and Vietnamese
5. **Optimize for Print**: Consider print layout and page breaks
6. **Mobile Responsive**: Ensure readability on mobile devices

### Performance Optimization
1. **Minimize CSS**: Use efficient CSS selectors
2. **Optimize Images**: Include proper image sizing
3. **Cache Templates**: Templates are automatically cached
4. **Validate Early**: Run validation during development

### Accessibility
1. **Color Contrast**: Ensure sufficient color contrast
2. **Font Sizes**: Use readable font sizes
3. **Structure**: Use proper heading hierarchy
4. **Screen Readers**: Include screen reader support

### Maintenance
1. **Version Control**: Use backup system for template changes
2. **Documentation**: Document custom modifications
3. **Testing**: Test templates with various data scenarios
4. **Monitoring**: Monitor template performance and errors

## Troubleshooting

### Common Issues

#### Template Not Rendering
- Check file permissions and paths
- Verify template syntax with validation service
- Ensure all required placeholders are present

#### Missing Images
- Verify image URLs are accessible
- Check image error handling implementation
- Ensure proper fallback content

#### Formatting Issues
- Validate CSS class usage
- Check responsive design rules
- Verify print optimization styles

#### Localization Problems
- Ensure locale-specific variables are used
- Check translation key mappings
- Verify date and currency formatting

### Debug Tools
1. **Template Validation Service**: Comprehensive validation
2. **Template Monitoring**: File change tracking
3. **Backup System**: Version history and recovery
4. **Health Checks**: System status monitoring

### Recovery Procedures
1. **Template Corruption**: Use emergency recovery
2. **Invalid Syntax**: Restore from backup
3. **Missing Files**: Recreate from working templates
4. **Performance Issues**: Check validation reports

## Examples

### Basic Order Confirmation Template
See `backend/src/pdf-generator/templates/order-confirmation.html` for a complete example.

### Invoice Template with Terms
See `backend/src/pdf-generator/templates/invoice.html` for an invoice example with terms and conditions.

### Custom CSS Styling
See `backend/src/pdf-generator/templates/pdf-styles.css` for comprehensive styling examples.

## API Integration

### Loading Templates
```typescript
const template = await templateLoader.loadTemplate('order-confirmation');
const stylesheet = await templateLoader.loadStylesheet();
```

### Processing Variables
```typescript
const processedTemplate = templateProcessor.processVariables(
  template,
  orderData,
  'en'
);
```

### Validation
```typescript
const report = await templateValidation.validateTemplate('order-confirmation');
if (!report.isValid) {
  console.error('Template validation failed:', report.errors);
}
```

This documentation provides comprehensive coverage of the template system structure, syntax, and usage patterns for PDF generation in the order attachment system.