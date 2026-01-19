# Implementation Plan: Buy Now Checkout

## Overview

This implementation plan breaks down the Buy Now Checkout feature into discrete, incremental tasks. Each task builds on previous work, with testing integrated throughout to catch issues early. The implementation follows a bottom-up approach: core utilities first, then UI components, then integration, and finally end-to-end wiring.

## Tasks

- [x] 1. Add translations for Buy Now feature
  - Add all required translation keys to `frontend/locales/translations.json`
  - Include both English and Vietnamese translations
  - Keys: `product.buyNow`, `product.buyingNow`, `checkout.buyNowCheckout`, `checkout.sessionExpired`, `checkout.addedToCartOnAbandon`
  - _Requirements: 1.3, 9.1, 9.2, 9.3, 9.4_

- [ ]* 1.1 Write property test for translation completeness
  - **Property 1: Translation Completeness**
  - **Validates: Requirements 1.3, 9.1, 9.2**

- [ ] 2. Implement Checkout Session Manager
  - [x] 2.1 Create checkout session manager utility
    - Create `frontend/lib/checkout-session.ts`
    - Implement `CheckoutSession` interface
    - Implement `createBuyNowSession()` function
    - Implement `getSession()` function
    - Implement `clearSession()` function
    - Implement `isSessionExpired()` function with 30-minute timeout
    - Use `sessionStorage` with fallback to in-memory storage
    - _Requirements: 2.2, 2.3, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 2.2 Write unit tests for checkout session manager
    - Test session creation with valid data
    - Test session retrieval
    - Test session expiration logic
    - Test session clearing
    - Test fallback when sessionStorage unavailable
    - _Requirements: 2.2, 2.3, 10.1, 10.2, 10.4_

  - [ ]* 2.3 Write property test for session data round-trip
    - **Property 5: Session Creation and Data Storage**
    - **Validates: Requirements 2.2, 2.3, 10.2**

- [ ] 3. Implement abandoned checkout detection hook
  - [x] 3.1 Create abandoned checkout hook
    - Create `frontend/hooks/useAbandonedCheckout.ts`
    - Implement route change detection using Next.js router
    - Implement `beforeunload` event handler for browser close
    - Exclude navigation to order confirmation page
    - Call `onAbandon` callback when abandonment detected
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ]* 3.2 Write unit tests for abandoned checkout hook
    - Test abandonment detection on route change
    - Test no abandonment on order confirmation navigation
    - Test abandonment on browser close
    - Test cleanup on unmount
    - _Requirements: 6.1, 6.5_

- [ ] 4. Add Buy Now button to ProductInfo component
  - [x] 4.1 Modify ProductInfo component
    - Open `frontend/app/[locale]/products/[slug]/ProductInfo.tsx`
    - Add Buy Now button below Add to Cart button
    - Apply green color scheme styling (bg-green-600, hover:bg-green-700)
    - Wire button to handleBuyNow function
    - Disable button when quantity is invalid
    - Show loading state during navigation
    - Use translations for button text
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.4_

  - [x] 4.2 Implement handleBuyNow function
    - Validate quantity > 0
    - Create checkout session using checkout session manager
    - Navigate to checkout page using Next.js router
    - Handle errors gracefully
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 4.3 Write unit tests for Buy Now button
    - Test button renders with correct styling
    - Test button respects quantity selector
    - Test button remains enabled for out-of-stock products
    - Test handleBuyNow creates session and navigates
    - Test invalid quantity prevents navigation
    - _Requirements: 1.1, 1.4, 1.5, 2.4_

  - [ ]* 4.4 Write property test for quantity respect
    - **Property 3: Quantity Respect**
    - **Validates: Requirements 1.5, 2.2**

  - [ ]* 4.5 Write property test for invalid quantity prevention
    - **Property 4: Invalid Quantity Prevention**
    - **Validates: Requirements 2.4**

  - [ ]* 4.6 Write property test for button stock independence
    - **Property 2: Button Stock Independence**
    - **Validates: Requirements 1.4, 7.1, 7.3**

- [x] 5. Checkpoint - Verify Buy Now button functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Modify CheckoutContent to support Buy Now flow
  - [x] 6.1 Add Buy Now state management to CheckoutContent
    - Open `frontend/app/[locale]/checkout/CheckoutContent.tsx`
    - Add state for checkout source ('buy-now' | 'cart')
    - Add state for Buy Now product data
    - Detect checkout source on component mount using session manager
    - Load product data for Buy Now flow
    - _Requirements: 2.5, 10.1, 10.3_

  - [x] 6.2 Modify checkout data loading logic
    - If source is 'buy-now', load product from session instead of cart
    - If source is 'cart', use existing cart loading logic
    - Display single product for Buy Now checkout
    - Calculate totals based on single product
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.4, 4.5_

  - [x] 6.3 Modify order creation logic for Buy Now
    - Skip cart clearing after Buy Now order completion
    - Clear checkout session after successful order
    - Keep existing cart clearing logic for cart-based checkout
    - _Requirements: 3.3, 5.1, 5.2, 5.3, 5.4, 10.4_

  - [x] 6.4 Integrate abandoned checkout detection
    - Use `useAbandonedCheckout` hook in CheckoutContent
    - Enable hook only for Buy Now flow
    - Pass product ID and quantity to hook
    - Implement onAbandon callback to add product to cart
    - Clear session after adding to cart
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.4_

  - [ ]* 6.5 Write unit tests for CheckoutContent modifications
    - Test source detection from session
    - Test Buy Now product loading
    - Test cart-based product loading
    - Test order creation without cart clearing (Buy Now)
    - Test order creation with cart clearing (cart-based)
    - Test abandoned checkout cart addition
    - _Requirements: 3.3, 6.1, 6.4, 10.3_

  - [ ]* 6.6 Write property test for cart preservation
    - **Property 6: Cart Preservation**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 6.7 Write property test for abandoned checkout cart addition
    - **Property 11: Abandoned Checkout Cart Addition**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 6.8 Write property test for successful checkout no cart addition
    - **Property 12: Successful Checkout No Cart Addition**
    - **Validates: Requirements 6.4**

- [ ] 7. Implement checkout feature parity
  - [x] 7.1 Verify shipping address support for Buy Now
    - Test that shipping address selection works in Buy Now flow
    - Ensure ShippingAddressForm works with Buy Now
    - _Requirements: 4.1_

  - [x] 7.2 Verify payment method support for Buy Now
    - Test that payment method selection works in Buy Now flow
    - Ensure bank transfer payment works with Buy Now
    - _Requirements: 4.2_

  - [x] 7.3 Implement promotion code support for Buy Now
    - Ensure promotion validation works with single Buy Now product
    - Test promotion discount calculation for Buy Now
    - _Requirements: 4.3, 4.6_

  - [x] 7.4 Verify shipping cost calculation for Buy Now
    - Test that ShippingMethodSelector works with Buy Now product
    - Ensure shipping rates calculated correctly for single product
    - _Requirements: 4.4_

  - [x] 7.5 Verify order summary accuracy for Buy Now
    - Test that order totals calculate correctly
    - Ensure tax, shipping, and discounts apply correctly
    - _Requirements: 4.5_

  - [ ]* 7.6 Write property test for promotion validation
    - **Property 7: Promotion Validation**
    - **Validates: Requirements 4.3, 4.6**

  - [ ]* 7.7 Write property test for shipping cost calculation
    - **Property 8: Shipping Cost Calculation**
    - **Validates: Requirements 4.4**

  - [ ]* 7.8 Write property test for order total accuracy
    - **Property 9: Order Total Accuracy**
    - **Validates: Requirements 4.5**

- [x] 8. Checkpoint - Verify checkout flow functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement order structure consistency
  - [x] 9.1 Verify order creation for Buy Now
    - Test that Buy Now orders use same CreateOrderData structure
    - Ensure order items array contains single item for Buy Now
    - Verify no special flags added to Buy Now orders
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.2 Verify order confirmation page for Buy Now
    - Test that Buy Now orders redirect to same confirmation page
    - Ensure confirmation page displays Buy Now orders correctly
    - _Requirements: 5.4_

  - [ ]* 9.3 Write property test for order structure consistency
    - **Property 10: Order Structure Consistency**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 10. Handle edge cases and error scenarios
  - [x] 10.1 Implement session expiration handling
    - Detect expired sessions on checkout page load
    - Display expiration message in user's language
    - Redirect to product page
    - Clear expired session
    - _Requirements: 10.4_

  - [x] 10.2 Implement error message translation
    - Ensure all error messages use translation keys
    - Test error messages in both English and Vietnamese
    - _Requirements: 9.4_

  - [x] 10.3 Handle zero-price products in Buy Now
    - Test Buy Now with zero-price products
    - Ensure checkout skips payment for zero-price
    - Verify order creation succeeds for zero-price
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 10.4 Handle out-of-stock products in Buy Now
    - Test Buy Now with out-of-stock products
    - Ensure button remains enabled
    - Verify order creation succeeds (booking system)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 10.5 Write property test for error message translation
    - **Property 13: Error Message Translation**
    - **Validates: Requirements 9.4**

  - [ ]* 10.6 Write property test for session source determination
    - **Property 14: Session Source Determination**
    - **Validates: Requirements 10.1, 10.3**

  - [ ]* 10.7 Write property test for session cleanup
    - **Property 15: Session Cleanup**
    - **Validates: Requirements 10.4**

- [ ] 11. Integration testing and polish
  - [ ]* 11.1 Write integration tests for complete Buy Now flow
    - Test end-to-end Buy Now purchase (authenticated user)
    - Test end-to-end Buy Now purchase (guest user)
    - Test Buy Now with promotion code
    - Test Buy Now with zero-price product
    - Test Buy Now with out-of-stock product
    - Test abandoned Buy Now checkout
    - Test session persistence across page refresh
    - _Requirements: All_

  - [x] 11.2 Manual testing across browsers
    - Test in Chrome, Firefox, Safari, Edge
    - Test on mobile browsers (iOS Safari, Chrome Mobile)
    - Verify sessionStorage fallback works
    - _Requirements: All_

  - [x] 11.3 Accessibility audit
    - Verify Buy Now button has proper ARIA labels
    - Test keyboard navigation
    - Test screen reader announcements
    - Verify focus management
    - _Requirements: 1.1_

  - [x] 11.4 Performance optimization
    - Verify no unnecessary re-renders
    - Test with large cart (ensure Buy Now doesn't affect cart performance)
    - Optimize product data loading
    - _Requirements: All_

- [x] 12. Final checkpoint - Complete feature verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Fix authentication redirect for Buy Now checkout
  - [x] 13.1 Fix checkout authentication flow
    - Modify CheckoutContent to ensure authentication check completes before Buy Now product loading
    - Prevent Buy Now error redirect when user is not authenticated
    - Ensure unauthenticated users are redirected to login page, not home page
    - Preserve Buy Now session across login redirect
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ]* 13.2 Test authentication redirect flow
    - Test that unauthenticated users clicking Buy Now are redirected to login
    - Test that Buy Now session persists after login
    - Test that authenticated users can complete Buy Now checkout
    - _Requirements: 2.5, 2.6, 2.7_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- The implementation maintains backward compatibility with existing cart/checkout flow
- All user-facing text must have both English and Vietnamese translations
