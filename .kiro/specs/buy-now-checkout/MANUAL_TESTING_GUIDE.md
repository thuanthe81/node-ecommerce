# Buy Now Checkout - Manual Testing Guide

## Overview

This guide provides comprehensive manual testing procedures for tasks 11.2 (Browser Testing), 11.3 (Accessibility Audit), and 11.4 (Performance Optimization) of the Buy Now Checkout feature.

---

## Task 11.2: Manual Testing Across Browsers

### Test Environment Setup

**Required Browsers:**
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)
- iOS Safari (mobile)
- Chrome Mobile (Android)

### Test Scenarios

#### Scenario 1: Basic Buy Now Flow

**Steps:**
1. Navigate to any product page
2. Select a quantity (e.g., 2)
3. Click the "Buy Now" button
4. Verify redirect to checkout page
5. Complete checkout with shipping address
6. Select shipping method
7. Review and place order
8. Verify order confirmation page

**Expected Results:**
- ✅ Buy Now button is visible and styled correctly (green background)
- ✅ Button respects selected quantity
- ✅ Checkout page loads with single product
- ✅ Cart remains unchanged throughout process
- ✅ Order completes successfully
- ✅ Confirmation page displays correctly

**Test in Each Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] iOS Safari
- [ ] Chrome Mobile

#### Scenario 2: SessionStorage Functionality

**Steps:**
1. Click "Buy Now" on a product
2. Open browser DevTools → Application/Storage → Session Storage
3. Verify `checkout-session` key exists
4. Check session data structure:
   ```json
   {
     "source": "buy-now",
     "product": {
       "id": "product-id",
       "quantity": 2
     },
     "createdAt": 1234567890,
     "expiresAt": 1234569690
   }
   ```
5. Refresh the checkout page
6. Verify session persists and checkout still works
7. Complete the order
8. Verify session is cleared after order completion

**Expected Results:**
- ✅ Session is created on Buy Now click
- ✅ Session persists across page refresh
- ✅ Session is cleared after order completion
- ✅ Session expires after 30 minutes

**Test in Each Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] iOS Safari
- [ ] Chrome Mobile

#### Scenario 3: SessionStorage Fallback (In-Memory)

**Steps:**
1. Open browser DevTools → Console
2. Disable sessionStorage (if possible) or test in private/incognito mode with storage disabled
3. Click "Buy Now" on a product
4. Check console for warning: "sessionStorage unavailable, using in-memory storage"
5. Complete checkout flow
6. Verify functionality works despite storage limitation

**Expected Results:**
- ✅ Warning message appears in console
- ✅ Buy Now flow still works
- ✅ Session data stored in memory
- ✅ Order completes successfully

**Note:** This is difficult to test manually. Check console logs for fallback behavior.

**Test in Each Browser:**
- [ ] Chrome (incognito)
- [ ] Firefox (private)
- [ ] Safari (private)
- [ ] Edge (InPrivate)

#### Scenario 4: Abandoned Checkout

**Steps:**
1. Click "Buy Now" on a product (quantity: 3)
2. Proceed to checkout page
3. Navigate away (click browser back button or go to home page)
4. Check cart icon/page
5. Verify product was added to cart with quantity 3

**Expected Results:**
- ✅ Product added to cart on abandonment
- ✅ Correct quantity preserved
- ✅ Session cleared after abandonment
- ✅ If product already in cart, quantity increases

**Test in Each Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] iOS Safari
- [ ] Chrome Mobile

#### Scenario 5: Mobile Responsiveness

**Steps:**
1. Open product page on mobile device
2. Verify Buy Now button is visible and tappable
3. Tap Buy Now button
4. Complete checkout on mobile
5. Test in both portrait and landscape orientations

**Expected Results:**
- ✅ Buy Now button properly sized for mobile
- ✅ Button text readable
- ✅ Checkout form usable on mobile
- ✅ No horizontal scrolling
- ✅ Touch targets adequate size (min 44x44px)

**Test on Mobile Browsers:**
- [ ] iOS Safari (iPhone)
- [ ] iOS Safari (iPad)
- [ ] Chrome Mobile (Android phone)
- [ ] Chrome Mobile (Android tablet)

#### Scenario 6: Out-of-Stock Products

**Steps:**
1. Find or create a product with 0 stock
2. Verify Buy Now button is enabled
3. Click Buy Now
4. Complete checkout
5. Verify order is created (booking system)

**Expected Results:**
- ✅ Buy Now button enabled for out-of-stock products
- ✅ Checkout proceeds normally
- ✅ Order created successfully
- ✅ Stock status displayed but doesn't block purchase

**Test in Each Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

#### Scenario 7: Zero-Price Products

**Steps:**
1. Find or create a product with price = 0
2. Click Buy Now
3. Complete checkout
4. Verify payment step is skipped/simplified
5. Verify order is created

**Expected Results:**
- ✅ Buy Now button enabled for zero-price products
- ✅ Checkout shows "Contact for Price" or similar
- ✅ Order created successfully
- ✅ No payment processing required

**Test in Each Browser:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Browser-Specific Issues to Watch For

**Chrome:**
- Session storage limits
- Console warnings/errors

**Firefox:**
- Private browsing storage restrictions
- CSS rendering differences

**Safari:**
- iOS Safari session storage in private mode
- Touch event handling
- Viewport height issues on mobile

**Edge:**
- Legacy compatibility mode
- Session storage behavior

**Mobile Browsers:**
- Touch target sizes
- Viewport scaling
- Keyboard behavior
- Form input focus

### Test Results Template

```
Browser: [Browser Name and Version]
Date: [Test Date]
Tester: [Your Name]

Scenario 1 - Basic Buy Now Flow: ✅ PASS / ❌ FAIL
Notes:

Scenario 2 - SessionStorage: ✅ PASS / ❌ FAIL
Notes:

Scenario 3 - Fallback: ✅ PASS / ❌ FAIL
Notes:

Scenario 4 - Abandoned Checkout: ✅ PASS / ❌ FAIL
Notes:

Scenario 5 - Mobile Responsiveness: ✅ PASS / ❌ FAIL
Notes:

Scenario 6 - Out-of-Stock: ✅ PASS / ❌ FAIL
Notes:

Scenario 7 - Zero-Price: ✅ PASS / ❌ FAIL
Notes:

Overall Status: ✅ PASS / ❌ FAIL
Critical Issues:
Minor Issues:
```

---

## Task 11.3: Accessibility Audit

### ARIA Labels and Semantic HTML

#### Test 1: Buy Now Button Accessibility

**Steps:**
1. Inspect Buy Now button in DevTools
2. Verify button element (not div with click handler)
3. Check for proper text content
4. Verify disabled state is properly communicated

**Expected Results:**
- ✅ Uses `<button>` element
- ✅ Has visible text label ("Buy Now" / "Mua Ngay")
- ✅ `disabled` attribute present when appropriate
- ✅ Loading state communicated ("Processing..." / "Đang xử lý...")

**Current Implementation Check:**
```tsx
<button
  onClick={handleBuyNow}
  disabled={buyingNow || quantity <= 0 || isNaN(quantity)}
  className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {buyingNow ? t('product.buyingNow') : t('product.buyNow')}
</button>
```

**Improvements Needed:**
- [ ] Add `aria-label` for screen readers
- [ ] Add `aria-busy` during loading state
- [ ] Add `aria-describedby` to link to quantity selector

**Recommended Fix:**
```tsx
<button
  onClick={handleBuyNow}
  disabled={buyingNow || quantity <= 0 || isNaN(quantity)}
  aria-label={buyingNow ? t('product.buyingNow') : t('product.buyNow')}
  aria-busy={buyingNow}
  aria-describedby="quantity-selector"
  className="w-full bg-green-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {buyingNow ? t('product.buyingNow') : t('product.buyNow')}
</button>
```

#### Test 2: Keyboard Navigation

**Steps:**
1. Navigate to product page
2. Press Tab repeatedly to navigate through page
3. Verify Buy Now button receives focus
4. Press Enter/Space on Buy Now button
5. Verify checkout page loads
6. Continue tabbing through checkout form
7. Complete checkout using only keyboard

**Expected Results:**
- ✅ Buy Now button is keyboard accessible
- ✅ Focus indicator visible on button
- ✅ Enter/Space activates button
- ✅ Tab order is logical
- ✅ All form fields keyboard accessible
- ✅ Can complete entire flow without mouse

**Test Checklist:**
- [ ] Tab to Buy Now button
- [ ] Focus indicator visible
- [ ] Enter key activates button
- [ ] Space key activates button
- [ ] Tab order logical on checkout page
- [ ] Can fill all form fields with keyboard
- [ ] Can submit order with keyboard

#### Test 3: Screen Reader Announcements

**Tools:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac/iOS)
- TalkBack (Android)

**Steps:**
1. Enable screen reader
2. Navigate to product page
3. Listen to Buy Now button announcement
4. Activate Buy Now button
5. Listen to checkout page announcements
6. Navigate through checkout form
7. Listen to error messages (if any)
8. Complete order and listen to confirmation

**Expected Announcements:**

**Buy Now Button:**
- "Buy Now, button" or "Mua Ngay, nút"
- When disabled: "Buy Now, button, disabled"
- When loading: "Processing, button, busy"

**Checkout Page:**
- "Checkout, heading level 1"
- "Step 1 of 3: Shipping"
- Form field labels clearly announced
- Error messages announced immediately

**Order Confirmation:**
- "Order confirmed" or similar success message

**Test Checklist:**
- [ ] Button role announced correctly
- [ ] Button state (enabled/disabled) announced
- [ ] Loading state announced
- [ ] Page title announced on navigation
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Success messages announced

#### Test 4: Focus Management

**Steps:**
1. Click Buy Now button
2. Verify focus moves to checkout page heading
3. Submit form with errors
4. Verify focus moves to first error
5. Complete order
6. Verify focus moves to confirmation heading

**Expected Results:**
- ✅ Focus managed on page transitions
- ✅ Focus moves to errors when present
- ✅ Focus returns to logical position after actions
- ✅ No focus traps

**Current Implementation:**
- Navigation uses Next.js router.push()
- No explicit focus management implemented

**Improvements Needed:**
- [ ] Add focus management on checkout page load
- [ ] Focus first error on validation failure
- [ ] Focus confirmation heading on success

**Recommended Implementation:**
```tsx
// In CheckoutContent.tsx
useEffect(() => {
  // Focus heading when page loads
  const heading = document.querySelector('h1');
  if (heading) {
    heading.focus();
  }
}, []);

// In handlePlaceOrder after error
if (error) {
  const errorElement = document.querySelector('[role="alert"]');
  if (errorElement) {
    errorElement.focus();
  }
}
```

#### Test 5: Color Contrast

**Tools:**
- Chrome DevTools Lighthouse
- WAVE Browser Extension
- Contrast Checker

**Steps:**
1. Run Lighthouse accessibility audit
2. Check Buy Now button contrast ratio
3. Check disabled state contrast
4. Check focus indicator contrast
5. Verify all text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

**Expected Results:**
- ✅ Buy Now button: green (#16a34a) on white background - ratio > 4.5:1
- ✅ Button text: white on green - ratio > 4.5:1
- ✅ Disabled state: sufficient contrast
- ✅ Focus indicator: visible and high contrast

**Test Checklist:**
- [ ] Buy Now button contrast ratio
- [ ] Disabled button contrast ratio
- [ ] Focus indicator contrast ratio
- [ ] Error message contrast ratio
- [ ] All text meets WCAG AA

### Accessibility Test Results Template

```
Test Date: [Date]
Tester: [Name]
Screen Reader: [NVDA/JAWS/VoiceOver/TalkBack]
Browser: [Browser Name]

Test 1 - ARIA Labels: ✅ PASS / ❌ FAIL
Issues:

Test 2 - Keyboard Navigation: ✅ PASS / ❌ FAIL
Issues:

Test 3 - Screen Reader: ✅ PASS / ❌ FAIL
Issues:

Test 4 - Focus Management: ✅ PASS / ❌ FAIL
Issues:

Test 5 - Color Contrast: ✅ PASS / ❌ FAIL
Issues:

Overall WCAG 2.1 Level: AA / A / Fail
Critical Issues:
Recommended Improvements:
```

---

## Task 11.4: Performance Optimization

### Test 1: Unnecessary Re-renders

**Tools:**
- React DevTools Profiler
- Chrome DevTools Performance tab

**Steps:**
1. Install React DevTools
2. Open Profiler tab
3. Navigate to product page
4. Start recording
5. Click Buy Now button
6. Stop recording
7. Analyze component render counts
8. Identify unnecessary re-renders

**Expected Results:**
- ✅ ProductInfo component renders only when necessary
- ✅ Buy Now button doesn't cause parent re-renders
- ✅ Checkout page renders efficiently
- ✅ No render loops or cascading updates

**Components to Monitor:**
- ProductInfo
- CheckoutContent
- ShippingAddressForm
- ShippingMethodSelector
- Order summary sidebar

**Optimization Opportunities:**

1. **Memoize Buy Now Handler:**
```tsx
const handleBuyNow = useCallback(async () => {
  if (quantity <= 0 || isNaN(quantity)) {
    return;
  }
  setBuyingNow(true);
  try {
    createBuyNowSession(product.id, quantity);
    router.push(`/${locale}/checkout`);
  } catch (error) {
    console.error('Failed to initiate Buy Now:', error);
    alert(t('cart.failedAddToCart'));
    setBuyingNow(false);
  }
}, [product.id, quantity, locale, router, t]);
```

2. **Memoize Checkout Items:**
```tsx
const checkoutItems = useMemo(() => {
  return checkoutSource === 'buy-now' && buyNowProduct
    ? [{
        id: `buy-now-${buyNowProduct.product.id}`,
        product: buyNowProduct.product,
        quantity: buyNowProduct.quantity,
      }]
    : (cart?.items || []);
}, [checkoutSource, buyNowProduct, cart?.items]);
```

3. **Memoize Calculations:**
```tsx
const { subtotal, tax, total } = useMemo(() => {
  const subtotal = checkoutItems.reduce((sum, item) => {
    const price = Number(item.product.price);
    return sum + (price > 0 ? price * item.quantity : 0);
  }, 0);

  const tax = subtotal * 0.1;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const total = Math.max(0, subtotal + calculatedShippingCost + tax - discountAmount);

  return { subtotal, tax, total };
}, [checkoutItems, calculatedShippingCost, appliedPromo]);
```

**Test Checklist:**
- [ ] Record baseline render count
- [ ] Identify unnecessary re-renders
- [ ] Apply memoization optimizations
- [ ] Re-test and compare render counts
- [ ] Verify functionality still works

### Test 2: Large Cart Performance

**Steps:**
1. Add 20+ items to cart
2. Navigate to product page
3. Click Buy Now button
4. Measure time to checkout page load
5. Complete Buy Now checkout
6. Verify cart is not affected
7. Check for performance degradation

**Expected Results:**
- ✅ Buy Now flow unaffected by large cart
- ✅ Checkout page loads quickly (<1 second)
- ✅ Cart operations don't slow down Buy Now
- ✅ No memory leaks

**Performance Metrics:**
- Time to Interactive (TTI): < 3 seconds
- First Contentful Paint (FCP): < 1.5 seconds
- Largest Contentful Paint (LCP): < 2.5 seconds

**Test Scenarios:**
- [ ] Cart with 5 items
- [ ] Cart with 20 items
- [ ] Cart with 50 items
- [ ] Empty cart
- [ ] Cart with out-of-stock items

### Test 3: Product Data Loading Optimization

**Steps:**
1. Open Chrome DevTools Network tab
2. Click Buy Now button
3. Monitor network requests
4. Check for:
   - Duplicate product API calls
   - Unnecessary data fetching
   - Large payload sizes
   - Slow API responses

**Expected Results:**
- ✅ Product data fetched only once
- ✅ No duplicate API calls
- ✅ Efficient data caching
- ✅ Fast API response times (<500ms)

**Current Implementation:**
```tsx
// In CheckoutContent.tsx
const product = await productApi.getProductById(session.product.id);
```

**Optimization Opportunities:**

1. **Cache Product Data in Session:**
```tsx
// In checkout-session.ts
export interface CheckoutSession {
  source: 'buy-now' | 'cart';
  product?: {
    id: string;
    quantity: number;
    cachedData?: EnhancedProduct; // Cache product data
  };
  createdAt: number;
  expiresAt: number;
}

// In ProductInfo.tsx
export const createBuyNowSession = (product: Product, quantity: number): void => {
  const session: CheckoutSession = {
    source: 'buy-now',
    product: {
      id: product.id,
      quantity,
      cachedData: product, // Cache product data
    },
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TIMEOUT_MS,
  };
  // ... store session
};

// In CheckoutContent.tsx
if (session.product.cachedData) {
  // Use cached data
  setBuyNowProduct({
    product: session.product.cachedData,
    quantity: session.product.quantity,
  });
} else {
  // Fetch from API
  const product = await productApi.getProductById(session.product.id);
  setBuyNowProduct({ product, quantity: session.product.quantity });
}
```

2. **Implement SWR or React Query:**
```tsx
import useSWR from 'swr';

const { data: product, error } = useSWR(
  session?.product?.id ? `/api/products/${session.product.id}` : null,
  productApi.getProductById,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  }
);
```

**Test Checklist:**
- [ ] Measure baseline API call count
- [ ] Measure baseline load time
- [ ] Implement caching optimization
- [ ] Re-test API call count
- [ ] Re-test load time
- [ ] Verify data freshness

### Test 4: Bundle Size Analysis

**Steps:**
1. Run production build: `npm run build`
2. Analyze bundle size
3. Check for:
   - Large dependencies
   - Duplicate code
   - Unused imports

**Expected Results:**
- ✅ Buy Now feature adds minimal bundle size
- ✅ No duplicate dependencies
- ✅ Code splitting effective

**Commands:**
```bash
# Build and analyze
npm run build
npm run analyze # if available

# Check specific file sizes
ls -lh .next/static/chunks/
```

**Test Checklist:**
- [ ] Measure baseline bundle size
- [ ] Identify large dependencies
- [ ] Remove unused imports
- [ ] Implement code splitting if needed
- [ ] Re-measure bundle size

### Performance Test Results Template

```
Test Date: [Date]
Tester: [Name]
Environment: [Development/Production]

Test 1 - Re-renders:
Baseline Render Count: [X]
Optimized Render Count: [Y]
Improvement: [Z%]
Status: ✅ PASS / ❌ FAIL

Test 2 - Large Cart:
Cart Size: [X items]
TTI: [X seconds]
FCP: [X seconds]
LCP: [X seconds]
Status: ✅ PASS / ❌ FAIL

Test 3 - Product Loading:
API Calls: [X]
Load Time: [X ms]
Cache Hit Rate: [X%]
Status: ✅ PASS / ❌ FAIL

Test 4 - Bundle Size:
Baseline: [X KB]
After Optimization: [Y KB]
Reduction: [Z KB / Z%]
Status: ✅ PASS / ❌ FAIL

Overall Performance Score: [X/100]
Critical Issues:
Optimization Recommendations:
```

---

## Summary Checklist

### Task 11.2 - Browser Testing
- [ ] Chrome - All scenarios pass
- [ ] Firefox - All scenarios pass
- [ ] Safari - All scenarios pass
- [ ] Edge - All scenarios pass
- [ ] iOS Safari - All scenarios pass
- [ ] Chrome Mobile - All scenarios pass
- [ ] SessionStorage works in all browsers
- [ ] Fallback mechanism tested

### Task 11.3 - Accessibility
- [ ] ARIA labels implemented
- [ ] Keyboard navigation works
- [ ] Screen reader tested (at least one)
- [ ] Focus management implemented
- [ ] Color contrast meets WCAG AA
- [ ] No critical accessibility issues

### Task 11.4 - Performance
- [ ] Re-renders optimized
- [ ] Large cart performance acceptable
- [ ] Product loading optimized
- [ ] Bundle size acceptable
- [ ] No performance regressions

### Overall Status
- [ ] All browser tests pass
- [ ] All accessibility tests pass
- [ ] All performance tests pass
- [ ] Ready for production deployment

---

## Next Steps

After completing manual testing:

1. **Document Issues:** Record all issues found in a separate issue tracker
2. **Prioritize Fixes:** Categorize issues as Critical/High/Medium/Low
3. **Implement Fixes:** Address critical and high-priority issues
4. **Re-test:** Verify fixes work across all browsers
5. **Sign-off:** Get stakeholder approval before deployment

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Chrome Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE Accessibility Tool](https://wave.webaim.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
