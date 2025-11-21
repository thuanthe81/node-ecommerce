# Design Document

## Overview

This design addresses the duplicate shipping address creation issue in the checkout flow. The root cause is that the frontend `CheckoutContent` component creates addresses at two different points in the flow:

1. In `handleNewShippingAddress` when the form is filled (for authenticated users)
2. In `handlePlaceOrder` when the order is submitted (for guest users)

This creates a race condition where guest users get addresses created during order placement, but the logic is inconsistent and can result in duplicate address records.

The solution refactors the checkout flow to defer all address persistence until order placement, ensuring addresses are created exactly once as part of the order creation transaction.

## Architecture

### Current Flow (Problematic)

```
Guest User:
1. Fill address form → Store in component state
2. Click "Place Order" → Create address via API → Create order

Authenticated User:
1. Fill address form → Create address via API immediately
2. Click "Place Order" → Use existing address ID → Create order
```

### Proposed Flow (Fixed)

```
Guest User:
1. Fill address form → Store in component state only
2. Click "Place Order" → Create address + order in single transaction

Authenticated User (New Address):
1. Fill address form → Store in component state only
2. Click "Place Order" → Create address + order in single transaction

Authenticated User (Saved Address):
1. Select saved address → Store address ID in component state
2. Click "Place Order" → Use existing address ID → Create order
```

## Components and Interfaces

### Frontend Changes

#### CheckoutContent Component

**Modified State Management:**
- Remove immediate address creation from `handleNewShippingAddress`
- Remove immediate address creation from `handleNewBillingAddress`
- Store address data in component state until order placement
- Defer all address persistence to `handlePlaceOrder`

**Modified Functions:**

```typescript
// Remove API call from this function
const handleNewShippingAddress = async (address: any) => {
  console.log('[CheckoutContent] Storing shipping address in state');
  setNewShippingAddress(address);
  // Remove: await userApi.createAddress(address)
};

// Remove API call from this function
const handleNewBillingAddress = async (address: any) => {
  console.log('[CheckoutContent] Storing billing address in state');
  setNewBillingAddress(address);
  // Remove: await userApi.createAddress(address)
};

// Consolidate all address creation here
const handlePlaceOrder = async () => {
  // Create addresses only when placing order
  // For both guest and authenticated users with new addresses
  let finalShippingAddressId = shippingAddressId;
  let finalBillingAddressId = billingAddressId;

  // If user selected a saved address, use that ID
  // If user filled out a new address form, create it now
  if (newShippingAddress && !shippingAddressId) {
    const createdAddress = await userApi.createAddress(newShippingAddress);
    finalShippingAddressId = createdAddress.id;

    if (useSameAddress) {
      finalBillingAddressId = createdAddress.id;
    }
  }

  if (newBillingAddress && !useSameAddress && !billingAddressId) {
    const createdAddress = await userApi.createAddress(newBillingAddress);
    finalBillingAddressId = createdAddress.id;
  }

  // Create order with address IDs
  const orderData: CreateOrderData = {
    email,
    shippingAddressId: finalShippingAddressId,
    billingAddressId: finalBillingAddressId,
    // ... rest of order data
  };

  const order = await orderApi.createOrder(orderData);
  // ... handle success
};
```

#### ShippingAddressForm Component

**No changes required** - This component already handles both saved address selection and new address form input correctly. It calls the parent's `onNewAddress` callback when the form is filled, which will now only update component state.

### Backend Changes

#### UsersService

**Modified `createAddress` Method:**

The existing implementation already handles both authenticated and guest users correctly:
- For authenticated users: Checks for duplicates using deduplication logic
- For guest users (userId = null): Creates new address without duplicate checking
- Properly handles the `isDefault` flag based on user authentication status

**No changes required** - The backend logic is already correct. The issue is purely in the frontend flow.

#### OrdersService

**No changes required** - The order creation logic already:
- Validates that addresses exist before creating the order
- Uses a transaction to ensure atomicity
- Properly handles both guest and authenticated user scenarios

## Data Models

No changes to data models are required. The existing `Address` schema supports:
- `userId` as nullable (for guest addresses)
- All required address fields
- `isDefault` flag for authenticated users

## Error Handling

### Address Creation Failures

**Scenario:** Address creation fails during order placement

**Handling:**
```typescript
try {
  if (newShippingAddress && !shippingAddressId) {
    const createdAddress = await userApi.createAddress(newShippingAddress);
    finalShippingAddressId = createdAddress.id;
  }
} catch (error) {
  setError('Failed to save shipping address. Please try again.');
  setLoading(false);
  return; // Stop order creation
}
```

### Order Creation Failures

**Scenario:** Order creation fails after addresses are created

**Current Behavior:** Addresses remain in database (orphaned records)

**Mitigation:** This is acceptable because:
1. For authenticated users: The address is saved to their account and can be used for future orders
2. For guest users: The address has no userId and will not appear in any user's address list
3. A cleanup job can periodically remove orphaned guest addresses (addresses with null userId and no associated orders)

### Validation Errors

**Scenario:** Address data is invalid

**Handling:**
- Frontend validation in `ShippingAddressForm` prevents submission of invalid data
- Backend validation in `CreateAddressDto` provides additional safety
- Display clear error messages to the user

## Testing Strategy

### Unit Tests

**Frontend Unit Tests:**

1. **Test: Address state management**
   - Verify `handleNewShippingAddress` stores address in state without API call
   - Verify `handleNewBillingAddress` stores address in state without API call
   - Verify state is preserved across step transitions

2. **Test: Order placement with new addresses**
   - Mock `userApi.createAddress` to return address with ID
   - Verify address creation is called exactly once for shipping
   - Verify address creation is called exactly once for billing (when different)
   - Verify order creation receives correct address IDs

3. **Test: Order placement with saved addresses**
   - Verify no address creation calls when using saved addresses
   - Verify order creation receives existing address IDs

4. **Test: Error handling**
   - Verify error display when address creation fails
   - Verify order creation is not attempted after address creation failure

**Backend Unit Tests:**

1. **Test: Address creation for authenticated users**
   - Verify duplicate detection works correctly
   - Verify new addresses are created when no duplicate exists
   - Verify existing addresses are updated when duplicate exists

2. **Test: Address creation for guest users**
   - Verify addresses are created with null userId
   - Verify no duplicate checking for guest addresses
   - Verify isDefault is never set for guest addresses

### Integration Tests

1. **Test: Complete guest checkout flow**
   - Fill out address form
   - Complete checkout
   - Verify exactly one shipping address created
   - Verify exactly one billing address created (or same as shipping)
   - Verify order references correct addresses

2. **Test: Complete authenticated user checkout with new address**
   - Login as user
   - Fill out new address form
   - Complete checkout
   - Verify exactly one address created
   - Verify address is associated with user account
   - Verify order references correct address

3. **Test: Complete authenticated user checkout with saved address**
   - Login as user with existing addresses
   - Select saved address
   - Complete checkout
   - Verify no new addresses created
   - Verify order references existing address

4. **Test: Checkout with same billing and shipping address**
   - Fill out shipping address
   - Select "use same address for billing"
   - Complete checkout
   - Verify exactly one address created
   - Verify order uses same address ID for both shipping and billing

### Manual Testing Checklist

- [ ] Guest user completes checkout with new address
- [ ] Guest user completes checkout with different billing address
- [ ] Authenticated user completes checkout with new address
- [ ] Authenticated user completes checkout with saved address
- [ ] Authenticated user completes checkout with mix of saved and new addresses
- [ ] Verify database contains correct number of address records after each test
- [ ] Verify no orphaned addresses are created
- [ ] Test error scenarios (network failures, validation errors)
