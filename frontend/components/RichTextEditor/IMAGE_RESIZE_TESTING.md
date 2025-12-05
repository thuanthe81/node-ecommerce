# Image Resize Testing Guide

This document provides manual testing steps to verify the image resizing functionality in the RichTextEditor component.

## Requirements Tested

- **9.1**: Default image width of 300px on insertion
- **9.2**: Resize handles appear on inserted images
- **9.3**: Dragging handles updates dimensions in real-time
- **9.4**: Aspect ratio is maintained during resize
- **9.5**: Resized dimensions persist in HTML
- **9.6**: Content with resized images loads at saved dimensions

## Test Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin content management page
3. Create or edit a content item

## Test Cases

### Test 1: Default Image Width (Requirement 9.1)

**Steps:**
1. Click the image button in the toolbar
2. Select "From Products" or "Upload from Disk"
3. Insert an image into the editor

**Expected Result:**
- The inserted image should have a width of 300px
- Inspect the HTML: `<img src="..." width="300" />`

**Status:** ✅ Pass / ❌ Fail

---

### Test 2: Resize Handles Appear (Requirement 9.2)

**Steps:**
1. Insert an image into the editor (see Test 1)
2. Click on the inserted image

**Expected Result:**
- Resize handles should appear at the corners and edges of the image
- Handles should be visible as small blue squares
- Cursor should change to resize cursor when hovering over handles

**Status:** ✅ Pass / ❌ Fail

---

### Test 3: Real-time Dimension Updates (Requirement 9.3)

**Steps:**
1. Insert an image into the editor
2. Click on the image to show resize handles
3. Drag a corner handle to resize the image

**Expected Result:**
- Image dimensions should update in real-time as you drag
- A tooltip showing current dimensions (e.g., "300 x 200") should appear
- The image should smoothly resize during the drag operation

**Status:** ✅ Pass / ❌ Fail

---

### Test 4: Aspect Ratio Maintained (Requirement 9.4)

**Steps:**
1. Insert an image into the editor
2. Note the original aspect ratio
3. Drag a corner handle to resize the image

**Expected Result:**
- The aspect ratio should remain constant during resize
- If the original image is 300x200 (3:2 ratio), resizing should maintain this ratio
- The image should not appear stretched or distorted

**Status:** ✅ Pass / ❌ Fail

---

### Test 5: Dimensions Persist in HTML (Requirement 9.5)

**Steps:**
1. Insert an image into the editor
2. Resize the image to a different size (e.g., 400px wide)
3. Switch to preview mode or inspect the HTML output

**Expected Result:**
- The HTML should contain the resized dimensions
- Example: `<img src="..." width="400" height="267" />` or inline styles
- The dimensions should be saved in the content

**Status:** ✅ Pass / ❌ Fail

---

### Test 6: Resized Images Load Correctly (Requirement 9.6)

**Steps:**
1. Create content with a resized image (see Test 5)
2. Save the content
3. Reload the page or navigate away and back
4. Edit the same content item

**Expected Result:**
- The image should load at the saved dimensions
- The image should not revert to the default 300px width
- The resize handles should still work on the loaded image

**Status:** ✅ Pass / ❌ Fail

---

## Additional Tests

### Test 7: Multiple Images

**Steps:**
1. Insert multiple images into the editor
2. Resize each image to different sizes
3. Save and reload

**Expected Result:**
- Each image should maintain its individual size
- Resizing one image should not affect others

**Status:** ✅ Pass / ❌ Fail

---

### Test 8: Language Switching

**Steps:**
1. Insert and resize an image in English content
2. Switch to Vietnamese tab
3. Insert and resize a different image
4. Switch back to English tab

**Expected Result:**
- Each language's images should maintain their sizes independently
- Switching languages should not affect image dimensions

**Status:** ✅ Pass / ❌ Fail

---

### Test 9: Product Images vs Uploaded Images

**Steps:**
1. Insert an image from products and resize it
2. Upload an image from disk and resize it
3. Save the content

**Expected Result:**
- Both types of images should support resizing equally
- Both should maintain their resized dimensions after save

**Status:** ✅ Pass / ❌ Fail

---

## Known Issues

- The ImageResize module may not work in Jest test environment (expected)
- Browser compatibility: Works best in modern browsers (Chrome, Firefox, Safari, Edge)

## Browser Testing

Test in the following browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Testing

Test on mobile devices:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive mode in desktop browser

## Notes

- The ImageResize module uses the `quill-image-resize-module-react` package
- Resize handles are styled with blue color (#2563eb) to match the admin theme
- The module provides three sub-modules: Resize, DisplaySize, and Toolbar
