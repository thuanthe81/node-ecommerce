# Implementation Plan

- [x] 1. Update PDF Localization Service currency configuration
  - Modify `backend/src/pdf-generator/services/pdf-localization.service.ts`
  - Update English locale `currencySymbol` from '$' to 'đ'
  - Update English locale `currencyPosition` from 'before' to 'after'
  - Ensure Vietnamese locale already uses 'đ' symbol and 'after' position
  - _Requirements: 1.1, 1.2, 3.3, 3.4_

- [ ]* 1.1 Write property test for consistent dong symbol usage
  - **Property 1: Consistent dong symbol usage**
  - **Validates: Requirements 1.1, 1.4**

- [x] 2. Simplify formatCurrency method implementation
  - Replace conditional locale-based logic with unified formatting
  - Use `toLocaleString('vi-VN')` for all number formatting regardless of locale
  - Apply consistent "amount đ" pattern for both English and Vietnamese
  - Remove unnecessary branching and complexity
  - _Requirements: 1.3, 3.1, 3.2, 3.5_

- [ ]* 2.1 Write property test for Vietnamese number formatting
  - **Property 3: Vietnamese number formatting**
  - **Validates: Requirements 1.3**

- [ ]* 2.2 Write property test for simplified formatting logic
  - **Property 8: Simplified formatting logic**
  - **Validates: Requirements 3.1, 3.4, 3.5**

- [x] 3. Update zero-amount handling
  - Ensure zero amounts display as "0 đ" for both locales
  - Remove "$0.00" formatting for English locale
  - Maintain consistent formatting pattern
  - _Requirements: 1.5_

- [ ]* 3.1 Write property test for symbol positioning consistency
  - **Property 2: Symbol positioning consistency**
  - **Validates: Requirements 1.2**

- [x] 4. Verify cross-service consistency
  - Compare PDF formatting output with email template service formatting
  - Ensure identical currency formatting patterns
  - Update any discrepancies to match established email template patterns
  - _Requirements: 2.1, 3.1_

- [ ]* 4.1 Write property test for cross-service formatting consistency
  - **Property 4: Cross-service formatting consistency**
  - **Validates: Requirements 2.1**

- [x] 5. Update existing unit tests
  - Modify `backend/src/pdf-generator/services/pdf-localization.service.spec.ts`
  - Update test expectations from '$' to 'đ' symbol
  - Update English locale test cases to expect 'after' positioning
  - Ensure all currency formatting tests pass with new implementation
  - _Requirements: 1.1, 1.2, 1.4_

- [ ]* 5.1 Write property test for internal PDF consistency
  - **Property 5: Internal PDF consistency**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [x] 6. Update PDF template engine tests
  - Modify `backend/src/pdf-generator/pdf-template.engine.spec.ts`
  - Update mock formatCurrency return values to use 'đ' symbol
  - Ensure template engine tests reflect new currency formatting
  - _Requirements: 2.2, 2.3_

- [ ]* 6.1 Write property test for Vietnamese locale string usage
  - **Property 6: Vietnamese locale string usage**
  - **Validates: Requirements 3.2**

- [x] 7. Update PDF document structure service tests
  - Modify tests in `backend/src/pdf-generator/pdf-document-structure.service.ts`
  - Update expected currency formatting in test assertions
  - Verify zero-price handling uses "0 đ" format
  - _Requirements: 1.5, 2.4_

- [ ]* 7.1 Write property test for configuration-based symbol definition
  - **Property 7: Configuration-based symbol definition**
  - **Validates: Requirements 3.3**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Update integration tests
  - Modify relevant integration tests in `backend/test/` directory
  - Update PDF generation tests to expect 'đ' currency symbol
  - Verify end-to-end PDF generation produces correct currency formatting
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ]* 9.1 Write unit tests for currency formatting edge cases
  - Test zero amounts, negative amounts, and large numbers
  - Test null/undefined amount handling
  - Test locale parameter variations
  - _Requirements: 1.5, 3.1_

- [x] 10. Verify PDF output consistency
  - Generate sample PDFs with various order types and amounts
  - Manually verify all monetary amounts display with 'đ' symbol
  - Check order confirmations, invoices, and payment information sections
  - Ensure consistent formatting across all PDF document types
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.