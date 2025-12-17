# Implementation Plan

- [x] 1. Create centralized constants file structure
  - Create `backend/src/common/constants.ts` with TypeScript interfaces and const assertions
  - Define hierarchical structure for status, cache, system, and other constants
  - Add comprehensive JSDoc documentation for all constant groups
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 4.1, 4.4_

- [ ]* 1.1 Write property test for constants file structure
  - **Property 4: Consistent naming conventions**
  - **Validates: Requirements 2.2**

- [ ]* 1.2 Write property test for JSDoc documentation
  - **Property 5: JSDoc documentation completeness**
  - **Validates: Requirements 2.4**

- [x] 2. Implement status constants
  - Add ORDER_STATUS constants mapping to Prisma OrderStatus enum
  - Add PAYMENT_STATUS constants mapping to Prisma PaymentStatus enum
  - Add USER_ROLES constants mapping to Prisma UserRole enum
  - Provide both individual exports and grouped exports
  - _Requirements: 1.1, 1.3, 4.2_

- [ ]* 2.1 Write property test for status value centralization
  - **Property 1: Status value centralization**
  - **Validates: Requirements 1.1, 3.1, 3.2, 3.3**

- [x] 3. Implement cache key constants
  - Add CACHE_KEYS constants for categories, products, and shipping
  - Create cache key generator functions for dynamic keys
  - Ensure cache key uniqueness and prevent collisions
  - _Requirements: 1.2, 3.4_

- [ ]* 3.1 Write property test for cache key centralization
  - **Property 2: Cache key centralization**
  - **Validates: Requirements 1.2, 3.4**

- [x] 4. Implement system constants
  - Add MIME_TYPES constants for file validation and content types
  - Add EMAIL constants for SMTP configuration defaults
  - Add API constants for pagination and timeout values
  - _Requirements: 1.4, 1.5, 3.5_

- [ ]* 4.1 Write property test for MIME type centralization
  - **Property 3: MIME type centralization**
  - **Validates: Requirements 1.4, 3.5**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Replace hardcoded status strings in analytics service
  - Update analytics service to use ORDER_STATUS and PAYMENT_STATUS constants
  - Replace hardcoded 'PAID' strings with PAYMENT_STATUS.PAID
  - Update SQL queries to use constant references
  - _Requirements: 3.1, 3.2_

- [x] 7. Replace hardcoded status strings in notifications service
  - Update email status badge generators to use status constants
  - Replace hardcoded status strings in email templates
  - Update status validation functions to use constants
  - _Requirements: 3.1, 3.2_

- [x] 8. Replace hardcoded role strings in controllers and guards
  - Update all @Roles decorators to use USER_ROLES constants
  - Replace hardcoded 'ADMIN' and 'CUSTOMER' strings
  - Update role-based authorization logic
  - _Requirements: 3.3_

- [x] 9. Replace hardcoded cache keys in categories service
  - Update categories service to use CACHE_KEYS constants
  - Replace hardcoded 'categories:tree' and other cache keys
  - Update cache invalidation logic to use constants
  - _Requirements: 3.4_

- [x] 10. Replace hardcoded cache keys in other services
  - Update products service cache keys
  - Update shipping service cache keys
  - Update any other services using hardcoded cache keys
  - _Requirements: 3.4_

- [x] 11. Replace hardcoded MIME types in email and file services
  - Update email service MIME type mappings to use constants
  - Update file upload validation to use MIME_TYPES constants
  - Replace hardcoded content type strings
  - _Requirements: 3.5_

- [x] 12. Replace hardcoded email configuration strings
  - Update email service default values to use EMAIL constants
  - Replace hardcoded SMTP server and port strings
  - Update email template identifiers to use constants
  - _Requirements: 1.5_

- [ ]* 13. Write unit tests for constants file
  - Create unit tests for constants file structure and organization
  - Test proper TypeScript typing and const assertions
  - Test export patterns (named and grouped exports)
  - Test import compatibility (named and namespace imports)
  - _Requirements: 2.1, 2.3, 4.1, 4.2, 4.3, 4.5_

- [ ]* 14. Write integration tests for constants usage
  - Test constants work correctly across module boundaries
  - Test cache operations function properly with constant keys
  - Test status-based logic works with constant values
  - Test email services work with constant identifiers
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 16. Add business constants to constants file
  - Add BUSINESS constants for company information (names, contact details)
  - Add company name constants for English and Vietnamese
  - Add contact email and phone constants
  - Add website and social media URL constants
  - Add branding asset path constants
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 16.1 Write property test for business constants centralization
  - **Property 6: Business information centralization**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 17. Replace hardcoded company names in orders service
  - Update createBusinessInfo method to use BUSINESS.COMPANY constants
  - Replace hardcoded "AlaCraft" and "AlaCraft Việt Nam" strings
  - Update business address creation to use constants
  - _Requirements: 5.1_

- [x] 18. Replace hardcoded contact information in services
  - Update email services to use BUSINESS.CONTACT constants
  - Replace hardcoded email addresses with constant references
  - Update phone number references to use constants
  - _Requirements: 5.2_

- [x] 19. Replace hardcoded URLs in email templates and services
  - Update website URL references to use BUSINESS.WEBSITE constants
  - Replace hardcoded social media URLs with BUSINESS.SOCIAL constants
  - Update email template URL references
  - _Requirements: 5.3, 5.5_

- [x] 20. Replace hardcoded asset paths in PDF and email services
  - Update logo path references to use BUSINESS.ASSETS constants
  - Replace hardcoded "/uploads/logo.jpg" with constant reference
  - Update other asset path references
  - _Requirements: 5.4_

- [x] 21. Replace hardcoded business information in PDF services
  - Update PDF generator services to use business constants
  - Replace hardcoded company names in PDF templates
  - Update business information in PDF metadata
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 22. Replace hardcoded business information in email templates
  - Update email template service to use business constants
  - Replace hardcoded company references in email headers
  - Update contact information in email footers
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 23. Write unit tests for business constants usage
  - Test business constants are properly imported and used
  - Test company name localization works correctly
  - Test contact information constants are valid
  - Test URL constants are properly formatted
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 24. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.