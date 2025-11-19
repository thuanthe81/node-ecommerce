# Implementation Plan

- [x] 1. Remove payment method selection from CheckoutContent
  - Remove the payment method selection UI section from step 2
  - Keep only the ShippingMethodSelector component in step 2
  - Remove radio buttons and payment method heading
  - Clean up the step 2 rendering to show only shipping method selection
  - _Requirements: 1.1, 1.4_

- [x] 2. Update payment method state management
  - Change payment method state from `useState('card')` to fixed value `'bank_transfer'`
  - Remove `setPaymentMethod` function and all calls to it
  - Ensure `handlePlaceOrder` always uses 'bank_transfer' as payment method
  - Verify order creation data includes correct payment method
  - _Requirements: 1.2, 1.5_

- [x] 3. Update step validation logic
  - Modify `canProceedToNextStep()` function for step 2
  - Remove `&& !!paymentMethod` check from step 2 validation
  - Ensure step 2 only validates `!!shippingMethod`
  - Test that "Next" button enables when shipping method is selected
  - _Requirements: 2.4_

- [x] 4. Update CheckoutStepper component
  - Review CheckoutStepper to ensure step labels are appropriate
  - Consider updating step 2 label from "Payment" to "Shipping Method" or "Delivery"
  - Ensure step progression works correctly with simplified flow
  - Verify visual indicators show correct active step
  - _Requirements: 1.1, 1.3_

- [x] 5. Add informational message about bank transfer
  - Add a note in the order summary or step 3 about bank transfer payment
  - Display message like "Payment via Bank Transfer - details will be provided after order confirmation"
  - Style message to be informative but not intrusive
  - Ensure message is visible in order review step
  - _Requirements: 1.5, 3.2_

- [x] 6. Test complete simplified checkout flow
  - Test guest user flow: address → shipping method → review → place order
  - Test authenticated user flow with saved address
  - Verify step 2 shows only shipping method selection (no payment UI)
  - Verify order is created with 'bank_transfer' payment method
  - Test navigation backward and forward through steps
  - Verify all data persists when navigating between steps
  - Test responsive design on mobile devices
  - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.5, 3.1, 3.3, 3.4, 3.5_

- [x] 7. Create PaymentSettings database model and migration
  - Add PaymentSettings model to Prisma schema with fields: id, accountName, accountNumber, bankName, qrCodeUrl, createdAt, updatedAt
  - Generate and run database migration
  - Verify migration creates the table correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8. Implement backend payment settings service and controller
- [x] 8.1 Create PaymentSettingsService with getBankTransferSettings method
  - Implement method to fetch latest payment settings from database
  - Return default empty settings when none configured
  - Handle database errors gracefully
  - _Requirements: 5.6, 5.7_

- [x] 8.2 Create PaymentSettingsService updateBankTransferSettings method
  - Implement upsert logic to create or update payment settings
  - Handle QR code image upload to uploads/payment-qr/ directory
  - Return updated settings after save
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.3 Create PaymentSettingsController with GET and PUT endpoints
  - Implement GET /payment-settings/bank-transfer endpoint (public access)
  - Implement PUT /payment-settings/bank-transfer endpoint (admin only)
  - Add file upload handling for QR code image
  - Add proper authentication and authorization guards
  - _Requirements: 5.5, 5.6_

- [x] 8.4 Create PaymentSettingsModule and wire up dependencies
  - Create module with service and controller
  - Import PrismaModule for database access
  - Export service for use in other modules
  - Register module in AppModule
  - _Requirements: 5.5, 5.6_

- [x] 9. Create frontend payment settings API client
  - Implement getBankTransferSettings() function in payment-settings-api.ts
  - Implement updateBankTransferSettings() function with FormData support
  - Add proper TypeScript interfaces for BankTransferSettings
  - Handle API errors appropriately
  - _Requirements: 5.6_

- [x] 10. Implement order confirmation page
- [x] 10.1 Create OrderConfirmationContent component
  - Create component at frontend/app/[locale]/orders/[orderId]/confirmation/OrderConfirmationContent.tsx
  - Fetch order details using order ID from URL params
  - Fetch bank transfer settings from backend
  - Implement loading states for both API calls
  - Handle errors when order not found or API fails
  - _Requirements: 4.1, 4.6_

- [x] 10.2 Implement order summary section
  - Display order number, date, and status in header
  - Render list of order items with quantities and prices
  - Show order totals: subtotal, shipping, tax, discount, and total
  - Format currency values correctly
  - _Requirements: 4.2, 4.3, 4.5_

- [x] 10.3 Implement shipping information section
  - Display shipping address in proper format
  - Show selected shipping method
  - Use semantic HTML (address element)
  - _Requirements: 4.4_

- [x] 10.4 Implement bank transfer instructions section
  - Display bank account name, number, and bank name
  - Show amount to transfer prominently
  - Render QR code image when available
  - Handle missing QR code gracefully
  - Add helpful instructions for completing payment
  - _Requirements: 4.6, 4.7, 4.8_

- [x] 10.5 Add action buttons and navigation
  - Implement print functionality for order details
  - Add "View All Orders" link for authenticated users
  - Add "Continue Shopping" link to products page
  - Ensure buttons are accessible and properly styled
  - _Requirements: 4.9, 4.10_

- [x] 10.6 Create order confirmation page route
  - Create page.tsx at frontend/app/[locale]/orders/[orderId]/confirmation/
  - Set up proper metadata for SEO
  - Render OrderConfirmationContent component
  - Handle locale parameter correctly
  - _Requirements: 4.1_

- [x] 11. Update checkout flow to redirect to order confirmation
  - Modify handlePlaceOrder in CheckoutContent to redirect to confirmation page
  - Pass order ID in URL: /[locale]/orders/[orderId]/confirmation
  - Ensure redirect works for both guest and authenticated users
  - Clear cart after successful order placement
  - _Requirements: 4.1_

- [x] 12. Style order confirmation page
  - Create responsive layout that works on mobile and desktop
  - Style success banner with checkmark icon
  - Design clear visual hierarchy for sections
  - Style bank details in highlighted card/box
  - Ensure QR code is properly sized and scannable
  - Add print-specific styles for clean printing
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 13. Implement accessibility features for order confirmation
  - Use proper heading hierarchy (h1, h2, h3)
  - Add semantic HTML elements (section, address, dl)
  - Ensure QR code has descriptive alt text
  - Make all interactive elements keyboard accessible
  - Add ARIA labels where needed
  - Test with screen reader
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 14. Add error handling for order confirmation page
  - Handle order not found (404) scenario
  - Handle failed API requests with retry mechanism
  - Show appropriate error messages
  - Provide fallback when bank transfer settings not configured
  - Log errors for debugging
  - _Requirements: 4.6, 4.9, 4.10_

- [x] 15. Create admin interface for payment settings management
  - Create admin page at frontend/app/[locale]/admin/payment-settings/
  - Build form to edit bank account name, number, and bank name
  - Add file upload for QR code image
  - Show preview of current QR code
  - Implement save functionality using payment settings API
  - Add proper validation and error handling
  - Restrict access to admin users only
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 16. Final integration testing and verification
  - Test complete flow: checkout → order placement → confirmation page
  - Verify order confirmation displays all required information
  - Test bank transfer instructions display correctly
  - Verify QR code displays when configured
  - Test guest user access to confirmation page
  - Test authenticated user access to confirmation page
  - Verify admin can update payment settings
  - Test print functionality
  - Verify responsive design on mobile devices
  - Test all error scenarios
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 5.5, 5.6_

- [ ] 17. Fix authentication error handling in API client
- [x] 17.1 Remove window.location.href redirect from api-client.ts
  - Replace window.location.href with custom event dispatch
  - Dispatch 'auth:logout' event when token refresh fails
  - Preserve order confirmation page exception for guest users
  - Ensure tokens are cleared before dispatching event
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 17.2 Update AuthContext to handle auth:logout event
  - Add event listener for 'auth:logout' custom event
  - Use Next.js router.push() for client-side navigation to login
  - Preserve locale in login redirect URL
  - Clean up event listener on component unmount
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 17.3 Test authentication error handling without page reload
  - Simulate token expiration during checkout
  - Verify no full page reload occurs
  - Verify network activity is preserved in DevTools
  - Verify redirect to login uses correct locale
  - Test that order confirmation page doesn't redirect for guest users
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 18. Update Address model to support guest checkout
- [x] 18.1 Update Prisma schema to make userId optional
  - Change userId field from String to String? in Address model
  - Change user relation from User to User? (optional)
  - Generate database migration for schema change
  - Run migration to update database
  - _Requirements: 7.1, 7.2_

- [x] 18.2 Update address creation service to handle optional userId
  - Modify createAddress method to accept optional userId parameter
  - Allow address creation with null userId for guest users
  - Ensure address validation works regardless of userId
  - Update address DTOs if needed to reflect optional userId
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 18.3 Update orders service address validation
  - Modify address ownership validation in orders.service.ts
  - Only check ownership if both userId and address.userId exist
  - Allow guest addresses (null userId) to be used in orders
  - Ensure validation doesn't block guest checkout
  - _Requirements: 7.5_

- [x] 18.4 Implement address cleanup service for orphaned addresses
  - Create AddressCleanupService with scheduled task
  - Implement cron job to run daily at midnight
  - Delete addresses with null userId older than 90 days
  - Log cleanup results for monitoring
  - Register service in appropriate module
  - _Requirements: 7.6_

- [x] 18.5 Test guest checkout with address creation
  - Test guest user can create shipping address without authentication
  - Test guest user can complete full checkout flow
  - Verify address is created with null userId
  - Verify order is created successfully with guest address
  - Test that authenticated users still create addresses with userId
  - _Requirements: 1.6, 7.2, 7.3, 7.5_

- [x] 19. Fix order confirmation redirect race condition
  - Identify race condition where clearCart() triggers redirect to cart page
  - Move router.push() to confirmation page before clearCart() call
  - Alternatively, add flag to prevent useEffect redirect during checkout completion
  - Test that successful order placement redirects to confirmation page
  - Verify cart is still cleared after redirect
  - Test both guest and authenticated user flows
  - _Requirements: 4.1, 11_

- [x] 20. Fix guest user authorization for order confirmation page
  - Make GET /orders/:id endpoint public with @Public() decorator
  - Update authorization logic in findOne service method
  - Allow guest users (no userId) to view guest orders (order.userId is null)
  - Prevent authenticated users from viewing guest orders
  - Prevent guest users from viewing authenticated user orders
  - Maintain existing security: users can only view their own orders
  - Test guest user can view order confirmation after placing order
  - Test authenticated user can view their own orders
  - Test users cannot view orders that don't belong to them
  - _Requirements: 4.1, 4.6_

