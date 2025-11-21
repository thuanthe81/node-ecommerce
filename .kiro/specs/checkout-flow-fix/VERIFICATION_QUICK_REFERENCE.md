# Checkout Flow Fix - Quick Verification Reference

## 🚀 Quick Test Commands

```bash
# Run automated verification (recommended)
cd backend
npx ts-node scripts/verify-checkout-fix.ts

# Check database for duplicates
cd backend
npx ts-node scripts/check-address-duplicates.ts
```

## ✅ Expected Results

### Automated Tests
All 4 tests should pass:
- ✅ Guest checkout with same billing address: 1 address created
- ✅ Guest checkout with different billing address: 2 addresses created
- ✅ Authenticated user with new address: 1 address created
- ✅ Authenticated user with saved address: 0 addresses created

### Database Check
- ✅ No duplicate addresses for authenticated users
- ✅ No orphaned guest addresses
- ✅ All orders have valid address references

## 🔍 Quick Database Queries

### Check for duplicates
```sql
SELECT
  "userId",
  "fullName",
  "addressLine1",
  COUNT(*) as count
FROM addresses
WHERE "userId" IS NOT NULL
GROUP BY "userId", "fullName", "addressLine1"
HAVING COUNT(*) > 1;
```
**Expected:** 0 rows

### Check recent orders
```sql
SELECT
  o."orderNumber",
  o."email",
  o."shippingAddressId" = o."billingAddressId" as same_address,
  o."createdAt"
FROM orders o
WHERE o."createdAt" > NOW() - INTERVAL '1 day'
ORDER BY o."createdAt" DESC;
```

## 📝 What Was Fixed

**Problem:** Checkout flow created duplicate addresses - one when form was filled, another when order was placed.

**Solution:** Deferred all address creation to order placement time.

**Key Changes:**
1. `handleNewShippingAddress` - Now only stores in state (no API call)
2. `handleNewBillingAddress` - Now only stores in state (no API call)
3. `handlePlaceOrder` - Creates addresses just before order creation

## 🎯 Success Criteria

- [x] Guest users: 1 address for same billing, 2 for different
- [x] Authenticated users: 1 address for new, 0 for saved
- [x] No duplicate addresses in database
- [x] Proper error handling prevents partial data
- [x] All orders reference valid addresses

## 📚 Documentation

- **Full Verification Guide:** `.kiro/specs/checkout-flow-fix/TASK_5_VERIFICATION_GUIDE.md`
- **Verification Summary:** `.kiro/specs/checkout-flow-fix/TASK_5_VERIFICATION_SUMMARY.md`
- **Design Document:** `.kiro/specs/checkout-flow-fix/design.md`
- **Requirements:** `.kiro/specs/checkout-flow-fix/requirements.md`

## 🐛 Troubleshooting

**If tests fail:**
1. Check that backend is running
2. Verify database is seeded
3. Check for any pending migrations
4. Review console logs for errors

**If duplicates found:**
1. Clear browser cache
2. Verify latest code is deployed
3. Check network tab for duplicate API calls
4. Review console logs during checkout

## ✨ Status

**All verification complete - Fix is production ready! 🎉**
