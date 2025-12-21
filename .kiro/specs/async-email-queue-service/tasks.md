# Implementation Plan

- [x] 1. Set up BullMQ infrastructure and dependencies
  - Install BullMQ package and types
  - Create email event type definitions and interfaces
  - Set up Redis connection configuration for queues
  - _Requirements: 1.4, 7.1_

- [ ]* 1.1 Write property test for queue persistence
  - **Property 3: Event persistence durability**
  - **Validates: Requirements 1.4, 7.1**

- [x] 2. Implement Email Event Publisher Service
  - Create EmailEventPublisher class with queue initialization
  - Implement publishEvent method with validation and priority handling
  - Add event validation logic for all email event types
  - Implement queue metrics collection methods
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2, 6.5_

- [ ]* 2.1 Write property test for event structure generation
  - **Property 4: Correct event structure generation**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ]* 2.2 Write property test for input validation
  - **Property 12: Input validation before queuing**
  - **Validates: Requirements 6.1, 6.2, 6.5**

- [ ]* 2.3 Write property test for asynchronous performance
  - **Property 1: Asynchronous processing performance**
  - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 3. Implement Email Worker Service
  - Create EmailWorker class with BullMQ worker initialization
  - Implement processEmailEvent method with type-based routing
  - Add order confirmation email processing logic
  - Add admin order notification processing logic
  - Add shipping notification processing logic
  - Add order status update processing logic
  - Add welcome email processing logic
  - Add password reset processing logic
  - Add contact form processing logic
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5_

- [ ]* 3.1 Write property test for retry behavior
  - **Property 5: Exponential backoff retry behavior**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 3.2 Write property test for dead letter queue
  - **Property 6: Dead letter queue for permanent failures**
  - **Validates: Requirements 3.2, 3.4**

- [ ]* 3.3 Write property test for schema validation
  - **Property 13: Schema validation during processing**
  - **Validates: Requirements 6.3, 6.4**

- [x] 4. Add error handling and classification
  - Implement isPermanentError method for error classification
  - Add retry configuration with exponential backoff
  - Implement dead letter queue handling
  - Add comprehensive error logging
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.3, 5.4_

- [ ]* 4.1 Write property test for automatic recovery
  - **Property 7: Automatic recovery after service restoration**
  - **Validates: Requirements 3.5**

- [x] 5. Create Email Queue Module
  - Create EmailQueueModule with proper dependency injection
  - Export EmailEventPublisher for use in other modules
  - Configure module imports and providers
  - _Requirements: 4.1_

- [x] 6. Implement backward compatibility layer
  - Create compatibility methods in EmailEventPublisher
  - Ensure same interface as existing EmailService
  - Add method mapping for existing email service calls
  - _Requirements: 4.1_

- [ ]* 6.1 Write property test for backward compatibility
  - **Property 8: Backward compatibility interface**
  - **Validates: Requirements 4.1**

- [ ]* 6.2 Write property test for content consistency
  - **Property 9: Content consistency with current system**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [x] 7. Add comprehensive logging and monitoring
  - Implement structured logging for all email events
  - Add event lifecycle logging (creation, processing, success, failure)
  - Implement queue metrics collection and reporting
  - Add health check endpoints for monitoring
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 7.1 Write property test for logging completeness
  - **Property 10: Comprehensive event logging**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ]* 7.2 Write property test for metrics availability
  - **Property 11: Queue metrics availability**
  - **Validates: Requirements 5.5**

- [x] 8. Implement resilience and recovery features
  - Add graceful shutdown handling for workers
  - Implement Redis reconnection logic with exponential backoff
  - Add crash recovery mechanisms
  - Ensure exactly-once processing in multi-worker scenarios
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write property test for crash recovery
  - **Property 14: Crash recovery without data loss**
  - **Validates: Requirements 7.2, 7.3**

- [ ]* 8.2 Write property test for graceful shutdown
  - **Property 15: Graceful shutdown completion**
  - **Validates: Requirements 7.4**

- [ ]* 8.3 Write property test for exactly-once processing
  - **Property 16: Exactly-once processing guarantee**
  - **Validates: Requirements 7.5**

- [x] 9. Update existing services to use Email Event Publisher
  - Modify OrdersService to use EmailEventPublisher instead of EmailService
  - Update AuthService to use EmailEventPublisher for welcome and password reset emails
  - Update ContactService to use EmailEventPublisher for contact form notifications
  - Ensure all existing email functionality works through the new system
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 9.1 Write property test for system resilience
  - **Property 2: System resilience under email service failure**
  - **Validates: Requirements 1.3**

- [x] 10. Add configuration and environment setup
  - Add BullMQ configuration to environment variables
  - Update Redis configuration for queue usage
  - Add queue-specific settings (concurrency, rate limiting, etc.)
  - Document configuration options
  - _Requirements: 4.5_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Create monitoring and admin endpoints
  - Add REST endpoints for queue status and metrics
  - Implement admin interface for viewing failed jobs
  - Add endpoints for manual job retry and dead letter queue management
  - Create health check endpoints for production monitoring
  - _Requirements: 5.5_

- [ ]* 12.1 Write unit tests for monitoring endpoints
  - Test queue metrics endpoint responses
  - Test admin interface functionality
  - Test health check endpoint behavior
  - _Requirements: 5.5_

- [x] 13. Add migration and deployment scripts
  - Create database migration scripts if needed
  - Add deployment scripts for queue worker processes
  - Create monitoring setup scripts
  - Document deployment procedures
  - _Requirements: 7.1_

- [x] 14. Final Checkpoint - Complete system integration test
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Fix resend order confirmation to use async queue
  - [x] 15.1 Add ORDER_CONFIRMATION_RESEND event type to EmailEventType enum
    - Update event type definitions and interfaces
    - Add OrderConfirmationResendEvent interface
    - Update EmailEvent union type
    - _Requirements: 8.1_

  - [x] 15.2 Update EmailEventPublisher validation and priority logic
    - Add ORDER_CONFIRMATION_RESEND to validation switch statement
    - Add priority assignment for resend events (same as original confirmation)
    - _Requirements: 8.1_

  - [x] 15.3 Update EmailWorker to handle resend events
    - Add case for ORDER_CONFIRMATION_RESEND in processEmailEvent switch
    - Implement sendOrderConfirmationResend method with PDF attachment
    - Reuse existing EmailAttachmentService for PDF generation
    - _Requirements: 8.3_

  - [ ]* 15.4 Write property test for resend asynchronous processing
    - **Property 17: Resend order confirmation asynchronous processing**
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 15.5 Write property test for resend PDF consistency
    - **Property 18: Resend email PDF attachment consistency**
    - **Validates: Requirements 8.3**

  - [ ]* 15.6 Write property test for resend validation and rate limiting
    - **Property 19: Resend rate limiting and validation**
    - **Validates: Requirements 8.4, 8.5**

  - [x] 15.7 Update EmailAttachmentService resendOrderConfirmation method
    - Replace direct sendOrderConfirmationWithPDF call with EmailEventPublisher
    - Keep existing validation logic (rate limiting, order verification, email matching)
    - Return immediately after queuing event instead of waiting for email delivery
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [x] 15.8 Update error handling for resend functionality
    - Ensure validation errors return immediately without queuing
    - Update success/error messages to reflect asynchronous processing
    - Maintain existing rate limiting and audit logging
    - _Requirements: 8.4, 8.5_

- [ ] 16. Final Checkpoint - Verify resend functionality works asynchronously
  - Start backend server and run async verification test
  - Ensure all tests pass, ask the user if questions arise.

## REMAINING PROPERTY TESTS TO IMPLEMENT

The following property-based tests are still pending and should be implemented to fully validate the system:

- [ ] 17. Implement Property Test Suite
  - [ ] 17.1 Property 1: Asynchronous processing performance (validates Requirements 1.1, 1.2, 1.5)
  - [ ] 17.2 Property 2: System resilience under email service failure (validates Requirements 1.3)
  - [ ] 17.3 Property 3: Event persistence durability (validates Requirements 1.4, 7.1)
  - [ ] 17.4 Property 4: Correct event structure generation (validates Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
  - [ ] 17.5 Property 5: Exponential backoff retry behavior (validates Requirements 3.1, 3.3)
  - [ ] 17.6 Property 6: Dead letter queue for permanent failures (validates Requirements 3.2, 3.4)
  - [ ] 17.7 Property 7: Automatic recovery after service restoration (validates Requirements 3.5)
  - [ ] 17.8 Property 8: Backward compatibility interface (validates Requirements 4.1)
  - [ ] 17.9 Property 9: Content consistency with current system (validates Requirements 4.2, 4.3, 4.4, 4.5)
  - [ ] 17.10 Property 10: Comprehensive event logging (validates Requirements 5.1, 5.2, 5.3, 5.4)
  - [ ] 17.11 Property 11: Queue metrics availability (validates Requirements 5.5)
  - [ ] 17.12 Property 12: Input validation before queuing (validates Requirements 6.1, 6.2, 6.5)
  - [ ] 17.13 Property 13: Schema validation during processing (validates Requirements 6.3, 6.4)
  - [ ] 17.14 Property 14: Crash recovery without data loss (validates Requirements 7.2, 7.3)
  - [ ] 17.15 Property 15: Graceful shutdown completion (validates Requirements 7.4)
  - [ ] 17.16 Property 16: Exactly-once processing guarantee (validates Requirements 7.5)
  - [ ] 17.17 Property 17: Resend order confirmation asynchronous processing (validates Requirements 8.1, 8.2)
  - [ ] 17.18 Property 18: Resend email PDF attachment consistency (validates Requirements 8.3)
  - [ ] 17.19 Property 19: Resend rate limiting and validation (validates Requirements 8.4, 8.5)

- [ ] 18. Unit Tests for Monitoring Endpoints
  - Test queue metrics endpoint responses
  - Test admin interface functionality
  - Test health check endpoint behavior
  - _Requirements: 5.5_

- [ ] 19. Final System Integration Test
  - Start backend server with email queue workers
  - Run comprehensive test suite including async verification
  - Validate all requirements are met
  - Document any remaining issues or limitations