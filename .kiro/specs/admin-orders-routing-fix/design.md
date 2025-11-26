# Design Document

## Overview

This design addresses the routing bug in the admin order management page where the "View Details" link displays `/undefined/admin/orders/[id]` instead of the correct locale-prefixed path. The root cause is that Next.js 15 changed route parameters from synchronous objects to asynchronous Promises, requiring the use of async/await to access param values.

The fix is straightforward: convert the page component to an async function and await the `params` Promise before passing the locale to child components.

## Architecture

### Current State
- Page component receives `params` as a prop
- Component directly accesses `params.locale` synchronously
- In Next.js 15, `params` is a Promise, so `params.locale` is undefined
- Child component receives undefined locale value
- Links constructed with undefined locale show `/undefined/...`

### Target State
- Page component is declared as async function
- Component awaits `params` Promise to get resolved values
- Locale value is properly extracted and passed to child components
- Links are constructed with correct locale prefix

## Components and Interfaces

### Modified Components

#### AdminOrdersPage Component (`frontend/app/[locale]/admin/orders/page.tsx`)

**Current Implementation:**
```typescript
export default function AdminOrdersPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <AdminProtectedRoute locale={params.locale}>
      <AdminLayout>
        <OrderListContent locale={params.locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
```

**Updated Implementation:**
```typescript
export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <OrderListContent locale={locale} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
```

**Key Changes:**
1. Add `async` keyword to function declaration
2. Update `params` type from `{ locale: string }` to `Promise<{ locale: string }>`
3. Await `params` and destructure `locale` value
4. Pass resolved `locale` value to child components

### Unchanged Components
- `OrderListContent`: No changes needed, already expects string locale prop
- `AdminProtectedRoute`: No changes needed, already expects string locale prop
- `AdminLayout`: No changes needed

## Data Models

No data model changes required. The locale parameter remains a string value; only the method of accessing it changes.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Routing Fix Properties

Based on the prework analysis, most acceptance criteria are either implementation details (enforced by TypeScript) or specific examples rather than universal properties. We have one testable property:

#### Property 1: Locale value is never undefined
*For any* page render with valid route params, the locale value passed to child components should never be undefined
**Validates: Requirements 1.5**

**Note on Testing Approach:**
Requirements 1.1, 1.2, and 1.3 are best validated through example-based integration tests rather than property-based tests, as they test specific locale values ("en" and "vi") and specific user interactions. Requirements 1.4, 2.1, 2.2, and 2.3 are implementation details enforced by TypeScript's type system and code review rather than runtime tests.

### Payment Status Update Properties

#### Property 2: Payment status update persists correctly
*For any* valid order and any valid payment status value (PENDING, PAID, FAILED, REFUNDED), when an administrator updates the payment status, the database should reflect the new status
**Validates: Requirements 3.3**

#### Property 3: Successful updates show confirmation
*For any* successful payment status update, the system should display a success confirmation message to the administrator
**Validates: Requirements 3.4**

#### Property 4: Failed updates preserve original status
*For any* payment status update that fails, the order's payment status should remain unchanged from its value before the update attempt
**Validates: Requirements 3.5**

#### Property 5: Updates refresh displayed data
*For any* successful payment status update, the displayed order details should match the current database state
**Validates: Requirements 3.6**

**Note on Example-Based Tests:**
Requirements 3.1 and 3.2 are best validated through example-based tests as they test specific UI elements and interactions rather than universal properties across all inputs.

## Error Handling

### Missing Locale
- **Scenario**: Params Promise resolves but locale is missing
- **Handling**: TypeScript type system ensures locale exists in params
- **Fallback**: If runtime error occurs, Next.js will show 404 page

### Invalid Locale
- **Scenario**: Locale value is not "en" or "vi"
- **Handling**: Next.js routing middleware should validate locale before reaching page
- **Current Behavior**: Already handled by i18n routing configuration

### Promise Rejection
- **Scenario**: Params Promise is rejected
- **Handling**: Next.js error boundary will catch and display error page
- **No Additional Code Needed**: Framework handles this automatically

## Testing Strategy

### Unit Tests
Since this is a simple async/await fix in a page component, unit testing would require mocking Next.js internals. The fix is better validated through:
- Manual testing in development
- Type checking with TypeScript
- Integration testing

### Property-Based Tests
Property-based testing is not applicable for this fix because:
- The change is a single async/await operation
- There are no complex transformations or algorithms
- The locale values are constrained to a fixed set ("en", "vi")

### Integration Tests
- Test navigation from admin orders list to order detail page
- Verify URL contains correct locale prefix
- Test with both "en" and "vi" locales

### Manual Testing Checklist
1. Navigate to `/en/admin/orders`
2. Click "View Details" on any order
3. Verify URL is `/en/admin/orders/[orderId]` (not `/undefined/...`)
4. Navigate to `/vi/admin/orders`
5. Click "View Details" on any order
6. Verify URL is `/vi/admin/orders/[orderId]`
7. Check browser console for no errors or warnings

## Payment Status Update Feature

### Overview
Administrators need the ability to update payment status for orders from the order detail page. This is essential for managing orders where payment confirmation happens outside the system (e.g., bank transfers, manual verification).

### Backend API
The backend already has the infrastructure for updating order status but needs a dedicated endpoint for payment status updates.

**Current State:**
- `PATCH /orders/:id/status` - Updates order status (PENDING, PROCESSING, SHIPPED, etc.)
- Payment status is stored in the Order model but no dedicated update endpoint exists

**Required Changes:**
- Add new endpoint: `PATCH /orders/:id/payment-status`
- Create DTO: `UpdatePaymentStatusDto` with validation
- Add service method: `updatePaymentStatus(id, dto)`
- Ensure admin-only access via `@Roles(UserRole.ADMIN)` guard

**Payment Status Values (from Prisma schema):**
- `PENDING` - Initial state, awaiting payment
- `PAID` - Payment confirmed
- `FAILED` - Payment attempt failed
- `REFUNDED` - Payment was refunded

### Frontend Components

#### Order Detail Page Enhancement
The order detail page at `/[locale]/admin/orders/[id]` needs to display current payment status and provide update functionality.

**UI Components:**
1. **Payment Status Display**
   - Show current status with color-coded badge
   - Display last updated timestamp

2. **Payment Status Update Button**
   - Opens modal/dropdown with status options
   - Only shows valid status transitions
   - Requires confirmation for critical changes (e.g., PAID → REFUNDED)

3. **Status Update Modal**
   - Dropdown to select new payment status
   - Optional notes field for admin reference
   - Cancel and Confirm buttons
   - Loading state during API call
   - Success/error feedback

**API Integration:**
- Create `updateOrderPaymentStatus` function in `lib/order-api.ts`
- Handle loading, success, and error states
- Refresh order data after successful update
- Display toast notifications for feedback

### Data Flow

```
User clicks "Update Payment Status"
  ↓
Modal opens with current status and options
  ↓
User selects new status and confirms
  ↓
Frontend calls PATCH /orders/:id/payment-status
  ↓
Backend validates admin role and updates database
  ↓
Backend returns updated order
  ↓
Frontend refreshes order display
  ↓
Success message shown to user
```

### Error Handling

**Frontend Errors:**
- Network failure: Show retry option
- Validation error: Display field-specific errors
- Unauthorized: Redirect to login
- Server error: Show generic error message

**Backend Errors:**
- Order not found: Return 404
- Invalid status value: Return 400 with validation errors
- Unauthorized: Return 403
- Database error: Return 500 with safe error message

## Implementation Notes

### Next.js 15 Migration Pattern
This fix follows the standard Next.js 15 migration pattern for async params:

**Before (Next.js 14 and earlier):**
```typescript
function Page({ params }: { params: { id: string } }) {
  const id = params.id;
}
```

**After (Next.js 15):**
```typescript
async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Similar Issues in Codebase
After fixing this page, we should check for similar issues in other admin pages:
- `/admin/customers/[customerId]`
- `/admin/products/[id]`
- `/admin/categories/[id]`
- `/admin/content/[id]`
- `/admin/banners/[id]`
- `/admin/promotions/[id]`

These pages may have the same issue and should be audited.

## Performance Considerations

### Impact of Async Function
- **Minimal Impact**: Awaiting params adds negligible latency (< 1ms)
- **Server-Side Only**: This code runs on the server during SSR, not in browser
- **No User-Facing Delay**: The await happens before any rendering begins

### Caching Behavior
- No impact on Next.js caching behavior
- Page remains statically generated or server-rendered as before
- Metadata export remains synchronous and unaffected
