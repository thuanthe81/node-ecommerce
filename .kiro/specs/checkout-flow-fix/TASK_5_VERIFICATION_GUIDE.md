# Task 5: Checkout Flow Fix Verification Guide

## Automated Test Results ✅

All automated tests have passed successfully:

### Test Summary
- ✅ **Guest checkout with same billing address**: Exactly 1 address created
- ✅ **Guest checkout with different billing address**: Exactly 2 addresses created
- ✅ **Authenticated user checkout with new address**: Exactly 1 address created
- ✅ **Authenticated user checkout with saved address**: No new addresses created

**Overall: 4/4 tests passed** 🎉

## Manual Testing Guide

### Prerequisites
1. Backend server running on `http://localhost:3000`
2. Frontend server running on `http://localhost:3001`
3. Database seeded with test data
4. Access to database query tool (e.g., Prisma Studio, pgAdmin, or psql)

### Test 1: Guest User Checkout with Same Billing Address

**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3001`
3. Add a product to cart
4. Go to checkout
5. Fill in email and shipping address
6. Check "Use same address for billing"
7. Select shipping method
8. Review and place order

**Database Verification:**
```sql
-- Count guest addresses created in last 5 minutes
SELECT COUNT(*) as guest_addresses
FROM addresses
WHERE "userId" IS NULL
  AND "createdAt" > NOW() - INTERVAL '5 minutes';

-- Expected: Should increase by 1 after order placement

-- Verify order uses same address for shipping and billing
SELECT
  id,
  "orderNumber",
  "shippingAddressId",
  "billingAddressId",
  "shippingAddressId" = "billingAddressId" as same_address
FROM orders
WHERE "createdAt" > NOW() - INTERVAL '5 minutes'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Expected: same_address should be TRUE
```

### Test 2: Guest User Checkout with Different Billing Address

**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3001`
3. Add a product to cart
4. Go to checkout
5. Fill in email and shipping address
6. Uncheck "Use same address for billing"
7. Fill in different billing address
8. Select shipping method
9. Review and place order

**Database Verification:**
```sql
-- Count guest addresses created in last 5 minutes
SELECT COUNT(*) as guest_addresses
FROM addresses
WHERE "userId" IS NULL
  AND "createdAt" > NOW() - INTERVAL '5 minutes';

-- Expected: Should increase by 2 after order placement

-- Verify order uses different addresses
SELECT
  id,
  "orderNumber",
  "shippingAddressId",
  "billingAddressId",
  "shippingAddressId" = "billingAddressId" as same_address
FROM orders
WHERE "createdAt" > NOW() - INTERVAL '5 minutes'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Expected: same_address should be FALSE
```

### Test 3: Authenticated User Checkout with New Address

**Steps:**
1. Login to the application
2. Add a product to cart
3. Go to checkout
4. Fill in a new shipping address (don't select saved address)
5. Select shipping method
6. Review and place order

**Database Verification:**
```sql
-- Get your user ID first
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Count addresses for your user
SELECT COUNT(*) as user_addresses
FROM addresses
WHERE "userId" = 'YOUR_USER_ID'
  AND "createdAt" > NOW() - INTERVAL '5 minutes';

-- Expected: Should increase by 1 after order placement

-- Verify address is associated with user
SELECT
  a.id,
  a."userId",
  a."fullName",
  a."addressLine1",
  a."isDefault"
FROM addresses a
WHERE a."userId" = 'YOUR_USER_ID'
  AND a."createdAt" > NOW() - INTERVAL '5 minutes';

-- Expected: Should show the new address with your userId
```

### Test 4: Authenticated User Checkout with Saved Address

**Steps:**
1. Login to the application (ensure you have at least one saved address)
2. Add a product to cart
3. Go to checkout
4. Select an existing saved address
5. Select shipping method
6. Review and place order

**Database Verification:**
```sql
-- Get your user ID first
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Count addresses for your user before and after
SELECT COUNT(*) as user_addresses
FROM addresses
WHERE "userId" = 'YOUR_USER_ID';

-- Expected: Count should NOT increase after order placement

-- Verify order uses existing address
SELECT
  o.id,
  o."orderNumber",
  o."shippingAddressId",
  a."addressLine1",
  a."createdAt" as address_created_at,
  o."createdAt" as order_created_at
FROM orders o
JOIN addresses a ON o."shippingAddressId" = a.id
WHERE o."userId" = 'YOUR_USER_ID'
  AND o."createdAt" > NOW() - INTERVAL '5 minutes'
ORDER BY o."createdAt" DESC
LIMIT 1;

-- Expected: address_created_at should be BEFORE order_created_at
```

## Console Log Verification

When testing in the browser, open Developer Tools Console and look for these log messages:

### Expected Console Logs for Guest User:
```
[CheckoutContent] handleNewShippingAddress called - storing address in state only
[CheckoutContent] Shipping address stored in component state, will be created during order placement
[CheckoutContent] handlePlaceOrder called
[CheckoutContent] Starting address creation process
[CheckoutContent] Creating new shipping address
[CheckoutContent] Shipping address created with ID: <uuid>
[CheckoutContent] Reusing shipping address for billing (if same address checked)
[CheckoutContent] Final address IDs: { shippingAddressId: '<uuid>', billingAddressId: '<uuid>' }
[CheckoutContent] Creating order with data: {...}
[CheckoutContent] Order created successfully: <order-id>
```

### Expected Console Logs for Authenticated User with New Address:
```
[CheckoutContent] handleNewShippingAddress called - storing address in state only
[CheckoutContent] Shipping address stored in component state, will be created during order placement
[CheckoutContent] handlePlaceOrder called
[CheckoutContent] Starting address creation process
[CheckoutContent] Creating new shipping address
[CheckoutContent] Shipping address created with ID: <uuid>
[CheckoutContent] Final address IDs: { shippingAddressId: '<uuid>', billingAddressId: '<uuid>' }
[CheckoutContent] Creating order with data: {...}
[CheckoutContent] Order created successfully: <order-id>
```

### Expected Console Logs for Authenticated User with Saved Address:
```
[CheckoutContent] Saved address selected: <uuid>
[CheckoutContent] handlePlaceOrder called
[CheckoutContent] Starting address creation process
[CheckoutContent] Final address IDs: { shippingAddressId: '<uuid>', billingAddressId: '<uuid>' }
[CheckoutContent] Creating order with data: {...}
[CheckoutContent] Order created successfully: <order-id>
```

**Key Observation:** Notice that when using a saved address, there are NO logs about "Creating new shipping address" - this confirms addresses are not being duplicated.

## Database Query Helpers

### Check for Duplicate Addresses
```sql
-- Find potential duplicate addresses for authenticated users
SELECT
  "userId",
  "fullName",
  "addressLine1",
  "city",
  "postalCode",
  COUNT(*) as duplicate_count
FROM addresses
WHERE "userId" IS NOT NULL
GROUP BY "userId", "fullName", "addressLine1", "city", "postalCode"
HAVING COUNT(*) > 1;

-- Expected: Should return 0 rows (no duplicates)
```

### Check Guest Addresses
```sql
-- Count guest addresses (should only exist for guest orders)
SELECT COUNT(*) as guest_address_count
FROM addresses
WHERE "userId" IS NULL;

-- List recent guest addresses with their orders
SELECT
  a.id as address_id,
  a."fullName",
  a."addressLine1",
  a."createdAt" as address_created,
  COUNT(DISTINCT o.id) as order_count
FROM addresses a
LEFT JOIN orders o ON (o."shippingAddressId" = a.id OR o."billingAddressId" = a.id)
WHERE a."userId" IS NULL
  AND a."createdAt" > NOW() - INTERVAL '1 day'
GROUP BY a.id, a."fullName", a."addressLine1", a."createdAt"
ORDER BY a."createdAt" DESC;
```

### Verify Order-Address Relationships
```sql
-- Check that all orders have valid address references
SELECT
  o.id,
  o."orderNumber",
  o."email",
  o."shippingAddressId",
  o."billingAddressId",
  sa."addressLine1" as shipping_address,
  ba."addressLine1" as billing_address
FROM orders o
LEFT JOIN addresses sa ON o."shippingAddressId" = sa.id
LEFT JOIN addresses ba ON o."billingAddressId" = ba.id
WHERE o."createdAt" > NOW() - INTERVAL '1 day'
ORDER BY o."createdAt" DESC;

-- Expected: All orders should have valid shipping and billing addresses
```

## Success Criteria

The fix is verified as successful if:

1. ✅ **Guest users with same billing address**: Exactly 1 address created per order
2. ✅ **Guest users with different billing address**: Exactly 2 addresses created per order
3. ✅ **Authenticated users with new address**: Exactly 1 address created and associated with user account
4. ✅ **Authenticated users with saved address**: No new addresses created, existing address reused
5. ✅ **Console logs**: Show addresses are stored in state first, then created during order placement
6. ✅ **Database queries**: Confirm no duplicate addresses exist
7. ✅ **Order references**: All orders correctly reference their shipping and billing addresses

## Troubleshooting

### If duplicate addresses are still being created:

1. **Check browser console logs**: Ensure the new flow is being followed
2. **Verify code changes**: Confirm `handleNewShippingAddress` and `handleNewBillingAddress` don't call API
3. **Check network tab**: Look for duplicate POST requests to `/api/users/addresses`
4. **Review database**: Use the duplicate detection query above
5. **Clear browser cache**: Old JavaScript might be cached

### If orders fail to create:

1. **Check error messages**: Look for specific error about address creation
2. **Verify address validation**: Ensure all required fields are filled
3. **Check backend logs**: Look for validation errors or database constraints
4. **Test API directly**: Use Postman/curl to test address creation endpoint

## Conclusion

All automated tests have passed, confirming that:
- The checkout flow correctly defers address creation until order placement
- No duplicate addresses are created for any user type
- Orders correctly reference the created or existing addresses
- The fix meets all requirements specified in the design document

The implementation is ready for production deployment.
