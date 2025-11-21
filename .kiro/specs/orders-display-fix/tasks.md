# Implementation Plan

- [x] 1. Update OrdersPage component to fetch and display orders
  - Modify `frontend/app/[locale]/account/orders/page.tsx` to add state management for orders, loading, and errors
  - Add `useEffect` hook to fetch orders using `orderApi.getOrders()` when user is authenticated
  - Implement conditional rendering based on loading state, error state, empty state, and data state
  - Add error handling with retry functionality
  - Sort orders by `createdAt` in descending order before rendering
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create OrderCard component for displaying order summaries
  - Create new file `frontend/components/OrderCard.tsx`
  - Implement component to display order number, date, status badge, total amount, and item previews
  - Add status color mapping for visual indicators (PENDING: yellow, PROCESSING: blue, SHIPPED: purple, DELIVERED: green, CANCELLED: red, REFUNDED: gray)
  - Display first 3 product thumbnails with item count
  - Add link to order confirmation page using order ID
  - Handle missing product images with placeholder
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [ ]* 2.1 Write property test for order sorting
  - **Property 5: Orders display in reverse chronological order**
  - **Validates: Requirements 1.5**

- [ ]* 2.2 Write property test for status badge mapping
  - **Property 8: Status indicators are visually distinct**
  - **Validates: Requirements 2.3**

- [x] 3. Integrate OrderCard into OrdersPage
  - Import and use OrderCard component in OrdersPage
  - Map over orders array to render OrderCard for each order
  - Pass locale prop to OrderCard for internationalization
  - Ensure proper spacing and layout for order list
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.1 Write unit tests for OrdersPage component
  - Test order fetching on mount
  - Test loading state display
  - Test error state with retry button
  - Test empty state display
  - Test orders list rendering
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 3.2 Write unit tests for OrderCard component
  - Test order information display
  - Test status badge rendering
  - Test product image display with placeholder fallback
  - Test navigation link generation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
