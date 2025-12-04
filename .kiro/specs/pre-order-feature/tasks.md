# Implementation Plan

- [x] 1. Update translation files with pre-order terminology
  - Update `frontend/locales/translations.json` to replace "outOfStock" keys with "preOrder" keys
  - Update English translations from "Out of Stock" to "Pre-Order"
  - Update Vietnamese translations from "Hết hàng" to "Đặt trước"
  - Verify "inStock" translations remain unchanged
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ]* 1.1 Write property test for translation consistency
  - **Property 1: Zero stock products display Pre-Order in correct locale**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2. Update UI components with pre-order terminology
  - Update `frontend/components/ProductCard.tsx` to display "Pre-Order" badge for zero-stock products
  - Update `frontend/components/ProductForm.tsx` to display "Pre-Order" status text
  - Update `frontend/app/[locale]/admin/products/page.tsx` filter dropdown options
  - Ensure visual styling remains consistent
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ]* 2.1 Write property test for UI component consistency
  - **Property 2: Admin interface displays Pre-Order for zero-stock products**
  - **Validates: Requirements 2.2**

- [x] 3. Update SEO system with pre-order schema
  - Update `frontend/lib/seo.ts` type definitions to use 'pre-order' instead of 'out of stock'
  - Update `generateProductSchema` function to map to schema.org PreOrder status
  - Update `frontend/app/[locale]/products/[slug]/ProductDetailContent.tsx` availability determination
  - _Requirements: 1.4, 3.3_

- [ ]* 3.1 Write property test for SEO schema correctness
  - **Property 3: SEO schema uses PreOrder for zero-stock products**
  - **Validates: Requirements 1.4**

- [x] 4. Update test files with pre-order terminology
  - Update `frontend/components/__tests__/ProductListing.zero-price.test.tsx` test descriptions and assertions
  - Update `backend/src/orders/orders.service.spec.ts` test descriptions
  - Ensure all tests pass with new terminology
  - _Requirements: 3.4_

- [ ]* 4.1 Write property test for regression - low stock warning
  - **Property 4: Low stock warning displays for products with low inventory**
  - **Validates: Requirements 4.1**

- [ ]* 4.2 Write property test for regression - in stock terminology
  - **Property 5: In Stock terminology preserved for available products**
  - **Validates: Requirements 4.2**

- [x] 5. Update documentation files
  - Update `frontend/SEO_IMPLEMENTATION.md` to reference pre-order terminology
  - Update `.kiro/specs/handmade-ecommerce/design.md` references
  - Update `.kiro/specs/handmade-ecommerce/requirements.md` references
  - Update `.kiro/specs/handmade-ecommerce/tasks.md` references
  - Update `.kiro/specs/admin-products-featured-filter/requirements.md` references
  - _Requirements: All_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update ProductCard visual styling for pre-order items
  - Remove dark overlay (`bg-black bg-opacity-50`) from out-of-stock product images in `frontend/components/ProductCard.tsx`
  - Remove centered flex layout for pre-order badge
  - Position "Pre-Order" label at bottom right corner of product image
  - Ensure product image remains fully visible (opacity: 1)
  - Maintain accessibility with proper ARIA labels
  - _Requirements: 1.5, 1.6_

- [ ]* 7.1 Write property test for image visibility
  - **Property 8: Product images visible for pre-order items**
  - **Validates: Requirements 1.5**

- [ ]* 7.2 Write property test for label positioning
  - **Property 9: Pre-order label positioned at bottom right**
  - **Validates: Requirements 1.6**

- [x] 8. Enable add to cart functionality for pre-order products
  - Update `frontend/app/[locale]/products/[slug]/ProductInfo.tsx` to always show add to cart button
  - Remove conditional wrapper `{!isOutOfStock && (` around add to cart section
  - Update quantity selector to allow reasonable max quantity (e.g., 99) for pre-order products
  - Ensure quantity selector works correctly for both in-stock and pre-order products
  - Maintain all existing functionality for in-stock products
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 8.1 Write property test for add to cart button visibility
  - **Property 10: Add to cart button visible for pre-order products**
  - **Validates: Requirements 5.1**

- [ ]* 8.2 Write property test for quantity selector visibility
  - **Property 11: Quantity selector visible for pre-order products**
  - **Validates: Requirements 5.2**

- [ ]* 8.3 Write property test for pre-order cart addition
  - **Property 12: Pre-order products can be added to cart**
  - **Validates: Requirements 5.3**

- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
