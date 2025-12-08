# Requirements Document

## Introduction

This document outlines the requirements for enhancing the email notification system in the e-commerce application. The system currently sends order confirmation and status update emails to customers. This enhancement will add admin notifications for new orders and improve the email template system to support bilingual (English and Vietnamese) HTML templates with better formatting.

## Glossary

- **Email Service**: The backend service responsible for sending emails using the Linux `mail` command
- **Email Template Service**: The backend service that generates HTML email templates in both English and Vietnamese
- **Order Service**: The backend service that manages order creation and status updates
- **Admin Email**: The email address stored in the footer_settings table's contactEmail field where admin notifications are sent
- **Customer Email**: The email address provided by the customer during checkout where order confirmations are sent
- **Order Confirmation Email**: Email sent to the customer when a new order is placed
- **Admin Order Notification Email**: Email sent to the admin when a new order is placed
- **Order Status Update Email**: Email sent to the customer when the admin changes the order status
- **HTML Email Template**: A formatted email template with proper styling and structure

## Requirements

### Requirement 1

**User Story:** As a customer, I want to receive a well-formatted order confirmation email when I place an order, so that I have a clear record of my purchase with all relevant details.

#### Acceptance Criteria

1. WHEN a customer completes an order THEN the Email Service SHALL send an order confirmation email to the customer's email address
2. WHEN the order confirmation email is generated THEN the Email Template Service SHALL include the order number, order date, customer name, and all order items with quantities and prices
3. WHEN the order confirmation email is generated THEN the Email Template Service SHALL include the subtotal, shipping cost, tax amount, discount amount (if applicable), and total amount
4. WHEN the order confirmation email is generated THEN the Email Template Service SHALL include the complete shipping address
5. WHEN the order confirmation email is generated THEN the Email Template Service SHALL format the email as HTML with proper styling and structure
6. WHEN the order confirmation email is generated THEN the Email Template Service SHALL use the customer's preferred language (English or Vietnamese) for all text content

### Requirement 2

**User Story:** As a shop owner, I want to receive an email notification when a customer places a new order, so that I can promptly process the order and prepare it for shipment.

#### Acceptance Criteria

1. WHEN a customer completes an order THEN the Email Service SHALL send an admin notification email to the shop's contact email address
2. WHEN the admin notification email is generated THEN the Email Template Service SHALL retrieve the admin email address from the footer_settings table's contactEmail field
3. WHEN the footer_settings table does not contain a contactEmail value THEN the Email Service SHALL log a warning and skip sending the admin notification
4. WHEN the admin notification email is generated THEN the Email Template Service SHALL include the order number, order date, customer name, customer email, and customer phone number
5. WHEN the admin notification email is generated THEN the Email Template Service SHALL include all order items with product names, SKUs, quantities, and prices
6. WHEN the admin notification email is generated THEN the Email Template Service SHALL include the subtotal, shipping cost, shipping method, tax amount, discount amount (if applicable), and total amount
7. WHEN the admin notification email is generated THEN the Email Template Service SHALL include the complete shipping address and billing address
8. WHEN the admin notification email is generated THEN the Email Template Service SHALL include the payment method and payment status
9. WHEN the admin notification email is generated THEN the Email Template Service SHALL include any customer notes or special instructions
10. WHEN the admin notification email is generated THEN the Email Template Service SHALL format the email as HTML with proper styling and structure

### Requirement 3

**User Story:** As a customer, I want to receive an email notification when the status of my order changes, so that I can track the progress of my order and know when to expect delivery.

#### Acceptance Criteria

1. WHEN an admin updates an order status THEN the Email Service SHALL send a status update email to the customer's email address
2. WHEN the order status changes to SHIPPED THEN the Email Template Service SHALL generate a shipping notification email with tracking information (if available)
3. WHEN the order status changes to any other status THEN the Email Template Service SHALL generate a general status update email
4. WHEN the status update email is generated THEN the Email Template Service SHALL include the order number, customer name, and the new status
5. WHEN the status update email is generated THEN the Email Template Service SHALL include a status-specific message explaining what the status means
6. WHEN the status update email is generated THEN the Email Template Service SHALL format the email as HTML with proper styling and structure
7. WHEN the status update email is generated THEN the Email Template Service SHALL use the customer's preferred language (English or Vietnamese) for all text content

### Requirement 4

**User Story:** As a developer, I want the email system to handle failures gracefully, so that order processing continues even if email delivery fails.

#### Acceptance Criteria

1. WHEN an email fails to send THEN the Email Service SHALL log the error with details about the failure
2. WHEN an email fails to send THEN the Email Service SHALL NOT throw an exception that would interrupt order processing
3. WHEN the admin email address is not configured THEN the Email Service SHALL log a warning and continue processing without sending the admin notification
4. WHEN the mail command is not available on the system THEN the Email Service SHALL log an error and continue processing
5. WHEN email sending fails THEN the Order Service SHALL complete the order creation or status update successfully

### Requirement 5

**User Story:** As a developer, I want email templates to be well-structured and maintainable, so that I can easily update email content and styling in the future.

#### Acceptance Criteria

1. WHEN an email template is generated THEN the Email Template Service SHALL use a consistent HTML structure with proper DOCTYPE and meta tags
2. WHEN an email template is generated THEN the Email Template Service SHALL include inline CSS styles for maximum email client compatibility
3. WHEN an email template is generated THEN the Email Template Service SHALL use a responsive design that works on both desktop and mobile email clients
4. WHEN an email template is generated THEN the Email Template Service SHALL include the shop's branding elements (logo, colors, contact information)
5. WHEN an email template is generated THEN the Email Template Service SHALL format currency values with proper decimal places and currency symbols
6. WHEN an email template is generated THEN the Email Template Service SHALL format dates in a human-readable format appropriate for the selected language

### Requirement 6

**User Story:** As a shop owner, I want to configure the admin notification email address through the admin panel, so that I can easily update where order notifications are sent without modifying code.

#### Acceptance Criteria

1. WHEN the admin updates the footer settings THEN the System SHALL save the contactEmail value to the footer_settings table
2. WHEN the Email Service needs to send an admin notification THEN the Email Service SHALL query the footer_settings table for the current contactEmail value
3. WHEN the contactEmail value changes THEN the Email Service SHALL use the new email address for all subsequent admin notifications
4. WHEN the contactEmail value is null or empty THEN the Email Service SHALL skip sending admin notifications and log a warning
