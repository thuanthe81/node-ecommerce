# Implementation Plan: Shared Constants and Translations Library

## Overview

This implementation plan converts the shared constants and translations library design into a series of incremental coding tasks. Each task builds on previous steps and focuses on creating a centralized library that eliminates duplication between frontend and backend applications.

## Tasks

- [x] 1. Set up shared package structure and build configuration
  - Create shared/ directory with proper npm package structure
  - Set up TypeScript configuration for multiple output formats (CommonJS, ESM)
  - Configure build scripts and development tooling
  - Set up Jest testing framework with property-based testing support
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ]* 1.1 Write property test for package structure
  - **Property 1: Complete Constant Export**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**

- [x] 2. Implement core constants module
  - [x] 2.1 Create status constants (order, payment, user roles)
    - Implement OrderStatus, PaymentStatus, UserRole enums
    - Create STATUS constant object with all status values
    - Add TypeScript type definitions and exports
    - _Requirements: 1.1, 1.6_

  - [ ]* 2.2 Write property test for status constants
    - **Property 3: Validation Function Consistency**
    - **Validates: Requirements 1.7**

  - [x] 2.3 Create business constants (company info, contact details)
    - Implement BUSINESS constant object with company information
    - Add contact details, social media URLs, and asset paths
    - Include localized company names and contact information
    - _Requirements: 1.2, 1.6_

  - [x] 2.4 Create system constants (MIME types, API config)
    - Implement SYSTEM constant object with MIME types
    - Add email configuration and API settings
    - Include rate limiting and timeout configurations
    - _Requirements: 1.3, 1.6_

  - [x] 2.5 Create cache key generators
    - Implement CACHE_KEYS object with generator functions
    - Add cache key patterns for categories, products, shipping, etc.
    - Ensure type safety for all cache key generators
    - _Requirements: 1.4, 1.6_

  - [ ]* 2.6 Write property test for cache key generators
    - **Property 4: Cache Key Uniqueness and Format**
    - **Validates: Requirements 1.4**

- [x] 3. Implement translations module
  - [x] 3.1 Create status translations
    - Implement STATUS_TRANSLATIONS object with EN/VI translations
    - Add translation functions for order status, payment status, user roles
    - Include fallback logic for missing translations
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2 Write property test for status translations
    - **Property 2: Translation Function Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 3.3 Create email translations
    - Implement EMAIL_TRANSLATIONS object with comprehensive email templates
    - Add order confirmation, admin notification, and status update translations
    - Include common email elements (signatures, branding, copyright)
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

  - [x] 3.4 Create email translation functions
    - Implement getEmailTemplateTranslations() function
    - Add getOrderConfirmationTranslations() function
    - Add getAdminOrderNotificationTranslations() function
    - Add getOrderStatusUpdateTranslations() function
    - Include generic getTranslation() helper function
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

  - [ ]* 3.5 Write property test for email translations
    - **Property 5: Translation Extensibility**
    - **Validates: Requirements 2.6, 6.4, 6.5**

- [x] 4. Implement utility functions
  - [x] 4.1 Create validation utilities
    - Implement status validation functions (isValidOrderStatus, etc.)
    - Add MIME type validation functions
    - Include email and URL validation helpers
    - _Requirements: 1.7_

  - [x] 4.2 Create translation helpers
    - Implement locale detection utilities
    - Add fallback translation logic
    - Include translation key generation helpers
    - _Requirements: 2.10, 2.11_

  - [ ]* 4.3 Write unit tests for utility functions
    - Test validation functions with valid/invalid inputs
    - Test translation helpers with various locales
    - Test edge cases and error conditions
    - _Requirements: 1.7, 2.10, 2.11_

- [x] 5. Set up build system and module exports
  - [x] 5.1 Configure TypeScript project references
    - Set up tsconfig files for CommonJS and ESM builds
    - Configure declaration file generation
    - Set up source maps for debugging
    - _Requirements: 3.3, 3.5_

  - [x] 5.2 Create main export files
    - Implement src/index.ts with all exports
    - Create barrel exports for each module
    - Ensure proper TypeScript type exports
    - _Requirements: 3.3, 3.5, 3.6_

  - [ ]* 5.3 Write property test for module compatibility
    - **Property 6: Module Format Compatibility**
    - **Validates: Requirements 3.3, 3.5**

- [x] 6. Checkpoint - Ensure shared library builds and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Backend integration and migration
  - [x] 7.1 Install shared library in backend
    - Add @alacraft/shared dependency to backend package.json
    - Update workspace configuration to include shared package
    - Verify shared library can be imported in backend
    - _Requirements: 3.2, 4.1_

  - [x] 7.2 Migrate backend constants
    - Replace backend/src/common/constants.ts imports with shared library
    - Update all files importing STATUS, BUSINESS, SYSTEM, CACHE_KEYS
    - Verify all existing functionality works with shared constants
    - _Requirements: 4.1, 4.5_

  - [x] 7.3 Replace EmailTranslationService with shared functions
    - ✅ Removed backend/src/notifications/services/email-translation.service.ts
    - ✅ Updated all email services to use shared translation functions
    - ✅ Replaced getEmailTemplateTranslations calls with shared library
    - ✅ Verified all email templates render correctly with shared translations
    - ✅ Updated all test files to remove EmailTranslationService dependencies
    - ✅ Added shipping notification and payment status update translations
    - ✅ Added contact form email translations
    - ✅ Added PDF metadata and error handling translations
    - ✅ Migrated all hardcoded email subjects to use shared translations
    - ✅ Updated email worker service to use shared translations
    - ✅ Updated PDF services to use shared translations
    - _Requirements: 4.3, 4.5_

  - [ ]* 7.4 Write integration tests for backend migration
    - Test that all backend services work with shared library
    - Verify email templates render with correct translations
    - Test cache key generation works with Redis
    - _Requirements: 4.5, 4.6_

- [x] 8. Frontend integration and migration
  - [x] 8.1 Install shared library in frontend
    - Add @alacraft/shared dependency to frontend package.json
    - Update workspace configuration
    - Verify shared library can be imported in frontend
    - _Requirements: 3.2, 4.2_

  - [x] 8.2 Migrate frontend constants
    - Update frontend/app/constants.ts to use shared business constants
    - Replace hardcoded company names with shared BUSINESS constants
    - Update any other constant usage throughout frontend
    - _Requirements: 4.2, 4.5_

  - [x] 8.3 Integrate status translations with existing i18n system
    - Update components using status translations to use shared functions
    - Integrate translateOrderStatus, translatePaymentStatus with existing useTranslations
    - Ensure status displays work correctly in both locales
    - _Requirements: 4.4, 4.5_

  - [ ]* 8.4 Write integration tests for frontend migration
    - Test that components display correct status translations
    - Verify shared constants work in React components
    - Test both English and Vietnamese locales
    - _Requirements: 4.5, 4.6_

- [x] 9. Cleanup and backward compatibility
  - [x] 9.1 Remove duplicate constant files
    - Remove backend/src/common/constants.ts (after verifying migration)
    - Clean up unused imports and references
    - Update any remaining hardcoded constants
    - _Requirements: 4.1, 4.2_

  - [x] 9.2 Add deprecation warnings for removed functionality
    - Add deprecated wrapper functions with console warnings
    - Ensure backward compatibility for any external dependencies
    - Document migration path for deprecated functions
    - _Requirements: 6.3, 2.11_

  - [ ]* 9.3 Write property test for backward compatibility
    - **Property 7: Backward Compatibility Preservation**
    - **Validates: Requirements 2.7, 4.5, 6.1, 6.2**

  - [ ]* 9.4 Write property test for deprecation warnings
    - **Property 8: Deprecation Warning Consistency**
    - **Validates: Requirements 6.3**

- [-] 10. Final testing and validation
  - [x] 10.1 Run comprehensive test suite
    - Execute all unit tests, integration tests, and property tests
    - Verify test coverage meets 90% threshold
    - Run tests in both development and production builds
    - _Requirements: 3.7_

  - [ ]* 10.2 Write property test for test coverage
    - **Property 9: Test Coverage Completeness**
    - **Validates: Requirements 3.7**

  - [ ] 10.3 Validate development workflow
    - Test hot reloading works with shared library changes
    - Verify both frontend and backend update when shared library changes
    - Test build process works correctly for all output formats
    - _Requirements: 5.1, 5.2_

- [x] 11. Final checkpoint - Ensure all tests pass and functionality works
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure frontend and backend work correctly with shared library
- Migration tasks maintain existing functionality while eliminating duplication