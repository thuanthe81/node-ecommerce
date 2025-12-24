# Implementation Plan: Variable Replacer HTML Cleanup

## Overview

This implementation plan removes all HTML generation and CSS styling code from the VariableReplacer service, moving these responsibilities to dedicated Handlebars partial templates and CSS component files. The refactoring maintains backward compatibility while achieving complete separation of concerns.

## Tasks

- [x] 1. Create directory structure for partial templates and CSS components
  - Create `backend/src/notifications/templates/partials/` directory
  - Create `backend/src/notifications/styles/components/` directory
  - Update template loader configuration to support partial template loading
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 2. Create partial template files
  - [x] 2.1 Create email header partial template
    - Create `partials/email-header.hbs` with company name and tagline
    - Replace HTML generation from `generateEmailHeader()` method
    - _Requirements: 1.2, 3.1_

  - [x] 2.2 Create email footer partial template
    - Create `partials/email-footer.hbs` with copyright, contact info, and disclaimer
    - Replace HTML generation from `generateEmailFooter()` method
    - _Requirements: 1.3, 3.2_

  - [x] 2.3 Create address card partial template
    - Create `partials/address-card.hbs` with address formatting
    - Replace HTML generation from `generateAddressCard()` method
    - Support all address fields (name, phone, address lines, city, state, postal code, country)
    - _Requirements: 1.4, 3.3_

  - [x] 2.4 Create button partial template
    - Create `partials/button.hbs` with text, URL, and style parameters
    - Support different button styles (primary, secondary, success, danger)
    - _Requirements: 3.4_

  - [x] 2.5 Create status badge partial template
    - Create `partials/status-badge.hbs` with status and status text parameters
    - Support all status types (pending, confirmed, shipped, delivered, cancelled)
    - _Requirements: 3.5_

  - [ ]* 2.6 Write property test for partial template parameter support
    - **Property 1: Partial Template Parameter Support**
    - **Validates: Requirements 3.7**

- [x] 3. Create CSS component files
  - [x] 3.1 Create layout CSS component
    - Create `components/layout.css` with header and footer styles
    - Move styles from `generateEmailHeader()` and `generateEmailFooter()` methods
    - _Requirements: 4.4_

  - [x] 3.2 Create buttons CSS component
    - Create `components/buttons.css` with all button styles
    - Move styles from `getButtonStyles()` method
    - Support primary, secondary, success, and danger button styles
    - _Requirements: 2.2, 4.1_

  - [x] 3.3 Create badges CSS component
    - Create `components/badges.css` with all status badge styles
    - Move styles from `getStatusBadgeStyles()` method
    - Support all status badge styles (pending, confirmed, shipped, delivered, cancelled)
    - _Requirements: 2.3, 4.2_

  - [x] 3.4 Create cards CSS component
    - Create `components/cards.css` with address card styles
    - Move styles from `generateAddressCard()` method
    - _Requirements: 4.3_

  - [ ]* 3.5 Write property test for CSS class usage
    - **Property 2: CSS Class Usage**
    - **Validates: Requirements 4.5**

  - [ ]* 3.6 Write property test for email client compatibility
    - **Property 3: Email Client Compatibility**
    - **Validates: Requirements 4.6**

- [x] 4. Register partial templates with Handlebars
  - [x] 4.1 Update VariableReplacer service to register partial templates
    - Add `registerPartialTemplates()` method to load and register all partials
    - Register email-header, email-footer, address-card, button, and status-badge partials
    - _Requirements: 3.6_

  - [ ]* 4.2 Write property test for partial template registration
    - **Property 4: Partial Template Registration**
    - **Validates: Requirements 3.6**

  - [x] 4.3 Add error handling for missing partial templates
    - Throw descriptive errors when partial templates are missing
    - Include partial name in error messages
    - _Requirements: 8.1_

  - [ ]* 4.4 Write property test for missing partial template error handling
    - **Property 5: Missing Partial Template Error Handling**
    - **Validates: Requirements 8.1**

- [x] 5. Update main email templates to use partial templates
  - [x] 5.1 Update order confirmation template
    - Replace `{{{emailHeader}}}` with `{{> email-header}}` partial
    - Replace `{{{emailFooter}}}` with `{{> email-footer}}` partial
    - Update template to pass required parameters to partials
    - _Requirements: 1.6_

  - [x] 5.2 Update admin order notification template
    - Replace helper calls with partial template includes
    - Update `{{{generateAddressCard}}}` calls with `{{> address-card}}` partials
    - Update `{{{generateButton}}}` calls with `{{> button}}` partials
    - Update `{{generateStatusBadge}}` calls with `{{> status-badge}}` partials
    - _Requirements: 1.6_

  - [x] 5.3 Update shipping notification template
    - Replace `{{{emailHeader}}}` and `{{{emailFooter}}}` with partials
    - Update any other helper calls to use partials
    - _Requirements: 1.6_

  - [x] 5.4 Update order status update template
    - Replace helper calls with partial template includes
    - Update `{{generateStatusBadge}}` calls with `{{> status-badge}}` partials
    - _Requirements: 1.6_

  - [x] 5.5 Update authentication templates (welcome email and password reset)
    - Replace `{{{emailHeader}}}` and `{{{emailFooter}}}` with partials
    - Update any button helper calls to use button partials
    - _Requirements: 1.6_

- [x] 6. Update CSS files to import component styles
  - [x] 6.1 Update order-related CSS files
    - Add `@import '../components/layout.css';` to all order template CSS files
    - Add `@import '../components/buttons.css';` where buttons are used
    - Add `@import '../components/badges.css';` where badges are used
    - Add `@import '../components/cards.css';` where address cards are used
    - _Requirements: 2.5_

  - [x] 6.2 Update authentication CSS files
    - Add component CSS imports to welcome email and password reset CSS files
    - _Requirements: 2.5_

- [x] 7. Checkpoint - Ensure partial templates and CSS components work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Remove HTML generation methods from VariableReplacer service
  - [x] 8.1 Remove HTML generation methods
    - Remove `generateEmailHeader()` method
    - Remove `generateEmailFooter()` method
    - Remove `generateAddressCard()` method
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 8.2 Remove CSS generation methods
    - Remove `getButtonStyles()` method
    - Remove `getStatusBadgeStyles()` method
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 8.3 Write property test for HTML generation elimination
    - **Property 6: HTML Generation Elimination**
    - **Validates: Requirements 1.1, 1.5**

  - [ ]* 8.4 Write property test for CSS generation elimination
    - **Property 7: CSS Generation Elimination**
    - **Validates: Requirements 2.1, 2.4**

- [x] 9. Refactor template helper functions
  - [x] 9.1 Remove HTML-generating template helpers
    - Remove `emailHeader` helper (replaced by partial)
    - Remove `emailFooter` helper (replaced by partial)
    - Remove `generateButton` helper (replaced by partial)
    - Remove `generateStatusBadge` helper (replaced by partial)
    - Remove `generateAddressCard` helper (replaced by partial)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.2 Keep only data transformation helpers
    - Keep `formatCurrency` helper (data transformation only)
    - Keep `formatDate` helper (data transformation only)
    - Add `getStatusText` helper for status text translation
    - _Requirements: 5.6, 5.7_

  - [ ]* 9.3 Write property test for template helper simplification
    - **Property 8: Template Helper Simplification**
    - **Validates: Requirements 5.6, 5.7**

- [x] 10. Add comprehensive error handling and validation
  - [x] 10.1 Add partial template validation
    - Validate that all partial templates contain valid HTML structure
    - Provide specific error messages for validation failures
    - _Requirements: 8.4, 8.6_

  - [x] 10.2 Add CSS component validation
    - Validate that all CSS component files contain valid CSS syntax
    - Log warnings for invalid CSS and continue with defaults
    - _Requirements: 8.2, 8.5, 8.6, 8.7_

  - [x] 10.3 Add partial template rendering error handling
    - Log partial name and error details when rendering fails
    - _Requirements: 8.3_

  - [ ]* 10.4 Write property test for error handling completeness
    - **Property 9: Error Handling Completeness**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

- [x] 11. Ensure backward compatibility
  - [x] 11.1 Verify API compatibility
    - Ensure all public method signatures remain unchanged
    - Test that email generation still works with existing data interfaces
    - _Requirements: 6.2_

  - [x] 11.2 Verify visual output consistency
    - Compare generated HTML output before and after refactoring
    - Ensure visual appearance is identical
    - _Requirements: 6.1, 6.3_

  - [ ]* 11.3 Write property test for visual output consistency
    - **Property 10: Visual Output Consistency**
    - **Validates: Requirements 6.1, 6.3**

  - [ ]* 11.4 Write property test for API compatibility
    - **Property 11: API Compatibility**
    - **Validates: Requirements 6.2**

  - [x] 11.5 Verify email client compatibility and accessibility
    - Test that all email client compatibility features are preserved
    - Test that all accessibility features are maintained
    - _Requirements: 6.4, 6.5, 6.6_

  - [ ]* 11.6 Write property test for compatibility feature preservation
    - **Property 12: Compatibility Feature Preservation**
    - **Validates: Requirements 6.4, 6.5, 6.6**

- [x] 12. Update directory structure and organization
  - [x] 12.1 Organize partial templates by component type
    - Ensure templates are logically organized (layout, forms, cards, etc.)
    - _Requirements: 7.3_

  - [x] 12.2 Ensure CSS component organization matches template organization
    - Maintain clear mapping between partial templates and CSS files
    - _Requirements: 7.4, 7.6_

  - [ ]* 12.3 Write property test for directory structure compliance
    - **Property 13: Directory Structure Compliance**
    - **Validates: Requirements 7.3, 7.4, 7.6, 7.7**

- [x] 13. Final checkpoint - Ensure all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integration testing and cleanup
  - [x] 14.1 Update existing tests to work with new implementation
    - Update VariableReplacer service unit tests
    - Update email template integration tests
    - Fix any broken tests due to implementation changes
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 14.2 Write integration tests for partial template system
    - Test end-to-end email generation with partial templates
    - Test error handling in integration scenarios
    - Test performance impact of partial template system
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 14.3 Clean up unused code and imports
    - Remove unused imports and dependencies
    - Update documentation and comments
    - Remove any remaining dead code
    - _Requirements: 1.1, 2.1_

- [x] 15. Final validation - Ensure system is production ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation maintains full backward compatibility with existing APIs
- Partial templates provide complete separation of HTML structure from TypeScript code
- CSS component files enable independent styling maintenance
- Error handling ensures graceful degradation for missing CSS but fails fast for missing templates