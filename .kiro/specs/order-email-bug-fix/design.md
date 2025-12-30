# Design Document

## Overview

This design addresses two critical bugs in the order confirmation email system:

1. **Complex CSS Display Bug**: Email templates display complex CSS code as visible text in the email body, creating a poor user experience
2. **Duplicate Email Bug**: Customers receive 4 duplicate order confirmation emails due to multiple event publications and insufficient deduplication

The solution involves completely simplifying the email template to contain only essential information (order ID, creation date, order link, and customer information) without any complex CSS or styling that could cause display issues.

## Architecture

The email system follows this flow:
1. **Order Creation** → Order Service creates order and publishes email event
2. **Event Publishing** → Email Event Publisher queues order confirmation event
3. **Event Processing** → Email Worker processes event and generates email
4. **Email Generation** → Email Attachment Service generates HTML template and PDF
5. **Email Delivery** → Email Service sends email with proper formatting

## Components and Interfaces

### Enhanced HTML Escaping Service

```typescript
interface HTMLEscapingService {
  escapeHtmlContent(content: string): string;
  escapeHtmlAttributes(attributes: string): string;
  validateHtmlStructure(html: string): ValidationResult;
  sanitizeCSS(css: string): string;
  containCSSInHead(html: string, css: string): string;
  simplifyEmailCSS(css: string): string;
  removeCSSComments(css: string): string; // New method to handle CSS comments
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cssContained: boolean;
  hasVisibleCSS: boolean;
}
```

### Enhanced Email Event Publisher

```typescript
interface EmailEventPublisher {
  // Enhanced with stronger deduplication
  sendOrderConfirmation(
    orderId: string,
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    locale: 'en' | 'vi'
  ): Promise<string>;

  // New method for deduplication checking
  checkEventDuplication(event: EmailEvent): Promise<boolean>;
}
```

### Enhanced Email Template Service

```typescript
interface EmailTemplateService {
  generateOrderConfirmationTemplate(
    orderData: OrderPDFData,
    locale: 'en' | 'vi'
  ): Promise<EmailTemplate>;

  // Simplified with minimal styling and essential information only
  generateSimpleHTMLContent(
    orderData: OrderPDFData,
    locale: 'en' | 'vi',
    translations: any
  ): string;

  // New methods for simple template generation
  validateSimpleTemplate(template: EmailTemplate): ValidationResult;
  generateOrderLink(orderId: string, orderNumber: string): string;
}

interface EmailTemplate {
  html: string;
  subject: string;
  attachments?: any[];
  // New fields for simple template validation
  isSimple: boolean;
  containsEssentialInfo: boolean;
}
```

### Status Translation Service

```typescript
interface StatusTranslationService {
  // Separate methods for different status types to prevent cross-contamination
  translateOrderStatus(
    status: string,
    locale: 'en' | 'vi',
    translationFunction: (key: string) => string
  ): string;

  translatePaymentStatus(
    status: string,
    locale: 'en' | 'vi',
    translationFunction: (key: string) => string
  ): string;

  // Validation methods to ensure proper namespace usage
  validateOrderStatusTranslation(status: string, translatedText: string): boolean;
  validatePaymentStatusTranslation(status: string, translatedText: string): boolean;
}

interface StatusTranslationResult {
  translatedText: string;
  isValid: boolean;
  usedFallback: boolean;
  namespace: 'orders' | 'email' | 'unknown';
}
```

## Data Models

### Email Event with Deduplication

```typescript
interface EmailEvent {
  type: EmailEventType;
  locale: 'en' | 'vi';
  timestamp: Date;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  // Enhanced deduplication fields
  deduplicationKey: string;
  eventHash: string;
}

interface EmailDeduplicationRecord {
  eventHash: string;
  orderId: string;
  eventType: EmailEventType;
  timestamp: Date;
  processed: boolean;
  jobId: string;
}
```

### Simple Email Template Data

```typescript
interface SimpleEmailData {
  orderId: string;
  orderNumber: string;
  createdDate: string;
  orderLink: string;
  customerName: string;
  customerEmail: string;
}

interface SimpleEmailTemplate {
  subject: string;
  html: string;
  text: string;
  essentialInfo: SimpleEmailData;
}
```

### Status Translation Data

```typescript
interface OrderStatusTranslation {
  status: string;
  namespace: 'orders';
  translationKey: string;
  fallbackText: string;
}

interface PaymentStatusTranslation {
  status: string;
  namespace: 'email';
  translationKey: string;
  fallbackText: string;
}

interface StatusTranslationConfig {
  orderStatusMappings: Record<string, string>;
  paymentStatusMappings: Record<string, string>;
  preventCrossNamespaceFallback: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

<function_calls>
<invoke name="prework">
<parameter name="featureName">order-email-bug-fix


### Property 1: HTML Special Character Escaping
*For any* HTML content containing special characters (&, <, >, ", '), the Email_Template_Service should convert them to their corresponding HTML entities (&amp;, &lt;, &gt;, &quot;, &#39;)

**Validates: Requirements 1.4**

### Property 2: Simple Template Essential Information
*For any* generated order confirmation email, the template should contain exactly these essential elements: order ID, creation date, order link, and customer information

**Validates: Requirements 1.2**

### Property 3: No Complex CSS in Simple Template
*For any* generated simple email template, the HTML should contain only basic inline styles and no CSS blocks, media queries, or complex styling

**Validates: Requirements 1.3**

### Property 4: Order Link Generation
*For any* order confirmation email, the order link should be a valid URL that directs to the specific order details page

**Validates: Requirements 1.5.1, 1.5.2**

### Property 5: Email Client Compatibility
*For any* simple email template, the HTML should be compatible with all major email clients without requiring complex CSS support

**Validates: Requirements 1.5.4, 1.5.5**

### Property 6: Customer Information Display
*For any* order confirmation email, the customer's name and email address should be clearly displayed and properly escaped

**Validates: Requirements 1.5.3**

### Property 7: Single Event Publication
*For any* order creation, the Order_Service should publish exactly one order confirmation event to the email queue

**Validates: Requirements 2.1**

### Property 8: Event Deduplication
*For any* set of identical order confirmation events published within a 1-minute window, the Email_Event_Publisher should process only one event

**Validates: Requirements 2.2, 2.4**

### Property 9: Single Email Delivery
*For any* processed order confirmation event, the Email_Worker should send exactly one email to the customer

**Validates: Requirements 2.3**

### Property 10: End-to-End Single Email
*For any* completed order creation, the customer should receive exactly one order confirmation email

**Validates: Requirements 2.5**

### Property 11: Event Publication Logging
*For any* email event publication, the system should log the event type, order ID, timestamp, and job ID

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 12: Email Delivery Logging
*For any* email sent, the system should log the delivery status, recipient email, and timestamp

**Validates: Requirements 3.4**

### Property 13: Duplicate Detection Logging
*For any* duplicate event detected, the system should log a warning with the event hash, order ID, and deduplication status

**Validates: Requirements 3.5**

### Property 14: Test Mode Comprehensive Logging
*For any* order placed in test mode, the system should log all email events, publications, and deliveries with full details

**Validates: Requirements 4.3**

### Property 15: Deduplication Evidence in Logs
*For any* review of email logs, there should be clear evidence showing which events were deduplicated and which were processed

**Validates: Requirements 4.4**

### Property 16: Simple Template Validation
*For any* generated email content, the HTML should be a simple template without complex CSS, containing only essential order information

**Validates: Requirements 4.5**

### Property 17: Payment Status Update Email Notification
*For any* payment status update performed by an administrator, the system should send exactly one payment status update email to the customer containing the new status and essential order information

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 18: Order Status Translation Namespace Isolation
*For any* order status value, the Status_Translation_Service should use only translation keys from the 'orders' namespace and never fall back to 'email' namespace keys

**Validates: Requirements 6.1**

### Property 19: Payment Status Translation Namespace Isolation
*For any* payment status value, the Status_Translation_Service should use only translation keys from the 'email' namespace and never fall back to 'orders' namespace keys

**Validates: Requirements 6.2**

### Property 20: Order Status Translation Fallback Prevention
*For any* invalid or unknown order status value, the system should return the raw status value rather than attempting to translate it using payment status translation keys

**Validates: Requirements 6.3**

### Property 21: Payment Status Translation Fallback Prevention
*For any* invalid or unknown payment status value, the system should return the raw status value rather than attempting to translate it using order status translation keys

**Validates: Requirements 6.4**

### Property 22: Dual Status Translation Independence
*For any* order containing both order status and payment status, each status should be translated using its appropriate namespace without cross-contamination

**Validates: Requirements 6.5**

### Property 23: Invalid Status Raw Value Display
*For any* completely invalid or unknown status value, the system should display the raw status value rather than an incorrect translation from any namespace

**Validates: Requirements 6.6**

### Property 24: Order Details Status Translation Correctness
*For any* order details page view, both order status and payment status should be correctly translated using their respective namespaces and clearly distinguished

**Validates: Requirements 6.7**

## Error Handling

### HTML Escaping Errors
- **Invalid HTML Structure**: Log error and return sanitized version with warnings
- **Unescapable Characters**: Convert to safe alternatives or remove
- **CSS Parsing Errors**: Fall back to inline styles without complex CSS

### Email Deduplication Errors
- **Redis Connection Failure**: Fall back to in-memory deduplication with shorter window
- **Hash Collision**: Use additional fields (timestamp, email) for uniqueness
- **Deduplication Key Generation Failure**: Log error and allow event to proceed (better to send duplicate than miss email)

### Email Delivery Errors
- **Template Generation Failure**: Use fallback plain text template
- **Validation Failure**: Log warnings but proceed with delivery
- **Duplicate Detection Failure**: Log error and proceed (fail-open approach)

### Status Translation Errors
- **Unknown Order Status**: Return raw status value, do not attempt payment status translation
- **Unknown Payment Status**: Return raw status value, do not attempt order status translation
- **Translation Key Missing**: Return raw status value with warning log
- **Cross-Namespace Fallback Attempt**: Block fallback and log error, return raw status value
- **Translation Function Failure**: Return raw status value and log error

## Testing Strategy

### Unit Tests
- Test HTML escaping for all special characters
- Test CSS sanitization and validation
- Test event deduplication logic
- Test logging functionality
- Test error handling paths
- Test order status translation with correct namespace usage
- Test payment status translation with correct namespace usage
- Test prevention of cross-namespace fallback
- Test handling of invalid status values

### Property-Based Tests
- Generate random HTML content with special characters and verify escaping
- Generate random order data and verify single email delivery
- Generate duplicate events and verify deduplication
- Generate various HTML structures and verify validation
- Generate random order status values and verify namespace isolation
- Generate random payment status values and verify namespace isolation
- Generate invalid status values and verify raw value display
- Generate order/payment status pairs and verify independent translation

### Integration Tests
- Test complete order creation flow with email delivery
- Test email template generation with real order data
- Test deduplication across multiple concurrent orders
- Test logging across all components
- Test order details page with correct status translations
- Test status translation service with various status combinations

### Manual Testing
- Create test orders and verify email formatting in multiple email clients
- Verify only one email is received per order
- Review logs to confirm deduplication is working
- Test with various special characters in customer names and addresses
- Test order details page with different order and payment status combinations
- Verify status translations use correct namespaces
- Test with invalid status values to ensure raw value display

## Implementation Notes

### Root Cause Analysis

**Complex CSS Display Bug**:
- The current email templates include complex CSS with media queries, print styles, and advanced styling
- This complex CSS is appearing as visible text in the email body instead of being properly rendered
- Email clients have varying levels of CSS support, causing inconsistent rendering and display issues
- The solution is to eliminate complex CSS entirely and use only basic inline styles

**Email Template Complexity Issues**:
- Current templates try to provide rich styling and responsive design features
- These features are not well-supported across email clients and cause more problems than benefits
- Customers primarily need essential order information, not elaborate styling
- A simple, clean template will be more reliable and universally compatible

**Duplicate Email Bug**:
- Investigation needed to determine if:
  - Order Service is calling `sendOrderConfirmationEmail` multiple times
  - Email Event Publisher is creating duplicate events
  - Email Worker is processing the same event multiple times
  - There are multiple instances of the worker running

**Status Translation Cross-Contamination Bug**:
- The current status translation utilities have fallback logic that can cause incorrect translations
- Order status translations fall back to payment status translations when the primary translation fails
- Payment status translations fall back to order status translations when the primary translation fails
- This creates confusion for users who see incorrect status information
- The solution is to eliminate cross-namespace fallback and use raw values for unknown statuses

### Fix Strategy

1. **Template Simplification**: Replace complex email templates with simple templates containing only essential information
2. **Minimal Styling**: Use only basic inline styles (font, color, spacing) and eliminate all CSS blocks, media queries, and complex styling
3. **Essential Information Focus**: Include only: order ID, creation date, direct order link, and customer information
4. **Universal Compatibility**: Ensure the simple template works across all email clients without requiring advanced CSS support
5. **Order Link Integration**: Add a direct link to the order details page for customers who need complete information
6. **HTML Escaping**: Maintain proper HTML entity encoding for all dynamic content
7. **Deduplication**: Strengthen the existing deduplication mechanism in Email Event Publisher
8. **Logging**: Add comprehensive logging to trace email flow and identify duplicate sources
9. **Status Translation Separation**: Remove cross-namespace fallback between order and payment status translations
10. **Namespace Isolation**: Ensure order status uses only 'orders' namespace and payment status uses only 'email' namespace
11. **Raw Value Fallback**: Display raw status values for unknown statuses instead of incorrect translations

### Dependencies
- Existing `EmailAttachmentService` for email generation
- Existing `EmailEventPublisher` for event queuing
- Existing `EmailWorker` for event processing
- Existing `EmailService` for email delivery
- May need to add HTML validation library (e.g., `htmlparser2` or `jsdom`)
