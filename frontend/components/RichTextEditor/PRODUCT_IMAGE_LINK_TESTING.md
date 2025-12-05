# Product Image Link Testing

## Implementation Summary

Product images inserted from the Product Image Picker are now automatically wrapped in clickable links that navigate to the product page.

## How It Works

### 1. Product Image Selection
- When a user selects an image from the Product Image Picker modal
- The modal passes both the image URL and the product slug to the handler
- The handler generates a locale-aware product URL: `/${locale}/products/${slug}`

### 2. Image Insertion
- **Product Images**: Inserted as `<a href="/${locale}/products/${slug}"><img src="${imageUrl}" width="300" /></a>`
- **Uploaded Images**: Inserted as standalone `<img src="${imageUrl}" width="300" />` (no link)

### 3. View Mode Behavior
- In read-only/preview mode, the links are clickable
- Clicking a product image navigates to the product detail page
- Links respect the current locale (English or Vietnamese)

### 4. Edit Mode Behavior
- In edit mode, links are visible but not clickable (standard Quill behavior)
- Users can still edit, resize, or delete the linked images
- Resize handles work on images within links

## Testing Checklist

### Manual Testing Steps

1. **Insert Product Image**
   - [ ] Open content form in admin panel
   - [ ] Click the image button in the editor toolbar
   - [ ] Select "From Products"
   - [ ] Choose a product image
   - [ ] Verify the image is inserted

2. **Verify Link Structure in Edit Mode**
   - [ ] Switch to preview mode
   - [ ] Inspect the HTML (browser dev tools)
   - [ ] Verify the image is wrapped in an `<a>` tag
   - [ ] Verify the href follows the pattern: `/en/products/[slug]` or `/vi/products/[slug]`

3. **Test Link Navigation in View Mode**
   - [ ] In preview mode, hover over the product image
   - [ ] Verify cursor changes to pointer (indicating clickable link)
   - [ ] Click the product image
   - [ ] Verify navigation to the product detail page
   - [ ] Verify the correct product is displayed

4. **Test Locale-Aware URLs**
   - [ ] Switch to Vietnamese tab
   - [ ] Insert a product image
   - [ ] Verify the link uses `/vi/products/[slug]`
   - [ ] Switch to English tab
   - [ ] Insert a product image
   - [ ] Verify the link uses `/en/products/[slug]`

5. **Test Uploaded Images (No Link)**
   - [ ] Click the image button
   - [ ] Select "Upload from Disk"
   - [ ] Upload an image file
   - [ ] Verify the image is inserted
   - [ ] Switch to preview mode
   - [ ] Verify the uploaded image is NOT wrapped in a link
   - [ ] Verify clicking the uploaded image does nothing

6. **Test Image Resizing with Links**
   - [ ] Insert a product image (with link)
   - [ ] Resize the image using the handles
   - [ ] Verify the resize works correctly
   - [ ] Switch to preview mode
   - [ ] Verify the resized image is still clickable
   - [ ] Verify the link still works after resizing

7. **Test Content Persistence**
   - [ ] Insert product images with links
   - [ ] Save the content
   - [ ] Reload the page
   - [ ] Verify the images are still wrapped in links
   - [ ] Verify the links still work

8. **Test Language Switching**
   - [ ] Insert product images in English content
   - [ ] Switch to Vietnamese tab
   - [ ] Insert product images in Vietnamese content
   - [ ] Switch back to English
   - [ ] Verify English images still have correct links
   - [ ] Switch to Vietnamese
   - [ ] Verify Vietnamese images still have correct links

## Expected Results

### Product Image HTML Structure
```html
<a href="/en/products/product-slug">
  <img src="https://example.com/product-image.jpg" width="300" />
</a>
```

### Uploaded Image HTML Structure
```html
<img src="https://example.com/uploaded-image.jpg" width="300" />
```

## Known Behaviors

1. **Edit Mode**: Links are not clickable in edit mode (standard Quill behavior)
2. **View Mode**: Links are fully functional and clickable
3. **Image Resizing**: Works correctly for both linked and standalone images
4. **Default Width**: All images (linked or not) get a default width of 300px

## Testing Status

- [x] Implementation complete
- [ ] Manual testing in progress
- [ ] All test cases passed
- [ ] Ready for production

## Notes

- Product images are automatically linked based on the presence of a product slug
- Uploaded images (from disk) are never linked
- Links use locale-aware URLs with product slugs for proper internationalization and SEO
- The implementation follows the existing Quill.js patterns and doesn't require custom modules
