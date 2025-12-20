# Design Document: Asynchronous Email Queue Service

## Overview

This design transforms the current synchronous email service into an asynchronous, event-driven architecture using BullMQ (a Redis-based queue library for Node.js). The system will decouple email sending from the main application flow, improving responsiveness and reliability.

The architecture introduces three main components:
1. **Email Event Publisher** - Publishes email events to the queue (replaces direct EmailService calls)
2. **Email Queue** - Redis-backed message queue that persists email events
3. **Email Worker** - Background processor that consumes events and sends emails

This design maintains backward compatibility with existing email functionality while adding robust retry mechanisms, monitoring, and horizontal scalability.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Main Process   │
│  (HTTP Server)  │
└────────┬────────┘
         │
         │ 1. Publish Event
         ▼
┌─────────────────────┐
│  Email Event        │
│  Publisher Service  │
└────────┬────────────┘
         │
         │ 2. Add to Queue
         ▼
┌─────────────────────┐
│   Redis Queue       │
│   (BullMQ)          │
└────────┬────────────┘
         │
         │ 3. Process Event
         ▼
┌─────────────────────┐
│   Email Worker      │
│   (Background)      │
└────────┬────────────┘
         │
         │ 4. Send Email
         ▼
┌─────────────────────┐
│   Email Service     │
│   (SMTP/swaks)      │
└─────────────────────┘
```

### Technology Stack

- **Queue Library**: BullMQ (Redis-based, production-ready, TypeScript support)
- **Message Broker**: Redis (already in use for caching)
- **Email Delivery**: Existing EmailService with swaks
- **Template Engine**: Existing EmailTemplateService
- **Monitoring**: BullMQ built-in monitoring + custom logging

### Why BullMQ?

- Built on top of Redis (already in our stack)
- Production-ready with excellent TypeScript support
- Built-in retry mechanisms with exponential backoff
- Dead letter queue support
- Job prioritization and rate limiting
- Horizontal scaling support
- Active maintenance and community
- Comprehensive monitoring and metrics

## Components and Interfaces

### 1. Email Event Types

```typescript
// Email event type enum
export enum EmailEventType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ADMIN_ORDER_NOTIFICATION = 'ADMIN_ORDER_NOTIFICATION',
  SHIPPING_NOTIFICATION = 'SHIPPING_NOTIFICATION',
  ORDER_STATUS_UPDATE = 'ORDER_STATUS_UPDATE',
  WELCOME_EMAIL = 'WELCOME_EMAIL',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CONTACT_FORM = 'CONTACT_FORM',
}

// Base email event interface
export interface BaseEmailEvent {
  type: EmailEventType;
  locale: 'en' | 'vi';
  timestamp: Date;
}

// Order confirmation event
export interface OrderConfirmationEvent extends BaseEmailEvent {
  type: EmailEventType.ORDER_CONFIRMATION;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
}

// Admin order notification event
export interface AdminOrderNotificationEvent extends BaseEmailEvent {
  type: EmailEventType.ADMIN_ORDER_NOTIFICATION;
  orderId: string;
  orderNumber: string;
}

// Shipping notification event
export interface ShippingNotificationEvent extends BaseEmailEvent {
  type: EmailEventType.SHIPPING_NOTIFICATION;
  orderId: string;
  orderNumber: string;
  trackingNumber?: string;
}

// Order status update event
export interface OrderStatusUpdateEvent extends BaseEmailEvent {
  type: EmailEventType.ORDER_STATUS_UPDATE;
  orderId: string;
  orderNumber: string;
  newStatus: string;
}

// Welcome email event
export interface WelcomeEmailEvent extends BaseEmailEvent {
  type: EmailEventType.WELCOME_EMAIL;
  userId: string;
  userEmail: string;
  userName: string;
}

// Password reset event
export interface PasswordResetEvent extends BaseEmailEvent {
  type: EmailEventType.PASSWORD_RESET;
  userId: string;
  userEmail: string;
  resetToken: string;
}

// Contact form event
export interface ContactFormEvent extends BaseEmailEvent {
  type: EmailEventType.CONTACT_FORM;
  senderName: string;
  senderEmail: string;
  message: string;
}

// Union type for all email events
export type EmailEvent =
  | OrderConfirmationEvent
  | AdminOrderNotificationEvent
  | ShippingNotificationEvent
  | OrderStatusUpdateEvent
  | WelcomeEmailEvent
  | PasswordResetEvent
  | ContactFormEvent;
```

### 2. Email Event Publisher Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EmailEvent, EmailEventType } from './types/email-event.types';

@Injectable()
export class EmailEventPublisher {
  private readonly logger = new Logger(EmailEventPublisher.name);
  private emailQueue: Queue;

  constructor() {
    // Initialize BullMQ queue with Redis connection
    this.emailQueue = new Queue('email-events', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        attempts: 5, // Maximum retry attempts
        backoff: {
          type: 'exponential',
          delay: 60000, // Start with 1 minute
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: false, // Keep failed jobs for debugging
      },
    });
  }

  /**
   * Publish email event to queue
   * @param event - Email event to publish
   * @returns Job ID
   */
  async publishEvent(event: EmailEvent): Promise<string> {
    try {
      // Validate event before publishing
      this.validateEvent(event);

      // Add job to queue with priority based on event type
      const job = await this.emailQueue.add(
        event.type,
        event,
        {
          priority: this.getEventPriority(event.type),
        }
      );

      this.logger.log(
        `Email event published: ${event.type} (Job ID: ${job.id})`
      );

      return job.id;
    } catch (error) {
      this.logger.error(
        `Failed to publish email event: ${event.type}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Validate email event structure
   */
  private validateEvent(event: EmailEvent): void {
    if (!event.type || !Object.values(EmailEventType).includes(event.type)) {
      throw new Error(`Invalid email event type: ${event.type}`);
    }

    if (!event.locale || !['en', 'vi'].includes(event.locale)) {
      throw new Error(`Invalid locale: ${event.locale}`);
    }

    // Type-specific validation
    switch (event.type) {
      case EmailEventType.ORDER_CONFIRMATION:
      case EmailEventType.ADMIN_ORDER_NOTIFICATION:
      case EmailEventType.SHIPPING_NOTIFICATION:
      case EmailEventType.ORDER_STATUS_UPDATE:
        if (!event.orderId || !event.orderNumber) {
          throw new Error('Order events require orderId and orderNumber');
        }
        break;

      case EmailEventType.WELCOME_EMAIL:
      case EmailEventType.PASSWORD_RESET:
        if (!event.userId || !event.userEmail) {
          throw new Error('User events require userId and userEmail');
        }
        break;

      case EmailEventType.CONTACT_FORM:
        if (!event.senderEmail || !event.message) {
          throw new Error('Contact form events require senderEmail and message');
        }
        break;
    }
  }

  /**
   * Get priority for event type
   * Lower number = higher priority
   */
  private getEventPriority(type: EmailEventType): number {
    const priorities = {
      [EmailEventType.PASSWORD_RESET]: 1, // Highest priority
      [EmailEventType.ORDER_CONFIRMATION]: 2,
      [EmailEventType.ADMIN_ORDER_NOTIFICATION]: 2,
      [EmailEventType.SHIPPING_NOTIFICATION]: 3,
      [EmailEventType.ORDER_STATUS_UPDATE]: 4,
      [EmailEventType.WELCOME_EMAIL]: 5,
      [EmailEventType.CONTACT_FORM]: 6, // Lowest priority
    };

    return priorities[type] || 10;
  }

  /**
   * Get queue metrics for monitoring
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Graceful shutdown
   */
  async onModuleDestroy() {
    await this.emailQueue.close();
  }
}
```

### 3. Email Worker Service

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { EmailEvent, EmailEventType } from './types/email-event.types';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { PrismaService } from '../prisma/prisma.service';
import { FooterSettingsService } from '../footer-settings/footer-settings.service';

@Injectable()
export class EmailWorker implements OnModuleInit {
  private readonly logger = new Logger(EmailWorker.name);
  private worker: Worker;

  constructor(
    private emailService: EmailService,
    private emailTemplateService: EmailTemplateService,
    private prisma: PrismaService,
    private footerSettingsService: FooterSettingsService,
  ) {}

  onModuleInit() {
    // Initialize BullMQ worker
    this.worker = new Worker(
      'email-events',
      async (job: Job<EmailEvent>) => {
        return this.processEmailEvent(job);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        concurrency: 5, // Process 5 emails concurrently
        limiter: {
          max: 100, // Max 100 emails
          duration: 60000, // Per minute (rate limiting)
        },
      }
    );

    // Event listeners for monitoring
    this.worker.on('completed', (job) => {
      this.logger.log(
        `Email sent successfully: ${job.data.type} (Job ID: ${job.id})`
      );
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Email failed: ${job?.data?.type} (Job ID: ${job?.id})`,
        error.stack
      );
    });

    this.worker.on('error', (error) => {
      this.logger.error('Worker error:', error.stack);
    });

    this.logger.log('Email worker started');
  }

  /**
   * Process email event based on type
   */
  private async processEmailEvent(job: Job<EmailEvent>): Promise<void> {
    const event = job.data;

    this.logger.log(
      `Processing email event: ${event.type} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts})`
    );

    try {
      switch (event.type) {
        case EmailEventType.ORDER_CONFIRMATION:
          await this.sendOrderConfirmation(event);
          break;

        case EmailEventType.ADMIN_ORDER_NOTIFICATION:
          await this.sendAdminOrderNotification(event);
          break;

        case EmailEventType.SHIPPING_NOTIFICATION:
          await this.sendShippingNotification(event);
          break;

        case EmailEventType.ORDER_STATUS_UPDATE:
          await this.sendOrderStatusUpdate(event);
          break;

        case EmailEventType.WELCOME_EMAIL:
          await this.sendWelcomeEmail(event);
          break;

        case EmailEventType.PASSWORD_RESET:
          await this.sendPasswordReset(event);
          break;

        case EmailEventType.CONTACT_FORM:
          await this.sendContactForm(event);
          break;

        default:
          throw new Error(`Unknown email event type: ${(event as any).type}`);
      }
    } catch (error) {
      // Check if error is permanent (validation error) or temporary (network issue)
      if (this.isPermanentError(error)) {
        // Move to dead letter queue immediately
        this.logger.error(
          `Permanent error for ${event.type}, moving to DLQ`,
          error.stack
        );
        throw new Error(`PERMANENT_ERROR: ${error.message}`);
      }

      // Temporary error - will be retried
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  private async sendOrderConfirmation(event: OrderConfirmationEvent): Promise<void> {
    // Fetch full order data from database
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    // Generate email template
    const template = this.emailTemplateService.getOrderConfirmationTemplate(
      this.mapOrderToEmailData(order),
      event.locale
    );

    // Send email
    const success = await this.emailService.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }
  }

  /**
   * Send admin order notification
   */
  private async sendAdminOrderNotification(event: AdminOrderNotificationEvent): Promise<void> {
    // Get admin email from footer settings
    const footerSettings = await this.footerSettingsService.getFooterSettings();

    if (!footerSettings.contactEmail) {
      this.logger.warn('Admin email not configured, skipping notification');
      return; // Don't fail the job
    }

    // Fetch full order data
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    // Generate email template
    const template = this.emailTemplateService.getAdminOrderNotificationTemplate(
      this.mapOrderToAdminEmailData(order),
      event.locale
    );

    // Send email
    const success = await this.emailService.sendEmail({
      to: footerSettings.contactEmail,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }
  }

  /**
   * Send shipping notification
   */
  private async sendShippingNotification(event: ShippingNotificationEvent): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    const template = this.emailTemplateService.getShippingNotificationTemplate(
      {
        ...this.mapOrderToEmailData(order),
        trackingNumber: event.trackingNumber,
      },
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }
  }

  /**
   * Send order status update
   */
  private async sendOrderStatusUpdate(event: OrderStatusUpdateEvent): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new Error(`Order not found: ${event.orderId}`);
    }

    const template = this.emailTemplateService.getOrderStatusUpdateTemplate(
      this.mapOrderToEmailData(order),
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: order.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(event: WelcomeEmailEvent): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: event.userId },
    });

    if (!user) {
      throw new Error(`User not found: ${event.userId}`);
    }

    const template = this.emailTemplateService.getWelcomeEmailTemplate(
      {
        userName: user.name,
        userEmail: user.email,
      },
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }
  }

  /**
   * Send password reset email
   */
  private async sendPasswordReset(event: PasswordResetEvent): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: event.userId },
    });

    if (!user) {
      throw new Error(`User not found: ${event.userId}`);
    }

    const template = this.emailTemplateService.getPasswordResetTemplate(
      {
        userName: user.name,
        resetToken: event.resetToken,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${event.resetToken}`,
      },
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }
  }

  /**
   * Send contact form notification
   */
  private async sendContactForm(event: ContactFormEvent): Promise<void> {
    const footerSettings = await this.footerSettingsService.getFooterSettings();

    if (!footerSettings.contactEmail) {
      this.logger.warn('Admin email not configured, skipping contact form notification');
      return;
    }

    const template = this.emailTemplateService.getContactFormTemplate(
      {
        senderName: event.senderName,
        senderEmail: event.senderEmail,
        message: event.message,
      },
      event.locale
    );

    const success = await this.emailService.sendEmail({
      to: footerSettings.contactEmail,
      subject: template.subject,
      html: template.html,
      locale: event.locale,
    });

    if (!success) {
      throw new Error('Email service returned false');
    }
  }

  /**
   * Check if error is permanent (validation) or temporary (network)
   */
  private isPermanentError(error: any): boolean {
    const permanentErrors = [
      'Order not found',
      'User not found',
      'Invalid email address',
      'Invalid event type',
    ];

    return permanentErrors.some(msg => error.message?.includes(msg));
  }

  /**
   * Helper to map order to email data
   */
  private mapOrderToEmailData(order: any): any {
    // Implementation matches existing OrdersService mapping
    return {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customerName: order.customerName,
      customerEmail: order.email,
      items: order.orderItems.map((item: any) => ({
        productName: item.product.name,
        productNameVi: item.product.nameVi,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      shippingAddress: order.shippingAddress,
      status: order.status,
    };
  }

  /**
   * Helper to map order to admin email data
   */
  private mapOrderToAdminEmailData(order: any): any {
    return {
      ...this.mapOrderToEmailData(order),
      billingAddress: order.billingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      notes: order.notes,
    };
  }

  /**
   * Graceful shutdown
   */
  async onModuleDestroy() {
    await this.worker.close();
  }
}
```

### 4. Email Queue Module

```typescript
import { Module } from '@nestjs/common';
import { EmailEventPublisher } from './email-event-publisher.service';
import { EmailWorker } from './email-worker.service';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';

@Module({
  imports: [PrismaModule, FooterSettingsModule],
  providers: [
    EmailEventPublisher,
    EmailWorker,
    EmailService,
    EmailTemplateService,
  ],
  exports: [EmailEventPublisher],
})
export class EmailQueueModule {}
```

## Data Models

### Email Event Schema

All email events follow this structure when stored in Redis:

```typescript
{
  // Job metadata (managed by BullMQ)
  id: string;              // Unique job ID
  name: string;            // Event type
  data: EmailEvent;        // Event payload
  opts: {
    attempts: number;      // Max retry attempts
    backoff: {
      type: 'exponential';
      delay: number;       // Initial delay in ms
    };
    priority: number;      // Job priority
    timestamp: number;     // Creation timestamp
  };
  progress: number;        // 0-100
  returnvalue: any;        // Result after completion
  stacktrace: string[];    // Error stack traces
  attemptsMade: number;    // Current attempt count
  finishedOn: number;      // Completion timestamp
  processedOn: number;     // Processing start timestamp
}
```

### Queue Metrics Schema

```typescript
interface QueueMetrics {
  waiting: number;    // Jobs waiting to be processed
  active: number;     // Jobs currently being processed
  completed: number;  // Successfully completed jobs
  failed: number;     // Failed jobs (after all retries)
  delayed: number;    // Jobs scheduled for future processing
  total: number;      // Sum of all jobs
}
```

##
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 2.1-2.5 (event creation) can be combined into a single comprehensive property about correct event structure generation
- Properties 4.2-4.5 (backward compatibility) can be consolidated into properties about content and configuration consistency
- Properties 5.1-5.4 (logging) can be combined into comprehensive logging properties
- Properties 6.1-6.5 (validation) can be consolidated into input and schema validation properties

### Core Properties

**Property 1: Asynchronous processing performance**
*For any* email event publication request, the Email_Event_Publisher should return within 100ms regardless of email service performance or availability
**Validates: Requirements 1.1, 1.2, 1.5**

**Property 2: System resilience under email service failure**
*For any* business operation that triggers email events, the main process should complete successfully even when the email service is unavailable
**Validates: Requirements 1.3**

**Property 3: Event persistence durability**
*For any* email event added to the queue, the event should remain persisted until successfully processed, even across system restarts
**Validates: Requirements 1.4, 7.1**

**Property 4: Correct event structure generation**
*For any* email type and valid input data, the Email_Event_Publisher should create an event with the correct type, required fields, and properly formatted data
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

**Property 5: Exponential backoff retry behavior**
*For any* email delivery that fails due to temporary issues, the Email_Worker should retry with exponentially increasing delays (1min, 5min, 15min, 1hr, 4hr)
**Validates: Requirements 3.1, 3.3**

**Property 6: Dead letter queue for permanent failures**
*For any* email that fails after maximum retry attempts or contains invalid data, the Email_Worker should move it to the dead letter queue without further retries
**Validates: Requirements 3.2, 3.4**

**Property 7: Automatic recovery after service restoration**
*For any* queued email events, when the email service is restored after downtime, the Email_Worker should automatically resume processing all pending events
**Validates: Requirements 3.5**

**Property 8: Backward compatibility interface**
*For any* existing email service method call, the Email_Event_Publisher should provide the same interface and behavior as the current EmailService
**Validates: Requirements 4.1**

**Property 9: Content consistency with current system**
*For any* email template generation with identical input data, the new Email_Queue_System should produce the same email content as the current system
**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

**Property 10: Comprehensive event logging**
*For any* email event lifecycle (creation, processing, success, failure), the system should log appropriate information with timestamps, identifiers, and relevant details
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 11: Queue metrics availability**
*For any* point in time, the Email_Queue_System should provide accurate metrics about queue depth, processing rate, and failure rates
**Validates: Requirements 5.5**

**Property 12: Input validation before queuing**
*For any* email event creation request, the Email_Event_Publisher should validate all required fields, email addresses, and locale information before adding to the queue
**Validates: Requirements 6.1, 6.2, 6.5**

**Property 13: Schema validation during processing**
*For any* email event processed by the Email_Worker, the event structure should match the expected schema for its type, with incomplete data moved to dead letter queue
**Validates: Requirements 6.3, 6.4**

**Property 14: Crash recovery without data loss**
*For any* worker crash or Redis disconnection, unprocessed events should remain in the queue and be recoverable when the system restarts
**Validates: Requirements 7.2, 7.3**

**Property 15: Graceful shutdown completion**
*For any* graceful system shutdown, currently processing email events should complete before the Email_Worker terminates
**Validates: Requirements 7.4**

**Property 16: Exactly-once processing guarantee**
*For any* email event in a multi-worker environment, the event should be processed exactly once with no duplicates
**Validates: Requirements 7.5**

## Error Handling

### Error Categories

1. **Validation Errors** (Permanent)
   - Invalid email addresses
   - Missing required fields
   - Unsupported locales
   - Malformed event data
   - Action: Immediate failure, move to DLQ

2. **Business Logic Errors** (Permanent)
   - Order not found
   - User not found
   - Invalid event type
   - Action: Immediate failure, move to DLQ

3. **Network/Service Errors** (Temporary)
   - SMTP server unavailable
   - DNS resolution failures
   - Connection timeouts
   - Rate limiting responses
   - Action: Retry with exponential backoff

4. **System Errors** (Temporary)
   - Redis connection lost
   - Database connection issues
   - Memory/resource constraints
   - Action: Retry with exponential backoff

### Retry Strategy

```typescript
const retryConfig = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 60000, // 1 minute initial delay
    settings: {
      multiplier: 5,    // 1min, 5min, 25min, 2hr, 10hr
      maxDelay: 36000000, // 10 hours maximum
    }
  }
};
```

### Dead Letter Queue

Failed jobs are moved to a separate DLQ for manual review:
- Jobs that exceed maximum retry attempts
- Jobs with permanent validation errors
- Jobs with corrupted data
- Retention: 30 days for analysis

### Circuit Breaker Pattern

Implement circuit breaker for email service:
- Open circuit after 10 consecutive failures
- Half-open after 5 minutes
- Close circuit after 3 successful sends

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing:

**Unit Tests** verify:
- Specific email event creation scenarios
- Error handling for known failure cases
- Integration between components
- Configuration loading and validation

**Property-Based Tests** verify:
- Universal properties across all email types and data combinations
- System behavior under various failure conditions
- Performance characteristics under load
- Data consistency and durability guarantees

### Property-Based Testing Framework

**Library**: fast-check (already in dependencies)
**Configuration**: Minimum 100 iterations per property test
**Test Tagging**: Each property test must reference the design document property

### Unit Testing Areas

1. **Email Event Publisher**
   - Event validation logic
   - Queue connection handling
   - Priority assignment
   - Error scenarios

2. **Email Worker**
   - Event processing logic
   - Template generation
   - Database queries
   - Error classification

3. **Integration Tests**
   - End-to-end email flow
   - Queue persistence
   - Worker recovery
   - Monitoring endpoints

### Performance Testing

1. **Load Testing**
   - 1000 concurrent email events
   - Response time under 100ms
   - Memory usage stability

2. **Stress Testing**
   - Queue depth limits
   - Worker concurrency limits
   - Redis connection limits

3. **Endurance Testing**
   - 24-hour continuous operation
   - Memory leak detection
   - Connection pool stability

### Monitoring and Observability

1. **Metrics Collection**
   - Queue depth and processing rate
   - Success/failure rates by email type
   - Average processing time
   - Retry attempt distribution

2. **Health Checks**
   - Redis connectivity
   - Worker process status
   - Queue processing lag

3. **Alerting**
   - High failure rates (>5%)
   - Queue depth exceeding thresholds
   - Worker process failures
   - Dead letter queue growth

4. **Logging Standards**
   - Structured JSON logging
   - Correlation IDs for tracing
   - Performance metrics
   - Error stack traces

### Migration Strategy

1. **Phase 1: Parallel Implementation**
   - Deploy new queue system alongside existing
   - Route 10% of emails through new system
   - Monitor and compare results

2. **Phase 2: Gradual Migration**
   - Increase traffic to 50%, then 90%
   - Monitor performance and reliability
   - Keep fallback to old system

3. **Phase 3: Full Migration**
   - Route 100% through new system
   - Remove old email service code
   - Clean up unused dependencies

4. **Rollback Plan**
   - Feature flags for instant rollback
   - Database compatibility maintained
   - Monitoring alerts for issues

### Production Considerations

1. **Scaling**
   - Horizontal worker scaling
   - Redis cluster for high availability
   - Load balancing across workers

2. **Security**
   - Encrypt sensitive data in queue
   - Secure Redis connections (TLS)
   - Access control for monitoring

3. **Compliance**
   - Email delivery logging for audits
   - Data retention policies
   - GDPR compliance for user data

4. **Disaster Recovery**
   - Redis backup and restore
   - Queue state recovery procedures
   - Cross-region replication options