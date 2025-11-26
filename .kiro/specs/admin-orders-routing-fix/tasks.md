# Implementation Plan

- [x] 1. Fix admin orders page to await params Promise
  - Modify `frontend/app/[locale]/admin/orders/page.tsx` to make the component async
  - Update params type from `{ locale: string }` to `Promise<{ locale: string }>`
  - Add await statement to resolve params before accessing locale
  - Pass resolved locale value to child components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

- [ ]* 1.1 Write integration test for locale routing
  - Test navigation from orders list to order detail with "en" locale
  - Test navigation from orders list to order detail with "vi" locale
  - Verify URLs contain correct locale prefix
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Audit and fix other admin pages with similar issue
  - Check and fix `/admin/customers/[customerId]/page.tsx`
  - Check and fix `/admin/products/[id]/page.tsx`
  - Check and fix `/admin/categories/[id]/page.tsx`
  - Check and fix `/admin/content/[id]/page.tsx`
  - Check and fix `/admin/banners/[id]/page.tsx`
  - Check and fix `/admin/promotions/[id]/page.tsx`
  - Check and fix `/admin/homepage-sections/[id]/page.tsx`
  - Apply same async/await pattern where params are accessed
  - _Requirements: 1.4, 1.5, 2.1, 2.2_

- [ ] 3. Manual testing checkpoint
  - Test admin orders page navigation with both locales
  - Verify no undefined in URLs
  - Check browser console for errors
  - Test other fixed admin pages
  - Ensure all tests pass, ask the user if questions arise.
