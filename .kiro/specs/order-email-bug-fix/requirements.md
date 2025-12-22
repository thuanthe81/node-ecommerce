# Requirements Document

## Introduction

This document outlines the requirements for fixing critical bugs in the order confirmation email system. The system currently has two major issues: (1) email templates display ugly CSS formatting with special characters appearing at the end of the CSS, and (2) customers receive 4 duplicate confirmation emails for a single order.

## Glossary

- **Email_Template_Service**: The service responsible for generating HTML email templates with proper formatting
- **Email_Worker**: The background worker that processes email events from the queue
- **Email_Event_Publisher**: The service that publishes email events to the queue
- **Order_Service**: The service that handles order creation and triggers email notifications
- **HTML_Escaping**: The process of converting special characters to HTML entities to prevent rendering issues
- **Email_Deduplication**: The mechanism to prevent duplicate emails from being sent for the same event

## Requirements

### Requirement 1

**User Story:** As a customer, I want to receive properly formatted order confirmation emails, so that I can read the email content without seeing ugly CSS code or special characters.

#### Acceptance Criteria

1. WHEN an order confirmation email is generated THEN the Email_Template_Service SHALL properly escape all special characters in HTML content
2. WHEN an order confirmation email is generated THEN the Email_Template_Service SHALL ensure CSS styles are properly closed and formatted
3. WHEN an order confirmation email is displayed THEN the email SHALL NOT show raw CSS code or special characters at the end of the content
4. WHEN HTML content contains special characters (quotes, ampersands, less-than, greater-than) THEN the Email_Template_Service SHALL convert them to HTML entities
5. WHEN the email template is generated THEN the Email_Template_Service SHALL validate that all HTML tags are properly closed

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
