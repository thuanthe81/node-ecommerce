# Implementation Plan

- [x] 1. Fix admin orders page to await params Promise
  - Modify `frontend/app/[locale]/admin/orders/page.tsx` to make the component async
  - Update params type from `{ locale: string }` to `Promise<{ locale: string }>`
  - Add await statement to resolve params before accessing locale
  - Pass resolved locale value to child components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

- [ ]* 1.1 Write integration test for locale routing
  - Test navigation from orders list to order detail with "en" locale
  - Test navigation from orders list to order detail with "vi" locale
  - Verify URLs contain correct locale prefix
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Audit and fix other admin pages with similar issue
  - Check and fix `/admin/customers/[customerId]/page.tsx`
  - Check and fix `/admin/products/[id]/page.tsx`
  - Check and fix `/admin/categories/[id]/page.tsx`
  - Check and fix `/admin/content/[id]/page.tsx`
  - Check and fix `/admin/banners/[id]/page.tsx`
  - Check and fix `/admin/promotions/[id]/page.tsx`
  - Check and fix `/admin/homepage-sections/[id]/page.tsx`
  - Apply same async/await pattern where params are accessed
  - _Requirements: 1.4, 1.5, 2.1, 2.2_

- [ ] 3. Manual testing checkpoint
  - Test admin orders page navigation with both locales
  - Verify no undefined in URLs
  - Check browser console for errors
  - Test other fixed admin pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement backend payment status update endpoint
- [x] 4.1 Create UpdatePaymentStatusDto
  - Create DTO file at `backend/src/orders/dto/update-payment-status.dto.ts`
  - Add validation for PaymentStatus enum
  - Add optional notes field for admin reference
  - _Requirements: 3.3_

- [x] 4.2 Add updatePaymentStatus service method
  - Add method to `OrdersService` in `backend/src/orders/orders.service.ts`
  - Validate order exists
  - Update payment status in database
  - Return updated order with all relations
  - _Requirements: 3.3, 3.5_

- [x] 4.3 Add payment status update controller endpoint
  - Add `PATCH :id/payment-status` endpoint to `OrdersController`
  - Apply `@Roles(UserRole.ADMIN)` guard
  - Call service method and return result
  - _Requirements: 3.3_

- [ ]* 4.4 Write property test for payment status persistence
  - **Property 2: Payment status update persists correctly**
  - **Validates: Requirements 3.3**

- [x] 5. Implement frontend payment status update UI
- [x] 5.1 Add updateOrderPaymentStatus API function
  - Create function in `frontend/lib/order-api.ts`
  - Call PATCH endpoint with order ID and new status
  - Handle authentication and error responses
  - _Requirements: 3.3, 3.4, 3.5_

- [x] 5.2 Create PaymentStatusUpdateModal component
  - Create modal component with status dropdown
  - Show current status and available options
  - Add confirmation button with loading state
  - Display success/error messages
  - _Requirements: 3.2, 3.4, 3.5_

- [x] 5.3 Integrate payment status update into order detail page
  - Add payment status display with update button
  - Wire up modal to API call
  - Refresh order data after successful update
  - Show toast notifications for feedback
  - _Requirements: 3.1, 3.2, 3.4, 3.6_

- [ ]* 5.4 Write property test for UI feedback
  - **Property 3: Successful updates show confirmation**
  - **Property 4: Failed updates preserve original status**
  - **Property 5: Updates refresh displayed data**
  - **Validates: Requirements 3.4, 3.5, 3.6**

- [ ] 6. Debug and fix payment status authorization issue
- [ ] 6.1 Verify JWT token contains admin role
  - Check JWT strategy to ensure role is included in token payload
  - Verify user object structure in authentication
  - _Requirements: 4.1, 4.2_

- [ ] 6.2 Test authorization guards
  - Add logging to RolesGuard to debug authorization flow
  - Verify user object is properly attached to request
  - Test payment status endpoint with admin credentials
  - _Requirements: 4.2, 4.3, 4.4_

- [ ] 6.3 Fix any authorization configuration issues
  - Ensure guards are properly applied to payment status endpoint
  - Verify error responses return correct status codes
  - Test with both authenticated and unauthenticated requests
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 7. Final checkpoint - Payment status update feature
  - Test payment status updates with all status values
  - Verify success and error messages display correctly
  - Confirm order details refresh after update
  - Test with different admin users
  - Ensure all tests pass, ask the user if questions arise.
