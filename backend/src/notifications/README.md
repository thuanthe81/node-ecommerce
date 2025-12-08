# Notifications Module

This module handles all email notifications in the application using the Linux `mail` command.

## Features

- **Bilingual Email Templates**: Support for English and Vietnamese
- **Order Notifications**: Confirmation, shipping, status updates, and admin notifications
- **Admin Order Notifications**: Real-time notifications to shop owner for new orders
- **Enhanced HTML Email Templates**: Professional, responsive email design with inline CSS
- **User Account Emails**: Welcome emails and password reset
- **Contact Form**: Admin notifications for contact form submissions
- **Graceful Error Handling**: Email failures don't interrupt order processing

## Prerequisites

The email service requires the `mail` command to be available on the system. Install it using:

```bash
# Ubuntu/Debian
sudo apt-get install mailutils

# CentOS/RHEL
sudo yum install mailx

# macOS
# mail command is pre-installed
```

## Email Templates

### Order-Related Emails

1. **Order Confirmation** - Sent to customer when an order is created
   - Order number and date
   - Order details, items with quantities and prices
   - Subtotal, shipping cost, tax, discount, and total
   - Shipping address
   - Professional HTML layout with responsive design
   - Available in English and Vietnamese

2. **Admin Order Notification** - Sent to shop owner when a new order is placed
   - Complete order details including order number and date
   - Customer information (name, email, phone)
   - All order items with product names (both languages), SKUs, quantities, and prices
   - Subtotal, shipping cost, shipping method, tax, discount, and total
   - Both shipping and billing addresses
   - Payment method and payment status
   - Customer notes (if provided)
   - Professional HTML layout optimized for quick order review
   - Available in English and Vietnamese

3. **Shipping Notification** - Sent when order status changes to "shipped"
   - Tracking number (if available)
   - Shipping address
   - Enhanced HTML formatting
   - Available in English and Vietnamese

4. **Order Status Update** - Sent when order status changes
   - New status information with status-specific messages
   - Enhanced HTML formatting
   - Available in English and Vietnamese

### User Account Emails

1. **Welcome Email** - Sent after user registration
   - Welcome message
   - Optional email verification link
   - Available in English and Vietnamese

2. **Password Reset** - Sent when user requests password reset
   - Reset link with token
   - 1-hour expiration notice
   - Available in English and Vietnamese

### Contact Form

- Sends contact form submissions to admin email
- Includes sender information and message

## Configuration

### Admin Email Configuration

The admin email address for order notifications is configured through the **Footer Settings** in the admin panel:

1. Log in to the admin panel
2. Navigate to **Settings** → **Footer Settings**
3. Enter the admin email address in the **Contact Email** field
4. Save the settings

The system will automatically:
- Send new order notifications to this email address
- Log a warning if the email is not configured (order processing continues normally)
- Use the updated email address immediately after changes

**Note**: If no admin email is configured, order notifications to the admin will be skipped, but customer emails will still be sent and order processing will continue normally.

### Environment Variables

Add the following to your `.env` file:

```env
# Frontend URL for email links (password reset, email verification)
FRONTEND_URL=http://localhost:3000
```

## Usage

### Sending Order Confirmation

The order confirmation email is automatically sent to the customer when an order is created in `OrdersService`:

```typescript
// Automatically called in OrdersService.create()
await this.sendOrderConfirmationEmail(order);
```

### Sending Admin Order Notification

The admin order notification email is automatically sent to the shop owner when a new order is placed:

```typescript
// Automatically called in OrdersService.create() after customer email
await this.sendAdminOrderNotification(order);
```

The system will:
1. Query the `footer_settings` table for the `contactEmail` value
2. Skip sending if no email is configured (with warning log)
3. Send a comprehensive order notification with all details
4. Continue order processing even if email fails

### Sending Shipping Notification

The shipping notification is automatically sent when order status is updated to "shipped":

```typescript
// Automatically called in OrdersService.updateStatus()
if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
  await this.sendShippingNotificationEmail(updatedOrder);
}
```

### Sending Order Status Update

The status update email is automatically sent when order status changes:

```typescript
// Automatically called in OrdersService.updateStatus()
await this.sendOrderStatusUpdateEmail(updatedOrder);
```

### Sending Welcome Email

The welcome email is automatically sent after user registration:

```typescript
// Automatically called in AuthService.register()
await this.sendWelcomeEmail(user);
```

### Sending Password Reset Email

The password reset email is sent when a user requests a password reset:

```typescript
// Called in AuthService.requestPasswordReset()
await this.sendPasswordResetEmail(user, resetToken);
```

## Email Service

The `EmailService` uses the Linux `mail` command to send emails. It:

1. Converts HTML templates to plain text
2. Executes the mail command with proper escaping
3. Logs success/failure without breaking the application flow

## Email Template Service

The `EmailTemplateService` provides bilingual templates for all email types with enhanced HTML formatting:

### Features

- **Bilingual Support**: Templates include both English and Vietnamese versions
- **Consistent HTML Layout**: All emails use a professional, responsive HTML structure
- **Helper Methods**: Utility functions for formatting currency, dates, and wrapping content
- **Inline CSS**: Maximum email client compatibility with inline styles
- **Responsive Design**: Mobile-friendly layouts that work across all devices

### Helper Methods

#### `wrapInEmailLayout(content: string, locale: 'en' | 'vi'): string`

Wraps email content in a consistent HTML layout with:
- Proper DOCTYPE and meta tags
- Responsive design with viewport settings
- Header with branding
- Content area with styling
- Footer with contact information and copyright

**Example:**
```typescript
const content = '<h2>Hello!</h2><p>Your order has been confirmed.</p>';
const html = this.wrapInEmailLayout(content, 'en');
// Returns complete HTML email with header, footer, and styling
```

#### `formatCurrency(amount: number, locale: 'en' | 'vi'): string`

Formats currency values with proper decimal places and symbols:
- **Vietnamese (vi)**: 0 decimal places with ₫ symbol (e.g., "1,000,000 ₫")
- **English (en)**: 2 decimal places (e.g., "100.00")

**Example:**
```typescript
this.formatCurrency(1000000, 'vi'); // "1,000,000 ₫"
this.formatCurrency(100, 'en');     // "100.00"
```

#### `formatDate(date: Date | string, locale: 'en' | 'vi'): string`

Formats dates in a human-readable format appropriate for the locale:
- **Vietnamese (vi)**: "ngày DD tháng MM năm YYYY, HH:mm"
- **English (en)**: "Month DD, YYYY, HH:mm AM/PM"

**Example:**
```typescript
this.formatDate(new Date(), 'vi'); // "8 tháng 12 năm 2025, 10:30"
this.formatDate(new Date(), 'en'); // "December 8, 2025, 10:30 AM"
```

### Template Methods

#### `getOrderConfirmationTemplate(data: OrderEmailData, locale: 'en' | 'vi')`

Generates customer order confirmation email with:
- Order number and date
- Order items with quantities and prices
- Subtotal, shipping, tax, discount, and total
- Shipping address
- Professional HTML layout

#### `getAdminOrderNotificationTemplate(data: AdminOrderEmailData, locale: 'en' | 'vi')`

Generates admin order notification email with comprehensive details:
- Order number and date
- Customer information (name, email, phone)
- Order items with product names (both languages), SKUs, quantities, and prices
- Subtotal, shipping cost, shipping method, tax, discount, and total
- Shipping and billing addresses
- Payment method and status
- Customer notes (if provided)

#### `getShippingNotificationTemplate(data: OrderEmailData, locale: 'en' | 'vi')`

Generates shipping notification email with:
- Order number
- Tracking number (if available)
- Shipping address

#### `getOrderStatusUpdateTemplate(data: OrderEmailData, locale: 'en' | 'vi')`

Generates status update email with:
- Order number
- New status with status-specific message
- Localized status names

## Error Handling

Email failures are logged but do not break the application flow. This ensures that:

- **Order creation succeeds even if email fails**: Customer and admin emails are sent in try-catch blocks
- **User registration succeeds even if welcome email fails**: Email errors don't prevent account creation
- **Missing admin email is handled gracefully**: System logs a warning and continues without admin notification
- **Invalid email addresses are validated**: System validates email format before sending
- **The application remains resilient to email service issues**: All email operations return boolean success/failure

### Error Scenarios

1. **Admin Email Not Configured**
   ```
   WARN: Admin email not configured, skipping admin notification for order ORD-123
   ```
   - Order processing continues normally
   - Customer email is still sent
   - Admin notification is skipped

2. **Invalid Email Address**
   ```
   WARN: Invalid email address: invalid@. Skipping email send.
   ```
   - Email validation prevents sending to malformed addresses
   - Returns false without attempting to send

3. **Mail Command Failure**
   ```
   ERROR: Failed to send email to customer@example.com: mail command not found
   ```
   - Error is logged with details
   - Order processing continues
   - Returns false to indicate failure

4. **Email Template Generation Error**
   - Errors are caught and logged
   - Order processing continues
   - System can fall back to plain text if needed

## Testing

To test email functionality in development:

1. Ensure `mail` command is installed
2. Configure admin email in Footer Settings (via admin panel)
3. Test by:
   - **Creating an order**: Verify both customer and admin emails are sent
   - **Updating order status**: Verify status update email is sent to customer
   - **Registering a new user**: Verify welcome email is sent
   - **Submitting a contact form**: Verify admin notification is sent
   - **Requesting a password reset**: Verify reset email is sent

### Testing Admin Notifications

1. Configure admin email in Footer Settings:
   ```
   Admin Panel → Settings → Footer Settings → Contact Email
   ```

2. Create a test order and verify:
   - Customer receives order confirmation email
   - Admin receives order notification email with all details
   - Both emails have proper HTML formatting

3. Test missing admin email:
   - Clear the Contact Email in Footer Settings
   - Create an order
   - Verify customer email is still sent
   - Check logs for warning message about missing admin email

### Testing Email Templates

View the generated HTML by checking the email service logs or by temporarily saving the HTML to a file:

```typescript
// In development, you can save HTML to file for testing
const template = this.emailTemplateService.getAdminOrderNotificationTemplate(data, 'en');
fs.writeFileSync('test-email.html', template.html);
```

Then open `test-email.html` in a browser to verify formatting.

## Production Considerations

For production environments, consider:

1. **Email Service Provider**: Replace Linux `mail` with a proper email service:
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

2. **Email Queue**: Use a job queue (Bull, BullMQ) for:
   - Retry logic
   - Rate limiting
   - Better error handling

3. **Email Tracking**: Implement:
   - Delivery tracking
   - Open rates
   - Click tracking

4. **Template Management**: Consider:
   - External template storage
   - Template versioning
   - A/B testing

## Future Enhancements

- [ ] Email verification for new users
- [ ] Order delivery confirmation emails
- [ ] Promotional email campaigns
- [ ] Email preferences management
- [x] HTML email templates with better styling ✅ (Completed)
- [x] Admin order notifications ✅ (Completed)
- [ ] Email analytics and tracking
- [ ] Email queue with retry logic (Bull/BullMQ)
- [ ] Multiple admin email recipients
- [ ] Email attachments (invoices, receipts)
- [ ] Email template customization through admin panel
