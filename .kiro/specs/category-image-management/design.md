# Design Document

## Overview

This feature redesigns the category image management workflow to eliminate direct image uploads during category creation and instead leverage existing product images when updating categories. The design focuses on simplifying the category creation process while ensuring that category imagery is sourced from the product catalog, promoting consistency and reducing storage redundancy.

The implementation involves modifications to both backend DTOs/validation and frontend UI components, introducing a new product image selector component for the update category form.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  CreateCategoryForm  │  UpdateCategoryForm                  │
│  (No image field)    │  (Product Image Selector)            │
└──────────────┬───────────────────┬──────────────────────────┘
               │                   │
               │ API Calls         │ API Calls
               │                   │
┌──────────────▼───────────────────▼──────────────────────────┐
│                     Backend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  CategoriesController                                       │
│    ├─ POST /categories (no imageUrl)                       │
│    └─ PATCH /categories/:id (optional imageUrl)            │
│                                                             │
│  CreateCategoryDto (imageUrl removed)                       │
│  UpdateCategoryDto (imageUrl optional, validated)           │
│                                                             │
│  CategoriesService                                          │
│    └─ validateProductImageUrl()                            │
└─────────────────────────────────────────────────────────────┘
               │
               │ Database Access
               │
┌──────────────▼──────────────────────────────────────────────┐
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Category Table (imageUrl nullable)                         │
│  ProductImage Table (source of valid images)                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Create Category Flow**:
   - Admin fills out category form (no image field)
   - Frontend sends POST request without imageUrl
   - Backend validates and creates category with null imageUrl
   - Category saved to database

2. **Update Category Flow**:
   - Admin opens update form
   - Frontend fetches all product images
   - Admin selects image from product catalog
   - Frontend sends PATCH request with selected imageUrl
   - Backend validates imageUrl exists in product images
   - Category updated with new imageUrl

## Components and Interfaces

### Backend Components

#### 1. CreateCategoryDto (Modified)

```typescript
export class CreateCategoryDto {
  @IsString()
  slug: string;

  @IsString()
  nameEn: string;

  @IsString()
  nameVi: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  // imageUrl field REMOVED

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

#### 2. UpdateCategoryDto (Modified)

```typescript
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;
}
```

#### 3. CategoriesService (Enhanced)

New method to validate product image URLs:

```typescript
async validateProductImageUrl(imageUrl: string): Promise<boolean> {
  const image = await this.prisma.productImage.findFirst({
    where: { url: imageUrl }
  });
  return !!image;
}
```

Modified update method to include validation:

```typescript
async update(id: string, updateCategoryDto: UpdateCategoryDto) {
  // ... existing validation ...

  // Validate imageUrl if provided
  if (updateCategoryDto.imageUrl) {
    const isValid = await this.validateProductImageUrl(updateCategoryDto.imageUrl);
    if (!isValid) {
      throw new BadRequestException('Invalid image URL. Must reference an existing product image.');
    }
  }

  // ... rest of update logic ...
}
```

#### 4. CategoriesController (Modified)

Add new endpoint to fetch product images:

```typescript
@Get('product-images')
async getProductImages() {
  return this.categoriesService.getAvailableProductImages();
}
```

### Frontend Components

#### 1. ProductImageSelector Component

New component for selecting product images:

```typescript
interface ProductImageSelectorProps {
  selectedImageUrl: string | null;
  onImageSelect: (imageUrl: string) => void;
  onImageClear: () => void;
  locale: string;
}

export default function ProductImageSelector({
  selectedImageUrl,
  onImageSelect,
  onImageClear,
  locale
}: ProductImageSelectorProps) {
  // Fetches all product images
  // Displays in grid layout
  // Handles selection and clearing
}
```

#### 2. CategoryForm Component (Modified)

- Remove image upload field from create mode
- Add ProductImageSelector in edit mode
- Update form submission logic

### API Endpoints

#### New Endpoint

```
GET /categories/product-images
Response: {
  images: Array<{
    id: string;
    url: string;
    productId: string;
    productNameEn: string;
    productNameVi: string;
    altTextEn?: string;
    altTextVi?: string;
  }>
}
```

#### Modified Endpoints

```
POST /categories
Body: CreateCategoryDto (without imageUrl)
Response: Category

PATCH /categories/:id
Body: UpdateCategoryDto (with optional imageUrl)
Response: Category
```

## Data Models

### Category Model (Existing - No Changes)

```prisma
model Category {
  id              String    @id @default(uuid())
  slug            String    @unique
  nameEn          String
  nameVi          String
  descriptionEn   String?
  descriptionVi   String?
  parentId        String?
  imageUrl        String?   // Nullable - can be null or reference product image
  displayOrder    Int       @default(0)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  parent          Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[] @relation("CategoryHierarchy")
  products        Product[]
}
```

### ProductImage Model (Existing - Reference Only)

```prisma
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
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, the following redundancies were identified:

- **Property 1.3 and 4.3 are identical**: Both test that the create endpoint rejects imageUrl fields. These will be combined into a single property.
- **Property 4.4 and 4.5 can be combined**: Both test validation of imageUrl in update requests - one for valid URLs, one for invalid. These can be combined into a comprehensive validation property.

The remaining properties provide unique validation value and will be retained.

Property 1: Category creation accepts requests without imageUrl
*For any* valid category data without an imageUrl field, submitting it to the create endpoint should result in a successful category creation
**Validates: Requirements 1.2**

Property 2: Category creation rejects requests with imageUrl
*For any* category data that includes an imageUrl field, submitting it to the create endpoint should result in a validation error
**Validates: Requirements 1.3, 4.3**

Property 3: Created categories have null imageUrl
*For any* successfully created category, querying the database should return a record with null or empty imageUrl value
**Validates: Requirements 1.4**

Property 4: Image selector displays all product images
*For any* set of product images in the database, loading the image selector should display all unique images without duplicates
**Validates: Requirements 2.2, 3.2**

Property 5: Image selection updates form state
*For any* product image selected in the selector, the form state should be updated to reference that image's URL
**Validates: Requirements 2.3**

Property 6: Category update persists imageUrl
*For any* valid category update with an imageUrl, the database record should be updated to store that imageUrl
**Validates: Requirements 2.4**

Property 7: Product metadata displayed with images
*For any* product image displayed in the selector, the product name should be included in the rendered output
**Validates: Requirements 3.3**

Property 8: ImageUrl validation in updates
*For any* imageUrl provided to the update endpoint, the system should accept it if and only if it references an existing product image, otherwise returning a validation error
**Validates: Requirements 4.4, 4.5**

Property 9: Clearing image sets null imageUrl
*For any* category update where the image is cleared, saving should result in the database record having a null or empty imageUrl value
**Validates: Requirements 5.3**

## Error Handling

### Backend Error Scenarios

1. **Invalid ImageUrl in Update Request**
   - Error Type: `BadRequestException`
   - HTTP Status: 400
   - Message: "Invalid image URL. Must reference an existing product image."
   - Trigger: UpdateCategoryDto contains imageUrl that doesn't exist in ProductImage table

2. **ImageUrl Provided in Create Request**
   - Error Type: `BadRequestException`
   - HTTP Status: 400
   - Message: "imageUrl field is not allowed when creating categories"
   - Trigger: CreateCategoryDto contains imageUrl field

3. **Product Images Fetch Failure**
   - Error Type: `InternalServerErrorException`
   - HTTP Status: 500
   - Message: "Failed to fetch product images"
   - Trigger: Database query failure when fetching product images

### Frontend Error Scenarios

1. **Image Selector Load Failure**
   - Display: Error message in selector component
   - Message: "Unable to load product images. Please try again."
   - Action: Provide retry button

2. **Category Update Failure**
   - Display: Alert/toast notification
   - Message: "Failed to update category. Please verify the selected image and try again."
   - Action: Keep form data, allow user to retry

3. **Network Timeout**
   - Display: Loading state with timeout message
   - Message: "Request is taking longer than expected..."
   - Action: Allow user to cancel or continue waiting

## Testing Strategy

### Unit Testing

#### Backend Unit Tests

1. **CreateCategoryDto Validation**
   - Test that DTO rejects imageUrl field
   - Test that all other required fields are validated correctly

2. **UpdateCategoryDto Validation**
   - Test that imageUrl is optional
   - Test that imageUrl must be a valid URL format

3. **CategoriesService.validateProductImageUrl()**
   - Test with valid product image URL (should return true)
   - Test with invalid URL (should return false)
   - Test with null/undefined (should return false)

4. **CategoriesService.update()**
   - Test successful update with valid imageUrl
   - Test rejection of invalid imageUrl
   - Test successful update with null imageUrl (clearing image)

5. **CategoriesService.getAvailableProductImages()**
   - Test returns all product images
   - Test deduplication of image URLs
   - Test includes product metadata

#### Frontend Unit Tests

1. **ProductImageSelector Component**
   - Test renders grid of images
   - Test handles image selection
   - Test handles image clearing
   - Test displays empty state when no images
   - Test displays product names with images

2. **CategoryForm Component (Create Mode)**
   - Test does not render image upload field
   - Test submits without imageUrl
   - Test successful category creation

3. **CategoryForm Component (Edit Mode)**
   - Test renders ProductImageSelector
   - Test displays current image if exists
   - Test updates imageUrl on selection
   - Test clears imageUrl when cleared
   - Test submits with updated imageUrl

### Property-Based Testing

The property-based testing approach will use **fast-check** for TypeScript/JavaScript. Each property test should run a minimum of 100 iterations.

#### Backend Property Tests

1. **Property 1: Category creation accepts requests without imageUrl**
   - Generator: Random valid category data (slug, names, descriptions, etc.) without imageUrl
   - Test: POST to /categories should return 201 with created category
   - Tag: **Feature: category-image-management, Property 1: Category creation accepts requests without imageUrl**

2. **Property 2: Category creation rejects requests with imageUrl**
   - Generator: Random valid category data with imageUrl field added
   - Test: POST to /categories should return 400 with validation error
   - Tag: **Feature: category-image-management, Property 2: Category creation rejects requests with imageUrl**

3. **Property 3: Created categories have null imageUrl**
   - Generator: Random valid category data without imageUrl
   - Test: After creation, database query should show null/empty imageUrl
   - Tag: **Feature: category-image-management, Property 3: Created categories have null imageUrl**

4. **Property 4: Image selector displays all product images**
   - Generator: Random set of products with images (including some duplicates)
   - Test: Fetching product images should return all unique images
   - Tag: **Feature: category-image-management, Property 4: Image selector displays all product images**

5. **Property 6: Category update persists imageUrl**
   - Generator: Random existing category and valid product image URL
   - Test: PATCH to /categories/:id should update database with imageUrl
   - Tag: **Feature: category-image-management, Property 6: Category update persists imageUrl**

6. **Property 8: ImageUrl validation in updates**
   - Generator: Random imageUrls (mix of valid product image URLs and invalid URLs)
   - Test: Valid URLs should be accepted (200), invalid should be rejected (400)
   - Tag: **Feature: category-image-management, Property 8: ImageUrl validation in updates**

7. **Property 9: Clearing image sets null imageUrl**
   - Generator: Random existing category with imageUrl
   - Test: PATCH with null/empty imageUrl should update database to null
   - Tag: **Feature: category-image-management, Property 9: Clearing image sets null imageUrl**

#### Frontend Property Tests

1. **Property 5: Image selection updates form state**
   - Generator: Random product image from available images
   - Test: Selecting image should update form state with that imageUrl
   - Tag: **Feature: category-image-management, Property 5: Image selection updates form state**

2. **Property 7: Product metadata displayed with images**
   - Generator: Random product images with associated product data
   - Test: Rendered selector should contain product names for all images
   - Tag: **Feature: category-image-management, Property 7: Product metadata displayed with images**

### Integration Testing

1. **End-to-End Category Creation Flow**
   - Create category without image
   - Verify category exists in database with null imageUrl
   - Verify category displays correctly in admin list

2. **End-to-End Category Update Flow**
   - Create category without image
   - Update category with product image selection
   - Verify imageUrl is persisted
   - Verify image displays in category list

3. **End-to-End Image Clearing Flow**
   - Create category and assign image
   - Clear image from category
   - Verify imageUrl is null in database
   - Verify no image displays in category list

## Implementation Notes

### Backend Implementation

1. **DTO Modification Strategy**
   - Remove `imageUrl` field from `CreateCategoryDto`
   - Keep `imageUrl` as optional in `UpdateCategoryDto`
   - Add custom validation decorator if needed for URL validation

2. **Service Layer Changes**
   - Add `getAvailableProductImages()` method to fetch all product images with metadata
   - Add `validateProductImageUrl()` method for validation
   - Modify `update()` method to include imageUrl validation
   - Ensure proper error messages for validation failures

3. **Controller Changes**
   - Add new GET endpoint for product images
   - Ensure create endpoint properly rejects imageUrl
   - Update endpoint should handle imageUrl validation

### Frontend Implementation

1. **Component Structure**
   - Create new `ProductImageSelector` component as a reusable module
   - Modify `CategoryForm` to conditionally render based on create/edit mode
   - Use React state management for image selection

2. **API Integration**
   - Add new API client method for fetching product images
   - Update category API methods to handle new validation

3. **User Experience**
   - Show loading state while fetching images
   - Display clear visual feedback for selected image
   - Provide easy way to clear selection
   - Show appropriate empty states

### Database Considerations

- No schema changes required (imageUrl already nullable)
- Existing categories with images will continue to work
- Consider adding database constraint to validate imageUrl references ProductImage table (optional enhancement)

### Backward Compatibility

- Existing categories with imageUrl values will continue to display correctly
- No data migration required
- API changes are additive (new endpoint) and restrictive (validation), not breaking for existing valid data
