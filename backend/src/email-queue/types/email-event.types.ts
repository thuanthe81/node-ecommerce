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
  ADMIN_ORDER_NOTIFICATION = 'ADMIN_ORDER_NOTIFICATION',
  SHIPPING_NOTIFICATION = 'SHIPPING_NOTIFICATION',
  ORDER_STATUS_UPDATE = 'ORDER_STATUS_UPDATE',
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
 * Union type representing all possible email events
 * Used for type-safe event handling
 */
export type EmailEvent =
  | OrderConfirmationEvent
  | AdminOrderNotificationEvent
  | ShippingNotificationEvent
  | OrderStatusUpdateEvent
  | WelcomeEmailEvent
  | PasswordResetEvent
  | ContactFormEvent;
