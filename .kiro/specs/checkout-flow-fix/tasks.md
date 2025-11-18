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
