# Design Document

## Overview

This design enhances the existing email notification system to provide comprehensive order notifications to both customers and administrators. The system will send well-formatted HTML emails in both English and Vietnamese, with proper error handling to ensure order processing continues even if email delivery fails.

The enhancement builds upon the existing notification infrastructure that uses the Linux `mail` command and adds:
- Admin notifications for new orders
- Enhanced HTML email templates with better styling
- Retrieval of admin email from footer_settings table
- Improved error handling and logging

## Architecture

### High-Level Architecture

```
Order Creation/Update Flow:
┌─────────────────┐
│  OrdersService  │
└────────┬────────┘
         │
         ├──> Create/Update Order in Database
         │
         ├──> Send Customer Email
         │    ┌──────────────────────┐
         │    │ EmailTemplateService │ (Generate HTML)
         │    └──────────┬───────────┘
         │               │
         │    ┌──────────▼───────────┐
         │    │   EmailService       │ (Send via mail command)
         │    └──────────────────────┘
         │
         └──> Send Admin Email (New Orders Only)
              ┌──────────────────────┐
              │ FooterSettingsService│ (Get admin email)
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │ EmailTemplateService │ (Generate HTML)
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │   EmailService       │ (Send via mail command)
              └──────────────────────┘
```

### Component Interaction

1. **OrdersService** orchestrates the email sending process
2. **FooterSettingsService** provides the admin email address
3. **EmailTemplateService** generates bilingual HTML templates
4. **EmailService** handles the actual email delivery via Linux `mail` command

## Components and Interfaces

### 1. EmailTemplateService Enhancement

**Purpose**: Generate HTML email templates for all notification types

**New Interface**:
```typescript
interface AdminOrderEmailData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    nameEn: string;
    nameVi: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shippingCost: number;
  shippingMethod: string;
  taxAmount: number;
  discountAmount: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
}

interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

**New Methods**:
```typescript
class EmailTemplateService {
  // New method for admin order notifications
  getAdminOrderNotificationTemplate(
    data: AdminOrderEmailData,
    locale: 'en' | 'vi' = 'en'
  ): { subject: string; html: string };

  // Enhanced existing methods with better HTML formatting
  getOrderConfirmationTemplate(
    data: OrderEmailData,
    locale: 'en' | 'vi' = 'en'
  ): { subject: string; html: string };

  // Helper method for consistent HTML structure
  private wrapInEmailLayout(
    content: string,
    locale: 'en' | 'vi'
  ): string;

  // Helper method for formatting currency
  private formatCurrency(
    amount: number,
    locale: 'en' | 'vi'
  ): string;

  // Helper method for formatting dates
  private formatDate(
    date: Date | string,
    locale: 'en' | 'vi'
  ): string;
}
```

### 2. OrdersService Enhancement

**Purpose**: Coordinate email notifications during order lifecycle

**New Methods**:
```typescript
class OrdersService {
  // New method to send admin notification
  private async sendAdminOrderNotification(order: Order): Promise<void>;

  // Enhanced existing method
  private async sendOrderConfirmationEmail(order: Order): Promise<void>;
}
```

### 3. FooterSettingsService Integration

**Purpose**: Provide admin email address for notifications

**Existing Interface** (no changes needed):
```typescript
interface FooterSettings {
  contactEmail: string | null;
  // ... other fields
}

class FooterSettingsService {
  async getFooterSettings(): Promise<FooterSettings>;
}
```

### 4. EmailService Enhancement

**Purpose**: Send emails with improved error handling

**Enhanced Interface**:
```typescript
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  locale?: 'en' | 'vi';
  from?: string; // Optional sender email
}

class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean>;

  // Enhanced HTML to plain text conversion
  private htmlToPlainText(html: string): string;

  // New method to validate email address
  private isValidEmail(email: string): boolean;
}
```

## Data Models

### Order Email Data Structure

```typescript
// Customer order confirmation email data
interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  shippingAddress: Address;
  trackingNumber?: string;
  status?: string;
}

// Admin order notification email data (more detailed)
interface AdminOrderEmailData extends Omit<OrderEmailData, 'items'> {
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    nameEn: string;
    nameVi: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  shippingMethod: string;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
}
```

### Email Template Structure

```typescript
interface EmailTemplate {
  subject: string;
  html: string;
}

// HTML email structure
interface EmailLayout {
  header: string;      // Logo and branding
  content: string;     // Main email content
  footer: string;      // Contact info and links
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Customer email delivery attempt

*For any* completed order, the system should attempt to send an order confirmation email to the customer's email address.

**Validates: Requirements 1.1**

### Property 2: Customer email content completeness

*For any* order confirmation email, the email content should include the order number, order date, customer name, all order items, subtotal, shipping cost, tax amount, total, and shipping address.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: Admin notification delivery attempt

*For any* completed order where footer_settings contains a valid contactEmail, the system should attempt to send an admin notification email to that address.

**Validates: Requirements 2.1, 2.2**

### Property 4: Admin email content completeness

*For any* admin notification email, the email content should include the order number, order date, customer name, customer email, customer phone, all order items with SKUs, subtotal, shipping cost, shipping method, tax amount, total, shipping address, billing address, payment method, payment status, and any customer notes.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

### Property 5: Status update email delivery

*For any* order status change, the system should attempt to send a status update email to the customer's email address.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Email failure resilience

*For any* email sending failure, the order creation or status update operation should complete successfully without throwing an exception.

**Validates: Requirements 4.1, 4.2, 4.5**

### Property 7: Missing admin email handling

*For any* order where footer_settings does not contain a contactEmail value, the system should log a warning and continue processing without sending an admin notification.

**Validates: Requirements 2.3, 4.3, 6.4**

### Property 8: HTML email structure consistency

*For any* generated email template, the HTML should include a proper DOCTYPE declaration, meta tags for character encoding and viewport, and inline CSS styles.

**Validates: Requirements 5.1, 5.2**

### Property 9: Bilingual content consistency

*For any* email template generated in Vietnamese, all user-facing text should be in Vietnamese, and for English, all text should be in English.

**Validates: Requirements 1.6, 3.7**

### Property 10: Currency formatting consistency

*For any* email template containing currency values, the values should be formatted with proper decimal places (2 for USD/general, 0 for VND) and appropriate currency symbols.

**Validates: Requirements 5.5**

## Error Handling

### Email Delivery Failures

1. **Mail Command Not Available**
   - Log error with details
   - Continue order processing
   - Return false from sendEmail method

2. **Invalid Email Address**
   - Validate email format before sending
   - Log warning for invalid addresses
   - Skip sending to invalid addresses

3. **Admin Email Not Configured**
   - Check if contactEmail exists in footer_settings
   - Log warning if not configured
   - Skip admin notification
   - Continue with customer notification

4. **Email Content Generation Errors**
   - Wrap template generation in try-catch
   - Log error with order details
   - Use fallback plain text template if HTML generation fails

### Database Query Failures

1. **Footer Settings Query Failure**
   - Catch database errors
   - Log error
   - Skip admin notification
   - Continue with customer notification

2. **Order Data Incomplete**
   - Validate required fields before email generation
   - Log warning for missing data
   - Use default values where appropriate

### Logging Strategy

```typescript
// Success logging
logger.log(`Order confirmation email sent to ${customerEmail} for order ${orderNumber}`);
logger.log(`Admin notification sent to ${adminEmail} for order ${orderNumber}`);

// Warning logging
logger.warn(`Admin email not configured, skipping admin notification for order ${orderNumber}`);
logger.warn(`Invalid admin email address: ${adminEmail}`);

// Error logging
logger.error(`Failed to send order confirmation email for order ${orderNumber}:`, error);
logger.error(`Failed to query footer settings for admin email:`, error);
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Email Template Generation**
   - Test English template generation with sample order data
   - Test Vietnamese template generation with sample order data
   - Test template generation with missing optional fields
   - Test currency formatting for different locales
   - Test date formatting for different locales

2. **Email Service**
   - Test email sending with valid data
   - Test email sending with invalid email addresses
   - Test HTML to plain text conversion
   - Test email validation logic

3. **Order Service Integration**
   - Test customer email sending on order creation
   - Test admin email sending on order creation
   - Test status update email sending
   - Test email sending with missing admin email

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript property testing library). Each test will run a minimum of 100 iterations.

1. **Property 1: Customer email delivery attempt**
   - Generate random valid orders
   - Verify sendEmail is called with customer email
   - Tag: **Feature: order-email-notifications, Property 1: Customer email delivery attempt**

2. **Property 2: Customer email content completeness**
   - Generate random orders with varying data
   - Verify all required fields are present in email HTML
   - Tag: **Feature: order-email-notifications, Property 2: Customer email content completeness**

3. **Property 3: Admin notification delivery attempt**
   - Generate random orders and footer settings with valid contactEmail
   - Verify sendEmail is called with admin email
   - Tag: **Feature: order-email-notifications, Property 3: Admin notification delivery attempt**

4. **Property 4: Admin email content completeness**
   - Generate random orders with all possible fields
   - Verify all required admin fields are present in email HTML
   - Tag: **Feature: order-email-notifications, Property 4: Admin email content completeness**

5. **Property 6: Email failure resilience**
   - Generate random orders
   - Mock email service to throw errors
   - Verify order creation completes successfully
   - Tag: **Feature: order-email-notifications, Property 6: Email failure resilience**

6. **Property 7: Missing admin email handling**
   - Generate random orders with null/empty contactEmail
   - Verify no admin email is sent
   - Verify warning is logged
   - Verify order creation succeeds
   - Tag: **Feature: order-email-notifications, Property 7: Missing admin email handling**

7. **Property 8: HTML email structure consistency**
   - Generate random email templates
   - Verify DOCTYPE, meta tags, and inline styles are present
   - Tag: **Feature: order-email-notifications, Property 8: HTML email structure consistency**

8. **Property 9: Bilingual content consistency**
   - Generate random email templates in both locales
   - Verify no mixed language content
   - Tag: **Feature: order-email-notifications, Property 9: Bilingual content consistency**

9. **Property 10: Currency formatting consistency**
   - Generate random currency amounts
   - Verify proper decimal places and symbols for each locale
   - Tag: **Feature: order-email-notifications, Property 10: Currency formatting consistency**

### Integration Testing

Integration tests will verify the complete email flow:

1. **End-to-End Order Creation with Emails**
   - Create order via API
   - Verify customer email is sent
   - Verify admin email is sent
   - Verify email content matches order data

2. **End-to-End Status Update with Emails**
   - Update order status via API
   - Verify status update email is sent
   - Verify email content reflects new status

3. **Admin Email Configuration**
   - Update footer settings with new admin email
   - Create order
   - Verify email is sent to new admin address

### Manual Testing

1. **Email Rendering**
   - Send test emails to various email clients (Gmail, Outlook, Apple Mail)
   - Verify HTML rendering is correct
   - Verify responsive design works on mobile

2. **Bilingual Content**
   - Verify Vietnamese characters display correctly
   - Verify currency symbols display correctly
   - Verify date formats are appropriate for each locale

## Implementation Notes

### Email Template Design

1. **HTML Structure**
   - Use table-based layout for maximum email client compatibility
   - Inline all CSS styles
   - Include fallback fonts
   - Use web-safe colors

2. **Responsive Design**
   - Use media queries for mobile optimization
   - Ensure minimum font sizes for readability
   - Stack elements vertically on small screens

3. **Branding**
   - Include shop logo in header
   - Use consistent color scheme
   - Include contact information in footer

### Performance Considerations

1. **Async Email Sending**
   - Email sending should not block order processing
   - Use fire-and-forget pattern with error logging

2. **Database Queries**
   - Cache footer settings to reduce database queries
   - Use existing cache infrastructure

3. **Email Queue (Future Enhancement)**
   - Consider implementing email queue for better reliability
   - Use Bull or BullMQ for job processing
   - Implement retry logic for failed emails

### Security Considerations

1. **Email Injection Prevention**
   - Validate and sanitize all email addresses
   - Escape special characters in email content
   - Use parameterized email commands

2. **Data Privacy**
   - Only include necessary customer information in admin emails
   - Ensure emails are sent over secure connections
   - Consider GDPR compliance for email storage

### Localization

1. **Language Detection**
   - Default to English for all emails initially
   - Future: Detect user's preferred language from user profile
   - Future: Allow users to set email language preference

2. **Translation Quality**
   - Ensure professional Vietnamese translations
   - Use consistent terminology across all emails
   - Consider cultural appropriateness of content

## Future Enhancements

1. **Rich Email Templates**
   - Use external email template service (e.g., SendGrid templates)
   - Implement template versioning
   - Add A/B testing capabilities

2. **Email Service Provider Integration**
   - Replace Linux `mail` with professional email service
   - Options: SendGrid, AWS SES, Mailgun, Postmark
   - Implement delivery tracking and analytics

3. **Email Preferences**
   - Allow customers to opt-out of certain email types
   - Provide email frequency controls
   - Implement unsubscribe functionality

4. **Email Analytics**
   - Track email open rates
   - Track link click rates
   - Monitor delivery success rates

5. **Additional Email Types**
   - Order delivery confirmation
   - Review request emails
   - Promotional campaigns
   - Abandoned cart reminders
