# Blog Content Type Schema Changes

## Overview
This document describes the database schema changes made to support the blog content type feature.

## Migration Details
- **Migration Name**: `20251208012620_add_blog_content_type`
- **Date**: December 8, 2024

## Changes Made

### 1. ContentType Enum Extension
Added `BLOG` value to the existing `ContentType` enum:
```prisma
enum ContentType {
  PAGE
  FAQ
  BANNER
  HOMEPAGE_SECTION
  BLOG  // New
}
```

### 2. Content Model Extensions
Added three new optional fields to the `Content` model for blog-specific data:
- `authorName` (String?) - Name of the blog post author
- `excerptEn` (String?) - Short summary in English
- `excerptVi` (String?) - Short summary in Vietnamese

### 3. New BlogCategory Model
Created a new model to manage blog categories:
```prisma
model BlogCategory {
  id        String   @id @default(uuid())
  slug      String   @unique
  nameEn    String
  nameVi    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts BlogCategoryAssociation[]

  @@index([slug])
  @@map("blog_categories")
}
```

### 4. New BlogCategoryAssociation Model
Created a junction table for many-to-many relationship between blog posts and categories:
```prisma
model BlogCategoryAssociation {
  id         String   @id @default(uuid())
  contentId  String
  categoryId String
  createdAt  DateTime @default(now())

  content  Content      @relation(fields: [contentId], references: [id], onDelete: Cascade)
  category BlogCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([contentId, categoryId])
  @@index([contentId])
  @@index([categoryId])
  @@map("blog_category_associations")
}
```

### 5. New Composite Indexes
Added two composite indexes to the `Content` model for optimized blog queries:
- `[type, isPublished, displayOrder, publishedAt]` - For blog listing with sorting
- `[type, isPublished, slug]` - For blog post lookup by slug

## Database Tables Created
1. `blog_categories` - Stores blog category definitions
2. `blog_category_associations` - Junction table for blog post-category relationships

## Verification
The schema changes have been verified using the `verify-blog-schema.ts` script, which tests:
- BLOG content type availability
- Blog category creation
- Blog post creation with new fields
- Category association creation
- Querying blog posts with categories
- Composite index queries

All tests passed successfully.

## Backward Compatibility
- All new fields in the `Content` model are optional (nullable)
- Existing content types (PAGE, FAQ, BANNER, HOMEPAGE_SECTION) are unaffected
- No breaking changes to existing functionality

## Next Steps
The schema is now ready for:
1. Backend service implementation (BlogCategoryService, ContentService extensions)
2. API endpoint creation
3. Frontend component development
