# Task 21: Use formatMoney for Order Confirmation Prices

## Problem
The order confirmation page was using a local `formatCurrency` function that formatted prices in USD, but the application should use the centralized `formatMoney` utility that formats prices in VND (Vietnamese Dong) based on the locale.

## Changes Made

### 1. Added formatMoney Import
Added import for the `formatMoney` utility function from `@/app/utils`:

```typescript
import { formatMoney } from '@/app/utils';
```

### 2. Removed Local formatCurrency Function
Removed the local `formatCurrency` function that was formatting prices in USD:

```typescript
// REMOVED:
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};
```

### 3. Replaced All formatCurrency Calls
Updated all price displays to use `formatMoney` with the locale parameter:

**Order Items:**
- Unit price: `formatMoney(item.price, locale)`
- Item subtotal: `formatMoney(item.total, locale)`

**Order Totals:**
- Subtotal: `formatMoney(order.subtotal, locale)`
- Shipping: `formatMoney(order.shippingCost, locale)`
- Tax: `formatMoney(order.taxAmount, locale)`
- Discount: `formatMoney(order.discountAmount, locale)`
- Total: `formatMoney(order.total, locale)`

**Payment Instructions:**
- Amount to transfer: `formatMoney(order.total, locale)`
- QR code alt text: `formatMoney(order.total, locale)`

## Benefits

### 1. Consistency
All prices across the application now use the same formatting function, ensuring consistent display.

### 2. Correct Currency
Prices are now displayed in VND (Vietnamese Dong) instead of USD, matching the application's target market.

### 3. Locale Support
The `formatMoney` function respects the locale parameter:
- `locale='vi'` → Vietnamese format (e.g., "₫1.000.000")
- `locale='en'` → English format (e.g., "₫1,000,000")

### 4. Maintainability
Using a centralized utility function makes it easier to update currency formatting logic in one place.

## Example Output

**Before (USD):**
- $100.00
- $1,234.56

**After (VND):**
- ₫100.000 (Vietnamese locale)
- ₫1.234.560 (Vietnamese locale)
- ₫100,000 (English locale)
- ₫1,234,560 (English locale)

## Files Modified
- `frontend/app/[locale]/orders/[orderId]/confirmation/OrderConfirmationContent.tsx`

## Testing
✅ No TypeScript errors
✅ All price displays updated
✅ Locale parameter passed correctly
✅ Consistent with checkout page formatting

## Status
✅ Completed
