# Implementation Plan

- [x] 1. Add form validation and submit button to ShippingAddressForm
  - Add `isFormValid()` helper function to check all required fields are filled
  - Add submit button inside the form element after all input fields
  - Style submit button to match checkout design system (blue primary button)
  - Disable submit button when form is invalid using `isFormValid()` check
  - Add loading state to submit button during address save operations
  - Position button before "Back to Saved Addresses" link for authenticated users
  - _Requirements: 1.1, 1.3, 1.4, 2.2, 3.1, 3.3_

- [x] 2. Enhance form submission handling for guest users
  - Ensure `handleSubmit` properly calls `onNewAddress` with complete form data
  - Verify form data structure matches the expected `NewAddressData` type
  - Add form validation to prevent submission with incomplete data
  - Test that parent component's `newShippingAddress` state updates correctly
  - Verify "Next" button becomes enabled after successful form submission
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 3. Improve authenticated user new address flow
  - Ensure submit button triggers address save to user account via API
  - Add error handling for failed address save operations with user-friendly messages
  - Auto-select newly created address after successful save
  - Update `selectedAddressId` state to reflect new address
  - Verify "Next" button enables after address is saved and selected
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4. Add visual feedback and validation messages
  - Add real-time validation feedback as users fill form fields
  - Display field-level error messages for invalid inputs
  - Show success confirmation when address is successfully saved
  - Add visual indicator when form is complete and ready to submit
  - Ensure loading states are visible during API operations
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 5. Test complete checkout flow end-to-end
  - Test guest user flow: enter address → submit → proceed to step 2
  - Test authenticated user with saved addresses: select address → proceed
  - Test authenticated user adding new address: add → save → proceed
  - Test form validation prevents submission with missing required fields
  - Test navigation back from step 2 preserves address data
  - Verify responsive design works on mobile devices
  - Test keyboard navigation and accessibility features
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2_
