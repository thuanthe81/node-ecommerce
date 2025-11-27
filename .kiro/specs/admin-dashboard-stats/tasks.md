# Implementation Plan

- [x] 1. Extend backend API with count endpoints
  - [x] 1.1 Add product count endpoint to ProductsController
    - Create GET /products/count endpoint with admin authorization
    - Implement count logic in ProductsService to count all products
    - Return JSON response with count field
    - _Requirements: 3.1_

  - [x] 1.2 Add customer count endpoint to UsersController
    - Create GET /users/count endpoint with admin authorization
    - Implement count logic in UsersService to count users with CUSTOMER role
    - Return JSON response with count field
    - _Requirements: 4.1_

  - [ ]* 1.3 Write property test for count endpoints
    - **Property 6: API call correctness**
    - **Validates: Requirements 1.1, 2.1, 3.1, 4.1**

- [x] 2. Extend frontend API client functions
  - [x] 2.1 Add getProductCount function to product-api.ts
    - Create function that calls GET /products/count
    - Add TypeScript interface for ProductCountResponse
    - Handle authentication with JWT token
    - _Requirements: 3.1_

  - [x] 2.2 Add getCustomerCount function to user-api.ts
    - Create function that calls GET /users/count
    - Add TypeScript interface for CustomerCountResponse
    - Handle authentication with JWT token
    - _Requirements: 4.1_

- [x] 3. Create useDashboardStats custom hook
  - [x] 3.1 Implement hook state management
    - Define DashboardStats interface with loading, error, and value states for each stat
    - Initialize state with all stats loading and values null
    - Create individual state update functions for each stat
    - _Requirements: 1.2, 2.2, 3.2, 4.2_

  - [x] 3.2 Implement data fetching logic
    - Create fetchAllStats function that calls all four APIs in parallel
    - Handle successful responses by updating respective stat values
    - Handle errors independently for each stat
    - Implement error logging to console
    - _Requirements: 1.1, 1.3, 2.1, 2.3, 3.1, 3.3, 4.1, 4.3, 5.1, 5.5_

  - [ ]* 3.3 Write property test for loading state display
    - **Property 1: Loading state display**
    - **Validates: Requirements 1.2, 2.2, 3.2, 4.2**

  - [ ]* 3.4 Write property test for error handling
    - **Property 2: Error state with retry**
    - **Validates: Requirements 1.4, 2.4, 3.4, 4.4, 5.2, 5.3**

  - [ ]* 3.5 Write property test for independent stat handling
    - **Property 4: Independent stat handling**
    - **Validates: Requirements 5.1, 5.4**

  - [ ]* 3.6 Write property test for error logging
    - **Property 7: Error logging**
    - **Validates: Requirements 5.5**

  - [x] 3.7 Implement retry functionality
    - Create retry function for each stat that clears error and re-fetches
    - Return retry functions from hook
    - _Requirements: 1.4, 2.4, 3.4, 4.4, 5.3_

  - [x] 3.8 Implement auto-refresh with timer
    - Set up 5-minute interval timer on mount
    - Call fetchAllStats on each interval
    - Clear timer on unmount
    - Ensure refresh doesn't cause disruptive UI changes
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 3.9 Write property test for auto-refresh lifecycle
    - **Property 5: Auto-refresh lifecycle**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 4. Implement currency and number formatting utilities
  - [x] 4.1 Create formatCurrency utility function
    - Use Intl.NumberFormat with locale parameter
    - Support both 'en' and 'vi' locales
    - Format revenue values with appropriate currency symbols
    - _Requirements: 1.3, 1.5_

  - [x] 4.2 Create formatNumber utility function
    - Use Intl.NumberFormat for locale-specific number formatting
    - Format count values (orders, products, customers)
    - _Requirements: 2.3, 3.3, 4.3_

  - [ ]* 4.3 Write property test for stat value display and formatting
    - **Property 3: Stat value display and formatting**
    - **Validates: Requirements 1.3, 1.5, 2.3, 3.3, 4.3**

- [x] 5. Update admin dashboard component
  - [x] 5.1 Integrate useDashboardStats hook
    - Import and use useDashboardStats hook
    - Replace hardcoded stat values with hook data
    - Pass locale to formatting functions
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [x] 5.2 Implement loading state UI
    - Create loading skeleton for each stat card
    - Show skeleton when stat.loading is true
    - Use aria-live regions for accessibility
    - _Requirements: 1.2, 2.2, 3.2, 4.2_

  - [x] 5.3 Implement error state UI
    - Create error message display for each stat
    - Add retry button for failed stats
    - Wire retry button to hook's retry functions
    - Ensure error messages are accessible
    - _Requirements: 1.4, 2.4, 3.4, 4.4, 5.1, 5.2, 5.3_

  - [x] 5.4 Display formatted stat values
    - Use formatCurrency for revenue stat
    - Use formatNumber for order, product, and customer counts
    - Ensure values display correctly for both locales
    - _Requirements: 1.3, 1.5, 2.3, 3.3, 4.3_

  - [ ]* 5.5 Write integration test for full dashboard load
    - Test complete flow: mount dashboard, verify API calls, verify all stats display
    - Test partial failure scenario: one API fails, others succeed
    - Test complete failure scenario: all APIs fail
    - Test retry flow: trigger error, click retry, verify re-fetch
    - _Requirements: All_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
