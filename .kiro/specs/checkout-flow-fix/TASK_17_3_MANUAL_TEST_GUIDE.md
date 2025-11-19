# Task 17.3 Manual Testing Guide

## Authentication Error Handling Without Page Reload

This guide provides step-by-step instructions to manually test the authentication error handling implementation.

### Requirements Being Tested
- 6.1: No full page reload occurs
- 6.2: Client-side navigation instead of window.location redirects
- 6.3: Locale preservation in redirect URL
- 6.4: Order confirmation page doesn't redirect for guest users
- 6.5: Network activity preserved for debugging

---

## Test Setup

### Prerequisites
1. Start the backend server: `cd backend && npm run start:dev`
2. Start the frontend server: `cd frontend && npm run dev`
3. Open browser DevTools (F12 or Cmd+Option+I)
4. Navigate to the Network tab in DevTools

---

## Test 1: Token Expiration During Checkout (Requirements 6.1, 6.2, 6.5)

### Objective
Verify that when authentication fails during checkout, the system uses client-side navigation without page reload and preserves network activity.

### Steps
1. **Login to the application**
   - Navigate to `http://localhost:3000/en/login`
   - Login with valid credentials
   - Verify you're logged in

2. **Open DevTools Network Tab**
   - Press F12 (or Cmd+Option+I on Mac)
   - Click on the "Network" tab
   - Ensure "Preserve log" is checked

3. **Navigate to checkout**
   - Add items to cart
   - Go to `http://localhost:3000/en/checkout`

4. **Simulate token expiration**
   - Open DevTools Console tab
   - Run: `localStorage.setItem('accessToken', 'expired-token')`
   - Run: `localStorage.setItem('refreshToken', 'invalid-refresh-token')`

5. **Trigger an API call**
   - Try to proceed to the next step in checkout
   - Or refresh the page to trigger API calls

### Expected Results
✅ **PASS Criteria:**
- No full page reload occurs (page doesn't flash/reload)
- Network tab shows all API requests (preserved)
- User is redirected to `/en/login` using client-side navigation
- The URL changes smoothly without page reload
- All network requests remain visible in DevTools

❌ **FAIL Criteria:**
- Page reloads (white flash, network tab clears)
- Network activity is lost
- Browser shows loading indicator

---

## Test 2: Locale Preservation (Requirement 6.3)

### Objective
Verify that the redirect to login preserves the current locale.

### Test 2a: English Locale

#### Steps
1. Login and navigate to `http://localhost:3000/en/checkout`
2. Simulate token expiration (see Test 1, step 4)
3. Trigger an API call

#### Expected Results
✅ User is redirected to `/en/login` (English locale preserved)

### Test 2b: Vietnamese Locale

#### Steps
1. Login and navigate to `http://localhost:3000/vi/checkout`
2. Simulate token expiration
3. Trigger an API call

#### Expected Results
✅ User is redirected to `/vi/login` (Vietnamese locale preserved)

---

## Test 3: Order Confirmation Page Exception (Requirement 6.4)

### Objective
Verify that guest users on the order confirmation page are NOT redirected when authentication fails.

### Steps
1. **Place an order as a guest**
   - Navigate to `http://localhost:3000/en/products`
   - Add items to cart
   - Complete checkout as a guest
   - Note the order ID from the confirmation page URL

2. **Open a new incognito/private window**
   - Navigate to the order confirmation page: `http://localhost:3000/en/orders/[ORDER_ID]/confirmation`
   - The page should load with order details

3. **Simulate authentication failure**
   - Open DevTools Console
   - Run: `localStorage.setItem('refreshToken', 'invalid-refresh-token')`
   - Scroll down the page to trigger any lazy-loaded API calls
   - Or wait for any background API calls

### Expected Results
✅ **PASS Criteria:**
- User remains on the order confirmation page
- No redirect to login occurs
- Order details remain visible
- Guest user can view their order

❌ **FAIL Criteria:**
- User is redirected to login page
- Order confirmation page becomes inaccessible

---

## Test 4: Network Activity Preservation (Requirement 6.5)

### Objective
Verify that network activity remains visible in DevTools for debugging.

### Steps
1. Open DevTools Network tab
2. Check "Preserve log" option
3. Login and navigate to checkout
4. Simulate token expiration
5. Trigger API calls that will fail

### Expected Results
✅ **PASS Criteria:**
- All network requests remain visible in Network tab
- Failed requests show 401 status
- Refresh token request shows failure
- No network tab clearing occurs
- Developer can inspect all request/response details

---

## Test 5: Complete Flow Test

### Objective
Test the complete authentication error handling flow from start to finish.

### Steps
1. **Start with clean state**
   - Clear all localStorage: `localStorage.clear()`
   - Navigate to `http://localhost:3000/en/login`

2. **Login**
   - Login with valid credentials
   - Verify successful login

3. **Navigate to checkout**
   - Add items to cart
   - Go to checkout page

4. **Open DevTools**
   - Open Network tab
   - Enable "Preserve log"

5. **Expire tokens**
   - In Console: `localStorage.setItem('accessToken', 'expired-token')`
   - In Console: `localStorage.setItem('refreshToken', 'invalid-refresh-token')`

6. **Trigger authentication error**
   - Try to proceed in checkout
   - Or click any button that makes an API call

7. **Observe behavior**
   - Watch for redirect
   - Check network tab
   - Verify no page reload

### Expected Results
✅ **Complete Flow PASS:**
1. API call is made with expired token
2. Backend returns 401
3. Frontend attempts token refresh
4. Refresh fails
5. Tokens are cleared from localStorage
6. `auth:logout` event is dispatched
7. AuthContext handles event
8. User is redirected to `/en/login` via router.push()
9. No page reload occurs
10. All network activity is preserved
11. URL changes to `/en/login`

---

## Debugging Tips

### If tests fail:

1. **Check browser console for errors**
   - Look for JavaScript errors
   - Check for event listener issues

2. **Verify event dispatch**
   - In Console:
   ```javascript
   window.addEventListener('auth:logout', () => console.log('auth:logout event received'));
   ```
   - Trigger the error
   - Check if event is logged

3. **Check localStorage**
   - In Console: `console.log(localStorage)`
   - Verify tokens are cleared after error

4. **Inspect network requests**
   - Look for the refresh token request
   - Check if it's failing as expected
   - Verify 401 responses

5. **Check router behavior**
   - Verify Next.js router is being used
   - Look for `router.push()` calls in React DevTools

---

## Success Criteria Summary

All tests must pass with the following outcomes:

- ✅ No full page reloads occur
- ✅ Client-side navigation is used (router.push)
- ✅ Network activity is preserved in DevTools
- ✅ Locale is preserved in redirect URLs
- ✅ Order confirmation page doesn't redirect guest users
- ✅ Tokens are cleared before event dispatch
- ✅ auth:logout event is dispatched correctly
- ✅ AuthContext handles the event properly

---

## Test Results

### Test 1: Token Expiration During Checkout
- [ ] PASS
- [ ] FAIL
- Notes: _______________________________________________

### Test 2a: English Locale Preservation
- [ ] PASS
- [ ] FAIL
- Notes: _______________________________________________

### Test 2b: Vietnamese Locale Preservation
- [ ] PASS
- [ ] FAIL
- Notes: _______________________________________________

### Test 3: Order Confirmation Page Exception
- [ ] PASS
- [ ] FAIL
- Notes: _______________________________________________

### Test 4: Network Activity Preservation
- [ ] PASS
- [ ] FAIL
- Notes: _______________________________________________

### Test 5: Complete Flow Test
- [ ] PASS
- [ ] FAIL
- Notes: _______________________________________________

---

## Conclusion

Date: _______________
Tester: _______________
Overall Result: [ ] PASS [ ] FAIL

Notes:
