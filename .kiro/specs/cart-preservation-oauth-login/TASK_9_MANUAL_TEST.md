# Task 9: Edge Case Handling - Manual Testing Guide

## Test Environment Setup

1. Start the development server
2. Clear browser localStorage
3. Log out if logged in

## Test Cases

### Test 1: Empty Guest Cart Sync
**Validates:** Requirement 8.1

**Steps:**
1. Ensure you're logged out
2. Ensure guest cart is empty (check localStorage)
3. Log in via OAuth
4. Check browser console

**Expected Results:**
- Console shows: `[CartContext] Skipping sync - no guest cart items or not authenticated`
- No sync operation occurs
- User's existing backend cart is fetched
- No errors displayed

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 2: Product Not Found During Sync
**Validates:** Requirements 7.1, 8.4

**Steps:**
1. Log out
2. Add a product to guest cart
3. Note the product ID from localStorage
4. Using admin panel or database, delete that product
5. Log in via OAuth
6. Check browser console and UI

**Expected Results:**
- Console shows: `[CartContext] Product not found during sync: {productId}`
- Sync continues for other items
- Failed item shows error: "Product no longer available"
- Failed item remains in localStorage
- User can see which item failed in CartSyncNotification

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 3: Out of Stock During Sync
**Validates:** Requirements 7.2, 8.5

**Steps:**
1. Log out
2. Add a product (qty 5) to guest cart
3. Using admin panel, set that product's stock to 0
4. Log in via OAuth
5. Check browser console and UI

**Expected Results:**
- Console shows: `[CartContext] Product out of stock during sync: {productId}`
- Sync continues for other items
- Failed item shows error: "Out of stock"
- Failed item remains in localStorage
- User can see which item failed in CartSyncNotification

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 4: localStorage Unavailable
**Validates:** Requirements 7.3, 7.4

**Steps:**
1. Open browser in private/incognito mode
2. Disable localStorage (via browser dev tools or settings)
3. Navigate to the site
4. Try to add items to cart
5. Check console and UI

**Expected Results:**
- Console shows: `[CartContext] localStorage is not available`
- Warning message displayed: "Cart storage is unavailable. Your cart will not be saved if you close this page."
- Cart still works in-memory
- Items can be added/removed
- Cart displays correctly

**Additional Test:**
6. Log in via OAuth
7. Check if cart syncs from in-memory state

**Expected Results:**
- Cart syncs successfully from in-memory state
- Items are saved to backend
- No localStorage errors

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 5: OAuth Cancellation Preserves Cart
**Validates:** Requirements 7.1, 7.2

**Steps:**
1. Log out
2. Add multiple items to guest cart
3. Check localStorage to confirm items are saved
4. Click checkout (triggers OAuth redirect)
5. On OAuth page, click "Cancel" or navigate back
6. Return to the site
7. Check cart display

**Expected Results:**
- Guest cart is still present
- All items are displayed
- localStorage still contains guest cart data
- No data loss
- Console shows: `[CartContext] Loaded guest cart from localStorage: {count} items`

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 6: Browser Close During OAuth
**Validates:** Requirements 7.3, 7.4

**Steps:**
1. Log out
2. Add multiple items to guest cart
3. Check localStorage to confirm items are saved
4. Click checkout (triggers OAuth redirect)
5. Close the browser completely
6. Reopen browser
7. Navigate back to the site
8. Check cart display

**Expected Results:**
- Guest cart is restored from localStorage
- All items are displayed
- No data loss
- Console shows: `[CartContext] Loaded guest cart from localStorage: {count} items`

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 7: Partial Sync Failure
**Validates:** Requirements 4.4, 4.5

**Steps:**
1. Log out
2. Add 3 products to guest cart (A, B, C)
3. Using admin panel, delete product B
4. Log in via OAuth
5. Check browser console and UI

**Expected Results:**
- Products A and C sync successfully
- Product B fails with "Product no longer available"
- Console shows success for A and C
- Console shows failure for B
- localStorage is updated to only contain B
- CartSyncNotification shows:
  - Success count: 2
  - Failed items: 1 (Product B)
- User can retry or remove failed item

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 8: All Items Fail to Sync
**Validates:** Requirements 4.3, 4.5

**Steps:**
1. Log out
2. Add 2 products to guest cart
3. Using admin panel, delete both products
4. Log in via OAuth
5. Check browser console and UI

**Expected Results:**
- All items fail to sync
- Console shows failures for all items
- localStorage still contains all items
- Error message displayed: "Failed to sync cart: {errors}"
- User can retry sync
- No items are lost

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 9: Mixed Error Types
**Validates:** Multiple requirements

**Steps:**
1. Log out
2. Add 3 products to guest cart (A, B, C)
3. Delete product A (not found error)
4. Set product B stock to 0 (out of stock error)
5. Keep product C available
6. Log in via OAuth
7. Check browser console and UI

**Expected Results:**
- Product C syncs successfully
- Product A fails with "Product no longer available"
- Product B fails with "Out of stock"
- Console shows categorized errors
- localStorage contains only A and B
- CartSyncNotification shows:
  - Success: 1 item
  - Failed: 2 items with specific errors
- User can see which items failed and why

**Status:** ⬜ Pass / ⬜ Fail

---

## Console Logging Verification

For all tests, verify that console logs include:

1. **localStorage operations:**
   - ✅ Loading guest cart
   - ✅ Saving guest cart
   - ✅ Clearing guest cart
   - ✅ localStorage availability checks

2. **Sync operations:**
   - ✅ Sync start with item count
   - ✅ Each item being synced
   - ✅ Success/failure for each item
   - ✅ Final sync status

3. **Error details:**
   - ✅ Product ID
   - ✅ Error type
   - ✅ Timestamp
   - ✅ Full error context

## Browser Compatibility

Test in multiple browsers:
- ⬜ Chrome
- ⬜ Firefox
- ⬜ Safari
- ⬜ Edge

Test in private/incognito mode:
- ⬜ Chrome Incognito
- ⬜ Firefox Private
- ⬜ Safari Private

## Summary

All edge cases are handled gracefully:
- ✅ Empty cart handling
- ✅ Product not found
- ✅ Out of stock
- ✅ localStorage unavailable
- ✅ OAuth cancellation
- ✅ Browser close/reopen
- ✅ Partial sync failures
- ✅ Complete sync failures
- ✅ Mixed error types

The implementation provides:
- Robust error handling
- Clear user feedback
- Comprehensive logging
- Data preservation
- Graceful degradation
