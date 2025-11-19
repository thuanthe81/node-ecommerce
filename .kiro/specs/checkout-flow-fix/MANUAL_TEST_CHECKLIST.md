# Manual Testing Checklist - Checkout Flow Fix

## Instructions
This checklist should be completed by manually testing the application. Check off each item as you verify it works correctly.

## Prerequisites
- [ ] Backend server running on http://localhost:3001
- [ ] Frontend server running on http://localhost:3000
- [ ] Database seeded with test data
- [ ] At least one product in the database
- [ ] Test user account created (for authenticated user testing)
- [ ] Admin user account created (for admin testing)

---

## Test 1: Simplified Checkout Flow (Guest User)

### Setup
1. [ ] Open browser in incognito/private mode
2. [ ] Navigate to http://localhost:3000
3. [ ] Add at least one product to cart
4. [ ] Navigate to cart page
5. [ ] Click "Proceed to Checkout"

### Step 1: Shipping Address
- [ ] Email input field is visible and required
- [ ] Shipping address form is displayed
- [ ] All required fields are marked with asterisk (*)
- [ ] "Next" button is disabled until all required fields are filled
- [ ] Fill in all required fields:
  - [ ] Email
  - [ ] Full Name
  - [ ] Phone
  - [ ] Address Line 1
  - [ ] City
  - [ ] State/Province
  - [ ] Postal Code
- [ ] "Use same address for billing" checkbox is checked by default
- [ ] "Next" button becomes enabled after filling all fields
- [ ] Click "Next" button

### Step 2: Shipping Method
- [ ] Shipping method selection is displayed
- [ ] Three shipping options are visible:
  - [ ] Standard Shipping ($5.00)
  - [ ] Express Shipping ($15.00)
  - [ ] Overnight Shipping ($25.00)
- [ ] **VERIFY: No payment method selection UI is visible**
- [ ] **VERIFY: No credit card or debit card options**
- [ ] Select a shipping method
- [ ] Order total in sidebar updates with shipping cost
- [ ] "Next" button is enabled after selecting shipping method
- [ ] Click "Next" button

### Step 3: Order Review
- [ ] All cart items are displayed with:
  - [ ] Product image
  - [ ] Product name
  - [ ] Quantity
  - [ ] Price
- [ ] Shipping address is displayed correctly
- [ ] Shipping method is shown
- [ ] Order totals are displayed:
  - [ ] Subtotal
  - [ ] Shipping cost
  - [ ] Tax (10% of subtotal)
  - [ ] Total
- [ ] Bank transfer information message is displayed
- [ ] Message indicates: "Payment via Bank Transfer - details will be provided after order confirmation"
- [ ] Order notes textarea is available (optional)
- [ ] "Place Order" button is visible and enabled
- [ ] Click "Place Order" button

### Order Placement
- [ ] Loading indicator is shown
- [ ] After successful order creation, redirected to order confirmation page
- [ ] URL is `/en/orders/[orderId]/confirmation` (or `/vi/...` for Vietnamese)

---

## Test 2: Order Confirmation Page (Guest User)

### Order Details Section
- [ ] Success banner is displayed with checkmark icon
- [ ] Order number is displayed (e.g., "ORD-2024-001")
- [ ] Order date is displayed
- [ ] Order status is shown (e.g., "Pending")

### Order Items
- [ ] All order items are listed
- [ ] Each item shows:
  - [ ] Product image
  - [ ] Product name (clickable link)
  - [ ] Quantity
  - [ ] Unit price
  - [ ] Subtotal
- [ ] Click on product name link - should navigate to product page
- [ ] Navigate back to confirmation page

### Order Totals
- [ ] Subtotal is displayed
- [ ] Shipping cost is shown
- [ ] Tax amount is included
- [ ] Total amount is prominently displayed
- [ ] All amounts are formatted correctly with currency symbol

### Shipping Information
- [ ] Shipping address section is displayed
- [ ] Address shows:
  - [ ] Full name
  - [ ] Address line 1
  - [ ] Address line 2 (if provided)
  - [ ] City, State, Postal Code
  - [ ] Country
  - [ ] Phone number
- [ ] Shipping method is displayed

### Bank Transfer Instructions
- [ ] Bank transfer instructions section is visible
- [ ] Instructional text is clear
- [ ] Bank account details are displayed:
  - [ ] Account Name
  - [ ] Account Number
  - [ ] Bank Name
  - [ ] Amount to Transfer (highlighted)
- [ ] QR code is displayed (if configured)
- [ ] QR code has descriptive text: "Scan this QR code with your banking app"
- [ ] If QR code not configured, section is gracefully hidden

### Action Buttons
- [ ] "Print Order" button is visible
- [ ] Click "Print Order" - print dialog opens
- [ ] Print preview shows clean layout without navigation
- [ ] QR code is visible in print preview
- [ ] "Continue Shopping" button is visible
- [ ] Click "Continue Shopping" - navigates to products page

---

## Test 3: Simplified Checkout Flow (Authenticated User)

### Setup
1. [ ] Log in with test user account
2. [ ] Add at least one product to cart
3. [ ] Navigate to cart page
4. [ ] Click "Proceed to Checkout"

### Step 1: Shipping Address
- [ ] Email is pre-filled with user's email
- [ ] If user has saved addresses:
  - [ ] Saved addresses are displayed
  - [ ] User can select a saved address
  - [ ] Selected address is highlighted
- [ ] User can choose to add a new address
- [ ] "Next" button is enabled when address is selected
- [ ] Click "Next" button

### Step 2: Shipping Method
- [ ] Same as guest user test
- [ ] **VERIFY: No payment method selection UI**
- [ ] Select shipping method and click "Next"

### Step 3: Order Review
- [ ] Same as guest user test
- [ ] Place order

### Order Confirmation
- [ ] Redirected to confirmation page
- [ ] All details displayed correctly
- [ ] **Additional for authenticated users:**
  - [ ] "View All Orders" link is visible
  - [ ] Click "View All Orders" - navigates to account orders page

---

## Test 4: Admin Payment Settings

### Setup
1. [ ] Log in with admin user account
2. [ ] Navigate to http://localhost:3000/en/admin/payment-settings

### Payment Settings Page
- [ ] Page loads successfully
- [ ] Page title: "Payment Settings"
- [ ] Form is displayed with fields:
  - [ ] Account Name
  - [ ] Account Number
  - [ ] Bank Name
  - [ ] QR Code Image Upload

### View Current Settings
- [ ] If settings exist, fields are pre-filled with current values
- [ ] If QR code exists, preview is shown
- [ ] If no settings exist, fields are empty

### Update Settings
- [ ] Update Account Name field
- [ ] Update Account Number field
- [ ] Update Bank Name field
- [ ] Upload a QR code image (PNG or JPG)
- [ ] Click "Save Settings" button
- [ ] Success message is displayed
- [ ] Page refreshes with updated values
- [ ] Verify changes persisted by refreshing page

### Verify Settings on Confirmation Page
- [ ] Place a test order (as guest or authenticated user)
- [ ] Navigate to order confirmation page
- [ ] Verify updated bank details are displayed
- [ ] Verify new QR code is displayed

---

## Test 5: Navigation and Data Persistence

### Backward Navigation
1. [ ] Start checkout flow
2. [ ] Fill in shipping address (Step 1)
3. [ ] Click "Next" to go to Step 2
4. [ ] Select shipping method
5. [ ] Click "Back" button
6. [ ] **VERIFY:** Returned to Step 1
7. [ ] **VERIFY:** Shipping address data is still filled in
8. [ ] Click "Next" again
9. [ ] **VERIFY:** Shipping method selection is still selected
10. [ ] Click "Next" to go to Step 3
11. [ ] Click "Back" button
12. [ ] **VERIFY:** Returned to Step 2
13. [ ] **VERIFY:** Shipping method is still selected

### Forward Navigation
1. [ ] Complete checkout flow from start to finish
2. [ ] Verify smooth transitions between steps
3. [ ] Verify no data loss during navigation

---

## Test 6: Error Handling

### Order Creation Failure
1. [ ] Stop the backend server
2. [ ] Attempt to place an order
3. [ ] **VERIFY:** Error message is displayed
4. [ ] **VERIFY:** User is not redirected
5. [ ] **VERIFY:** Form data is preserved
6. [ ] Start backend server
7. [ ] Click "Place Order" again
8. [ ] **VERIFY:** Order is created successfully

### Order Not Found
1. [ ] Navigate to http://localhost:3000/en/orders/invalid-order-id/confirmation
2. [ ] **VERIFY:** Error message is displayed
3. [ ] **VERIFY:** "Order not found" or similar message
4. [ ] **VERIFY:** Link to contact support is provided

### Payment Settings Not Configured
1. [ ] As admin, delete all payment settings (or clear database)
2. [ ] Place a test order
3. [ ] Navigate to confirmation page
4. [ ] **VERIFY:** Order details are still displayed
5. [ ] **VERIFY:** Fallback message is shown instead of bank details
6. [ ] **VERIFY:** Message indicates payment instructions will be sent via email

---

## Test 7: Responsive Design

### Mobile (< 768px)
1. [ ] Open browser developer tools
2. [ ] Set viewport to iPhone SE (375px width)
3. [ ] Navigate through entire checkout flow
4. [ ] **VERIFY:** Single column layout
5. [ ] **VERIFY:** All buttons are touch-friendly (min 44px height)
6. [ ] **VERIFY:** Forms are easy to fill out
7. [ ] **VERIFY:** No horizontal scrolling
8. [ ] **VERIFY:** QR code is appropriately sized
9. [ ] Navigate to order confirmation page
10. [ ] **VERIFY:** All content is readable
11. [ ] **VERIFY:** Layout is clean and organized

### Tablet (768px - 1024px)
1. [ ] Set viewport to iPad (768px width)
2. [ ] Navigate through checkout flow
3. [ ] **VERIFY:** Layout adapts appropriately
4. [ ] **VERIFY:** Good use of available space
5. [ ] **VERIFY:** All features accessible

### Desktop (> 1024px)
1. [ ] Set viewport to desktop (1920px width)
2. [ ] Navigate through checkout flow
3. [ ] **VERIFY:** Two-column layout (form + sidebar)
4. [ ] **VERIFY:** Order summary sidebar is sticky
5. [ ] **VERIFY:** Optimal use of screen space

---

## Test 8: Accessibility

### Keyboard Navigation
1. [ ] Navigate to checkout page
2. [ ] Use only keyboard (Tab, Shift+Tab, Enter, Space)
3. [ ] **VERIFY:** Can navigate through all form fields
4. [ ] **VERIFY:** Can select shipping method with keyboard
5. [ ] **VERIFY:** Can click buttons with Enter/Space
6. [ ] **VERIFY:** Focus indicators are visible
7. [ ] **VERIFY:** Tab order is logical
8. [ ] **VERIFY:** No keyboard traps

### Screen Reader (if available)
1. [ ] Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. [ ] Navigate through checkout flow
3. [ ] **VERIFY:** All form labels are announced
4. [ ] **VERIFY:** Required fields are indicated
5. [ ] **VERIFY:** Error messages are announced
6. [ ] **VERIFY:** Heading hierarchy is logical
7. [ ] Navigate to order confirmation page
8. [ ] **VERIFY:** All content is accessible
9. [ ] **VERIFY:** Bank details are properly structured
10. [ ] **VERIFY:** QR code has descriptive alt text

### Color Contrast
1. [ ] Use browser extension to check color contrast
2. [ ] **VERIFY:** All text meets WCAG AA standards (4.5:1 for normal text)
3. [ ] **VERIFY:** Interactive elements have sufficient contrast

---

## Test 9: Internationalization

### English (en)
1. [ ] Navigate to http://localhost:3000/en
2. [ ] Complete checkout flow
3. [ ] **VERIFY:** All text is in English
4. [ ] **VERIFY:** Currency is formatted correctly
5. [ ] **VERIFY:** Product names are in English
6. [ ] Navigate to order confirmation
7. [ ] **VERIFY:** All text is in English

### Vietnamese (vi)
1. [ ] Navigate to http://localhost:3000/vi
2. [ ] Complete checkout flow
3. [ ] **VERIFY:** All text is in Vietnamese
4. [ ] **VERIFY:** Currency is formatted correctly
5. [ ] **VERIFY:** Product names are in Vietnamese
6. [ ] Navigate to order confirmation
7. [ ] **VERIFY:** All text is in Vietnamese

---

## Test 10: Print Functionality

### Print Order Confirmation
1. [ ] Navigate to order confirmation page
2. [ ] Click "Print Order" button
3. [ ] **VERIFY:** Print dialog opens
4. [ ] **VERIFY:** Print preview shows:
  - [ ] Order details
  - [ ] Order items
  - [ ] Shipping address
  - [ ] Bank transfer instructions
  - [ ] QR code (if configured)
5. [ ] **VERIFY:** Print preview does NOT show:
  - [ ] Navigation header
  - [ ] Footer
  - [ ] Action buttons
6. [ ] **VERIFY:** Layout is optimized for A4/Letter paper
7. [ ] **VERIFY:** QR code is clear and scannable in print

---

## Test 11: Promotion Code

### Apply Promotion Code
1. [ ] Add products to cart
2. [ ] Navigate to checkout
3. [ ] In order summary sidebar, enter a valid promotion code
4. [ ] Click "Apply" button
5. [ ] **VERIFY:** Success message is shown
6. [ ] **VERIFY:** Discount is applied to order total
7. [ ] **VERIFY:** Discount amount is displayed
8. [ ] Complete checkout
9. [ ] **VERIFY:** Discount is reflected in order confirmation

### Remove Promotion Code
1. [ ] After applying promotion code
2. [ ] Click "Remove" or "Delete" button next to applied code
3. [ ] **VERIFY:** Discount is removed
4. [ ] **VERIFY:** Order total updates correctly

---

## Test 12: Security

### Admin Access Control
1. [ ] Log out (or use incognito mode)
2. [ ] Navigate to http://localhost:3000/en/admin/payment-settings
3. [ ] **VERIFY:** Redirected to login page or access denied
4. [ ] Log in as non-admin user
5. [ ] Navigate to payment settings page
6. [ ] **VERIFY:** Access denied or redirected

### Guest Order Access
1. [ ] As guest user, place an order
2. [ ] Note the order ID from confirmation page URL
3. [ ] Open new incognito window
4. [ ] Navigate directly to confirmation page with order ID
5. [ ] **VERIFY:** Can access order confirmation
6. [ ] Try to access a different order ID
7. [ ] **VERIFY:** Cannot access other users' orders (if implemented)

---

## Test 13: Performance

### Page Load Times
1. [ ] Open browser developer tools (Network tab)
2. [ ] Navigate to checkout page
3. [ ] **VERIFY:** Page loads in < 2 seconds
4. [ ] Navigate to order confirmation page
5. [ ] **VERIFY:** Page loads in < 2 seconds

### API Response Times
1. [ ] Open browser developer tools (Network tab)
2. [ ] Place an order
3. [ ] Check API call to create order
4. [ ] **VERIFY:** Response time < 1 second
5. [ ] Navigate to confirmation page
6. [ ] Check API calls for order details and payment settings
7. [ ] **VERIFY:** Response times < 500ms

---

## Test 14: Data Integrity

### Cart Clearing
1. [ ] Add products to cart
2. [ ] Note the cart item count
3. [ ] Complete checkout and place order
4. [ ] **VERIFY:** Redirected to confirmation page
5. [ ] Navigate to cart page
6. [ ] **VERIFY:** Cart is empty
7. [ ] **VERIFY:** Cart count shows 0

### Order Data Accuracy
1. [ ] Place an order with specific items and quantities
2. [ ] Navigate to order confirmation page
3. [ ] **VERIFY:** All items match what was in cart
4. [ ] **VERIFY:** Quantities are correct
5. [ ] **VERIFY:** Prices are correct
6. [ ] **VERIFY:** Totals are calculated correctly
7. [ ] As admin, check database
8. [ ] **VERIFY:** Order data in database matches confirmation page
9. [ ] **VERIFY:** Payment method is 'bank_transfer'

---

## Summary

### Total Tests: 14 categories
### Tests Passed: _____ / _____
### Tests Failed: _____ / _____
### Issues Found: _____

### Critical Issues
List any critical issues that prevent core functionality:
1.
2.
3.

### Minor Issues
List any minor issues or improvements:
1.
2.
3.

### Notes
Additional observations or comments:


---

## Sign-off

**Tester Name:** _____________________
**Date:** _____________________
**Signature:** _____________________

**Status:** [ ] APPROVED [ ] NEEDS FIXES

