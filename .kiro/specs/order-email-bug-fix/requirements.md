# Requirements Document

## Introduction

This document outlines the requirements for fixing critical bugs in the order confirmation email system. The system currently has two major issues: (1) email templates display complex CSS code as visible text in the email body, causing poor user experience, and (2) customers receive 4 duplicate confirmation emails for a single order. The solution is to completely simplify the email template to contain only essential information without complex styling.

## Glossary

- **Email_Template_Service**: The service responsible for generating HTML email templates with proper formatting
- **Email_Worker**: The background worker that processes email events from the queue
- **Email_Event_Publisher**: The service that publishes email events to the queue
- **Order_Service**: The service that handles order creation and triggers email notifications
- **Simple_Email_Template**: A minimal email template containing only essential order information without complex CSS or styling
- **Order_Link**: A direct link to view the order details on the website
- **Essential_Information**: Core order data including order ID, creation date, and customer information

## Requirements

### Requirement 1

**User Story:** As a customer, I want to receive a simple, clean order confirmation email with essential information, so that I can quickly understand my order details without seeing any technical code or styling issues.

#### Acceptance Criteria

1. WHEN an order confirmation email is generated THEN the Email_Template_Service SHALL create a simple template with only essential information
2. WHEN an order confirmation email is displayed THEN the email SHALL contain only: order ID, creation date, order link, and customer information
3. WHEN the email template is generated THEN it SHALL use minimal inline styles only (no CSS blocks, no complex styling)
4. WHEN HTML content contains special characters THEN the Email_Template_Service SHALL convert them to HTML entities
5. WHEN the email is sent THEN it SHALL be readable and professional without any visible CSS code or technical artifacts

### Requirement 1.5

**User Story:** As a customer, I want to easily access my order details, so that I can view my complete order information when needed.

#### Acceptance Criteria

1. WHEN an order confirmation email is sent THEN it SHALL include a direct link to view the order on the website
2. WHEN the order link is clicked THEN it SHALL take the customer directly to their order details page
3. WHEN the email contains customer information THEN it SHALL display the customer's name and email address
4. WHEN the email is generated THEN it SHALL be compatible with all major email clients without complex CSS
5. WHEN the email is viewed THEN it SHALL maintain a clean, professional appearance with basic formatting only

### Requirement 2

**User Story:** As a customer, I want to receive only one order confirmation email per order, so that I am not confused or annoyed by duplicate notifications.

#### Acceptance Criteria

1. WHEN an order is created THEN the Order_Service SHALL publish exactly one order confirmation event to the email queue
2. WHEN an order confirmation event is published THEN the Email_Event_Publisher SHALL use deduplication to prevent duplicate events
3. WHEN an order confirmation event is processed THEN the Email_Worker SHALL send exactly one email to the customer
4. WHEN multiple order confirmation events with the same order ID are published within a short time window THEN the Email_Event_Publisher SHALL deduplicate them and process only one
5. WHEN the order creation process completes THEN the customer SHALL receive exactly one order confirmation email

### Requirement 3

**User Story:** As a developer, I want to identify the root cause of duplicate emails, so that I can prevent similar issues in the future.

#### Acceptance Criteria

1. WHEN investigating duplicate emails THEN the system SHALL provide logging to trace all email event publications
2. WHEN an order is created THEN the system SHALL log each call to sendOrderConfirmation with timestamps
3. WHEN an email event is published THEN the system SHALL log the job ID and deduplication status
4. WHEN an email is sent THEN the system SHALL log the delivery status and recipient
5. WHEN duplicate events are detected THEN the system SHALL log warnings with details about the duplication

### Requirement 4

**User Story:** As a system administrator, I want to verify that the email fixes work correctly, so that I can ensure customers receive proper notifications.

#### Acceptance Criteria

1. WHEN testing the order flow THEN the system SHALL provide a way to verify email content formatting
2. WHEN testing the order flow THEN the system SHALL provide a way to count emails sent per order
3. WHEN an order is placed in test mode THEN the system SHALL log all email events and deliveries
4. WHEN reviewing email logs THEN the system SHALL show clear evidence of deduplication working
5. WHEN reviewing email content THEN the system SHALL show that HTML is properly formatted without CSS artifacts
