# Design Document: Cart Session Synchronization Fix

## Overview

This design addresses a critical bug where cart item deletion fails with "Cart item does not belong to session" error. The root cause is a session ID synchronization issue between the frontend and backend. The solution ensures consistent session ID management across both systems by:

1. Having the backend always return the session ID in cart responses
2. Having the frontend update its stored session ID from backend responses
3. Implementing retry logic for session mismatch errors
4. Adding comprehensive logging for debugging

## Architecture

### Current Flow (Buggy)
```
Frontend                          Backend
   |                                 |
   |-- Add to Cart (sessionId: A) ->|
   |                                 |-- Creates cart with sessionId A
   |<-- Cart Response --------------|
   |                                 |
   | [sessionId A stored in localStorage]
   |                                 |
   |-- Remove Item (sessionId: A) ->|
   |                                 |-- Validates: cart.sessionId === A?
   |<-- Error: Mismatch ------------|
```

### Fixed Flow
```
Frontend                          Backend
   |                                 |
   |-- Add to Cart (sessionId: A) ->|
   |                                 |-- Creates cart with sessionId A
   |<-- Cart Response (sessionId: A)|
   |                                 |
   | [Updates localStorage with sessionId A]
   |                                 |
   |-- Remove Item (sessionId: A) ->|
   |                                 |-- Validates: cart.sessionId === A ✓
   |<-- Success --------------------|
```

## Components and Interfaces

### Backend Changes

#### 1. Cart Response DTO Enhancement
Add sessionId to all cart responses to enable frontend synchronization.

```typescript
// backend/src/cart/dto/cart-response.dto.ts
export class CartResponseDto {
  id: string;
  userId?: string;
  sessionId?: string;  // Make this always present
  expiresAt: string;
  items: CartItemDto[];
}
```

#### 2. Cart Controller Improvements
- Ensure sessionId from request header is always used when provided
- Add logging for session ID operations
- Return sessionId in all responses

```typescript
// backend/src/cart/cart.controller.ts
private getSessionId(req: Request): string {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  if (sessionId) {
    // Log for debugging
    console.log(`Using existing session ID: ${sessionId}`);
    return sessionId as string;
  }

  // Only generate new session ID if none provided
  const newSessionId = this.generateSessionId();
  console.log(`Generated new session ID: ${newSessionId}`);
  return newSessionId;
}
```

#### 3. Cart Service Validation Enhancement
Improve error messages to include session ID information for debugging.

```typescript
// backend/src/cart/cart.service.ts
if (sessionId && cartItem.cart.sessionId !== sessionId) {
  throw new BadRequestException(
    `Cart item does not belong to session. ` +
    `Expected: ${cartItem.cart.sessionId}, Got: ${sessionId}`
  );
}
```

### Frontend Changes

#### 1. Cart API Client Enhancement
Update the cart API to sync session ID from responses.

```typescript
// frontend/lib/cart-api.ts
export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;  // Always present in responses
  expiresAt: string;
  items: CartItem[];
}

// Helper to sync session ID from cart response
function syncSessionId(cart: Cart): void {
  if (cart.sessionId && typeof window !== 'undefined') {
    const currentSessionId = localStorage.getItem('sessionId');
    if (currentSessionId !== cart.sessionId) {
      console.log(`Syncing session ID: ${currentSessionId} -> ${cart.sessionId}`);
      localStorage.setItem('sessionId', cart.sessionId);
    }
  }
}

// Update all API methods to sync session ID
export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.get('/cart', {
      headers: sessionId ? { 'x-session-id': sessionId } : {},
    });
    syncSessionId(response.data);
    return response.data;
  },

  addItem: async (productId: string, quantity: number): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.post(
      '/cart/items',
      { productId, quantity },
      { headers: sessionId ? { 'x-session-id': sessionId } : {} }
    );
    syncSessionId(response.data);
    return response.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.delete(`/cart/items/${itemId}`, {
      headers: sessionId ? { 'x-session-id': sessionId } : {},
    });
    syncSessionId(response.data);
    return response.data;
  },

  // ... similar updates for other methods
};
```

#### 2. Cart Context Retry Logic
Add retry logic to handle session mismatch errors gracefully.

```typescript
// frontend/contexts/CartContext.tsx
const removeItem = async (itemId: string) => {
  try {
    setError(null);
    const updatedCart = await cartApi.removeItem(itemId);
    setCart(updatedCart);
    notifyCartUpdate();
  } catch (err: any) {
    // Check if it's a session mismatch error
    if (err.response?.data?.message?.includes('does not belong to session')) {
      console.log('Session mismatch detected, refreshing cart and retrying...');
      try {
        // Refresh cart to sync session ID
        await refreshCart();
        // Retry the operation once
        const updatedCart = await cartApi.removeItem(itemId);
        setCart(updatedCart);
        notifyCartUpdate();
        return; // Success on retry
      } catch (retryErr: any) {
        console.error('Retry failed:', retryErr);
        setError('Failed to remove item. Please refresh the page and try again.');
        throw retryErr;
      }
    }

    setError(err.response?.data?.message || 'Failed to remove item');
    throw err;
  }
};
```

## Data Models

No database schema changes required. The session ID already exists in the Cart model.

```prisma
model Cart {
  id        String   @id @default(uuid())
  userId    String?
  sessionId String?
  expiresAt DateTime
  items     CartItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Session ID Consistency
*For any* cart operation sequence (add, update, remove), the session ID used by the frontend should match the session ID of the cart in the backend after each operation.
**Validates: Requirements 1.1, 1.2, 2.3**

### Property 2: Session ID Persistence
*For any* cart response from the backend, if the response contains a session ID, the frontend should store that session ID in localStorage.
**Validates: Requirements 1.1, 2.1**

### Property 3: Backend Session ID Usage
*For any* cart request with a session ID header, the backend should use that session ID and not generate a new one.
**Validates: Requirements 1.3, 2.2**

### Property 4: Ownership Validation
*For any* cart item operation, the backend should verify that either the user ID matches OR the session ID matches before allowing the operation.
**Validates: Requirements 1.5, 2.5**

### Property 5: Retry Success After Sync
*For any* session mismatch error, if the frontend refreshes the cart and retries the operation, the operation should succeed (assuming the cart item still exists).
**Validates: Requirements 3.3**

## Error Handling

### Backend Error Responses
```typescript
// Enhanced error message with debugging info
{
  statusCode: 400,
  message: "Cart item does not belong to session. Expected: sess_123, Got: sess_456",
  error: "Bad Request",
  details: {
    cartSessionId: "sess_123",
    requestSessionId: "sess_456",
    itemId: "item_789"
  }
}
```

### Frontend Error Handling
1. **Session Mismatch**: Automatically refresh cart and retry once
2. **Retry Failure**: Show user-friendly message with refresh suggestion
3. **Network Errors**: Standard error handling with retry option
4. **Logging**: Console log all session ID operations for debugging

## Testing Strategy

### Unit Tests

#### Backend Unit Tests
- Test `getSessionId()` uses header value when provided
- Test `getSessionId()` generates new ID when none provided
- Test session validation in `removeItem()` with matching session ID
- Test session validation in `removeItem()` with mismatched session ID
- Test error message includes session ID details

#### Frontend Unit Tests
- Test `syncSessionId()` updates localStorage when session ID changes
- Test `syncSessionId()` doesn't update when session ID matches
- Test `getSessionId()` generates new ID when none exists
- Test `getSessionId()` returns existing ID from localStorage

### Property-Based Tests

We will use `fast-check` for property-based testing in TypeScript. Each property test should run a minimum of 100 iterations.

#### Property Test 1: Session ID Consistency
Test that after any sequence of cart operations, the frontend's stored session ID matches the backend's cart session ID.

```typescript
// Tag: **Feature: cart-session-sync-fix, Property 1: Session ID Consistency**
fc.assert(
  fc.property(
    fc.array(fc.oneof(
      fc.constant('add'),
      fc.constant('update'),
      fc.constant('remove')
    )),
    async (operations) => {
      // Execute operations
      // Verify session ID consistency
    }
  ),
  { numRuns: 100 }
);
```

#### Property Test 2: Session ID Persistence
Test that for any cart response containing a session ID, the frontend stores it.

```typescript
// Tag: **Feature: cart-session-sync-fix, Property 2: Session ID Persistence**
fc.assert(
  fc.property(
    fc.record({
      id: fc.uuid(),
      sessionId: fc.string(),
      items: fc.array(fc.anything())
    }),
    (cartResponse) => {
      syncSessionId(cartResponse);
      const stored = localStorage.getItem('sessionId');
      return stored === cartResponse.sessionId;
    }
  ),
  { numRuns: 100 }
);
```

#### Property Test 3: Backend Session ID Usage
Test that the backend always uses the provided session ID from the request header.

```typescript
// Tag: **Feature: cart-session-sync-fix, Property 3: Backend Session ID Usage**
fc.assert(
  fc.property(
    fc.string({ minLength: 10 }),
    async (sessionId) => {
      const cart = await createCartWithSession(sessionId);
      return cart.sessionId === sessionId;
    }
  ),
  { numRuns: 100 }
);
```

### Integration Tests
- Test complete flow: add item → remove item (should succeed)
- Test session mismatch scenario with retry logic
- Test cart operations across multiple browser tabs
- Test cart merge on login preserves session

### Manual Testing Checklist
- Add product to cart as guest
- Remove product from cart (should succeed)
- Add multiple products and remove each one
- Test in multiple browser tabs simultaneously
- Test with browser localStorage cleared mid-session
- Test cart operations after page refresh

## Implementation Notes

1. **Backward Compatibility**: The changes are backward compatible. Existing carts will continue to work.

2. **Performance**: No performance impact. We're only adding a field to responses and a localStorage update.

3. **Security**: Session IDs are already exposed in responses (cart.sessionId), so no new security concerns.

4. **Logging**: Add console.log statements for debugging during development. These can be removed or converted to proper logging in production.

5. **Testing Priority**: Focus on integration tests that cover the full flow, as this is a cross-system synchronization issue.
