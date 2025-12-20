# Email Queue Backward Compatibility

## Overview

The `EmailEventPublisher` service provides backward compatibility with the existing `EmailService` interface, allowing for a seamless migration to the asynchronous email queue system.

## Compatibility Methods

### `sendEmail(options: EmailOptions): Promise<boolean>`

Provides the same interface as `EmailService.sendEmail()`. This method:
- Accepts the same `EmailOptions` interface
- Returns `Promise<boolean>` for compatibility
- Queues the email as a `CONTACT_FORM` event (generic fallback)
- Returns `true` immediately (actual sending is asynchronous)
- Returns `false` if queuing fails

**Note**: This is a generic fallback method. For better categorization and monitoring, use the specific event methods instead.

**Example**:
```typescript
// Old way (EmailService)
await this.emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<p>Hello World</p>',
  locale: 'en',
});

// New way (EmailEventPublisher) - same interface
await this.emailEventPublisher.sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<p>Hello World</p>',
  locale: 'en',
});
```

### `sendEmailWithAttachment(options: EmailAttachmentOptions): Promise<boolean>`

Provides the same interface as `EmailService.sendEmailWithAttachment()`. This method:
- Accepts the same `EmailAttachmentOptions` interface
- Returns `Promise<boolean>` for compatibility
- Currently logs a warning (attachments not yet supported in queue)
- Queues the email content without attachments
- Returns `true` immediately
- Returns `false` if queuing fails

**Note**: Attachment support in the queue system is planned for future implementation.

## Recommended: Specific Event Methods

For better email categorization, monitoring, and retry policies, use the specific event methods:

### Order-Related Emails

```typescript
// Order confirmation
await this.emailEventPublisher.sendOrderConfirmation(
  orderId,
  orderNumber,
  customerEmail,
  customerName,
  locale
);

// Admin order notification
await this.emailEventPublisher.sendAdminOrderNotification(
  orderId,
  orderNumber,
  locale
);

// Shipping notification
await this.emailEventPublisher.sendShippingNotification(
  orderId,
  orderNumber,
  trackingNumber, // optional
  locale
);

// Order status update
await this.emailEventPublisher.sendOrderStatusUpdate(
  orderId,
  orderNumber,
  newStatus,
  locale
);
```

### User-Related Emails

```typescript
// Welcome email
await this.emailEventPublisher.sendWelcomeEmail(
  userId,
  userEmail,
  userName,
  locale
);

// Password reset
await this.emailEventPublisher.sendPasswordReset(
  userId,
  userEmail,
  resetToken,
  locale
);
```

### Contact Form

```typescript
// Contact form notification
await this.emailEventPublisher.sendContactForm(
  senderName,
  senderEmail,
  message,
  locale
);
```

## Migration Guide

### Step 1: Update Module Imports

Replace `NotificationsModule` with `EmailQueueModule`:

```typescript
// Before
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
})

// After
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
  imports: [EmailQueueModule],
})
```

### Step 2: Update Service Injection

Replace `EmailService` with `EmailEventPublisher`:

```typescript
// Before
import { EmailService } from '../notifications/services/email.service';

constructor(
  private emailService: EmailService,
) {}

// After
import { EmailEventPublisher } from '../email-queue/services/email-event-publisher.service';

constructor(
  private emailEventPublisher: EmailEventPublisher,
) {}
```

### Step 3: Update Method Calls (Option A: Minimal Changes)

Keep the same method calls for backward compatibility:

```typescript
// Before
await this.emailService.sendEmail({
  to: order.email,
  subject: template.subject,
  html: template.html,
  locale,
});

// After (minimal change)
await this.emailEventPublisher.sendEmail({
  to: order.email,
  subject: template.subject,
  html: template.html,
  locale,
});
```

### Step 3: Update Method Calls (Option B: Recommended)

Use specific event methods for better categorization:

```typescript
// Before
await this.emailService.sendEmail({
  to: order.email,
  subject: template.subject,
  html: template.html,
  locale,
});

// After (recommended)
await this.emailEventPublisher.sendOrderConfirmation(
  order.id,
  order.orderNumber,
  order.email,
  order.customerName,
  locale
);
```

## Benefits of Specific Event Methods

1. **Better Monitoring**: Each email type has its own metrics and logs
2. **Custom Retry Policies**: Different email types can have different retry strategies
3. **Priority Handling**: Critical emails (password reset) get higher priority
4. **Type Safety**: Compile-time validation of required fields
5. **Clearer Intent**: Code is more self-documenting

## Return Value Differences

### EmailService (Synchronous)
- Returns `true` if email was sent successfully
- Returns `false` if email sending failed
- Blocks until email is sent

### EmailEventPublisher (Asynchronous)
- Returns `true` if event was queued successfully
- Returns `false` if queuing failed
- Returns immediately (non-blocking)
- Actual email sending happens in background worker
- Use queue metrics to monitor actual delivery status

## Error Handling

### EmailService
```typescript
const success = await this.emailService.sendEmail(options);
if (!success) {
  // Email failed to send
  console.error('Email failed');
}
```

### EmailEventPublisher
```typescript
// Queuing errors (rare)
const success = await this.emailEventPublisher.sendEmail(options);
if (!success) {
  // Failed to queue (Redis connection issue, etc.)
  console.error('Failed to queue email');
}

// Delivery errors (handled by worker with retries)
// Check queue metrics or logs for delivery status
const metrics = await this.emailEventPublisher.getQueueMetrics();
console.log(`Failed emails: ${metrics.failed}`);
```

## Testing

When testing code that uses `EmailEventPublisher`, you can mock it the same way as `EmailService`:

```typescript
{
  provide: EmailEventPublisher,
  useValue: {
    sendEmail: jest.fn().mockResolvedValue(true),
    sendOrderConfirmation: jest.fn().mockResolvedValue('job-id'),
    // ... other methods
  },
}
```

## Monitoring

The `EmailEventPublisher` provides queue metrics:

```typescript
const metrics = await this.emailEventPublisher.getQueueMetrics();
console.log({
  waiting: metrics.waiting,    // Jobs waiting to be processed
  active: metrics.active,      // Jobs currently being processed
  completed: metrics.completed, // Successfully completed jobs
  failed: metrics.failed,      // Failed jobs (after all retries)
  delayed: metrics.delayed,    // Jobs scheduled for future
  total: metrics.total,        // Total jobs
});
```

## Limitations

1. **Attachments**: Not yet supported in the queue system. The `sendEmailWithAttachment` method will queue the email content but skip attachments.

2. **Immediate Feedback**: The return value only indicates if the email was queued, not if it was delivered. Use queue metrics for delivery status.

3. **Generic Events**: The `sendEmail` method creates generic `CONTACT_FORM` events. Use specific methods for better categorization.

## Future Enhancements

- Attachment support in queue system
- Webhook notifications for delivery status
- Admin UI for viewing failed emails
- Bulk email operations
- Email templates stored in database
