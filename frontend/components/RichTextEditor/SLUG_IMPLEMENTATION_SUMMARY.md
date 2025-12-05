# Product Image Link Implementation: Using Slug Instead of ID

## Summary

Updated the RichTextEditor to use product **slugs** instead of product **IDs** when creating links for product images. This aligns with the URL structure used throughout the application and provides better SEO.

## Changes Made

### 1. Type Definitions (`types.ts`)

**Updated `ProductImageSelection` interface:**
```typescript
// Before
export interface ProductImageSelection {
  url: string;
  productId: string;  // ❌ Using ID
}

// After
export interface ProductImageSelection {
  url: string;
  slug: string;  // ✅ Using slug
}
```

**Updated `UseImageInsertionReturn` interface:**
```typescript
// Before
handleProductImageSelect: (url: string, productId?: string) => void;

// After
handleProductImageSelect: (url: string, slug?: string) => void;
```

**Updated `ImageUploadData` interface:**
```typescript
// Before
export interface ImageUploadData {
  file: File;
  productId?: string;
}

// After
export interface ImageUploadData {
  file: File;
  slug?: string;
}
```

### 2. Image Insertion Hook (`useImageInsertion.ts`)

**Updated `insertImageAtCursor` function:**
```typescript
// Before
const insertImageAtCursor = useCallback(
  (url: string, productId?: string) => {
    if (productId) {
      const productUrl = `/products/${productId}`;  // ❌ Missing locale, using ID
      // ...
    }
  },
  [editor, onImageInsert, locale]
);

// After
const insertImageAtCursor = useCallback(
  (url: string, slug?: string) => {
    if (slug) {
      const productUrl = `/${locale}/products/${slug}`;  // ✅ Locale-aware, using slug
      // ...
    }
  },
  [editor, onImageInsert, locale]
);
```

**Updated `handleProductImageSelect` function:**
```typescript
// Before
const handleProductImageSelect = useCallback(
  (url: string, productId?: string) => {
    insertImageAtCursor(url, productId);
    // ...
  },
  [insertImageAtCursor]
);

// After
const handleProductImageSelect = useCallback(
  (url: string, slug?: string) => {
    insertImageAtCursor(url, slug);
    // ...
  },
  [insertImageAtCursor]
);
```

### 3. RichTextEditor Component (`RichTextEditor.tsx`)

**Updated ImagePickerModal callback:**
```typescript
// Before
<ImagePickerModal
  onSelectImage={(imageUrl, product) => {
    handleProductImageSelect(imageUrl, product?.id);  // ❌ Using ID
  }}
/>

// After
<ImagePickerModal
  onSelectImage={(imageUrl, product) => {
    handleProductImageSelect(imageUrl, product?.slug);  // ✅ Using slug
  }}
/>
```

### 4. Documentation (`PRODUCT_IMAGE_LINK_TESTING.md`)

Updated all references from `productId` to `slug` and from `/products/[id]` to `/products/[slug]`.

## URL Format

### Before
```html
<!-- Missing locale prefix -->
<a href="/products/abc-123-def-456">
  <img src="..." width="300" />
</a>
```

### After
```html
<!-- Locale-aware with slug -->
<a href="/en/products/organic-green-tea">
  <img src="..." width="300" />
</a>

<a href="/vi/products/organic-green-tea">
  <img src="..." width="300" />
</a>
```

## Benefits

1. **SEO Friendly**: Slugs are human-readable and better for search engines
2. **Consistency**: Matches URL structure used throughout the application (ProductCard, CartItem, SearchBar, etc.)
3. **Locale Awareness**: Now properly includes locale prefix in URLs
4. **User Experience**: URLs are more meaningful and shareable

## Testing

All TypeScript diagnostics pass with no errors. The implementation:
- ✅ Uses product slugs for link generation
- ✅ Includes locale prefix in URLs (`/${locale}/products/${slug}`)
- ✅ Maintains backward compatibility (uploaded images still work as standalone)
- ✅ Follows existing patterns in the codebase

## Related Files

- `frontend/components/RichTextEditor/types.ts`
- `frontend/components/RichTextEditor/hooks/useImageInsertion.ts`
- `frontend/components/RichTextEditor/RichTextEditor.tsx`
- `frontend/components/RichTextEditor/PRODUCT_IMAGE_LINK_TESTING.md`

## Spec Updates

The following spec documents were also updated to reflect this change:
- `.kiro/specs/quilljs-rich-text-editor/requirements.md`
- `.kiro/specs/quilljs-rich-text-editor/design.md`
- `.kiro/specs/quilljs-rich-text-editor/tasks.md`
