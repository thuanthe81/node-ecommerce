# Status Translation Verification Manual Test Plan

This document outlines manual tests to verify that status translations work correctly on the order details page according to requirements 6.1-6.7.

## Test Environment Setup

1. Start the development server: `npm run dev`
2. Navigate to an order details page: `/en/orders/[orderId]` or `/vi/orders/[orderId]`
3. Use browser developer tools to inspect the rendered HTML and console logs

## Test Cases

### Test Case 1: Valid Order and Payment Status Combinations

**Objective**: Verify that valid statuses are translated correctly using appropriate namespaces.

**Test Data**: Create or find orders with these status combinations:
- Order: PENDING, Payment: PENDING
- Order: PROCESSING, Payment: PAID
- Order: SHIPPED, Payment: PAID
- Order: DELIVERED, Payment: PAID
- Order: CANCELLED, Payment: FAILED
- Order: REFUNDED, Payment: REFUNDED

**Expected Results**:
- Order status should be translated using orders namespace (e.g., "Pending", "Processing", "Shipped")
- Payment status should be translated using email namespace (e.g., "Pending", "Paid", "Failed")
- No console warnings about cross-namespace fallback
- Both statuses should be clearly displayed and distinguishable

**Verification Steps**:
1. Navigate to order details page
2. Locate the "Order Details" section
3. Find the "Status" field (order status)
4. Find the "Payment Status" field (payment status)
5. Verify both are translated appropriately
6. Check browser console for any warnings

### Test Case 2: Invalid/Unknown Status Values

**Objective**: Verify that unknown statuses display raw values without cross-namespace fallback.

**Test Data**: Manually modify order data (via database or API) to have:
- Order: UNKNOWN_ORDER_STATUS, Payment: PENDING
- Order: PENDING, Payment: UNKNOWN_PAYMENT_STATUS
- Order: INVALID_STATUS, Payment: INVALID_PAYMENT_STATUS

**Expected Results**:
- Unknown order status should display "UNKNOWN_ORDER_STATUS" (raw value)
- Unknown payment status should display "UNKNOWN_PAYMENT_STATUS" (raw value)
- Console should show warnings about unknown statuses
- No cross-namespace fallback should occur

**Verification Steps**:
1. Navigate to order with invalid statuses
2. Verify raw status values are displayed
3. Check console for appropriate warning messages
4. Confirm no cross-namespace translation attempts

### Test Case 3: Null/Undefined Status Handling

**Objective**: Verify graceful handling of null/undefined status values.

**Test Data**: Orders with:
- Order status: null, Payment status: PENDING
- Order status: PENDING, Payment status: null
- Both statuses: null

**Expected Results**:
- Null/undefined statuses should display "Unknown"
- Console should show warnings about null/undefined statuses
- Page should not crash or show errors

**Verification Steps**:
1. Navigate to orders with null statuses
2. Verify "Unknown" is displayed for null statuses
3. Check console for appropriate warnings
4. Confirm page renders correctly

### Test Case 4: Localization Testing

**Objective**: Verify status translations work correctly in both English and Vietnamese.

**Test Data**: Same order viewed in both locales:
- `/en/orders/[orderId]`
- `/vi/orders/[orderId]`

**Expected Results**:
- English: Order statuses in English, Payment statuses in English
- Vietnamese: Order statuses in Vietnamese, Payment statuses in Vietnamese
- Shared library translations should be used when available
- Fallback to namespace translations when shared library fails

**Verification Steps**:
1. View same order in English locale
2. Note the status translations
3. Switch to Vietnamese locale
4. Verify status translations change appropriately
5. Check that both locales work without errors

### Test Case 5: Console Warning Verification

**Objective**: Verify appropriate console warnings are logged for debugging.

**Test Data**: Orders with various status combinations including invalid ones.

**Expected Console Messages**:
- `"Order status is undefined or null"` for null order statuses
- `"Payment status is undefined or null"` for null payment statuses
- `"Unknown order status: [STATUS]"` for invalid order statuses
- `"Unknown payment status: [STATUS]"` for invalid payment statuses
- `"Failed to translate order status key: [KEY]"` for translation errors
- `"Failed to translate payment status key: [KEY]"` for translation errors

**Verification Steps**:
1. Open browser developer tools console
2. Navigate to orders with various status combinations
3. Verify appropriate warning messages appear
4. Confirm no unexpected errors or warnings

### Test Case 6: Cross-Namespace Fallback Prevention

**Objective**: Verify that order status never falls back to payment status translations and vice versa.

**Test Data**:
- Create scenario where order status translation fails but payment status translation would succeed
- Create scenario where payment status translation fails but order status translation would succeed

**Expected Results**:
- Failed order status translation should return raw status, not payment status translation
- Failed payment status translation should return raw status, not order status translation
- No cross-contamination between namespaces

**Verification Steps**:
1. Use browser developer tools to modify translation functions
2. Force translation failures for specific namespaces
3. Verify raw values are returned instead of cross-namespace translations
4. Check console for appropriate error messages

## Test Results Documentation

For each test case, document:
- ✅ PASS / ❌ FAIL
- Actual behavior observed
- Any deviations from expected results
- Screenshots of status displays
- Console log messages
- Browser and version tested

## Automated Test Verification

Run the automated tests to complement manual testing:

```bash
# Run status translation behavior tests
npm test statusTranslationBehavior.test.tsx

# Run all OrderDetailView related tests
npm test -- --testPathPattern=OrderDetailView
```

## Success Criteria

All tests must pass with:
- ✅ Order status uses only orders namespace translations
- ✅ Payment status uses only email namespace translations
- ✅ No cross-namespace fallback occurs
- ✅ Invalid statuses display raw values
- ✅ Null/undefined statuses handled gracefully
- ✅ Appropriate console warnings logged
- ✅ Both English and Vietnamese locales work correctly
- ✅ Page renders correctly in all scenarios
- ✅ No JavaScript errors in console
- ✅ Automated tests pass