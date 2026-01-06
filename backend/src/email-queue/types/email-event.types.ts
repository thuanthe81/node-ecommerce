/**
 * Email Event Types and Interfaces
 *
 * This file defines all email event types and their corresponding data structures
 * for the asynchronous email queue system.
 */

/**
 * Enum defining all supported email event types
 */
export enum EmailEventType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_CONFIRMATION_RESEND = 'ORDER_CONFIRMATION_RESEND',
  INVOICE_EMAIL = 'INVOICE_EMAIL',
  ADMIN_ORDER_NOTIFICATION = 'ADMIN_ORDER_NOTIFICATION',
  SHIPPING_NOTIFICATION = 'SHIPPING_NOTIFICATION',
  ORDER_STATUS_UPDATE = 'ORDER_STATUS_UPDATE',
  ORDER_CANCELLATION = 'ORDER_CANCELLATION',
  ADMIN_CANCELLATION_NOTIFICATION = 'ADMIN_CANCELLATION_NOTIFICATION',
  PAYMENT_STATUS_UPDATE = 'PAYMENT_STATUS_UPDATE',
  WELCOME_EMAIL = 'WELCOME_EMAIL',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CONTACT_FORM = 'CONTACT_FORM',
}

/**
 * Base interface for all email events
 * Contains common fields shared across all event types
 */
export interface BaseEmailEvent {
  type: EmailEventType;
  locale: 'en' | 'vi';
  timestamp: Date;
}

/**
 * Order confirmation email event
 * Sent to customers after successful order placement
 */
export interface OrderConfirmationEvent extends BaseEmailEvent {
  type: EmailEventType.ORDER_CONFIRMATION;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
}

/**
 * Order confirmation resend email event
 * Sent to customers when they request a resend of their order confirmation
 */
export interface OrderConfirmationResendEvent extends BaseEmailEvent {
  type: EmailEventType.ORDER_CONFIRMATION_RESEND;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
}

/**
 * Invoice email event
 * Sent to customers with PDF invoice attachment for fully-priced orders
 */
export interface InvoiceEmailEvent extends BaseEmailEvent {
  type: EmailEventType.INVOICE_EMAIL;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  adminUserId?: string; // ID of admin who triggered the invoice
}

/**
 * Admin order notification email event
 * Sent to administrators when a new order is placed
 */
export interface AdminOrderNotificationEvent extends BaseEmailEvent {
  type: EmailEventType.ADMIN_ORDER_NOTIFICATION;
  orderId: string;
  orderNumber: string;
}

/**
 * Shipping notification email event
 * Sent to customers when their order is shipped
 */
export interface ShippingNotificationEvent extends BaseEmailEvent {
  type: EmailEventType.SHIPPING_NOTIFICATION;
  orderId: string;
  orderNumber: string;
  trackingNumber?: string;
}

/**
 * Order status update email event
 * Sent to customers when their order status changes
 */
export interface OrderStatusUpdateEvent extends BaseEmailEvent {
  type: EmailEventType.ORDER_STATUS_UPDATE;
  orderId: string;
  orderNumber: string;
  newStatus: string;
}

/**
 * Welcome email event
 * Sent to new users after successful registration
 */
export interface WelcomeEmailEvent extends BaseEmailEvent {
  type: EmailEventType.WELCOME_EMAIL;
  userId: string;
  userEmail: string;
  userName: string;
}

/**
 * Password reset email event
 * Sent to users who request a password reset
 */
export interface PasswordResetEvent extends BaseEmailEvent {
  type: EmailEventType.PASSWORD_RESET;
  userId: string;
  userEmail: string;
  resetToken: string;
}

/**
 * Contact form email event
 * Sent to administrators when a contact form is submitted
 */
export interface ContactFormEvent extends BaseEmailEvent {
  type: EmailEventType.CONTACT_FORM;
  senderName: string;
  senderEmail: string;
  message: string;
}

/**
 * Order cancellation email event
 * Sent to customers when their order is cancelled
 */
export interface OrderCancellationEvent extends BaseEmailEvent {
  type: EmailEventType.ORDER_CANCELLATION;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  cancellationReason?: string;
}

/**
 * Admin cancellation notification email event
 * Sent to administrators when an order is cancelled
 */
export interface AdminCancellationNotificationEvent extends BaseEmailEvent {
  type: EmailEventType.ADMIN_CANCELLATION_NOTIFICATION;
  orderId: string;
  orderNumber: string;
  cancellationReason?: string;
}

/**
 * Payment status update email event
 * Sent to customers when their payment status changes
 */
export interface PaymentStatusUpdateEvent extends BaseEmailEvent {
  type: EmailEventType.PAYMENT_STATUS_UPDATE;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  paymentStatus: string;
  statusMessage?: string;
}

/**
 * Union type representing all possible email events
 * Used for type-safe event handling
 */
export type EmailEvent =
  | OrderConfirmationEvent
  | OrderConfirmationResendEvent
  | InvoiceEmailEvent
  | AdminOrderNotificationEvent
  | ShippingNotificationEvent
  | OrderStatusUpdateEvent
  | OrderCancellationEvent
  | AdminCancellationNotificationEvent
  | PaymentStatusUpdateEvent
  | WelcomeEmailEvent
  | PasswordResetEvent
  | ContactFormEvent;
