# Implementation Plan: Zero-Price Products

- [x] 1. Add database schema changes
  - Add `requiresPricing` boolean field to Order model
  - Add `PENDING_QUOTE` status to OrderStatus enum
  - Create and run database migration
  - _Requirements: 3.4, 4.4_

- [x] 2. Update backend services for zero-price products
  - Add helper methods to identify zero-price products in ProductsService
  - Update CartService to accept zero-price products
  - Update OrdersService to set requiresPricing flag for orders with zero-price items
  - Update OrdersService to set PENDING_QUOTE status when appropriate
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.3, 3.4_

- [ ]* 2.1 Write property test for zero-price product persistence
  - **Property 1: Zero-price product persistence**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ]* 2.2 Write property test for cart acceptance
  - **Property 4: Cart acceptance for zero-price products**
  - **Validates: Requirements 3.1**

- [ ]* 2.3 Write property test for order quote status
  - **Property 7: Order quote status assignment**
  - **Validates: Requirements 3.4**

- [x] 3. Implement admin order item pricing functionality
  - Create API endpoint to set price for individual order items
  - Add method to recalculate order total after price updates
  - Add validation to prevent order fulfillment with unpriced items
  - Ensure product base price remains unchanged when setting order item prices
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 3.1 Write property test for product price isolation
  - **Property 9: Product price isolation**
  - **Validates: Requirements 4.2**

- [ ]* 3.2 Write property test for order total calculation
  - **Property 10: Order total calculation with custom prices**
  - **Validates: Requirements 4.3**

- [ ]* 3.3 Write property test for fulfillment blocking
  - **Property 11: Fulfillment blocking for unpriced items**
  - **Validates: Requirements 4.4**

- [ ]* 3.4 Write property test for total recalculation
  - **Property 12: Total recalculation on price update**
  - **Validates: Requirements 4.5**

- [x] 4. Create frontend utility functions
  - Create `isContactForPrice()` helper function
  - Add utility for formatting zero-price display text
  - Add localized messaging for contact-for-price products
  - _Requirements: 2.1, 2.2_

- [ ]* 4.1 Write property test for display consistency
  - **Property 2: Contact-for-price display consistency**
  - **Validates: Requirements 2.1, 2.2**

- [x] 5. Update ProductCard component
  - Modify price display logic to show "Contact for Price" for zero-price products
  - Ensure proper localization (English/Vietnamese)
  - Update styling for contact-for-price messaging
  - _Requirements: 2.1, 2.2_

- [x] 6. Update product detail page
  - Keep "Add to Cart" button functional for zero-price products
  - Add messaging explaining that pricing will be provided after order placement
  - Ensure proper localization of messaging
  - _Requirements: 2.3, 2.4_

- [ ]* 6.1 Write property test for pricing guidance presence
  - **Property 3: Pricing guidance presence**
  - **Validates: Requirements 2.3, 2.4**

- [x] 7. Update cart components
  - Display zero-price items with "Price TBD" indicator
  - Add informational message when cart contains zero-price products
  - Ensure proper localization of messages
  - _Requirements: 3.1, 3.2_

- [ ]* 7.1 Write property test for cart messaging
  - **Property 5: Cart messaging for quote items**
  - **Validates: Requirements 3.2**

- [x] 8. Update checkout flow
  - Allow checkout with zero-price products
  - Calculate total correctly (sum of non-zero items)
  - Display appropriate messaging about quote items
  - _Requirements: 3.3_

- [ ]* 8.1 Write property test for checkout acceptance
  - **Property 6: Checkout acceptance with zero-price items**
  - **Validates: Requirements 3.3**

- [x] 9. Create admin order pricing interface
  - Add price input fields for zero-price order items in order detail page
  - Implement price setting functionality with API integration
  - Display visual indicator for orders requiring pricing
  - Show warning message when order has unpriced items
  - Update order total display after price changes
  - _Requirements: 4.1, 6.2_

- [ ]* 9.1 Write property test for admin price setting interface
  - **Property 8: Admin price setting interface**
  - **Validates: Requirements 4.1**

- [ ]* 9.2 Write property test for admin order visual indication
  - **Property 15: Admin order visual indication**
  - **Validates: Requirements 6.2**

- [x] 10. Update admin ProductForm component
  - Add visual indicator when price is set to zero
  - Display informational message about quote-based pricing workflow
  - Ensure proper localization of admin messages
  - _Requirements: 6.1_

- [ ]* 10.1 Write property test for admin product visual indication
  - **Property 14: Admin product visual indication**
  - **Validates: Requirements 6.1**

- [x] 11. Update product listing and filtering
  - Ensure zero-price products display correctly in listings
  - Handle zero-price products in price-based filtering
  - Handle zero-price products in price-based sorting
  - Test edge cases with all zero-price products
  - _Requirements: 5.2_

- [ ]* 11.1 Write property test for price filtering robustness
  - **Property 13: Price filtering robustness**
  - **Validates: Requirements 5.2**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 13. Write integration tests
  - Test end-to-end flow: create zero-price product, add to cart, place order
  - Test admin flow: set prices for order items, verify total calculation
  - Test order fulfillment blocking with unpriced items
  - Test product listing with mixed regular and zero-price products
  - Test price updates from zero to non-zero and vice versa
  - _Requirements: All_
