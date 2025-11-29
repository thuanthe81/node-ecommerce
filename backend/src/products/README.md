# Products Module

This module handles all product-related functionality including product catalog management, image uploads, and search capabilities.

## Features

### Product Management
- Create, read, update, and delete products
- Bilingual support (English and Vietnamese)
- Product categorization
- Stock management
- Featured products
- Price comparison (sale prices)

### Product Images
- Multiple images per product
- Image upload with validation (type, size)
- Automatic image resizing and thumbnail generation
- Image ordering
- Bilingual alt text support

### Search and Filtering
- Full-text search on product name, description, and SKU
- Filter by category
- Filter by price range
- Filter by stock availability
- Filter by featured status
- Sort by price, name, or creation date
- Pagination support

## API Endpoints

### Public Endpoints

#### Get Products (with filters)
```
GET /api/products
Query Parameters:
  - search: string (optional)
  - categoryId: string (optional)
  - minPrice: number (optional)
  - maxPrice: number (optional)
  - inStock: boolean (optional)
  - isFeatured: boolean (optional)
  - sortBy: 'price' | 'name' | 'createdAt' (optional, default: 'createdAt')
  - sortOrder: 'asc' | 'desc' (optional, default: 'desc')
  - page: number (optional, default: 1)
  - limit: number (optional, default: 20)

Response:
{
  data: Product[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

#### Get Product by Slug
```
GET /api/products/:slug

Response: Product with images, reviews, average rating, and related products
```

#### Search Products (Autocomplete)
```
GET /api/products/search?q=searchTerm&limit=10

Response: Product[]
```

### Admin Endpoints (Requires Authentication + ADMIN role)

#### Create Product
```
POST /api/products
Body: CreateProductDto

Response: Product
```

#### Update Product
```
PATCH /api/products/:id
Body: UpdateProductDto

Response: Product
```

#### Delete Product
```
DELETE /api/products/:id

Response: void
```

#### Upload Product Image
```
POST /api/products/:id/images
Content-Type: multipart/form-data
Body:
  - file: File (required)
  - altTextEn: string (optional)
  - altTextVi: string (optional)
  - displayOrder: number (optional)

Response: ProductImage
```

#### Get Product Images
```
GET /api/products/:id/images

Response: ProductImage[]
```

#### Update Image Order
```
PATCH /api/products/:id/images/:imageId
Body: { displayOrder: number }

Response: ProductImage
```

#### Delete Product Image
```
DELETE /api/products/:id/images/:imageId

Response: { message: string }
```

## Data Models

### Product
```typescript
{
  id: string
  slug: string
  sku: string
  nameEn: string
  nameVi: string
  descriptionEn: string
  descriptionVi: string
  price: number
  compareAtPrice?: number
  costPrice?: number
  stockQuantity: number
  lowStockThreshold: number
  weight?: number
  length?: number
  width?: number
  height?: number
  categoryId: string
  isActive: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}
```

### ProductImage
```typescript
{
  id: string
  productId: string
  url: string
  altTextEn?: string
  altTextVi?: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}
```

## Image Upload Configuration

- **Allowed formats**: JPEG, PNG, WebP
- **Max file size**: 5MB
- **Image processing**:
  - Main image: Resized to max 1200x1200px (maintains aspect ratio)
  - Thumbnail: Resized to 300x300px (cropped to fit)
  - Format: Converted to JPEG for consistency
- **Storage**: Hierarchical structure at `uploads/products/[product-id]/`
- **Access**: Served via static file middleware at `/uploads/products/`

**Note:** See [Image Storage API Documentation](./IMAGE_STORAGE_API.md) for detailed information about the storage structure, migration process, and cleanup utilities.

## Validation Rules

### Product Creation/Update
- `slug`: Required, unique, string
- `sku`: Required, unique, string
- `nameEn`: Required, string
- `nameVi`: Required, string
- `descriptionEn`: Required, string
- `descriptionVi`: Required, string
- `price`: Required, number, min: 0
- `compareAtPrice`: Optional, number, min: 0
- `costPrice`: Optional, number, min: 0
- `stockQuantity`: Required, integer, min: 0
- `lowStockThreshold`: Optional, integer, min: 0, default: 10
- `categoryId`: Required, valid UUID, must exist
- `isActive`: Optional, boolean, default: true
- `isFeatured`: Optional, boolean, default: false

## Business Logic

### Product Deletion
- Products with existing orders cannot be deleted (soft delete by setting `isActive: false` recommended)
- Products in carts are automatically removed when product is deleted
- All product images are deleted when product is deleted

### Related Products
- When fetching a product by slug, the API returns up to 4 related products from the same category
- Related products are sorted by creation date (newest first)

### Average Rating
- Calculated from approved reviews only
- Returned with product detail endpoint

## Dependencies

- `@nestjs/common`: Core NestJS functionality
- `@nestjs/platform-express`: Express platform for file uploads
- `@prisma/client`: Database ORM
- `class-validator`: DTO validation
- `class-transformer`: DTO transformation
- `multer`: File upload handling
- `sharp`: Image processing and resizing

## Usage Example

### Creating a Product (Admin)
```typescript
const product = await productApi.createProduct({
  slug: 'handmade-ceramic-vase',
  sku: 'VASE-001',
  nameEn: 'Handmade Ceramic Vase',
  nameVi: 'Bình gốm thủ công',
  descriptionEn: 'Beautiful handcrafted ceramic vase',
  descriptionVi: 'Bình gốm thủ công đẹp mắt',
  price: 250000,
  compareAtPrice: 350000,
  stockQuantity: 10,
  categoryId: 'category-uuid',
  isActive: true,
  isFeatured: true,
});
```

### Uploading Product Image (Admin)
```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('altTextEn', 'Ceramic vase front view');
formData.append('altTextVi', 'Mặt trước bình gốm');

const image = await productApi.uploadProductImage(productId, formData);
```

### Searching Products (Public)
```typescript
const results = await productApi.getProducts({
  search: 'ceramic',
  categoryId: 'category-uuid',
  minPrice: 100000,
  maxPrice: 500000,
  inStock: true,
  sortBy: 'price',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
});
```
