# Design Document

## Overview

This design enhances the existing product image management system to provide a complete, user-friendly experience for handling multiple product images. The system already has the database schema and basic API endpoints in place, but needs improvements in the product creation flow, image reordering UI, and frontend gallery display.

The design focuses on three main areas:
1. **Backend**: Enhance the product creation endpoint to accept multiple images atomically
2. **Frontend Admin**: Improve the ProductForm component with drag-and-drop reordering and better image management
3. **Frontend Customer**: Create an image gallery component for product detail pages

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├──────────────────────┬──────────────────────────────────────┤
│   Admin Interface    │      Customer Interface              │
│                      │                                       │
│  - ProductForm       │  - ProductImageGallery               │
│  - ImageUploader     │  - ProductCard (with primary image)  │
│  - ImageReorder      │                                       │
└──────────────────────┴──────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (NestJS)                        │
├─────────────────────────────────────────────────────────────┤
│  ProductsController                                          │
│  - POST /products (with images)                              │
│  - POST /products/:id/images                                 │
│  - PATCH /products/:id/images/:imageId                       │
│  - DELETE /products/:id/images/:imageId                      │
│  - PATCH /products/:id/images/reorder                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Services Layer                                  │
├─────────────────────────────────────────────────────────────┤
│  ProductsService          ProductsImageService               │
│  - Product CRUD           - Image upload & processing        │
│  - Validation             - Thumbnail generation             │
│                           - Display order management         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM                                                  │
│  - Product model                                             │
│  - ProductImage model (1:many relationship)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. ProductsController Enhancement

**New Endpoint:**
```typescript
POST /products (multipart/form-data)
- Accepts product data + multiple image files
- Creates product and all images atomically
- Returns complete product with images
```

**New Endpoint:**
```typescript
PATCH /products/:id/images/reorder
- Accepts array of {imageId, displayOrder}
- Updates all display orders in a transaction
- Returns updated images
```

#### 2. ProductsService Enhancement

**Method: createWithImages**
```typescript
async createWithImages(
  createProductDto: CreateProductDto,
  files: Express.Multer.File[]
): Promise<Product>
```
- Validates product data
- Creates product record
- Processes all images in parallel
- Rolls back on failure
- Returns product with images

#### 3. ProductsImageService Enhancement

**Method: uploadMultipleImages**
```typescript
async uploadMultipleImages(
  productId: string,
  files: Express.Multer.File[],
  startOrder: number = 0
): Promise<ProductImage[]>
```
- Processes multiple files in parallel
- Generates thumbnails for each
- Assigns sequential display orders
- Returns array of created images

**Method: reorderImages**
```typescript
async reorderImages(
  productId: string,
  orderMap: Array<{imageId: string, displayOrder: number}>
): Promise<ProductImage[]>
```
- Updates display orders in transaction
- Validates all images belong to product
- Returns updated images in new order

**Method: normalizeDisplayOrder**
```typescript
private async normalizeDisplayOrder(productId: string): Promise<void>
```
- Called after deletion
- Ensures display orders are sequential (0, 1, 2, ...)
- No gaps in sequence

### Frontend Components

#### 1. ProductForm Enhancement

**New Sub-component: ImageManager**
```typescript
interface ImageManagerProps {
  productId?: string;
  existingImages: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  locale: string;
}
```

Features:
- Drag-and-drop file upload
- Image preview grid
- Drag-to-reorder functionality
- Delete individual images
- Edit alt text inline
- Visual indicator for primary image

#### 2. New Component: ProductImageGallery

```typescript
interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  locale: string;
}
```

Features:
- Main image display
- Thumbnail navigation
- Keyboard navigation (arrow keys)
- Touch/swipe support for mobile
- Zoom on click (optional)
- Responsive layout

#### 3. ProductCard Enhancement

Update to show primary image with optional hover effect to show second image.

## Data Models

### Existing Models (No Changes Required)

```prisma
model Product {
  id                String         @id @default(uuid())
  slug              String         @unique
  sku               String         @unique
  nameEn            String
  nameVi            String
  descriptionEn     String
  descriptionVi     String
  price             Decimal        @db.Decimal(10, 2)
  // ... other fields
  images            ProductImage[]
}

model ProductImage {
  id            String   @id @default(uuid())
  productId     String
  url           String
  altTextEn     String?
  altTextVi     String?
  displayOrder  Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([productId, displayOrder])
}
```

### DTOs

**CreateProductWithImagesDto**
```typescript
export class CreateProductWithImagesDto extends CreateProductDto {
  // Inherits all product fields
  // Images handled separately via multipart form data
}
```

**ReorderImagesDto**
```typescript
export class ReorderImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrderItem)
  images: ImageOrderItem[];
}

class ImageOrderItem {
  @IsString()
  @IsNotEmpty()
  imageId: string;

  @IsInt()
  @Min(0)
  displayOrder: number;
}
```

**UpdateProductImageDto**
```typescript
export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  altTextEn?: string;

  @IsOptional()
  @IsString()
  altTextVi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Multiple image upload acceptance
*For any* set of valid image files, when uploaded together during product creation, the system should accept and process all files without rejection.
**Validates: Requirements 1.1**

### Property 2: Unique identifiers for uploaded images
*For any* set of uploaded images, each image should have a unique identifier and unique URL in the database.
**Validates: Requirements 1.2**

### Property 3: Sequential display order assignment
*For any* set of images uploaded together, the system should assign display order values as a sequential sequence starting from 0 (i.e., 0, 1, 2, ..., n-1 for n images).
**Validates: Requirements 1.3**

### Property 4: Product-image persistence round trip
*For any* product created with a set of images, retrieving that product should return all the same images linked to it.
**Validates: Requirements 1.4**

### Property 5: Partial upload failure reporting
*For any* upload containing both valid and invalid image files, the system should process all valid files successfully and report specific errors for each invalid file.
**Validates: Requirements 1.5**

### Property 6: Display order preservation on retrieval
*For any* product with images, retrieving the product's images should return them sorted by display order in ascending sequence.
**Validates: Requirements 2.1**

### Property 7: Reorder operation correctness
*For any* product with images and any valid reordering operation, the resulting display orders should match the requested new positions.
**Validates: Requirements 2.2**

### Property 8: Reorder persistence
*For any* reorder operation, immediately querying the images after the operation should return them in the new order.
**Validates: Requirements 2.3**

### Property 9: Sequential display order invariant
*For any* product after any reorder operation, the display orders should form a sequential sequence starting from 0 with no gaps.
**Validates: Requirements 2.5**

### Property 10: Image deletion removes from product
*For any* product with images, deleting a specific image should result in that image no longer appearing in the product's image list.
**Validates: Requirements 3.1**

### Property 11: File cleanup on deletion
*For any* image deletion, the corresponding image file and thumbnail should be removed from the file system.
**Validates: Requirements 3.2**

### Property 12: Display order normalization after deletion
*For any* product after deleting an image, the remaining images should have sequential display orders starting from 0.
**Validates: Requirements 3.3**

### Property 13: State consistency on deletion failure
*For any* image deletion that fails, the product's image list and file system should remain unchanged from the pre-deletion state.
**Validates: Requirements 3.5**

### Property 14: Complete image retrieval
*For any* product, retrieving it for editing should return all images associated with that product.
**Validates: Requirements 4.1**

### Property 15: Appending new images preserves order
*For any* product with existing images, adding new images should result in the new images appearing after all existing images in display order.
**Validates: Requirements 4.2**

### Property 16: Display order continuation
*For any* product with existing images, newly added images should have display orders starting from max(existing display orders) + 1.
**Validates: Requirements 4.3**

### Property 17: Alt text round trip
*For any* image uploaded with alt text in English and Vietnamese, retrieving that image should return the same alt text values.
**Validates: Requirements 5.2**

### Property 18: Default alt text application
*For any* image uploaded without alt text, the system should use the product name as the default alt text for both languages.
**Validates: Requirements 5.3**

### Property 19: Language-appropriate alt text rendering
*For any* image displayed in a specific language context, the rendered HTML should include the alt text for that language.
**Validates: Requirements 5.4**

### Property 20: Alt text update persistence
*For any* existing image, updating its alt text should result in the new alt text being stored and retrieved correctly.
**Validates: Requirements 5.5**

### Property 21: Ordered image display
*For any* product viewed by a customer, the images should be displayed in ascending display order.
**Validates: Requirements 6.1**

### Property 22: Primary image selection
*For any* product with multiple images, the primary image should be the one with the lowest display order (typically 0).
**Validates: Requirements 7.1, 7.2**

### Property 23: File type and size validation
*For any* uploaded file, the system should validate that it is an allowed image type (JPEG, PNG, WebP) and under the size limit (5MB) before processing.
**Validates: Requirements 8.2**

### Property 24: Validation error reporting
*For any* invalid file upload (wrong type or too large), the system should reject it with a specific error message indicating the validation failure.
**Validates: Requirements 8.3**

### Property 25: Thumbnail generation
*For any* successfully uploaded image, the system should generate a thumbnail version with dimensions not exceeding 300x300 pixels.
**Validates: Requirements 8.4**

### Property 26: Complete URL response
*For any* successful multi-image upload, the API response should include valid URLs for all uploaded images.
**Validates: Requirements 8.5**

## Error Handling

### Backend Error Scenarios

1. **Invalid File Type**
   - Validation: Check MIME type against whitelist
   - Response: 400 Bad Request with specific file name and error
   - Action: Reject file, continue with valid files

2. **File Size Exceeded**
   - Validation: Check file size before processing
   - Response: 400 Bad Request with file name and size limit
   - Action: Reject file, continue with valid files

3. **Product Not Found**
   - Validation: Check product exists before image operations
   - Response: 404 Not Found
   - Action: Abort operation

4. **Image Not Found**
   - Validation: Check image exists and belongs to product
   - Response: 404 Not Found
   - Action: Abort operation

5. **Storage Failure**
   - Detection: Catch file system errors
   - Response: 500 Internal Server Error
   - Action: Rollback database changes, cleanup partial files

6. **Database Transaction Failure**
   - Detection: Catch Prisma errors
   - Response: 500 Internal Server Error
   - Action: Rollback transaction, cleanup uploaded files

7. **Invalid Display Order**
   - Validation: Check display order is non-negative integer
   - Response: 400 Bad Request
   - Action: Reject operation

### Frontend Error Scenarios

1. **Upload Failure**
   - Detection: API error response
   - Display: Toast notification with error message
   - Action: Allow retry, maintain form state

2. **Network Error**
   - Detection: Network timeout or connection failure
   - Display: User-friendly error message
   - Action: Provide retry button

3. **File Selection Error**
   - Detection: Invalid file type selected
   - Display: Inline validation message
   - Action: Prevent upload, show allowed types

4. **Deletion Confirmation**
   - Trigger: User clicks delete
   - Display: Confirmation modal
   - Action: Only delete on explicit confirmation

5. **Reorder Failure**
   - Detection: API error during reorder
   - Display: Error message
   - Action: Revert to previous order in UI

## Testing Strategy

### Unit Testing

**Backend Unit Tests:**
- ProductsImageService.uploadProductImage: Test single image upload with valid/invalid files
- ProductsImageService.uploadMultipleImages: Test batch upload with mixed valid/invalid files
- ProductsImageService.deleteProductImage: Test deletion and file cleanup
- ProductsImageService.reorderImages: Test reordering logic
- ProductsImageService.normalizeDisplayOrder: Test display order normalization after deletion
- ProductsController image endpoints: Test request validation and response formatting

**Frontend Unit Tests:**
- ImageManager component: Test file selection, preview, and state management
- ProductImageGallery component: Test image navigation and display
- ProductCard component: Test primary image selection
- Image upload utility functions: Test FormData construction

### Property-Based Testing

Property-based tests will use **fast-check** for TypeScript/JavaScript to verify the correctness properties defined above. Each test should run a minimum of 100 iterations with randomly generated inputs.

**Backend Property Tests:**
- Test Properties 1-5: Multi-image upload behavior
- Test Properties 6-9: Image reordering behavior
- Test Properties 10-13: Image deletion behavior
- Test Properties 14-16: Adding images to existing products
- Test Properties 17-20: Alt text handling
- Test Properties 23-26: Validation and processing

**Frontend Property Tests:**
- Test Property 21: Image display ordering
- Test Property 22: Primary image selection
- Test Property 19: Alt text rendering

### Integration Testing

**End-to-End Scenarios:**
1. Create product with multiple images → Verify all images stored and retrievable
2. Edit product → Add more images → Verify appended correctly
3. Reorder images → Verify new order persists
4. Delete images → Verify cleanup and order normalization
5. Create product → Delete all images → Verify product still exists
6. Upload mix of valid/invalid files → Verify partial success handling

**API Integration Tests:**
- Test complete product creation flow with images
- Test image CRUD operations on existing products
- Test concurrent image operations
- Test transaction rollback on failures

### Manual Testing Checklist

**Admin Interface:**
- [ ] Drag and drop multiple images to upload
- [ ] Reorder images by dragging
- [ ] Delete images with confirmation
- [ ] Edit alt text inline
- [ ] Create product with 0, 1, 5, 10 images
- [ ] Test on mobile viewport

**Customer Interface:**
- [ ] View product with multiple images
- [ ] Navigate through image gallery
- [ ] Test keyboard navigation
- [ ] Test touch/swipe on mobile
- [ ] Verify primary image in listings
- [ ] Test with slow network (image loading)

## Performance Considerations

1. **Parallel Image Processing**: Upload and process multiple images concurrently to reduce total upload time
2. **Thumbnail Generation**: Generate thumbnails asynchronously to avoid blocking the response
3. **Image Optimization**: Use Sharp library to optimize images (resize, compress) before storage
4. **Lazy Loading**: Load images on-demand in the gallery to improve initial page load
5. **Caching**: Cache product images in CDN or browser cache with appropriate headers
6. **Database Indexing**: Existing index on (productId, displayOrder) ensures fast ordered retrieval

## Security Considerations

1. **File Type Validation**: Strictly validate MIME types and file extensions
2. **File Size Limits**: Enforce 5MB limit per file to prevent DoS
3. **Path Traversal Prevention**: Sanitize filenames and use UUIDs for storage
4. **Authentication**: All image management endpoints require admin authentication
5. **Authorization**: Verify product ownership/permissions before operations
6. **Input Sanitization**: Sanitize alt text and other user inputs to prevent XSS
7. **Rate Limiting**: Apply rate limits to upload endpoints to prevent abuse

## Implementation Notes

1. **Atomic Product Creation**: When creating a product with images, use a database transaction to ensure atomicity
2. **File Cleanup**: Always cleanup uploaded files if database operations fail
3. **Display Order Management**: Maintain display order as a sequential sequence (0, 1, 2, ...) with no gaps
4. **Backward Compatibility**: Existing products without images should continue to work
5. **Migration**: No database migration needed as schema already supports multiple images
6. **Image Formats**: Support JPEG, PNG, and WebP formats
7. **Responsive Images**: Consider generating multiple sizes for responsive display (future enhancement)
