# Implementation Plan

- [x] 1. Enhance EmailTemplateService with improved HTML templates and admin notification support
  - [x] 1.1 Add helper method for consistent email HTML layout
    - Create `wrapInEmailLayout()` method that provides consistent HTML structure
    - Include DOCTYPE, meta tags, and responsive design elements
    - Add header with branding, content area, and footer with contact info
    - Use table-based layout for email client compatibility
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 1.2 Add helper methods for formatting
    - Create `formatCurrency()` method for locale-specific currency formatting
    - Create `formatDate()` method for locale-specific date formatting
    - Handle VND (0 decimals) vs USD (2 decimals) formatting
    - _Requirements: 5.5, 5.6_

  - [x] 1.3 Create admin order notification template method
    - Implement `getAdminOrderNotificationTemplate()` method
    - Include all order details: customer info, items with SKUs, addresses, payment info
    - Support both English and Vietnamese
    - Include customer notes if present
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 1.4 Write property test for admin email content completeness
    - **Property 4: Admin email content completeness**
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

  - [x] 1.5 Enhance existing order confirmation template
    - Update `getOrderConfirmationTemplate()` to use new HTML layout wrapper
    - Improve styling with inline CSS
    - Use new formatting helper methods
    - Ensure all required fields are included
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 1.6 Write property test for customer email content completeness
    - **Property 2: Customer email content completeness**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [x] 1.7 Enhance status update email templates
    - Update `getOrderStatusUpdateTemplate()` to use new HTML layout
    - Add status-specific messages for each order status
    - Improve styling and formatting
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [ ]* 1.8 Write property test for HTML email structure consistency
    - **Property 8: HTML email structure consistency**
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 1.9 Write property test for bilingual content consistency
    - **Property 9: Bilingual content consistency**
    - **Validates: Requirements 1.6, 3.7**

  - [ ]* 1.10 Write property test for currency formatting consistency
    - **Property 10: Currency formatting consistency**
    - **Validates: Requirements 5.5**

- [x] 2. Enhance EmailService with better error handling and validation
  - [x] 2.1 Add email validation method
    - Create `isValidEmail()` method to validate email addresses
    - Use regex pattern for email validation
    - _Requirements: 4.1, 4.2_

  - [x] 2.2 Enhance sendEmail method with validation and error handling
    - Validate email address before sending
    - Return boolean indicating success/failure instead of void
    - Improve error logging with more details
    - Ensure exceptions don't propagate
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 2.3 Improve HTML to plain text conversion
    - Enhance `htmlToPlainText()` method to handle more HTML elements
    - Better handling of tables and lists
    - Preserve formatting for better readability
    - _Requirements: 1.5_

  - [ ]* 2.4 Write property test for email failure resilience
    - **Property 6: Email failure resilience**
    - **Validates: Requirements 4.1, 4.2, 4.5**

- [x] 3. Update OrdersService to send admin notifications
  - [x] 3.1 Add FooterSettingsService dependency
    - Inject FooterSettingsService into OrdersService
    - Update constructor and imports
    - _Requirements: 2.2, 6.2_

  - [x] 3.2 Create sendAdminOrderNotification method
    - Implement private method to send admin notifications
    - Query footer settings for admin email
    - Handle missing admin email gracefully with warning log
    - Prepare admin email data with all required fields
    - Call EmailTemplateService to generate admin template
    - Call EmailService to send email
    - Wrap in try-catch to prevent failures from breaking order processing
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ]* 3.3 Write property test for admin notification delivery attempt
    - **Property 3: Admin notification delivery attempt**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.4 Write property test for missing admin email handling
    - **Property 7: Missing admin email handling**
    - **Validates: Requirements 2.3, 4.3, 6.4**

  - [x] 3.5 Update create method to send admin notification
    - Call `sendAdminOrderNotification()` after order creation
    - Call after customer email is sent
    - Ensure admin email failure doesn't affect order creation
    - _Requirements: 2.1_

  - [ ]* 3.6 Write property test for customer email delivery attempt
    - **Property 1: Customer email delivery attempt**
    - **Validates: Requirements 1.1**

  - [x] 3.7 Enhance sendOrderConfirmationEmail method
    - Update to use enhanced email templates
    - Improve error handling and logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 3.8 Enhance sendOrderStatusUpdateEmail method
    - Update to use enhanced email templates
    - Improve error handling and logging
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 3.9 Write property test for status update email delivery
    - **Property 5: Status update email delivery**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 4. Add translations for email content
  - [x] 4.1 Add email-related translations to translations.json
    - Add translations for order status names
    - Add translations for email subject lines
    - Add translations for email body text
    - Add translations for shipping methods
    - Add translations for payment methods
    - Include both English and Vietnamese
    - _Requirements: 1.6, 3.7_

- [x] 5. Update module dependencies
  - [x] 5.1 Update OrdersModule to include FooterSettingsService
    - Import FooterSettingsModule in OrdersModule
    - Ensure FooterSettingsService is available for injection
    - _Requirements: 2.2, 6.2_

  - [x] 5.2 Verify NotificationsModule exports
    - Ensure EmailService and EmailTemplateService are exported
    - Verify they're available for use in OrdersModule
    - _Requirements: 1.1, 2.1, 3.1_

- [ ] 6. Create integration tests for email flow
  - [ ]* 6.1 Write integration test for order creation with emails
    - Create order via OrdersService
    - Mock EmailService to capture sent emails
    - Verify customer email is sent with correct data
    - Verify admin email is sent with correct data
    - _Requirements: 1.1, 2.1_

  - [ ]* 6.2 Write integration test for status update with email
    - Update order status via OrdersService
    - Mock EmailService to capture sent emails
    - Verify status update email is sent
    - Verify email content reflects new status
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 6.3 Write integration test for missing admin email
    - Set footer settings contactEmail to null
    - Create order via OrdersService
    - Verify customer email is sent
    - Verify admin email is not sent
    - Verify warning is logged
    - _Requirements: 2.3, 4.3, 6.4_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update documentation
  - [x] 8.1 Update notifications README
    - Document new admin notification feature
    - Update email template examples
    - Add configuration instructions for admin email
    - Document new helper methods
    - _Requirements: 2.2, 6.1, 6.2, 6.3, 6.4_

  - [x] 8.2 Add inline code documentation
    - Add JSDoc comments to new methods
    - Document parameters and return types
    - Add usage examples in comments
    - _Requirements: All_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
