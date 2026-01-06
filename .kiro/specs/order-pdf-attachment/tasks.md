# Implementation Plan

- [x] 1. Set up PDF generation infrastructure and dependencies
  - [x] 1.1 Install and configure PDF generation library
    - Install puppeteer or jsPDF library for PDF generation
    - Configure PDF generation settings and fonts
    - Set up TypeScript types for PDF generation
    - _Requirements: 1.1, 1.3_

  - [ ]* 1.2 Write property test for comprehensive PDF generation
    - **Property 1: Comprehensive PDF generation**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 1.3 Create PDF template engine and styling system
    - Implement PDFTemplateEngine class with template creation methods
    - Define PDF styling constants (fonts, colors, spacing, page format)
    - Create branding assets integration for logo and colors
    - Implement template validation and error handling
    - _Requirements: 1.3, 2.1, 2.2_

  - [ ]* 1.4 Write property test for professional PDF formatting
    - **Property 2: Professional PDF formatting**
    - **Validates: Requirements 1.3, 2.1, 2.2**

  - [x] 1.5 Create PDF document structure and layout system
    - Implement header, content, and footer section generators
    - Create page layout with proper margins for A4/Letter printing
    - Implement responsive layout for different content lengths
    - Add page numbering and document metadata
    - _Requirements: 1.5, 2.3_

  - [ ]* 1.6 Write property test for standard printing format
    - **Property 4: Standard printing format**
    - **Validates: Requirements 1.5**

- [-] 2. Implement core PDF Generator Service
  - [x] 2.1 Create PDFGeneratorService class with order PDF generation
    - Implement generateOrderPDF method with comprehensive order data handling
    - Add data validation before PDF generation
    - Create order information sections (customer, items, pricing, payment)
    - Implement error handling and logging for PDF generation failures
    - _Requirements: 1.1, 1.2, 4.6_

  - [ ]* 2.2 Write property test for required PDF fields presence
    - **Property 3: Required PDF fields presence**
    - **Validates: Requirements 1.4**

  - [ ]* 2.3 Write property test for data validation before generation
    - **Property 21: Data validation before generation**
    - **Validates: Requirements 4.6**

  - [x] 2.4 Implement payment method formatting in PDFs
    - Create payment method section with different payment types
    - Add QR code integration for bank transfer payments
    - Implement payment instructions and status display
    - Ensure consistency with order confirmation page display
    - _Requirements: 1.6, 4.2, 6.3_

  - [ ]* 2.5 Write property test for payment method consistency
    - **Property 5: Payment method consistency**
    - **Validates: Requirements 1.6**

  - [ ]* 2.6 Write property test for payment method formatting
    - **Property 17: Payment method formatting**
    - **Validates: Requirements 4.2**

  - [x] 2.7 Implement product information and order items display
    - Create product card layout for order items
    - Add product images with fallback handling for missing images
    - Implement quantity, pricing, and total calculations display
    - Create order summary table with subtotal, shipping, taxes, discounts
    - _Requirements: 2.4, 4.4, 6.1, 6.5_

  - [ ]* 2.8 Write property test for product information formatting
    - **Property 7: Product information formatting**
    - **Validates: Requirements 2.4**

  - [ ]* 2.9 Write property test for product image handling
    - **Property 19: Product image handling**
    - **Validates: Requirements 4.4**

- [x] 3. Implement localization and multi-language support
  - [x] 3.1 Create localization system for PDF content
    - Implement translation system for PDF text content
    - Add support for English and Vietnamese languages
    - Create locale-specific formatting for dates, currency, addresses
    - Implement right-to-left text support if needed
    - _Requirements: 2.6_

  - [ ]* 3.2 Write property test for localization support
    - **Property 9: Localization support**
    - **Validates: Requirements 2.6**

  - [x] 3.3 Add customer and address information formatting
    - Create customer information section with contact details
    - Implement billing and shipping address display
    - Add phone number and email formatting
    - Ensure all customer information is included and properly formatted
    - _Requirements: 6.2_

  - [ ]* 3.4 Write property test for customer information completeness
    - **Property 29: Customer information completeness**
    - **Validates: Requirements 6.2**

  - [x] 3.5 Implement shipping information display
    - Create shipping method and delivery information section
    - Add estimated delivery date and tracking number display
    - Implement carrier information and shipping instructions
    - _Requirements: 4.3, 6.4_

  - [ ]* 3.6 Write property test for shipping information completeness
    - **Property 18: Shipping information completeness**
    - **Validates: Requirements 4.3**

- [x] 4. Create Document Storage Service
  - [x] 4.1 Implement DocumentStorageService for temporary PDF storage
    - Create file storage system with unique filename generation
    - Implement PDF file saving and retrieval methods
    - Add file permission and security measures
    - Create storage capacity monitoring and validation
    - _Requirements: 5.1, 5.5_

  - [ ]* 4.2 Write property test for unique file storage
    - **Property 22: Unique file storage**
    - **Validates: Requirements 5.1**

  - [ ]* 4.3 Write property test for file security measures
    - **Property 26: File security measures**
    - **Validates: Requirements 5.5**

  - [x] 4.4 Implement PDF cleanup service and scheduling
    - Create PDF cleanup service with retention period management
    - Implement automatic cleanup scheduling after successful email sending
    - Add expired file cleanup with configurable retention periods
    - Create storage capacity handling and emergency cleanup procedures
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 4.5 Write property test for cleanup scheduling
    - **Property 23: Cleanup scheduling**
    - **Validates: Requirements 5.2**

  - [ ]* 4.6 Write property test for expired file cleanup
    - **Property 24: Expired file cleanup**
    - **Validates: Requirements 5.3**

  - [x] 4.7 Add filename conflict handling and error management
    - Implement filename conflict resolution with unique suffixes
    - Add comprehensive error handling for storage operations
    - Create logging for storage operations and cleanup activities
    - _Requirements: 5.6_

  - [ ]* 4.8 Write property test for filename conflict handling
    - **Property 27: Filename conflict handling**
    - **Validates: Requirements 5.6**

- [x] 5. Implement Email Attachment System
  - [x] 5.1 Create simplified email templates to avoid swaks errors
    - Design minimal HTML email templates that work with swaks
    - Create plain text email content with PDF attachment explanation
    - Implement email subject generation with order information
    - Add email template localization for English and Vietnamese
    - _Requirements: 3.1, 3.3_

  - [ ]* 5.2 Write property test for simplified email templates
    - **Property 10: Simplified email templates**
    - **Validates: Requirements 3.1**

  - [ ]* 5.3 Write property test for attachment explanation
    - **Property 12: Attachment explanation**
    - **Validates: Requirements 3.3**

  - [x] 5.4 Implement EmailAttachmentSystem with PDF attachment functionality
    - Create email sending service with PDF attachment support
    - Implement proper MIME type and base64 encoding for PDF attachments
    - Add email client compatibility testing and fallbacks
    - Create attachment size validation and compression if needed
    - _Requirements: 3.2, 3.4, 7.6_

  - [ ]* 5.5 Write property test for PDF attachment inclusion
    - **Property 11: PDF attachment inclusion**
    - **Validates: Requirements 3.2**

  - [ ]* 5.6 Write property test for email client compatibility
    - **Property 13: Email client compatibility**
    - **Validates: Requirements 3.4**

  - [x] 5.7 Add email delivery verification and error handling
    - Implement email delivery status tracking and logging
    - Create fallback notification methods for attachment failures
    - Add retry logic for failed email deliveries
    - Implement comprehensive error logging and monitoring
    - _Requirements: 3.5, 3.6_

  - [ ]* 5.8 Write property test for attachment failure handling
    - **Property 14: Attachment failure handling**
    - **Validates: Requirements 3.5**

  - [ ]* 5.9 Write property test for email delivery verification
    - **Property 15: Email delivery verification**
    - **Validates: Requirements 3.6**

- [x] 6. Integrate PDF system with existing order service
  - [x] 6.1 Update OrdersService to use PDF attachment system
    - Modify sendOrderConfirmationEmail method to generate and attach PDFs
    - Replace complex HTML email templates with simplified versions
    - Add PDF generation to order creation workflow
    - Implement error handling for PDF generation failures in order flow
    - _Requirements: 1.1, 4.5_

  - [ ]* 6.2 Write property test for order type handling
    - **Property 16: Order type handling**
    - **Validates: Requirements 4.1**

  - [ ]* 6.3 Write property test for PDF generation error handling
    - **Property 20: PDF generation error handling**
    - **Validates: Requirements 4.5**

  - [x] 6.2 Add support for different order types and edge cases
    - Handle single item orders, multiple item orders, and zero-price products
    - Implement special handling for orders with missing or incomplete data
    - Add support for orders with different payment methods and shipping options
    - Create comprehensive order data validation before PDF generation
    - _Requirements: 4.1_

  - [x] 6.3 Create business information and legal content integration
    - Add company contact details and business information to PDFs
    - Implement terms and conditions and return policy inclusion
    - Create customer service contact methods display
    - Add legal disclaimers and privacy policy references
    - _Requirements: 2.5, 6.6_

  - [ ]* 6.4 Write property test for terms and conditions inclusion
    - **Property 8: Terms and conditions inclusion**
    - **Validates: Requirements 2.5**

  - [ ]* 6.5 Write property test for business information inclusion
    - **Property 33: Business information inclusion**
    - **Validates: Requirements 6.6**

- [x] 7. Implement resend email functionality
  - [x] 7.1 Create ResendEmailHandler for order confirmation pages
    - Implement resend email request handling with order number validation
    - Add customer email validation and authorization checks
    - Create rate limiting system to prevent spam and abuse
    - Implement resend request logging and monitoring
    - _Requirements: 8.2, 8.3, 8.6_

  - [ ]* 7.2 Write property test for PDF regeneration on resend
    - **Property 40: PDF regeneration on resend**
    - **Validates: Requirements 8.2**

  - [ ]* 7.3 Write property test for resend email delivery
    - **Property 41: Resend email delivery**
    - **Validates: Requirements 8.3**

  - [ ]* 7.4 Write property test for resend rate limiting
    - **Property 44: Resend rate limiting**
    - **Validates: Requirements 8.6**

  - [x] 7.5 Add frontend resend button to order confirmation pages
    - Add "Resend Email" button to order confirmation page UI
    - Implement button click handler with API call to resend endpoint
    - Add loading states and user feedback for resend operations
    - Create success and error message display for resend results
    - _Requirements: 8.1, 8.4, 8.5_

  - [ ]* 7.6 Write property test for resend success feedback
    - **Property 42: Resend success feedback**
    - **Validates: Requirements 8.4**

  - [ ]* 7.7 Write property test for resend error feedback
    - **Property 43: Resend error feedback**
    - **Validates: Requirements 8.5**

  - [x] 7.8 Create resend API endpoint and controller
    - Implement POST /api/orders/:orderNumber/resend-email endpoint
    - Add request validation and authentication middleware
    - Create controller method that integrates with ResendEmailHandler
    - Add proper HTTP status codes and error responses
    - _Requirements: 8.2, 8.3_

- [x] 8. Add PDF accessibility and cross-platform compatibility
  - [x] 8.1 Implement PDF accessibility features
    - Add proper text structure and heading hierarchy to PDFs
    - Implement accessibility tags and metadata for screen readers
    - Create high contrast color options and readable font sizes
    - Add alternative text for images and visual elements
    - _Requirements: 7.5_

  - [ ]* 8.2 Write property test for PDF accessibility compliance
    - **Property 38: PDF accessibility compliance**
    - **Validates: Requirements 7.5**

  - [x] 8.3 Optimize PDFs for different devices and viewing scenarios
    - Ensure mobile device readability with appropriate scaling
    - Optimize desktop viewing experience with proper zoom levels
    - Create print-optimized layouts with proper margins and page breaks
    - Add navigation features for multi-page PDFs
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 8.4 Write property test for mobile PDF readability
    - **Property 35: Mobile PDF readability**
    - **Validates: Requirements 7.2**

  - [ ]* 8.5 Write property test for desktop PDF optimization
    - **Property 36: Desktop PDF optimization**
    - **Validates: Requirements 7.3**

  - [ ]* 8.6 Write property test for print compatibility
    - **Property 37: Print compatibility**
    - **Validates: Requirements 7.4**

  - [x] 8.7 Add PDF compression and size optimization
    - Implement PDF compression to reduce file sizes
    - Add image optimization and compression for product images
    - Create alternative delivery methods for large PDF files
    - Implement size validation and warnings for oversized attachments
    - _Requirements: 7.6_

  - [ ]* 8.8 Write property test for large file handling
    - **Property 39: Large file handling**
    - **Validates: Requirements 7.6**

- [x] 9. Add comprehensive error handling and monitoring
  - [x] 9.1 Implement comprehensive error handling across all services
    - Add detailed error logging for PDF generation failures
    - Create fallback notification methods for email attachment failures
    - Implement graceful degradation for missing data or images
    - Add monitoring and alerting for system failures
    - _Requirements: 4.5, 3.5_

  - [x] 9.2 Create system monitoring and health checks
    - Add health check endpoints for PDF generation service
    - Implement storage capacity monitoring and alerts
    - Create email delivery success rate monitoring
    - Add performance metrics for PDF generation times
    - _Requirements: 5.4, 3.6_

  - [x] 9.3 Add comprehensive logging and audit trails
    - Log all PDF generation requests and results
    - Track email sending attempts and delivery status
    - Monitor file storage operations and cleanup activities
    - Create audit trails for resend email operations
    - _Requirements: 3.6, 4.5_

- [x] 10. Update translations and add new email content
  - [x] 10.1 Add PDF-related translations to localization files
    - Add translations for PDF content elements in English and Vietnamese
    - Include email template text for PDF attachment explanations
    - Add resend button text and feedback messages
    - Create error message translations for PDF-related failures
    - _Requirements: All requirements with locale support_

  - [x] 10.2 Update existing email templates to use simplified HTML
    - Modify existing email templates to avoid swaks syntax errors
    - Replace complex HTML with simple, swaks-compatible markup
    - Ensure all email templates work properly with PDF attachments
    - Test email templates across different email clients
    - _Requirements: 3.1_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Create comprehensive documentation and deployment guide
  - [x] 12.1 Document PDF generation system and configuration
    - Create documentation for PDFGeneratorService and its methods
    - Document PDF template system and customization options
    - Add configuration guide for PDF styling and branding
    - Include troubleshooting guide for common PDF generation issues

  - [x] 12.2 Document email attachment system and swaks integration
    - Create guide for simplified email template creation
    - Document email attachment configuration and testing
    - Add swaks command troubleshooting and optimization tips
    - Include email client compatibility testing procedures

  - [x] 12.3 Create deployment and maintenance documentation
    - Document storage management and cleanup procedures
    - Create monitoring and alerting setup guide
    - Add performance tuning recommendations
    - Include backup and disaster recovery procedures

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Extract and enhance quote item utilities
  - [x] 14.1 Extract quote item detection logic from sanitizeOrderData
    - Move hasQuoteItems logic from EmailTemplateService to shared utility functions
    - Create validateAllItemsPriced utility function
    - Add canGeneratePDF and canChangeOrderStatus utility functions
    - Ensure backward compatibility with existing sanitizeOrderData usage
    - _Requirements: 9.2, 9.3_

  - [ ]* 14.2 Write property test for quote order email without PDF
    - **Property 46: Quote order email without PDF**
    - **Validates: Requirements 9.2**

  - [ ]* 14.3 Write property test for order status restriction for quote items
    - **Property 47: Order status restriction for quote items**
    - **Validates: Requirements 9.3**

  - [x] 14.4 Add quote item price update functionality to existing order service
    - Extend existing order update methods to handle quote item pricing
    - Add price validation for positive numbers and proper formatting
    - Implement order total recalculation when prices are updated
    - Add support for multiple price updates on the same quote items
    - Implement price history tracking for audit purposes
    - Add error handling for invalid price updates
    - _Requirements: 9.4, 10.2, 10.3, 10.7, 10.8_

  - [ ]* 14.5 Write property test for quote item price updates
    - **Property 48: Quote item price updates**
    - **Validates: Requirements 9.4**

  - [ ]* 14.6 Write property test for price validation for quote items
    - **Property 52: Price validation for quote items**
    - **Validates: Requirements 10.2**

  - [ ]* 14.7 Write property test for order total recalculation
    - **Property 53: Order total recalculation**
    - **Validates: Requirements 10.3**

  - [ ]* 14.8 Write property test for multiple price updates allowed
    - **Property 57: Multiple price updates allowed**
    - **Validates: Requirements 10.7**

  - [ ]* 14.9 Write property test for price history maintenance
    - **Property 58: Price history maintenance**
    - **Validates: Requirements 10.8**

- [-] 15. Update existing email system to use two-step email process
  - [x] 15.1 Modify OrdersService to implement two-step email flow
    - Always send confirmation email without PDF attachment for all orders
    - Automatically send invoice email with PDF for orders with only priced items
    - Skip invoice email for orders containing quote items
    - Use extracted hasQuoteItems utility to determine email behavior
    - _Requirements: 9.1, 9.2, 9.3, 11.1, 11.2, 11.3_

  - [ ]* 15.2 Write property test for universal confirmation email without attachment
    - **Property 59: Universal confirmation email without attachment**
    - **Validates: Requirements 9.1, 11.1**

  - [ ]* 15.3 Write property test for automatic invoice email for priced orders
    - **Property 60: Automatic invoice email for priced orders**
    - **Validates: Requirements 9.2, 11.2**

  - [ ]* 15.4 Write property test for single confirmation email for quote orders
    - **Property 61: Single confirmation email for quote orders**
    - **Validates: Requirements 9.3, 11.3**

- [x] 16. Update admin frontend for quote item management and invoice emails
  - [x] 16.1 Add quote item pricing interface to admin order pages
    - Show pricing form when order status is pending and products don't have prices
    - Use existing backend APIs for setting prices
    - Add client-side validation for price inputs (positive numbers)
    - Implement conditional rendering based on order status and item pricing
    - _Requirements: 10.1, 10.2_

  - [ ]* 16.2 Write property test for price input fields for quote items
    - **Property 65: Price input fields for quote items**
    - **Validates: Requirements 10.1**

  - [ ]* 16.3 Write property test for price validation for quote items
    - **Property 66: Price validation for quote items**
    - **Validates: Requirements 10.2**

  - [x] 16.4 Add admin interface controls for invoice email functionality
    - Show "Send Invoice Email" button instead of resend button for priced orders
    - Disable order status changes when quote items exist
    - Add loading states and error handling for invoice email operations
    - Create admin feedback messages for invoice email operations
    - _Requirements: 9.4, 9.6, 10.4, 10.6_

  - [ ]* 16.5 Write property test for send invoice email button visibility
    - **Property 64: Send invoice email button visibility**
    - **Validates: Requirements 9.6**

  - [ ]* 16.6 Write property test for order status restriction for quote items
    - **Property 62: Order status restriction for quote items**
    - **Validates: Requirements 9.4**

  - [ ]* 16.7 Write property test for admin controls enablement for fully priced orders
    - **Property 68: Admin controls enablement for fully priced orders**
    - **Validates: Requirements 10.4**

  - [ ]* 16.8 Write property test for admin invoice email success confirmation
    - **Property 70: Admin invoice email success confirmation**
    - **Validates: Requirements 10.6**

- [x] 17. Update existing admin frontend for multiple quote item price edits and invoice emails
  - [x] 17.1 Update existing QuoteItemPricingForm to allow multiple price edits
    - Modify existing form to support editing previously set prices
    - Remove any restrictions that prevent multiple price updates
    - Ensure form validation works for price updates (not just initial setting)
    - Update UI to clearly indicate when prices can be edited multiple times
    - _Requirements: 10.7, 10.8_

  - [ ]* 17.2 Write property test for multiple price updates capability
    - **Property 71: Multiple price updates capability**
    - **Validates: Requirements 10.7**

  - [ ]* 17.3 Write property test for price history maintenance
    - **Property 72: Price history maintenance**
    - **Validates: Requirements 10.8**

  - [x] 17.4 Update existing admin order management interface for invoice emails
    - Modify existing pricing form visibility logic to support multiple edits
    - Update invoice email button logic to work with updated prices
    - Ensure order status controls work correctly with price updates
    - Update any UI messaging to reflect invoice email functionality
    - _Requirements: 9.6, 10.4, 10.7_

  - [ ]* 17.5 Write property test for quote item price updates
    - **Property 63: Quote item price updates**
    - **Validates: Requirements 9.5**

  - [ ]* 17.6 Write property test for order total recalculation after pricing
    - **Property 67: Order total recalculation after pricing**
    - **Validates: Requirements 10.3**

- [x] 18. Checkpoint - Ensure all quote item tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Add invoice email functionality and API endpoints
  - [x] 19.1 Create InvoiceEmailHandler for admin-triggered invoice emails
    - Implement invoice email request handling with order number validation
    - Add customer email validation and authorization checks
    - Create rate limiting system to prevent spam and abuse
    - Implement invoice email request logging and monitoring
    - _Requirements: 10.5, 11.4_

  - [ ]* 19.2 Write property test for PDF generation for invoice emails
    - **Property 69: PDF generation for invoice emails**
    - **Validates: Requirements 10.5**

  - [ ]* 19.3 Write property test for invoice email after admin pricing
    - **Property 73: Invoice email after admin pricing**
    - **Validates: Requirements 11.4**

  - [x] 19.4 Add invoice email API endpoint and controller
    - Implement POST /api/orders/:orderNumber/send-invoice-email endpoint
    - Add request validation and authentication middleware
    - Create controller method that integrates with InvoiceEmailHandler
    - Add proper HTTP status codes and error responses
    - _Requirements: 10.5, 11.4_

  - [ ]* 19.5 Write property test for complete order details in invoice PDF
    - **Property 74: Complete order details in invoice PDF**
    - **Validates: Requirements 11.5**

  - [ ]* 19.6 Write property test for current pricing accuracy in multiple PDFs
    - **Property 75: Current pricing accuracy in multiple PDFs**
    - **Validates: Requirements 11.6**

- [-] 20. Final integration and testing for two-step email process
  - [x] 20.1 Integration testing for two-step email workflow
    - Test complete two-step email workflow from order creation to invoice delivery
    - Verify confirmation emails are always sent without attachments
    - Test automatic invoice emails for priced orders
    - Validate admin-controlled invoice emails for quote orders
    - _Requirements: All updated email requirements_

  - [x] 20.2 Update existing tests for two-step email compatibility
    - Modify existing email system tests for new two-step flow
    - Update PDF generation tests to work with invoice emails
    - Add two-step email scenarios to existing integration tests
    - Ensure backward compatibility with existing order types
    - _Requirements: 9.1, 9.2, 9.3, 11.1, 11.2, 11.3_

- [x] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Create HTML template files for PDF generation
  - [x] 22.1 Create order confirmation HTML template file
    - Create `backend/src/pdf-generator/templates/order-confirmation.html` template file
    - Extract HTML structure from existing `generateOrderHeaderHTML`, `generateOrderInfoHTML`, `generateOrderItemsTableHTML`, `generateOrderSummaryHTML`, `generatePaymentInfoHTML`, `generateShippingInfoHTML`, and `generateFooterHTML` methods
    - Use template placeholders (e.g., `{{orderNumber}}`, `{{customerName}}`, `{{items}}`) for dynamic content
    - Include complete CSS styling within the template file
    - Ensure template supports both English and Vietnamese locales through placeholders
    - _Requirements: 1.1, 1.3, 2.1, 2.2_

  - [x] 22.2 Create invoice HTML template file based on order confirmation template
    - Create `backend/src/pdf-generator/templates/invoice.html` template file
    - Base the invoice template on the order confirmation template structure
    - Modify header section to show "Invoice" instead of "Order Confirmation"
    - Update document title and metadata placeholders for invoice format
    - Include invoice-specific elements (invoice number, issue date, due date if applicable)
    - Maintain consistent styling and branding with order confirmation template
    - _Requirements: 1.1, 1.3, 2.1, 2.2_

  - [x] 22.3 Create template CSS file for consistent styling
    - Create `backend/src/pdf-generator/templates/pdf-styles.css` file
    - Extract CSS from existing `generateCSS` method in PDFTemplateEngine
    - Include all styling for headers, content sections, tables, footer
    - Add print-optimized styles and accessibility enhancements
    - Ensure responsive design for different PDF viewing scenarios
    - _Requirements: 1.5, 2.2, 7.2, 7.3, 7.4_

- [x] 23. Implement template file loading and processing system
  - [x] 23.1 Create template file loader service
    - Create `PDFTemplateLoaderService` to handle template file loading
    - Implement methods to load HTML template files from filesystem
    - Add template caching for improved performance
    - Include error handling for missing or corrupted template files
    - Add template validation to ensure required placeholders are present
    - _Requirements: 4.5, 4.6_

  - [x] 23.2 Create template variable replacement system
    - Implement template variable replacement engine
    - Support nested object placeholders (e.g., `{{customer.name}}`, `{{items[0].name}}`)
    - Add conditional rendering for optional sections (e.g., `{{#if taxAmount}}...{{/if}}`)
    - Add conditional rendering with else blocks (e.g., `{{#if condition}}...{{else}}...{{/if}}`)
    - Support loop rendering for order items (e.g., `{{#each items}}...{{/each}}`), with processLoops handling conditionals within each iteration
    - Include localization support for template text placeholders
    - Add HTML escaping for security and proper rendering
    - Fix missing translation keys for invoice PDFs (invoiceItems, invoiceSummary, totalAmountDue, contactUs, paymentStatus_paid)
    - _Requirements: 2.6, 4.4, 6.1, 6.2_

  - [x] 23.3 Update PDFTemplateEngine to use template files
    - Modify `generateHTMLFromOrderData` method to use template files instead of programmatic generation
    - Replace existing HTML generation methods with template loading and variable replacement
    - Update `createOrderTemplate` and `createInvoiceTemplate` methods to use file-based templates
    - Maintain backward compatibility during transition period
    - Add configuration option to switch between programmatic and file-based template generation
    - _Requirements: 1.1, 1.3, 4.5_

- [x] 24. Add template file management and validation
  - [x] 24.1 Implement template validation system
    - Create template validation service to check template file integrity
    - Validate that all required placeholders are present in templates
    - Check template syntax and structure for common errors
    - Add validation for CSS file references and styling consistency
    - Include template version compatibility checking
    - _Requirements: 4.6_

  - [x] 24.2 Add template file monitoring and hot-reloading (development)
    - Implement file system watching for template file changes
    - Add hot-reloading capability for development environments
    - Include template cache invalidation when files are modified
    - Add logging for template file changes and reloads
    - Ensure production environments use cached templates for performance
    - _Requirements: 4.5_

  - [x] 24.3 Create template file backup and recovery system
    - Implement template file backup before modifications
    - Add template version control and rollback capabilities
    - Create template file integrity checking and repair
    - Include template file migration system for updates
    - Add documentation for template file maintenance procedures
    - _Requirements: 4.5, 5.1_

- [x] 25. Update existing services to use template-based system
  - [x] 25.1 Update PDF generation services to use new template system
    - Modify `PDFGeneratorService` to use `PDFTemplateLoaderService`
    - Update all PDF generation methods to use template files
    - Remove deprecated programmatic HTML generation methods
    - Ensure all existing functionality works with template-based system
    - Add comprehensive error handling for template-related failures
    - _Requirements: 1.1, 4.5_

  - [x] 25.2 Update localization service for template support
    - Modify `PDFLocalizationService` to work with template placeholders
    - Add template-specific translation methods
    - Support dynamic locale switching in templates
    - Include template text extraction for translation management
    - Ensure all existing translations work with new template system
    - _Requirements: 2.6_

  - [x] 25.3 Update compression and optimization services for templates
    - Modify image optimization to work with template-based generation
    - Update CSS optimization for template-based styling
    - Ensure template caching works with compression services
    - Add template-specific performance monitoring
    - Maintain all existing optimization features with template system
    - _Requirements: 7.6, 8.7_

- [ ] 26. Add comprehensive testing for template-based system
  - [ ]* 26.1 Write unit tests for template loading and processing
    - Test template file loading with valid and invalid files
    - Test variable replacement with various data types and structures
    - Test conditional rendering and loop processing
    - Test error handling for missing templates and malformed data
    - Test template caching and invalidation

  - [ ]* 26.2 Write integration tests for template-based PDF generation
    - Test complete PDF generation using template files
    - Test both order confirmation and invoice template generation
    - Test localization with template-based system
    - Test image optimization and compression with templates
    - Test error scenarios and fallback mechanisms

  - [ ]* 26.3 Write property tests for template system correctness
    - **Property 76: Template variable replacement completeness**
    - **Validates: Requirements 1.1, 6.1, 6.2**
    - **Property 77: Template file loading reliability**
    - **Validates: Requirements 4.5, 4.6**

- [x] 27. Create template documentation and migration guide
  - [x] 27.1 Document template file structure and syntax
    - Create comprehensive documentation for template file format
    - Document all available placeholders and their data types
    - Include examples of conditional rendering and loops
    - Add styling guidelines for template CSS modifications
    - Create troubleshooting guide for common template issues

  - [x] 27.2 Create template customization guide
    - Document how to modify templates for different business needs
    - Include guidelines for maintaining brand consistency
    - Add examples of common template customizations
    - Create template testing procedures for modifications
    - Include performance considerations for template changes

  - [x] 27.3 Create migration documentation from programmatic to template-based system
    - Document the migration process from current system to template files
    - Include rollback procedures if issues arise
    - Add performance comparison between old and new systems
    - Create deployment checklist for template-based system
    - Include monitoring and maintenance procedures

- [x] 28. Final checkpoint - Ensure template-based system works correctly
  - Ensure all template-based PDF generation tests pass
  - Verify both order confirmation and invoice templates work correctly
  - Test template system with various order types and locales
  - Confirm all existing functionality is preserved with template files
  - Ask the user if questions arise about the template-based implementation