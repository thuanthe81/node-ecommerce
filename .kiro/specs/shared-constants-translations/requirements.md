# Requirements Document

## Introduction

This document outlines the requirements for creating a shared library that centralizes constants and translations used by both the frontend and backend applications. Currently, there is duplication of constants (like order statuses, payment statuses) and translations between the two codebases, leading to potential inconsistencies and maintenance overhead.

## Glossary

- **Shared_Library**: A separate npm package containing constants and translations that can be imported by both frontend and backend
- **Constants**: Static values like order statuses, payment statuses, user roles, MIME types, and business information
- **Translations**: Localized text strings for status values and other shared content
- **Frontend**: Next.js React application
- **Backend**: NestJS Node.js application
- **Monorepo**: The current workspace structure containing both frontend and backend

## Requirements

### Requirement 1: Shared Constants Library

**User Story:** As a developer, I want a centralized constants library, so that both frontend and backend use consistent values and reduce duplication.

#### Acceptance Criteria

1. THE Shared_Library SHALL export all status constants (order status, payment status, user roles)
2. THE Shared_Library SHALL export all business constants (company info, contact details, social media URLs)
3. THE Shared_Library SHALL export all system constants (MIME types, API configuration)
4. THE Shared_Library SHALL export all cache key generators and patterns
5. WHEN constants are updated in the Shared_Library, THEN both Frontend and Backend SHALL use the updated values
6. THE Shared_Library SHALL provide TypeScript type definitions for all constants
7. THE Shared_Library SHALL include utility functions for constant validation

### Requirement 2: Shared Translations Library

**User Story:** As a developer, I want centralized status and email translations, so that both frontend and backend display consistent localized text.

#### Acceptance Criteria

1. THE Shared_Library SHALL export status translations for both English and Vietnamese
2. THE Shared_Library SHALL provide translation functions for order statuses
3. THE Shared_Library SHALL provide translation functions for payment statuses
4. THE Shared_Library SHALL provide translation functions for user roles
5. THE Shared_Library SHALL export email template translations for both English and Vietnamese
6. THE Shared_Library SHALL provide email translation functions for order confirmation emails
7. THE Shared_Library SHALL provide email translation functions for admin order notification emails
8. THE Shared_Library SHALL provide email translation functions for order status update emails
9. WHEN status or email translations are updated in the Shared_Library, THEN both Frontend and Backend SHALL use the updated translations
10. THE Shared_Library SHALL support extensible translation keys for future status types and email templates
11. THE Shared_Library SHALL maintain backward compatibility with existing translation usage

### Requirement 3: Package Structure and Distribution

**User Story:** As a developer, I want the shared library to be easily installable and maintainable, so that it integrates seamlessly with our monorepo workflow.

#### Acceptance Criteria

1. THE Shared_Library SHALL be structured as a separate npm package within the monorepo
2. THE Shared_Library SHALL be installable via npm/yarn in both Frontend and Backend
3. THE Shared_Library SHALL use TypeScript for type safety
4. THE Shared_Library SHALL have its own build process and package.json
5. THE Shared_Library SHALL export both CommonJS and ES modules for compatibility
6. THE Shared_Library SHALL include comprehensive documentation and examples
7. THE Shared_Library SHALL have automated tests for all exported functionality

### Requirement 4: Migration and Integration

**User Story:** As a developer, I want to migrate existing code to use the shared library, so that duplication is eliminated and consistency is achieved.

#### Acceptance Criteria

1. WHEN Backend constants are migrated, THEN all existing imports SHALL be updated to use the Shared_Library
2. WHEN Frontend constants are migrated, THEN all existing imports SHALL be updated to use the Shared_Library
3. WHEN Backend status translations are migrated, THEN all status translation calls SHALL use the Shared_Library
4. WHEN Backend email translations are migrated, THEN the EmailTranslationService SHALL be replaced with Shared_Library functions
5. WHEN Frontend status translations are migrated, THEN all status translation calls SHALL use the Shared_Library
6. WHEN Frontend email-related translations are migrated, THEN components SHALL use Shared_Library email translation functions
7. THE migration SHALL maintain all existing functionality without breaking changes
8. THE migration SHALL include comprehensive testing to verify compatibility
9. THE migration SHALL update all test files to use the new shared constants and translations

### Requirement 5: Development Workflow Integration

**User Story:** As a developer, I want the shared library to integrate with our development workflow, so that changes are automatically reflected in dependent applications.

#### Acceptance Criteria

1. WHEN the Shared_Library is modified during development, THEN Frontend and Backend SHALL automatically use the updated version
2. THE Shared_Library SHALL support hot reloading during development
3. THE Shared_Library SHALL have its own development scripts for building and testing
4. THE Shared_Library SHALL be included in the monorepo's root package.json workspace configuration
5. THE Shared_Library SHALL have automated linting and formatting rules consistent with the project
6. THE Shared_Library SHALL be included in the CI/CD pipeline for automated testing
7. THE Shared_Library SHALL have version management for production releases

### Requirement 6: Backward Compatibility and Extensibility

**User Story:** As a developer, I want the shared library to be extensible and backward compatible, so that future enhancements don't break existing functionality.

#### Acceptance Criteria

1. THE Shared_Library SHALL maintain API compatibility when adding new constants
2. THE Shared_Library SHALL maintain API compatibility when adding new translations
3. THE Shared_Library SHALL provide deprecation warnings for removed functionality
4. THE Shared_Library SHALL support adding new status types without breaking existing code
5. THE Shared_Library SHALL support adding new locales without breaking existing translations
6. THE Shared_Library SHALL use semantic versioning for release management
7. THE Shared_Library SHALL include migration guides for major version updates