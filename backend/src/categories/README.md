# Categories Module

This module implements the category management system for the e-commerce platform.

## Features

### Backend (NestJS)

- **Category Entity**: Bilingual support (English and Vietnamese) with hierarchical structure
- **CRUD Operations**: Full create, read, update, and delete functionality
- **Hierarchical Categories**: Support for parent-child relationships
- **Tree Structure**: Returns categories in a nested tree format
- **Validation**: Prevents circular references and validates parent-child relationships
- **Product Count**: Includes product count for each category
- **Admin Protection**: Admin-only endpoints for create, update, and delete operations

### API Endpoints

#### Public Endpoints
- `GET /categories` - Get all categories as a tree structure
- `GET /categories/:id` - Get a single category by ID
- `GET /categories/slug/:slug` - Get a category by slug

#### Admin Endpoints (Requires ADMIN role)
- `POST /categories` - Create a new category
- `PATCH /categories/:id` - Update a category
- `DELETE /categories/:id` - Delete a category

### Frontend (Next.js)

- **CategoryNav Component**: Dropdown navigation menu with subcategories
- **Category Page**: Display category information and products
- **Breadcrumb Component**: Navigation breadcrumbs for better UX
- **Header Component**: Main header with category navigation
- **Bilingual Support**: Displays content based on selected locale (vi/en)
- **Responsive Design**: Mobile-friendly navigation

## Usage

### Creating a Category

```typescript
POST /categories
{
  "slug": "handmade-jewelry",
  "nameEn": "Handmade Jewelry",
  "nameVi": "Trang sức thủ công",
  "descriptionEn": "Beautiful handcrafted jewelry pieces",
  "descriptionVi": "Những món trang sức thủ công đẹp mắt",
  "displayOrder": 1,
  "isActive": true
}
```

### Creating a Subcategory

```typescript
POST /categories
{
  "slug": "necklaces",
  "nameEn": "Necklaces",
  "nameVi": "Dây chuyền",
  "parentId": "parent-category-id",
  "displayOrder": 1,
  "isActive": true
}
```

## Requirements Satisfied

- **Requirement 1.2**: Categories organize products hierarchically
- **Requirement 1.3**: Category navigation allows browsing by category
- **Requirement 6.1**: Category entity with bilingual fields
- **Requirement 7.1**: Admin can manage categories through CRUD operations

## Next Steps

- Task 7: Implement product catalog with category filtering
- Add category images
- Implement category search
- Add category analytics
