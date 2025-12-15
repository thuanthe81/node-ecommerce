# Email Attachment System Documentation

## Overview

The Email Attachment System provides reliable email delivery with PDF attachments using the swaks (Swiss Army Knife SMTP) command-line tool. This system was designed to solve HTML syntax errors that occurred with complex email templates by using simplified HTML content and attaching comprehensive order information as PDF documents.

## Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   EmailService      │────│  EmailAttachment     │────│  PDFGenerator       │
│   (swaks wrapper)   │    │  Service             │    │  Service            │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  HTML Simplifier    │    │  Attachment          │    │  Document Storage   │
│                     │    │  Validator           │    │  Service            │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  swaks Command      │    │  MIME Type           │    │  Resend Email       │
│  Executor           │    │  Detection           │    │  Handler            │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## Core Components

### 1. EmailService

**Location**: `backend/src/notifications/services/email.service.ts`

The main service that wraps swaks functionality and provides email sending capabilities.

**Key Methods**:
- `sendEmail(options)` - Send simple HTML emails
- `sendEmailWithAttachment(options)` - Send emails with PDF attachments
- `simplifyHtmlForSwaks(html)` - Process HTML to avoid swaks syntax errors
- `htmlToPlainText(html)` - Convert HTML to plain text fallback

**Features**:
- Email address validation
- SMTP configuration from environment variables
- Attachment size validation (25MB limit)
- MIME type detection
- HTML content simplification
- Error handling and logging

### 2. EmailAttachmentService

**Location**: `backend/src/pdf-generator/services/email-attachment.service.ts`

Orchestrates the complete email attachment workflow including PDF generation, storage, and delivery.

**Key Methods**:
- `sendOrderConfirmationWithPDF(customerEmail, orderData, locale)` - Complete workflow
- `resendOrderConfirmation(orderNumber, customerEmail)` - Resend functionality
- `generateSimplifiedEmailTemplate(orderData, locale)` - Create email templates

**Features**:
- PDF generation integration
- Rate limiting for resend operations
- Delivery attempt tracking
- Retry logic with exponential backoff
- Audit logging and monitoring

## swaks Integration

### Installation and Setup

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install swaks
```

**CentOS/RHEL:**
```bash
sudo yum install swaks
# or
sudo dnf install swaks
```

**macOS:**
```bash
brew install swaks
```

**Verify Installation:**
```bash
swaks --version
```

### Environment Configuration

```bash
# SMTP Server Configuration
SMTP_SERVER=smtp.gmail.com          # SMTP server hostname
SMTP_PORT=587                       # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@domain.com     # SMTP username
SMTP_PASSWORD=your-app-password     # SMTP password or app password

# Email Settings
DEFAULT_FROM_EMAIL=noreply@domain.com  # Default sender email
EMAIL_TIMEOUT=30                       # Email timeout in seconds
EMAIL_MAX_RETRIES=3                    # Maximum retry attempts
```

### swaks Command Structure

The system builds swaks commands with the following structure:

```bash
swaks \
  --to "recipient@example.com" \
  --server "smtp.gmail.com" \
  --port "587" \
  --tls \
  --auth-user "sender@example.com" \
  --auth-password "password" \
  --h-Subject "Order Confirmation" \
  --attach "/path/to/order.pdf" \
  --attach-type "application/pdf" \
  --attach-name "order-12345.pdf" \
  --body "Simplified HTML content" \
  --add-header "MIME-Version: 1.0" \
  --add-header "Content-Type: text/html"
```

### Command Building Process

```typescript
// Example of how the system builds swaks commands
private buildSwaksCommand(options: EmailAttachmentOptions): string {
  const { to, subject, html, attachments } = options;

  // Base command
  let command = `swaks --to "${to}" --server "${this.smtpServer}" --port "${this.smtpPort}"`;

  // Add authentication
  if (this.smtpUser && this.smtpPassword) {
    command += ` --tls --auth-user "${this.smtpUser}" --auth-password "${this.smtpPassword}"`;
  }

  // Add subject with proper escaping
  command += ` --h-Subject "${subject.replace(/"/g, '\\"')}"`;

  // Add attachments
  if (attachments?.length > 0) {
    attachments.forEach(attachment => {
      command += ` --attach "${attachment.path}"`;
      command += ` --attach-type "${attachment.contentType || 'application/pdf'}"`;
      command += ` --attach-name "${attachment.filename}"`;
    });
  }

  // Add simplified HTML body
  const simplifiedHtml = this.simplifyHtmlForSwaks(html);
  command += ` --body '${simplifiedHtml.replace(/"/g, '\\"').replace(/'/g, "\\'")}' --add-header "MIME-Version: 1.0" --add-header "Content-Type: text/html"`;

  return command;
}
```

## HTML Simplification

### Problem Statement

Complex HTML templates caused syntax errors with swaks due to:
- Special characters in CSS and JavaScript
- Complex style attributes
- Nested quotes and escape sequences
- Large inline styles and scripts

### Solution: HTML Simplification

The `simplifyHtmlForSwaks` method processes HTML content to make it swaks-compatible:

```typescript
private simplifyHtmlForSwaks(html: string): string {
  let simplified = html;

  // Remove problematic elements
  simplified = simplified.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  simplified = simplified.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  simplified = simplified.replace(/<link[^>]*>/gi, '');

  // Simplify style attributes - keep only safe styles
  simplified = simplified.replace(/style="([^"]*)"/gi, (match, styleContent) => {
    const safeStyles = styleContent
      .split(';')
      .filter(style => {
        const prop = style.trim().toLowerCase();
        return prop.startsWith('color:') ||
               prop.startsWith('background-color:') ||
               prop.startsWith('font-family:') ||
               prop.startsWith('font-size:') ||
               prop.startsWith('font-weight:') ||
               prop.startsWith('text-align:') ||
               prop.startsWith('padding:') ||
               prop.startsWith('margin:') ||
               prop.startsWith('border:') ||
               prop.startsWith('width:') ||
               prop.startsWith('height:');
      })
      .join(';');

    return safeStyles ? `style="${safeStyles}"` : '';
  });

  // Remove problematic attributes
  simplified = simplified.replace(/class="[^"]*"/gi, '');
  simplified = simplified.replace(/data-[^=]*="[^"]*"/gi, '');
  simplified = simplified.replace(/on\w+="[^"]*"/gi, '');

  // Clean up and escape
  simplified = simplified.replace(/<!--[\s\S]*?-->/g, '');
  simplified = simplified.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');
  simplified = simplified.replace(/\s+/g, ' ');
  simplified = simplified.replace(/'/g, '&#39;');
  simplified = simplified.replace(/"/g, '&quot;');
  simplified = simplified.replace(/[`$\\]/g, '');

  return simplified;
}
```

### Safe HTML Elements and Attributes

**Allowed HTML Elements:**
- Basic structure: `html`, `head`, `body`, `div`, `span`, `p`
- Text formatting: `h1-h6`, `strong`, `em`, `b`, `i`, `u`
- Lists: `ul`, `ol`, `li`
- Tables: `table`, `tr`, `td`, `th`, `thead`, `tbody`
- Links and images: `a`, `img`
- Line breaks: `br`, `hr`

**Safe CSS Properties:**
- Colors: `color`, `background-color`
- Typography: `font-family`, `font-size`, `font-weight`, `text-align`
- Spacing: `padding`, `margin`
- Borders: `border`, `border-color`, `border-width`
- Dimensions: `width`, `height`

## Email Templates

### Simplified Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">Order Confirmation</h1>

        <p>Dear {{customerName}},</p>

        <p>Thank you for your order! Your order details are attached as a PDF document.</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Order Summary</h3>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Order Date:</strong> {{orderDate}}</p>
            <p><strong>Total Amount:</strong> {{totalAmount}}</p>
        </div>

        <p>Please find your complete order details in the attached PDF document.</p>

        <p>If you have any questions, please contact us at {{contactEmail}}.</p>

        <p>Best regards,<br>{{companyName}}</p>
    </div>
</body>
</html>
```

### Template Localization

**English Template:**
```typescript
const englishTemplate = {
  subject: 'Order Confirmation - {{orderNumber}}',
  greeting: 'Dear {{customerName}},',
  thankYou: 'Thank you for your order!',
  attachmentNote: 'Your order details are attached as a PDF document.',
  orderSummary: 'Order Summary',
  contactNote: 'If you have any questions, please contact us.',
  signature: 'Best regards,',
};
```

**Vietnamese Template:**
```typescript
const vietnameseTemplate = {
  subject: 'Xác nhận đơn hàng - {{orderNumber}}',
  greeting: 'Kính chào {{customerName}},',
  thankYou: 'Cảm ơn bạn đã đặt hàng!',
  attachmentNote: 'Chi tiết đơn hàng được đính kèm trong file PDF.',
  orderSummary: 'Tóm tắt đơn hàng',
  contactNote: 'Nếu có thắc mắc, vui lòng liên hệ với chúng tôi.',
  signature: 'Trân trọng,',
};
```

## Attachment Handling

### File Validation

```typescript
interface AttachmentValidation {
  maxSize: number;        // 25MB for email compatibility
  allowedTypes: string[]; // ['application/pdf']
  maxFilenameLength: number; // 100 characters
}

private validateAttachment(attachment: EmailAttachment): ValidationResult {
  const validation: ValidationResult = { isValid: true, warnings: [] };

  // Check file existence
  if (!fs.existsSync(attachment.path)) {
    validation.isValid = false;
    validation.warnings.push('File does not exist');
    return validation;
  }

  // Check file size
  const stats = fs.statSync(attachment.path);
  if (stats.size > this.maxAttachmentSize) {
    validation.isValid = false;
    validation.warnings.push(`File too large: ${stats.size} bytes`);
  }

  // Check filename
  if (attachment.filename.length > 100) {
    validation.warnings.push('Filename may be truncated in some email clients');
  }

  // Check for problematic characters
  const problematicChars = /[<>:"|?*]/;
  if (problematicChars.test(attachment.filename)) {
    validation.warnings.push('Filename contains problematic characters');
  }

  return validation;
}
```

### MIME Type Detection

```typescript
private getMimeType(filePath: string): string {
  const path = require('path');
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}
```

## Error Handling and Recovery

### Common Error Scenarios

1. **swaks Command Failures**
   - SMTP authentication errors
   - Network connectivity issues
   - Server timeout errors
   - Invalid email addresses

2. **Attachment Issues**
   - File not found errors
   - File size limitations
   - MIME type problems
   - Encoding issues

3. **HTML Processing Errors**
   - Malformed HTML content
   - Character encoding issues
   - Template rendering failures

### Error Recovery Strategies

```typescript
// Retry logic with exponential backoff
private async sendEmailWithRetry(
  options: EmailAttachmentOptions,
  maxRetries = 3
): Promise<EmailSendResult> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = await this.emailService.sendEmailWithAttachment(options);

      if (success) {
        return {
          success: true,
          deliveryStatus: 'sent',
          timestamp: new Date(),
          retryCount: attempt - 1,
        };
      }
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (this.isNonRetryableError(error)) {
        break;
      }

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Email delivery failed',
    deliveryStatus: 'failed',
    timestamp: new Date(),
    retryCount: maxRetries,
  };
}

// Fallback notification methods
private async sendFallbackNotification(
  customerEmail: string,
  orderData: OrderPDFData
): Promise<void> {
  try {
    // Send simplified email without attachment
    await this.emailService.sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderData.orderNumber}`,
      html: this.generateFallbackEmailContent(orderData),
    });

    // Log for manual follow-up
    this.logger.warn(`Sent fallback email for order ${orderData.orderNumber}`);

  } catch (error) {
    // Final fallback - admin notification
    await this.notifyAdminOfFailure(customerEmail, orderData, error);
  }
}
```

## Resend Functionality

### Rate Limiting

```typescript
interface RateLimitConfig {
  windowMs: number;     // 1 hour
  maxAttempts: number;  // 3 attempts per window
  blockDuration: number; // Additional block time after limit exceeded
}

private checkRateLimit(customerEmail: string): RateLimitResult {
  const now = new Date();
  const windowStart = new Date(now.getTime() - this.rateLimitConfig.windowMs);

  const attempts = this.rateLimitMap.get(customerEmail) || { count: 0, resetTime: now };

  // Reset if window expired
  if (attempts.resetTime < windowStart) {
    attempts.count = 0;
    attempts.resetTime = new Date(now.getTime() + this.rateLimitConfig.windowMs);
  }

  const allowed = attempts.count < this.rateLimitConfig.maxAttempts;

  if (allowed) {
    attempts.count++;
    this.rateLimitMap.set(customerEmail, attempts);
  }

  return {
    allowed,
    remainingAttempts: Math.max(0, this.rateLimitConfig.maxAttempts - attempts.count),
    resetTime: attempts.resetTime,
  };
}
```

### Resend Implementation

```typescript
async resendOrderConfirmation(
  orderNumber: string,
  customerEmail: string
): Promise<ResendResult> {
  try {
    // Check rate limiting
    const rateLimitResult = this.checkRateLimit(customerEmail);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        rateLimited: true,
      };
    }

    // Fetch order data
    const orderData = await this.getOrderData(orderNumber);
    if (!orderData) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Validate customer email matches order
    if (orderData.customerInfo.email !== customerEmail) {
      return {
        success: false,
        message: 'Email address does not match order',
      };
    }

    // Regenerate and send PDF
    const result = await this.sendOrderConfirmationWithPDF(
      customerEmail,
      orderData,
      orderData.locale
    );

    if (result.success) {
      return {
        success: true,
        message: 'Order confirmation email resent successfully',
      };
    } else {
      return {
        success: false,
        message: 'Failed to resend email',
        error: result.error,
      };
    }

  } catch (error) {
    this.logger.error(`Failed to resend order confirmation for ${orderNumber}:`, error);
    return {
      success: false,
      message: 'Internal error occurred',
      error: error.message,
    };
  }
}
```

## Testing and Validation

### Email Client Compatibility Testing

```bash
# Test with different email clients
swaks --to test@gmail.com --attach test.pdf --server smtp.gmail.com --port 587 --tls
swaks --to test@outlook.com --attach test.pdf --server smtp.gmail.com --port 587 --tls
swaks --to test@yahoo.com --attach test.pdf --server smtp.gmail.com --port 587 --tls
```

### Attachment Size Testing

```typescript
// Test attachment size limits
const testAttachmentSizes = async () => {
  const testSizes = [
    { size: '1MB', path: 'test-1mb.pdf' },
    { size: '10MB', path: 'test-10mb.pdf' },
    { size: '25MB', path: 'test-25mb.pdf' },
    { size: '30MB', path: 'test-30mb.pdf' }, // Should fail
  ];

  for (const test of testSizes) {
    try {
      const result = await this.sendEmailWithAttachment({
        to: 'test@example.com',
        subject: `Test ${test.size} attachment`,
        html: '<p>Test email</p>',
        attachments: [{ filename: test.path, path: test.path }],
      });

      console.log(`${test.size}: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`${test.size}: ERROR - ${error.message}`);
    }
  }
};
```

### HTML Simplification Testing

```typescript
// Test HTML simplification
const testHtmlSimplification = () => {
  const complexHtml = `
    <html>
      <head>
        <style>
          .complex { background: linear-gradient(45deg, red, blue); }
        </style>
        <script>alert('test');</script>
      </head>
      <body>
        <div class="complex" onclick="doSomething()" data-test="value">
          <p style="color: red; font-size: 14px; complex-property: value;">Test</p>
        </div>
      </body>
    </html>
  `;

  const simplified = this.simplifyHtmlForSwaks(complexHtml);
  console.log('Simplified HTML:', simplified);

  // Verify no problematic elements remain
  const hasProblematicElements = [
    /<style/i,
    /<script/i,
    /onclick=/i,
    /data-/i,
    /class=/i,
  ].some(pattern => pattern.test(simplified));

  console.log('Has problematic elements:', hasProblematicElements);
};
```

## Monitoring and Logging

### Email Delivery Tracking

```typescript
interface EmailDeliveryMetrics {
  totalSent: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  attachmentSizeDistribution: Record<string, number>;
  errorTypes: Record<string, number>;
}

class EmailMonitoringService {
  private metrics: EmailDeliveryMetrics = {
    totalSent: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageDeliveryTime: 0,
    attachmentSizeDistribution: {},
    errorTypes: {},
  };

  recordEmailSent(result: EmailSendResult, attachmentSize?: number): void {
    this.metrics.totalSent++;

    if (result.success) {
      this.metrics.successfulDeliveries++;
    } else {
      this.metrics.failedDeliveries++;

      if (result.error) {
        const errorType = this.categorizeError(result.error);
        this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;
      }
    }

    if (attachmentSize) {
      const sizeCategory = this.categorizeSizeCategory(attachmentSize);
      this.metrics.attachmentSizeDistribution[sizeCategory] =
        (this.metrics.attachmentSizeDistribution[sizeCategory] || 0) + 1;
    }
  }

  getDeliveryRate(): number {
    return this.metrics.totalSent > 0
      ? this.metrics.successfulDeliveries / this.metrics.totalSent
      : 0;
  }
}
```

This documentation provides comprehensive coverage of the email attachment system, including swaks integration, HTML simplification, error handling, and testing procedures.