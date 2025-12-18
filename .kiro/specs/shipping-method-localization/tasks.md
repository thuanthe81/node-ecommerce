# Implementation Plan

- [-] 1. Update backend shipping calculation API to support locale parameters
  - [x] 1.1 Add locale parameter to CalculateShippingDto
    - Add optional locale field with validation for 'en' and 'vi' values
    - Update DTO class with proper decorators and validation
    - _Requirements: 2.1, 2.3_

  - [ ]* 1.2 Write property test for locale parameter validation
    - **Property 4: Locale parameter acceptance**
    - **Validates: Requirements 2.1**

  - [x] 1.3 Update ShippingService calculateShipping method to handle locale
    - Modify method signature to accept locale parameter
    - Add locale-based field selection logic for primary name/description
    - Ensure all locale variants are included in response
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.5_

  - [ ]* 1.4 Write property test for Vietnamese locale primary fields
    - **Property 1: Vietnamese locale returns Vietnamese primary fields**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.5 Write property test for English locale primary fields
    - **Property 2: English locale returns English primary fields**
    - **Validates: Requirements 1.3, 1.4**

  - [ ]* 1.6 Write property test for complete locale data inclusion
    - **Property 3: Complete locale data inclusion**
    - **Validates: Requirements 1.5, 2.5**

  - [x] 1.7 Implement default locale behavior when no locale provided
    - Add logic to default to English when locale parameter is missing
    - Update response to use English as primary fields
    - _Requirements: 2.2_

  - [ ]* 1.8 Write property test for default locale behavior
    - **Property 5: Default locale behavior**
    - **Validates: Requirements 2.2**

  - [ ] 1.9 Implement invalid locale fallback handling
    - Add validation and fallback logic for invalid locale values
    - Log warnings for invalid locale parameters
    - _Requirements: 2.3_

  - [ ]* 1.10 Write property test for invalid locale fallback
    - **Property 6: Invalid locale fallback**
    - **Validates: Requirements 2.3**

- [x] 2. Update ShippingRate interface and response structure
  - [x] 2.1 Extend ShippingRate interface with all locale fields
    - Add nameEn, nameVi, descriptionEn, descriptionVi fields
    - Maintain backward compatibility with existing name/description fields
    - Update TypeScript interfaces in both backend and frontend
    - _Requirements: 1.5, 2.5_

  - [ ]* 2.2 Write property test for locale-based field prioritization
    - **Property 7: Locale-based field prioritization**
    - **Validates: Requirements 2.4**

  - [x] 2.3 Update shipping service to populate all locale fields
    - Modify calculateShipping to include all language variants in response
    - Set primary name/description based on requested locale
    - Handle missing translation data with fallback logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.4 Write property test for missing translation fallback
    - **Property 15: Missing translation fallback**
    - **Validates: Requirements 5.1**

- [x] 3. Update frontend shipping API client
  - [x] 3.1 Add locale parameter to CalculateShippingData interface
    - Update frontend interface to include optional locale field
    - Modify shippingApi.calculateShipping to pass locale parameter
    - _Requirements: 3.1_

  - [ ]* 3.2 Write property test for frontend locale passing
    - **Property 8: Frontend locale passing**
    - **Validates: Requirements 3.1**

  - [x] 3.3 Update ShippingRate interface in frontend
    - Add all locale fields to match backend response structure
    - Ensure type safety for new locale-specific fields
    - _Requirements: 1.5, 3.2_

- [x] 4. Update ShippingMethodSelector component for locale support
  - [x] 4.1 Add locale prop to ShippingMethodSelector
    - Update component props to accept current locale
    - Pass locale to shipping calculation API calls
    - _Requirements: 3.1_

  - [x] 4.2 Implement locale-aware display logic
    - Use locale-appropriate name and description fields from API response
    - Add fallback logic for missing translations
    - _Requirements: 3.2, 3.4_

  - [ ]* 4.3 Write property test for frontend localized field usage
    - **Property 9: Frontend localized field usage**
    - **Validates: Requirements 3.2**

  - [ ]* 4.4 Write property test for frontend fallback behavior
    - **Property 11: Frontend fallback behavior**
    - **Validates: Requirements 3.4**

  - [x] 4.5 Implement dynamic locale switching
    - Add useEffect to re-fetch shipping methods when locale changes
    - Handle loading states during locale switching
    - _Requirements: 3.3_

  - [ ]* 4.6 Write property test for dynamic locale switching
    - **Property 10: Dynamic locale switching**
    - **Validates: Requirements 3.3**

  - [x] 4.7 Add error handling for locale switching failures
    - Implement graceful error handling when API calls fail
    - Display appropriate error messages in current locale
    - _Requirements: 5.4_

  - [ ]* 4.8 Write property test for frontend error handling
    - **Property 18: Frontend error handling**
    - **Validates: Requirements 5.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update checkout flow integration
  - [x] 6.1 Update checkout pages to pass locale to ShippingMethodSelector
    - Modify checkout components to include current locale prop
    - Ensure locale is passed from Next.js locale context
    - _Requirements: 3.1_

  - [x] 6.2 Add translations for shipping-related UI text
    - Add shipping method selection translations to translations.json
    - Include error messages and loading states in both languages
    - _Requirements: 3.2, 5.4_

- [x] 7. Implement cross-component consistency
  - [x] 7.1 Update PDF generation to use localized shipping method data
    - Modify PDF services to fetch shipping method details with locale
    - Ensure PDF shipping sections use same text as checkout
    - _Requirements: 4.1_

  - [ ]* 7.2 Write property test for cross-component consistency
    - **Property 12: Cross-component consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 7.3 Update order confirmation to use localized shipping data
    - Modify order services to include locale when fetching shipping details
    - Ensure order confirmations match checkout display
    - _Requirements: 4.2_

  - [x] 7.4 Update email notifications to use localized shipping data
    - Modify email services to use locale-appropriate shipping method text
    - Ensure email content matches checkout and order confirmations
    - _Requirements: 4.3_

- [x] 8. Add data validation and error handling
  - [x] 8.1 Implement shipping method translation validation
    - Add validation to ensure active methods have complete translations
    - Create admin warnings for missing translations
    - _Requirements: 4.5_

  - [ ]* 8.2 Write property test for complete translation validation
    - **Property 14: Complete translation validation**
    - **Validates: Requirements 4.5**

  - [x] 8.3 Add service unavailability resilience
    - Implement fallback logic when localization services fail
    - Add caching for shipping method translations
    - _Requirements: 5.2_

  - [ ]* 8.4 Write property test for service unavailability resilience
    - **Property 16: Service unavailability resilience**
    - **Validates: Requirements 5.2**

  - [x] 8.5 Implement corrupted data handling
    - Add validation to exclude invalid shipping methods from results
    - Log errors for corrupted shipping method data
    - _Requirements: 5.5_

  - [ ]* 8.6 Write property test for corrupted data handling
    - **Property 19: Corrupted data handling**
    - **Validates: Requirements 5.5**

- [x] 9. Add comprehensive logging and monitoring
  - [x] 9.1 Implement translation missing logging
    - Add structured logging for missing translation fields
    - Include method ID and missing field information
    - _Requirements: 5.1_

  - [x] 9.2 Add locale parameter logging
    - Log invalid locale parameters with fallback behavior
    - Track locale usage patterns for analytics
    - _Requirements: 2.3_

  - [ ]* 9.3 Write property test for missing key fallback
    - **Property 17: Missing key fallback**
    - **Validates: Requirements 5.3**

- [x] 10. Update admin interface for translation management
  - [x] 10.1 Update shipping method admin forms to show both languages
    - Modify admin forms to display and edit both English and Vietnamese fields
    - Add validation to ensure both translations are provided
    - _Requirements: 4.5_

  - [x] 10.2 Add translation completeness indicators
    - Show warnings in admin interface for incomplete translations
    - Add bulk translation validation tools
    - _Requirements: 4.5_

- [x] 11. Final integration testing and validation
  - [x] 11.1 Test end-to-end locale switching workflow
    - Verify complete user journey from language selection to checkout
    - Test all shipping method displays use consistent localized text
    - _Requirements: 3.3, 4.1, 4.2, 4.3_

  - [ ]* 11.2 Write property test for translation update propagation
    - **Property 13: Translation update propagation**
    - **Validates: Requirements 4.4**

  - [x] 11.3 Validate cache invalidation for translation updates
    - Test that shipping method translation changes invalidate relevant caches
    - Verify updated translations appear across all system components
    - _Requirements: 4.4_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.