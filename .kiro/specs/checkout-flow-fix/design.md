# Design Document

## Overview

This design simplifies the checkout flow by removing the payment method selection step, since the business only accepts bank transfer payments. The checkout will be streamlined to two steps: (1) Shipping address and (2) Shipping method selection, followed by order review. The payment method will be automatically set to bank transfer without user interaction.

## Architecture

### Component Hierarchy

```
CheckoutContent (Parent)
├── CheckoutStepper (2 steps instead of 3)
├── ShippingAddressForm (Step 1)
│   ├── Saved Addresses List (authenticated users)
│   └── New Address Form (guest users or new address)
├── ShippingMethodSelector (Step 2)
└── Order Review (Step 3)
```

### Data Flow

1. **Step 1 - Shipping Address:**
   - User enters/selects shipping address
   - Address validation occurs
   - User proceeds to step 2

2. **Step 2 - Shipping Method:**
   - User selects shipping method (standard/express/overnight)
   - Shipping cost updates in order summary
   - Payment method automatically set to 'bank_transfer'
   - User proceeds to step 3

3. **Step 3 - Order Review:**
   - User reviews complete order
   - User places order with bank transfer payment method

## Components and Interfaces

### CheckoutContent Component Changes

**Current State:**
- Has 3 steps with payment method selection in step 2
- Payment method state: `const [paymentMethod, setPaymentMethod] = useState('card')`
- Step 2 validation checks for both shipping method and payment method

**Required Changes:**
1. Remove payment method selection UI from step 2
2. Set payment method to 'bank_transfer' by default
3. Update step 2 validation to only check shipping method
4. Update CheckoutStepper to show 2 steps instead of 3
5. Keep step 3 as order review (no changes needed)

**Updated Step Validation Logic:**
```typescript
const canProceedToNextStep = () => {
  if (currentStep === 1) {
    // Shipping address validation
    if (!email) return false;
    if (user) {
      return !!shippingAddressId;
    } else {
      return !!newShippingAddress;
    }
  }
  if (currentStep === 2) {
    // Only validate shipping method (payment is auto-set)
    return !!shippingMethod;
  }
  return true;
}
```

### CheckoutStepper Component Changes

**Current State:**
- Displays 3 steps: Shipping, Payment, Review

**Required Changes:**
- Update to display 2 steps: Shipping, Shipping Method, Review
- Or keep 3 visual steps but rename step 2 from "Payment" to "Shipping Method"
- Ensure step indicators reflect the simplified flow

## Data Models

### Payment Method

**Current:**
```typescript
const [paymentMethod, setPaymentMethod] = useState('card');
```

**Updated:**
```typescript
const [paymentMethod] = useState('bank_transfer'); // Fixed value, no setter needed
```

### Order Creation Data

```typescript
interface CreateOrderData {
  email: string;
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethod: 'standard' | 'express' | 'overnight';
  paymentMethod: 'bank_transfer'; // Always bank_transfer
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  notes?: string;
  promotionId?: string;
}
```

## Implementation Details

### CheckoutContent Modifications

1. **Remove Payment Method Selection UI**
   - Remove the entire payment method selection section from step 2
   - Keep only the ShippingMethodSelector component in step 2
   - Remove radio buttons for payment method selection

2. **Update Payment Method State**
   - Change from `useState('card')` to fixed value `'bank_transfer'`
   - Remove `setPaymentMethod` function calls
   - Ensure order creation always uses 'bank_transfer'

3. **Update Step Validation**
   - Modify `canProceedToNextStep()` for step 2
   - Remove `&& !!paymentMethod` check from step 2 validation
   - Only validate `!!shippingMethod` for step 2

4. **Update CheckoutStepper**
   - Modify step labels if needed
   - Consider renaming step 2 from "Payment" to "Shipping Method"
   - Or keep current labels but ensure flow is clear

### User Experience Flow

**Complete Checkout Flow:**
1. **Step 1 - Shipping Address:**
   - User enters email (guest) or is auto-filled (authenticated)
   - User selects saved address or enters new address
   - User clicks "Next" → proceeds to step 2

2. **Step 2 - Shipping Method:**
   - User sees only shipping method options (no payment selection)
   - User selects standard/express/overnight shipping
   - Order summary updates with shipping cost
   - User clicks "Next" → proceeds to step 3

3. **Step 3 - Order Review:**
   - User reviews order items, address, shipping method
   - User can add order notes
   - User clicks "Place Order"
   - Order created with payment method = 'bank_transfer'

## Error Handling

### Order Creation Errors

1. **API Failure**
   - Display error message if order creation fails
   - Keep all form data intact
   - Allow user to retry order placement
   - Log error details for debugging

2. **Validation Errors**
   - Ensure shipping method is selected before proceeding
   - Validate shipping address exists
   - Show clear error messages for missing data

3. **Network Issues**
   - Show loading state during order creation
   - Display timeout message if request takes too long
   - Provide retry mechanism

### Edge Cases

1. **User navigates back from step 3**
   - Preserve shipping method selection
   - Allow user to change shipping method
   - Maintain payment method as bank_transfer

2. **User navigates back from step 2**
   - Preserve shipping address data
   - Allow user to change address if needed

3. **Cart becomes empty during checkout**
   - Redirect to cart page
   - Show appropriate message

## Testing Strategy

### Unit Tests

1. **Step Validation**
   - Test `canProceedToNextStep()` for each step
   - Verify step 2 only checks shipping method (not payment)
   - Test payment method is always 'bank_transfer'

2. **Order Creation**
   - Test order data includes correct payment method
   - Verify all required fields are included
   - Test order creation with valid data

### Integration Tests

1. **Complete Checkout Flow**
   - Enter shipping address
   - Proceed to step 2
   - Select shipping method (no payment selection shown)
   - Proceed to step 3
   - Review order
   - Place order
   - Verify order created with bank_transfer payment

2. **Navigation Between Steps**
   - Navigate forward through all steps
   - Navigate backward through steps
   - Verify data persists when navigating back
   - Verify shipping method selection is preserved

3. **Guest vs Authenticated Flow**
   - Test guest checkout with new address
   - Test authenticated checkout with saved address
   - Test authenticated checkout with new address
   - Verify both flows skip payment selection

### Manual Testing Checklist

- [ ] Step 2 does not show payment method selection
- [ ] Shipping method selection works correctly
- [ ] Order summary updates with shipping cost
- [ ] Can proceed from step 2 with only shipping method selected
- [ ] Order is created with bank_transfer payment method
- [ ] CheckoutStepper shows correct step labels
- [ ] Navigation between steps works smoothly
- [ ] Responsive design works on mobile
- [ ] All translations display correctly

## UI/UX Considerations

### Simplified Step 2 Layout

**Before:**
- Shipping method selector
- Payment method selector (radio buttons)

**After:**
- Shipping method selector only
- More prominent display of shipping options
- Clear indication that payment is via bank transfer

### Visual Feedback

1. **Step Indicators**
   - Clear progression through 3 steps
   - Step 2 labeled appropriately (e.g., "Shipping Method" or "Delivery")
   - Active step highlighted

2. **Order Summary**
   - Shows shipping cost based on selected method
   - Displays payment method as "Bank Transfer" (informational)
   - Updates total in real-time

3. **Informational Message**
   - Optional: Add a note in order summary or step 3 about bank transfer
   - Example: "Payment will be made via bank transfer. Bank details will be provided after order confirmation."

## Accessibility

1. **Step Navigation**
   - Clear step labels for screen readers
   - Proper ARIA labels for navigation buttons
   - Focus management between steps

2. **Shipping Method Selection**
   - Radio buttons properly labeled
   - Selected method announced to screen readers
   - Keyboard navigation works correctly

3. **Order Review**
   - All order details accessible via screen reader
   - Clear indication of payment method
   - Proper button labels for actions

## Performance Considerations

1. **State Management**
   - Remove unused payment method state setter
   - Simplify step validation logic
   - Reduce unnecessary re-renders

2. **Component Rendering**
   - Step 2 renders faster without payment UI
   - Fewer form elements to manage
   - Cleaner component structure
