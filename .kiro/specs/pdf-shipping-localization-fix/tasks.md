# Implementation Plan

- [x] 1. Update PDF Document Structure Service to use localization service
  - [x] 1.1 Inject PDF Localization Service into constructor
    - Add PDFLocalizationService to constructor parameters
    - Update service imports and dependency injection
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Write property test for localization service usage
    - **Property 1: Localization service usage for shipping sections**
    - **Validates: Requirements 1.1**

  - [x] 1.3 Replace hardcoded shipping section title with localization service
    - Replace `isVietnamese ? 'Thông tin vận chuyển' : 'Shipping Information'` with `this.localizationService.translate('shippingInformation', locale)`
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.4 Write property test for translation key usage
    - **Property 2: Translation key usage for shipping labels**
    - **Validates: Requirements 1.2**

  - [x] 1.5 Replace hardcoded shipping method label with localization service
    - Replace `isVietnamese ? 'Phương thức vận chuyển' : 'Shipping Method'` with `this.localizationService.translate('shippingMethod', locale)`
    - _Requirements: 1.1, 1.2_

  - [x] 1.6 Replace hardcoded description label with localization service
    - Replace `isVietnamese ? 'Mô tả' : 'Description'` with `this.localizationService.translate('description', locale)`
    - _Requirements: 1.1, 1.2_

  - [x] 1.7 Replace hardcoded estimated delivery label with localization service
    - Replace `isVietnamese ? 'Dự kiến giao hàng' : 'Estimated Delivery'` with `this.localizationService.translate('estimatedDelivery', locale)`
    - _Requirements: 1.1, 1.2_

  - [x] 1.8 Replace hardcoded tracking number label with localization service
    - Replace `isVietnamese ? 'Mã vận đơn' : 'Tracking Number'` with `this.localizationService.translate('trackingNumber', locale)`
    - _Requirements: 1.1, 1.2_

  - [x] 1.9 Replace hardcoded carrier label with localization service
    - Replace `isVietnamese ? 'Đơn vị vận chuyển' : 'Carrier'` with `this.localizationService.translate('carrier', locale)`
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.10 Write property test for consistent localization patterns
    - **Property 3: Consistent localization patterns across components**
    - **Validates: Requirements 1.3**

- [x] 2. Verify cross-service translation consistency
  - [x] 2.1 Test shipping section translations match other PDF sections
    - Verify that common terms use identical translation keys across PDF components
    - Ensure consistent translation patterns between PDF Document Structure Service and PDF Template Engine
    - _Requirements: 2.1, 2.5_

  - [ ]* 2.2 Write property test for cross-section translation consistency
    - **Property 4: Cross-section translation consistency**
    - **Validates: Requirements 2.1**

  - [x] 2.3 Validate Vietnamese locale shipping translations
    - Test that all shipping-related text in Vietnamese matches the localization service translations
    - Verify proper Vietnamese formatting and terminology
    - _Requirements: 2.2_

  - [ ]* 2.4 Write property test for Vietnamese locale shipping translations
    - **Property 5: Vietnamese locale shipping translations**
    - **Validates: Requirements 2.2**

  - [x] 2.5 Validate English locale shipping translations
    - Test that all shipping-related text in English matches the localization service translations
    - Verify proper English formatting and terminology
    - _Requirements: 2.3_

  - [ ]* 2.6 Write property test for English locale shipping translations
    - **Property 6: English locale shipping translations**
    - **Validates: Requirements 2.3**

  - [ ]* 2.7 Write property test for service translation consistency
    - **Property 7: Service translation consistency**
    - **Validates: Requirements 2.5**

- [x] 3. Update and verify existing tests
  - [x] 3.1 Update PDF Document Structure Service unit tests
    - Modify existing tests to expect localization service usage
    - Update test mocks to include PDFLocalizationService
    - Verify all shipping section tests pass with new implementation
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 3.2 Write property test for English locale shipping section correctness
    - **Property 8: English locale shipping section correctness**
    - **Validates: Requirements 3.1**

  - [ ]* 3.3 Write property test for Vietnamese locale shipping section correctness
    - **Property 9: Vietnamese locale shipping section correctness**
    - **Validates: Requirements 3.2**

  - [x] 3.4 Add integration tests for cross-service consistency
    - Create tests that compare output between PDF Document Structure Service and PDF Template Engine
    - Verify identical translations for the same shipping data and locale
    - _Requirements: 2.5, 3.3_

  - [ ]* 3.5 Write property test for service output consistency
    - **Property 10: Service output consistency**
    - **Validates: Requirements 3.3**

- [x] 4. Validate translation key completeness and fallback behavior
  - [x] 4.1 Verify all shipping translation keys exist in localization service
    - Check that all required shipping-related keys exist in both English and Vietnamese dictionaries
    - Validate translation key completeness and accuracy
    - _Requirements: 3.4_

  - [ ]* 4.2 Write property test for translation key completeness
    - **Property 11: Translation key completeness**
    - **Validates: Requirements 3.4**

  - [x] 4.3 Test fallback behavior for missing translation keys
    - Verify graceful handling when translation keys are missing
    - Test that the localization service fallback mechanism works correctly
    - _Requirements: 3.5_

  - [ ]* 4.4 Write property test for fallback mechanism
    - **Property 12: Fallback mechanism for missing keys**
    - **Validates: Requirements 3.5**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Verify PDF generation output consistency
  - [x] 6.1 Generate sample PDFs with various shipping configurations
    - Test PDFs with different shipping methods, tracking numbers, and delivery information
    - Verify consistent translation usage across all shipping data variations
    - _Requirements: 1.1, 1.2, 2.2, 2.3_

  - [x] 6.2 Compare PDF output before and after localization fix
    - Ensure that the visual output remains identical while using proper localization
    - Verify that no functionality is broken by the localization changes
    - _Requirements: 1.3, 2.1_

  - [x] 6.3 Test locale switching behavior
    - Generate PDFs switching between English and Vietnamese locales
    - Verify proper translation switching and no cross-contamination
    - _Requirements: 2.2, 2.3, 3.1, 3.2_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.