# Implementation Plan: Order UserId Fix

## Overview

This implementation plan addresses userId-related issues in the order system by requiring authentication for all orders and ensuring proper email uniqueness validation. The approach focuses on eliminating guest orders, enforcing authentication requirements, and comprehensive testing to support authenticated users only.

## Tasks

- [x] 1. Update database schema to require userId for orders
  - Modify Prisma schema to make userId required (not null) in Order model
  - Create and run database migration to update existing orders
  - Ensure proper foreign key constraints are in place
  - _Requirements: 1.3, 1.5, 4.5_

- [ ]* 1.1 Write property test for required userId constraint
  - **Property 4: Required userId constraint**
  - **Validates: Requirements 1.3, 1.5, 4.2, 4.5**

- [x] 2. Implement authentication guards for order operations
  - Add authentication requirements to order creation endpoints
  - Ensure all order operations require valid user authentication
  - Update controller methods to validate userId from authentication context
  - _Requirements: 1.1, 1.4, 4.1_

- [ ]* 2.1 Write property test for authentication requirement
  - **Property 1: Authentication requirement for order creation**
  - **Validates: Requirements 1.1, 1.4, 4.1**

- [ ]* 2.2 Write property test for authenticated user context extraction
  - **Property 10: Authenticated user context extraction**
  - **Validates: Requirements 2.1**

- [x] 3. Update address validation logic for authenticated users
  - Ensure address ownership validation for all user addresses
  - Remove null-checking logic since all orders now have userId
  - Verify users can only use their own addresses
  - _Requirements: 2.3, 4.3_

- [ ]* 3.1 Write property test for address ownership validation
  - **Property 3: Address ownership validation**
  - **Validates: Requirements 2.3, 4.3**

- [x] 4. Enhance order access control for authenticated users
  - Update order retrieval to work with required userId
  - Ensure proper access validation without null comparison issues
  - Maintain admin access to all orders with user information
  - _Requirements: 2.4, 3.1, 3.2, 4.4_

- [ ]* 4.1 Write property test for user order access control
  - **Property 2: User order access control**
  - **Validates: Requirements 2.4**

- [ ]* 4.2 Write property test for admin universal access
  - **Property 7: Admin universal order access**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 4.3 Write property test for access validation
  - **Property 11: Access validation without null comparison issues**
  - **Validates: Requirements 4.4**

- [x] 5. Checkpoint - Verify order system with required authentication
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update order management operations
  - Ensure userId is preserved during order updates, cancellations, and price changes
  - Maintain proper user relationships during all order operations
  - Verify database integrity is maintained
  - _Requirements: 2.2, 2.5, 3.3, 3.4, 3.5_

- [ ]* 6.1 Write property test for user relationship integrity
  - **Property 5: User relationship integrity**
  - **Validates: Requirements 2.2, 2.5**

- [ ]* 6.2 Write property test for userId preservation during updates
  - **Property 6: UserId preservation during updates**
  - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 7. Audit and enhance email uniqueness validation
  - Review user registration and email update processes
  - Ensure proper error messages for duplicate email scenarios
  - Verify database constraints are properly enforced
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 7.1 Write property test for email uniqueness validation
  - **Property 8: Email uniqueness validation**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ]* 7.2 Write property test for database email constraint
  - **Property 9: Database email constraint enforcement**
  - **Validates: Requirements 5.3, 5.5**

- [x] 8. Add comprehensive error handling and logging
  - Implement proper error messages for authentication failures
  - Add logging for debugging userId validation issues
  - Ensure graceful handling of database constraint violations
  - _Requirements: 4.5, 5.5_

- [ ]* 8.1 Write unit tests for error scenarios
  - Test edge cases and error conditions for authentication and email validation
  - _Requirements: 4.5, 5.5_

- [x] 9. Create integration tests for end-to-end workflows
  - Test complete order creation flow for authenticated users only
  - Test user registration and email uniqueness enforcement
  - Verify admin operations work correctly for all orders with user associations
  - _Requirements: All requirements_

- [ ]* 9.1 Write integration tests for authenticated order workflows
  - Test end-to-end order creation, retrieval, and management for authenticated users
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2_

- [ ]* 9.2 Write integration tests for user management workflows
  - Test user registration, email validation, and account management
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Final checkpoint - Comprehensive system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Integration tests ensure end-to-end functionality works correctly for authenticated users only
- Focus on authentication requirements and proper error handling throughout
- Database migration required to change userId from nullable to required