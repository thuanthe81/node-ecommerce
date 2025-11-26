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

Based on the prework analysis, most acceptance criteria are either implementation details (enforced by TypeScript) or specific examples rather than universal properties. We have one testable property:

### Property 1: Locale value is never undefined
*For any* page render with valid route params, the locale value passed to child components should never be undefined
**Validates: Requirements 1.5**

**Note on Testing Approach:**
Requirements 1.1, 1.2, and 1.3 are best validated through example-based integration tests rather than property-based tests, as they test specific locale values ("en" and "vi") and specific user interactions. Requirements 1.4, 2.1, 2.2, and 2.3 are implementation details enforced by TypeScript's type system and code review rather than runtime tests.

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
