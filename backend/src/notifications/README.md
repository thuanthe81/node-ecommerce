# Notifications Module

This module handles all email notifications in the application using the Linux `mail` command.

## Features

- **Bilingual Email Templates**: Support for English and Vietnamese
- **Order Notifications**: Confirmation, shipping, and status updates
- **User Account Emails**: Welcome emails and password reset
- **Contact Form**: Admin notifications for contact form submissions

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

1. **Order Confirmation** - Sent when an order is created
   - Order details, items, totals
   - Shipping address
   - Available in English and Vietnamese

2. **Shipping Notification** - Sent when order status changes to "shipped"
   - Tracking number (if available)
   - Shipping address
   - Available in English and Vietnamese

3. **Order Status Update** - Sent when order status changes
   - New status information
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

Add the following to your `.env` file:

```env
# Admin email for receiving contact form submissions
ADMIN_EMAIL=admin@example.com
```

## Usage

### Sending Order Confirmation

The order confirmation email is automatically sent when an order is created in `OrdersService`:

```typescript
// Automatically called in OrdersService.create()
await this.sendOrderConfirmationEmail(order);
```

### Sending Shipping Notification

The shipping notification is automatically sent when order status is updated to "shipped":

```typescript
// Automatically called in OrdersService.updateStatus()
if (updateOrderStatusDto.status === OrderStatus.SHIPPED) {
  await this.sendShippingNotificationEmail(updatedOrder);
}
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

The `EmailTemplateService` provides bilingual templates for all email types:

- Templates include both English and Vietnamese versions
- Automatically formats order data, user data, etc.
- Returns subject and HTML body for each email type

## Error Handling

Email failures are logged but do not break the application flow. This ensures that:

- Order creation succeeds even if email fails
- User registration succeeds even if welcome email fails
- The application remains resilient to email service issues

## Testing

To test email functionality in development:

1. Ensure `mail` command is installed
2. Configure a valid admin email in `.env`
3. Test by:
   - Creating an order
   - Registering a new user
   - Submitting a contact form
   - Requesting a password reset

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
- [ ] HTML email templates with better styling
- [ ] Email analytics and tracking
