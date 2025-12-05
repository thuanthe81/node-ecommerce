# Implementation Verification: Product Slug in Image Links

## Quick Verification Steps

To verify the implementation is working correctly:

### 1. Start the Development Server
```bash
cd frontend
npm run dev
```

### 2. Navigate to Content Management
1. Open browser to `http://localhost:3000/en/admin/content`
2. Log in as admin
3. Create or edit a content item

### 3. Test Product Image Insertion
1. Click the image button in the rich text editor toolbar
2. Select "From Products"
3. Choose any product image
4. The image should be inserted

### 4. Verify the Link Structure
1. Toggle to preview mode
2. Right-click on the inserted product image
3. Select "Inspect Element" (or similar)
4. Verify the HTML structure:
   ```html
   <a href="/en/products/[product-slug]">
     <img src="[image-url]" width="300" />
   </a>
   ```

### 5. Test Link Navigation
1. In preview mode, click on the product image
2. Verify you are navigated to the product detail page
3. Verify the URL in the browser is `/en/products/[product-slug]`

### 6. Test Vietnamese Locale
1. Switch to Vietnamese tab
2. Insert a product image
3. Verify the link uses `/vi/products/[product-slug]`

## Expected Behavior

✅ **Product images** should be wrapped in links with format: `/${locale}/products/${slug}`
✅ **Uploaded images** should NOT be wrapped in links
✅ **Links should be clickable** in preview/read-only mode
✅ **Links should include locale** prefix (en or vi)
✅ **Slugs should be used** instead of IDs

## Common Issues

### Issue: Link uses ID instead of slug
**Solution**: Verify `product?.slug` is being passed in `RichTextEditor.tsx`

### Issue: Link missing locale prefix
**Solution**: Verify the URL is constructed as `/${locale}/products/${slug}` in `useImageInsertion.ts`

### Issue: Uploaded images have links
**Solution**: Verify that only images with a `slug` parameter get wrapped in links

## Code References

- **Type definitions**: `frontend/components/RichTextEditor/types.ts`
- **Link generation**: `frontend/components/RichTextEditor/hooks/useImageInsertion.ts` (line ~57)
- **Slug passing**: `frontend/components/RichTextEditor/RichTextEditor.tsx` (line ~143)

## Verification Checklist

- [ ] Product images are wrapped in `<a>` tags
- [ ] Links use product slug, not ID
- [ ] Links include locale prefix (`/en/` or `/vi/`)
- [ ] Uploaded images are NOT wrapped in links
- [ ] Links are clickable in preview mode
- [ ] Clicking links navigates to correct product page
- [ ] Both English and Vietnamese locales work correctly
