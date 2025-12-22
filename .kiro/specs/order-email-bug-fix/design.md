# Design Document

## Overview

This design addresses two critical bugs in the order confirmation email system:

1. **CSS Formatting Bug**: Email templates display raw CSS code and special characters at the end of the email content due to improper HTML escaping and malformed CSS
2. **Duplicate Email Bug**: Customers receive 4 duplicate order confirmation emails due to multiple event publications and insufficient deduplication

The solution involves enhancing HTML escaping mechanisms, fixing CSS generation, and strengthening email event deduplication.

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
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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

  // Enhanced with proper escaping
  generateMinimalHTMLContent(
    orderData: OrderPDFData,
    locale: 'en' | 'vi',
    translations: any
  ): string;

  // New validation method
  validateEmailTemplate(template: EmailTemplate): ValidationResult;
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

### HTML Validation Result

```typescript
interface HTMLValidationResult {
  isValid: boolean;
  hasUnclosedTags: boolean;
  hasUnescapedCharacters: boolean;
  cssIssues: string[];
  htmlIssues: string[];
  recommendations: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

<function_calls>
<invoke name="prework">
<parameter name="featureName">order-email-bug-fix


### Property 1: HTML Special Character Escaping
*For any* HTML content containing special characters (&, <, >, ", '), the Email_Template_Service should convert them to their corresponding HTML entities (&amp;, &lt;, &gt;, &quot;, &#39;)

**Validates: Requirements 1.1, 1.4**

### Property 2: CSS Structure Validation
*For any* generated email template, all CSS style blocks should be properly closed with matching opening and closing tags

**Validates: Requirements 1.2**

### Property 3: No Raw CSS in Output
*For any* generated email HTML, the final output should not contain unescaped CSS code or special characters visible in the rendered content

**Validates: Requirements 1.3**

### Property 4: HTML Tag Closure
*For any* generated email template, all HTML tags should have matching closing tags and proper nesting structure

**Validates: Requirements 1.5**

### Property 5: Single Event Publication
*For any* order creation, the Order_Service should publish exactly one order confirmation event to the email queue

**Validates: Requirements 2.1**

### Property 6: Event Deduplication
*For any* set of identical order confirmation events published within a 1-minute window, the Email_Event_Publisher should process only one event

**Validates: Requirements 2.2, 2.4**

### Property 7: Single Email Delivery
*For any* processed order confirmation event, the Email_Worker should send exactly one email to the customer

**Validates: Requirements 2.3**

### Property 8: End-to-End Single Email
*For any* completed order creation, the customer should receive exactly one order confirmation email

**Validates: Requirements 2.5**

### Property 9: Event Publication Logging
*For any* email event publication, the system should log the event type, order ID, timestamp, and job ID

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 10: Email Delivery Logging
*For any* email sent, the system should log the delivery status, recipient email, and timestamp

**Validates: Requirements 3.4**

### Property 11: Duplicate Detection Logging
*For any* duplicate event detected, the system should log a warning with the event hash, order ID, and deduplication status

**Validates: Requirements 3.5**

### Property 12: Test Mode Comprehensive Logging
*For any* order placed in test mode, the system should log all email events, publications, and deliveries with full details

**Validates: Requirements 4.3**

### Property 13: Deduplication Evidence in Logs
*For any* review of email logs, there should be clear evidence showing which events were deduplicated and which were processed

**Validates: Requirements 4.4**

### Property 14: HTML Formatting Verification
*For any* generated email content, the HTML should be properly formatted without CSS artifacts or unescaped characters

**Validates: Requirements 4.5**

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

## Testing Strategy

### Unit Tests
- Test HTML escaping for all special characters
- Test CSS sanitization and validation
- Test event deduplication logic
- Test logging functionality
- Test error handling paths

### Property-Based Tests
- Generate random HTML content with special characters and verify escaping
- Generate random order data and verify single email delivery
- Generate duplicate events and verify deduplication
- Generate various HTML structures and verify validation

### Integration Tests
- Test complete order creation flow with email delivery
- Test email template generation with real order data
- Test deduplication across multiple concurrent orders
- Test logging across all components

### Manual Testing
- Create test orders and verify email formatting in multiple email clients
- Verify only one email is received per order
- Review logs to confirm deduplication is working
- Test with various special characters in customer names and addresses

## Implementation Notes

### Root Cause Analysis

**CSS Formatting Bug**:
- The `generateMinimalHTMLContent` method in `EmailAttachmentService` generates HTML with inline styles
- Special characters in customer names, addresses, or product descriptions are not being escaped
- CSS strings may contain unescaped quotes or other characters that break the HTML structure

**Duplicate Email Bug**:
- Investigation needed to determine if:
  - Order Service is calling `sendOrderConfirmationEmail` multiple times
  - Email Event Publisher is creating duplicate events
  - Email Worker is processing the same event multiple times
  - There are multiple instances of the worker running

### Fix Strategy

1. **HTML Escaping**: Add proper HTML entity encoding for all dynamic content
2. **CSS Sanitization**: Validate and sanitize all CSS before including in templates
3. **Deduplication**: Strengthen the existing deduplication mechanism in Email Event Publisher
4. **Logging**: Add comprehensive logging to trace email flow and identify duplicate sources
5. **Validation**: Add HTML structure validation before sending emails

### Dependencies
- Existing `EmailAttachmentService` for email generation
- Existing `EmailEventPublisher` for event queuing
- Existing `EmailWorker` for event processing
- Existing `EmailService` for email delivery
- May need to add HTML validation library (e.g., `htmlparser2` or `jsdom`)
