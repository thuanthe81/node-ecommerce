# Design Document

## Overview

This design addresses the checkout flow issue where users cannot proceed to the next step after entering a new shipping address. The root cause is that the `ShippingAddressForm` component renders a form element but doesn't provide a submit mechanism, preventing the `onNewAddress` callback from being triggered. This blocks the `canProceedToNextStep()` validation in the parent `CheckoutContent` component.

## Architecture

### Component Hierarchy

```
CheckoutContent (Parent)
├── CheckoutStepper
├── ShippingAddressForm (Step 1)
│   ├── Saved Addresses List (authenticated users)
│   └── New Address Form (guest users or new address)
├── ShippingMethodSelector (Step 2)
└── Order Review (Step 3)
```

### Data Flow

1. User fills in shipping address form fields → `formData` state updates
2. User triggers form submission → `handleSubmit` called → `onNewAddress` callback invoked
3. Parent component receives address data → updates `newShippingAddress` state
4. `canProceedToNextStep()` validates → returns true if address exists
5. "Next" button becomes enabled → user can proceed to step 2

## Components and Interfaces

### ShippingAddressForm Component Changes

**Current Issues:**
- Form element exists but has no submit button
- No way to trigger the `onSubmit` handler
- Form data is collected but never submitted

**Solution:**
Add a submit button within the form that:
- Is only visible when showing the new address form
- Validates all required fields are filled
- Triggers form submission to invoke `onNewAddress` callback
- Provides clear visual feedback about form state

**Interface (unchanged):**
```typescript
interface ShippingAddressFormProps {
  onAddressSelect: (addressId: string) => void;
  onNewAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  selectedAddressId?: string;
}
```

### CheckoutContent Component Changes

**Current Logic:**
```typescript
const canProceedToNextStep = () => {
  if (currentStep === 1) {
    if (!email) return false;
    if (user) {
      return !!shippingAddressId;
    } else {
      return !!newShippingAddress;
    }
  }
  // ... other steps
}
```

**Issue:** For guest users, `newShippingAddress` is only set when `onNewAddress` is called, but the form never submits.

**Solution:** The existing logic is correct; we just need to ensure the form can actually submit and trigger the callback.

## Data Models

### Address Data Structure

```typescript
interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Form data (without id and isDefault)
type NewAddressData = Omit<Address, 'id' | 'isDefault'>;
```

### Form State

```typescript
const [formData, setFormData] = useState<NewAddressData>({
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Vietnam',
});
```

## Implementation Details

### ShippingAddressForm Modifications

1. **Add Submit Button**
   - Place button at the end of the form
   - Style consistently with other checkout buttons
   - Show loading state during submission
   - Disable when required fields are empty

2. **Form Validation**
   - Check all required fields before enabling submit
   - Use HTML5 validation attributes (required)
   - Provide visual feedback for validation state

3. **User Experience Flow**

   **For Guest Users:**
   - Form is shown by default
   - User fills in fields
   - User clicks "Save Address" button
   - Form submits → `onNewAddress` called
   - Parent updates state → "Next" button enables
   - User clicks "Next" → proceeds to step 2

   **For Authenticated Users (New Address):**
   - User clicks "Add New Address"
   - Form appears
   - User fills in fields
   - User clicks "Save Address" button
   - Address saved to account via API
   - Address auto-selected
   - "Next" button enables
   - User clicks "Next" → proceeds to step 2

### Button Placement Strategy

The submit button should be placed:
- Inside the form element (to trigger form submission)
- After all form fields
- Before the "Back to Saved Addresses" link (for authenticated users)
- Styled to match the checkout flow's design system

### Validation Logic

```typescript
const isFormValid = () => {
  return (
    formData.fullName.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.addressLine1.trim() !== '' &&
    formData.city.trim() !== '' &&
    formData.state.trim() !== '' &&
    formData.postalCode.trim() !== ''
  );
};
```

## Error Handling

### Form Submission Errors

1. **API Failure (Authenticated Users)**
   - If address save fails, show error message
   - Keep form data intact
   - Allow user to retry
   - Don't block checkout (address can be saved later)

2. **Validation Errors**
   - Use HTML5 validation for immediate feedback
   - Show field-level errors for specific issues
   - Prevent submission until all required fields are valid

3. **Network Issues**
   - Show loading state during API calls
   - Display error message if request fails
   - Provide retry mechanism

### Edge Cases

1. **User switches between saved and new address**
   - Clear form data when switching back to saved addresses
   - Preserve form data if user accidentally clicks away

2. **User navigates back from step 2**
   - Preserve selected/entered address data
   - Don't require re-submission

3. **Session timeout during checkout**
   - Preserve form data in component state
   - Handle authentication errors gracefully

## Testing Strategy

### Unit Tests

1. **Form Validation**
   - Test `isFormValid()` with various input combinations
   - Verify required field validation
   - Test optional field handling

2. **Form Submission**
   - Test `handleSubmit` calls `onNewAddress` with correct data
   - Verify form data structure matches expected interface
   - Test form reset after successful submission

3. **Button State**
   - Verify submit button is disabled when form is invalid
   - Verify submit button is enabled when form is valid
   - Test loading state during submission

### Integration Tests

1. **Guest Checkout Flow**
   - Fill in new address form
   - Submit form
   - Verify "Next" button becomes enabled
   - Proceed to step 2
   - Verify address data is preserved

2. **Authenticated User New Address**
   - Click "Add New Address"
   - Fill in form
   - Submit form
   - Verify API call is made
   - Verify address is saved and selected
   - Proceed to step 2

3. **Form Switching**
   - Start with saved address
   - Switch to new address form
   - Fill in form
   - Switch back to saved address
   - Verify saved address is still selected

### Manual Testing Checklist

- [ ] Guest user can enter address and proceed
- [ ] Authenticated user can add new address
- [ ] Form validation prevents submission with missing fields
- [ ] Submit button shows loading state
- [ ] Error messages display correctly
- [ ] Address data persists when navigating back
- [ ] Responsive design works on mobile
- [ ] Keyboard navigation works properly
- [ ] Screen reader announces form state changes

## UI/UX Considerations

### Button Styling

```css
/* Primary action button */
.submit-button {
  background: blue-600;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
}

.submit-button:hover {
  background: blue-700;
}

.submit-button:disabled {
  background: gray-300;
  cursor: not-allowed;
}
```

### Visual Feedback

1. **Form State Indicators**
   - Required fields marked with asterisk (*)
   - Invalid fields highlighted in red
   - Valid fields show subtle green indicator
   - Submit button disabled state is visually clear

2. **Loading States**
   - Submit button shows spinner during API call
   - Button text changes to "Saving..." or "Processing..."
   - Form fields disabled during submission

3. **Success Feedback**
   - Brief success message after address saved
   - Smooth transition to enabled "Next" button
   - Visual confirmation of selected address

## Accessibility

1. **Form Labels**
   - All inputs have associated labels
   - Required fields indicated in label text and with aria-required
   - Error messages linked to inputs via aria-describedby

2. **Button States**
   - Submit button has clear aria-label
   - Disabled state announced to screen readers
   - Loading state communicated via aria-live region

3. **Keyboard Navigation**
   - Tab order follows logical flow
   - Enter key submits form
   - Focus management after submission

## Performance Considerations

1. **Form Validation**
   - Validate on blur for better UX
   - Debounce validation for performance
   - Use memoization for validation function

2. **API Calls**
   - Show loading state immediately
   - Handle slow network gracefully
   - Implement timeout for API calls

3. **State Management**
   - Minimize re-renders during form input
   - Use controlled components efficiently
   - Avoid unnecessary state updates
