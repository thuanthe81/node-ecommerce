# Task 20: Guest User Authorization for Order Confirmation

## Problem
Guest users were receiving "unauthorized" errors when trying to view their order confirmation page after successfully placing an order. The backend was rejecting the request because:

1. The `GET /orders/:id` endpoint required authentication by default
2. The authorization logic didn't account for guest orders (where `order.userId` is `null`)

## Root Cause

### Issue 1: Missing @Public() Decorator
The `@Get(':id')` endpoint in `orders.controller.ts` didn't have the `@Public()` decorator, requiring authentication for all requests.

### Issue 2: Flawed Authorization Logic
The service method `findOne()` had this check:

```typescript
if (userRole !== UserRole.ADMIN && order.userId !== userId) {
  throw new ForbiddenException('You do not have access to this order');
}
```

For guest users:
- `userId` is `undefined` (no authentication)
- `order.userId` is `null` (guest order)
- The check `null !== undefined` evaluates to `true`, throwing a forbidden error

## Solution

### 1. Made Endpoint Public
Added `@Public()` decorator to the `@Get(':id')` endpoint:

```typescript
@Get(':id')
@Public()
findOne(
  @Param('id') id: string,
  @CurrentUser() user?: { userId: string; role: UserRole },
) {
  return this.ordersService.findOne(id, user?.userId, user?.role);
}
```

### 2. Updated Authorization Logic
Implemented comprehensive authorization checks in `findOne()` service method:

```typescript
// Check authorization
// - Admins can view any order
// - Authenticated users can only view their own orders
// - Guest users (no userId) can view guest orders (order.userId is null)
if (userRole === UserRole.ADMIN) {
  // Admin can view any order
  return order;
}

if (userId && order.userId && order.userId !== userId) {
  // Authenticated user trying to view another user's order
  throw new ForbiddenException('You do not have access to this order');
}

if (userId && !order.userId) {
  // Authenticated user trying to view a guest order
  throw new ForbiddenException('You do not have access to this order');
}

if (!userId && order.userId) {
  // Guest user trying to view an authenticated user's order
  throw new ForbiddenException('You do not have access to this order');
}

// Allow: authenticated user viewing their own order, or guest viewing guest order
```

## Security Considerations

The new logic maintains security while enabling guest checkout:

| Scenario | User Type | Order Type | Result |
|----------|-----------|------------|--------|
| Admin views any order | Admin | Any | ✅ Allowed |
| User views own order | Authenticated | User's order | ✅ Allowed |
| User views other user's order | Authenticated | Other user's order | ❌ Forbidden |
| User views guest order | Authenticated | Guest order | ❌ Forbidden |
| Guest views guest order | Guest | Guest order | ✅ Allowed |
| Guest views user order | Guest | User's order | ❌ Forbidden |

## Potential Security Concern

**Note:** With this implementation, anyone with the order ID can view a guest order. This is a trade-off for guest checkout functionality.

### Mitigation Options (Future Enhancement):
1. Use UUIDs for order IDs (already implemented - harder to guess)
2. Add email verification: require guest to enter the email used for the order
3. Add a secure token in the confirmation URL
4. Set a time limit on guest order viewing (e.g., 24 hours)

For now, the UUID-based order IDs provide reasonable security for guest orders.

## Testing

### Test Cases:
1. ✅ Guest user places order and views confirmation page
2. ✅ Authenticated user places order and views confirmation page
3. ✅ Guest user cannot view authenticated user's order
4. ✅ Authenticated user cannot view another user's order
5. ✅ Authenticated user cannot view guest order
6. ✅ Admin can view any order

### Manual Testing:
```bash
# Test guest order viewing (should succeed)
curl http://localhost:3000/api/orders/{guest-order-id}

# Test authenticated user viewing their order (should succeed)
curl -H "Authorization: Bearer {user-token}" \
  http://localhost:3000/api/orders/{user-order-id}

# Test guest viewing authenticated order (should fail)
curl http://localhost:3000/api/orders/{authenticated-order-id}
```

## Files Modified
- `backend/src/orders/orders.controller.ts` - Added @Public() decorator
- `backend/src/orders/orders.service.ts` - Updated authorization logic

## Requirements Validated
- Requirement 4.1: Order confirmation page is accessible after order placement
- Requirement 4.6: Guest users can view their order confirmation
- Requirement 1.6: Guest checkout is fully functional

## Status
✅ Completed and tested
