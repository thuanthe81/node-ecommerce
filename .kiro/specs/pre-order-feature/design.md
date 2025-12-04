# Design Document

## Overview

This feature replaces "Out of Stock" terminology with "Pre-Order" throughout the e-commerce platform. The change affects frontend UI components, translation files, SEO metadata, and test files. The implementation maintains all existing functionality while updating the user-facing terminology to better reflect the business model where customers can order temporarily unavailable products.

## Architecture

The change is primarily a content/terminology update that spans multiple layers:

1. **Translation Layer**: Update translation keys and values in the centralized translations.json file
2. **UI Components**: Update hardcoded strings in React components
3. **SEO Layer**: Update schema.org structured data to use PreOrder availability status
4. **Type Definitions**: Update TypeScript type definitions for availability status
5. **Test Layer**: Update test descriptions and assertions

The architecture remains unchanged - this is a content update that maintains all existing component structures and data flows.

## Components and Interfaces

### Translation System

**File**: `frontend/locales/translations.json`

The translation system uses a nested JSON structure with locale-specific values:

```json
{
  "common": {
    "outOfStock": {
      "en": "Pre-Order",
      "vi": "Đặt trước"
    }
  },
  "product": {
    "outOfStock": {
      "en": "Pre-Order",
      "vi": "Đặt trước"
    }
  }
}
```

### UI Components

**ProductCard Component** (`frontend/components/ProductCard.tsx`):
- Displays availability badge overlay on product images
- Uses inline strings that need updating

**ProductForm Component** (`frontend/components/ProductForm.tsx`):
- Shows availability status in product forms
- Uses inline strings with locale-based conditionals

**Admin Products Page** (`frontend/app/[locale]/admin/products/page.tsx`):
- Provides stock status filter dropdown
- Uses inline strings for filter options

### SEO System

**File**: `frontend/lib/seo.ts`

Type definitions and schema generation functions:

```typescript
interface SEOProps {
  availability?: 'in stock' | 'pre-order';
}

function generateProductSchema(product: {
  availability: 'in stock' | 'pre-order';
}) {
  // Maps to schema.org availability status
  const schemaAvailability = product.availability === 'in stock'
    ? 'https://schema.org/InStock'
    : 'https://schema.org/PreOrder';
}
```

### Product Detail Page

**File**: `frontend/app/[locale]/products/[slug]/ProductDetailContent.tsx`

Determines availability status based on stock quantity:

```typescript
availability: product.stockQuantity > 0 ? 'in stock' : 'pre-order'
```

## Data Models

No database schema changes required. The change only affects how zero stock quantity is presented to users.

**Existing Product Model** (unchanged):
```typescript
interface Product {
  stockQuantity: number;
  // ... other fields
}
```

**Availability Determination Logic** (unchanged):
- `stockQuantity > 0` → "In Stock"
- `stockQuantity === 0` → "Pre-Order" (previously "Out of Stock")

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Consistent terminology across UI components

*For any* product with zero stock quantity displayed in any UI component, the availability text SHALL be "Pre-Order" in English or "Đặt trước" in Vietnamese, never "Out of Stock" or "Hết hàng"

**Validates: Requirements 1.1, 1.2**

### Property 8: Product image visibility for pre-order items

*For any* product with zero stock quantity displayed in the product catalog, the product image SHALL be fully visible without any dark overlay or opacity reduction

**Validates: Requirements 1.5**

### Property 9: Pre-order label positioning

*For any* product with zero stock quantity displayed in the product catalog, the "Pre-Order" label SHALL be positioned at the bottom right corner of the product image

**Validates: Requirements 1.6**

### Property 2: Translation key consistency

*For any* translation key previously named "outOfStock", the system SHALL use "preOrder" as the key name while maintaining the same usage context

**Validates: Requirements 3.1**

### Property 3: SEO schema correctness

*For any* product with zero stock quantity, the generated schema.org structured data SHALL use "https://schema.org/PreOrder" availability status instead of "https://schema.org/OutOfStock"

**Validates: Requirements 1.4**

### Property 4: Admin interface consistency

*For any* admin interface element that displays or filters by stock status, the terminology SHALL use "Pre-Order" instead of "Out of Stock"

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Type definition accuracy

*For any* TypeScript type definition or interface that specifies availability status, the type SHALL include 'pre-order' as a valid value instead of 'out of stock'

**Validates: Requirements 3.3**

### Property 6: In-stock terminology preservation

*For any* product with stock quantity greater than zero, the availability text SHALL remain "In Stock" in English or "Còn hàng" in Vietnamese, unchanged from the current implementation

**Validates: Requirements 4.2**

### Property 7: Low stock warning preservation

*For any* product with stock quantity greater than zero but below the low stock threshold, the low stock warning SHALL continue to display unchanged

**Validates: Requirements 4.1**

### Property 10: Add to cart button visibility for pre-order products

*For any* product with zero stock quantity, the "Add to Cart" button SHALL be visible and functional

**Validates: Requirements 5.1**

### Property 11: Quantity selector visibility for pre-order products

*For any* product with zero stock quantity, the quantity selector SHALL be visible and allow quantity selection

**Validates: Requirements 5.2**

### Property 12: Pre-order cart addition functionality

*For any* product with zero stock quantity, adding the product to cart SHALL succeed without stock quantity validation errors

**Validates: Requirements 5.3**

## Error Handling

No new error handling required. This is a terminology change that does not affect error conditions or validation logic.

Existing error handling remains unchanged:
- Stock quantity validation continues to work as before
- Cart operations with zero-stock products continue to function
- Order placement validation remains the same

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples of the terminology change:

1. **ProductCard Component Test**: Verify that a product with `stockQuantity: 0` displays "Pre-Order" badge
2. **Admin Filter Test**: Verify that the stock filter dropdown contains "Pre-Order" option
3. **SEO Schema Test**: Verify that `generateProductSchema` returns PreOrder schema for zero-stock products
4. **Translation Test**: Verify that translation keys resolve to correct "Pre-Order" text

### Property-Based Tests

Property-based tests will verify universal properties across all inputs:

1. **Property Test for UI Consistency**: Generate random products with various stock quantities and verify that zero-stock products always show "Pre-Order" text
2. **Property Test for Translation Consistency**: Generate random locale and context combinations and verify that all "outOfStock" references resolve to "Pre-Order" terminology
3. **Property Test for SEO Schema**: Generate random products and verify that schema.org availability status correctly maps to PreOrder for zero-stock items

### Testing Framework

- **Unit Tests**: Jest with React Testing Library
- **Property-Based Tests**: fast-check library for JavaScript/TypeScript
- **Minimum Iterations**: 100 iterations per property-based test

### Test Configuration

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the design document property
- Use the format: `**Feature: pre-order-feature, Property {number}: {property_text}**`

## Implementation Notes

### Files to Update

1. **Translation Files**:
   - `frontend/locales/translations.json` - Update translation keys and values

2. **UI Components**:
   - `frontend/components/ProductCard.tsx` - Update availability badge text
   - `frontend/components/ProductForm.tsx` - Update form status text
   - `frontend/app/[locale]/admin/products/page.tsx` - Update filter dropdown options
   - `frontend/app/[locale]/products/[slug]/ProductInfo.tsx` - Enable add to cart for pre-order products

3. **SEO System**:
   - `frontend/lib/seo.ts` - Update type definitions and schema generation

4. **Product Pages**:
   - `frontend/app/[locale]/products/[slug]/ProductDetailContent.tsx` - Update availability determination

5. **Test Files**:
   - `frontend/components/__tests__/ProductListing.zero-price.test.tsx` - Update test descriptions
   - `backend/src/orders/orders.service.spec.ts` - Update test descriptions

6. **Documentation**:
   - `frontend/SEO_IMPLEMENTATION.md` - Update documentation references
   - `.kiro/specs/handmade-ecommerce/design.md` - Update spec references
   - `.kiro/specs/handmade-ecommerce/requirements.md` - Update spec references
   - `.kiro/specs/handmade-ecommerce/tasks.md` - Update spec references
   - `.kiro/specs/admin-products-featured-filter/requirements.md` - Update spec references

### Backward Compatibility

The change maintains backward compatibility:
- No API changes required
- No database migrations needed
- Existing functionality remains unchanged
- Only user-facing terminology is updated

### Localization

Both English and Vietnamese translations must be updated consistently:
- English: "Out of Stock" → "Pre-Order"
- Vietnamese: "Hết hàng" → "Đặt trước"

### SEO Considerations

The schema.org PreOrder status is semantically more accurate than OutOfStock for products that can be ordered despite zero inventory. This improves search engine understanding of product availability.

### Pre-Order Cart Functionality

**Current Behavior**: The add to cart button and quantity selector are hidden when `isOutOfStock` is true (line 151 in ProductInfo.tsx).

**New Behavior**:
- Remove the `{!isOutOfStock && (` conditional wrapper around the add to cart section
- Always show the add to cart button and quantity selector for all products
- For pre-order products (zero stock), allow quantity selection without stock quantity restrictions
- The quantity selector max value should be reasonable (e.g., 99) for pre-order products instead of being limited by `product.stockQuantity`

**Implementation Details**:
```typescript
// Current logic (to be changed):
{!isOutOfStock && (
  <div className="space-y-4">
    {/* Quantity selector and add to cart button */}
  </div>
)}

// New logic:
<div className="space-y-4">
  {/* Always show quantity selector and add to cart button */}
  {/* For pre-order products, set reasonable max quantity (e.g., 99) */}
</div>
```
