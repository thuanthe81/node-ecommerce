# Design Document

## Overview

The blog content type feature extends the existing content management system to support blog posts. This design leverages the current Content model in Prisma by adding a new `BLOG` content type and introducing a new `BlogCategory` model for organizing posts. The implementation will reuse existing patterns for bilingual content, image management, and admin interfaces while adding blog-specific functionality like category management, related posts, and enhanced SEO.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Customer Pages          │  Admin Pages                      │
│  - Blog Listing          │  - Blog Post Management           │
│  - Blog Post Detail      │  - Category Management            │
│  - Category Filter       │  - Rich Text Editor               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                          │
├─────────────────────────────────────────────────────────────┤
│  Content Service         │  Blog Category Service            │
│  - CRUD operations       │  - Category CRUD                  │
│  - Related posts logic   │  - Tag management                 │
│  - SEO metadata          │                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────┤
│  Content (existing)      │  BlogCategory (new)               │
│  - Add BLOG type         │  - Category definitions           │
│  - Add author field      │  - Bilingual names                │
│  - Add excerpt fields    │                                   │
│  - Add categories array  │  BlogCategoryAssociation (new)    │
│                          │  - Many-to-many relationship      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Blog Post Creation Flow**:
   - Admin creates blog post via admin interface
   - Rich text editor handles content with embedded images
   - Content service validates and stores blog post
   - Categories are associated via junction table

2. **Blog Post Display Flow**:
   - Customer requests blog listing or detail page
   - Content service retrieves published blog posts
   - Related posts are calculated based on shared categories
   - Frontend renders with SEO metadata

## Components and Interfaces

### Backend Components

#### 1. Database Schema Extensions

**Content Model Updates** (extend existing):
```prisma
model Content {
  // ... existing fields ...

  // New fields for blog support
  authorName    String?
  excerptEn     String?
  excerptVi     String?

  // Relationships
  blogCategories BlogCategoryAssociation[]
}

enum ContentType {
  PAGE
  FAQ
  BANNER
  HOMEPAGE_SECTION
  BLOG  // New type
}
```

**New BlogCategory Model**:
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

model BlogCategoryAssociation {
  id         String   @id @default(uuid())
  contentId  String
  categoryId String
  createdAt  DateTime @default(now())

  content  Content       @relation(fields: [contentId], references: [id], onDelete: Cascade)
  category BlogCategory  @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([contentId, categoryId])
  @@index([contentId])
  @@index([categoryId])
  @@map("blog_category_associations")
}
```

#### 2. Content Service Extensions

**New Methods**:
```typescript
// Get blog posts with pagination and filtering
async findBlogPosts(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  published?: boolean;
}): Promise<PaginatedBlogPosts>

// Get single blog post with categories
async findBlogPostBySlug(slug: string): Promise<BlogPostWithCategories>

// Get related blog posts
async findRelatedPosts(postId: string, limit: number): Promise<Content[]>

// Validate blog post specific requirements
private validateBlogPost(contentDto: any): void
```

#### 3. Blog Category Service (New)

```typescript
@Injectable()
export class BlogCategoryService {
  // CRUD operations for categories
  async create(dto: CreateBlogCategoryDto): Promise<BlogCategory>
  async findAll(): Promise<BlogCategory[]>
  async findOne(id: string): Promise<BlogCategory>
  async findBySlug(slug: string): Promise<BlogCategory>
  async update(id: string, dto: UpdateBlogCategoryDto): Promise<BlogCategory>
  async remove(id: string): Promise<void>

  // Category association management
  async associateCategories(contentId: string, categoryIds: string[]): Promise<void>
  async dissociateCategories(contentId: string, categoryIds: string[]): Promise<void>
  async getCategoriesForPost(contentId: string): Promise<BlogCategory[]>
}
```

#### 4. API Endpoints

**Content Controller Extensions**:
```
GET    /content/blog                    - Get paginated blog posts (public)
GET    /content/blog/:slug              - Get single blog post (public)
GET    /content/blog/:id/related        - Get related posts (public)
POST   /content/blog                    - Create blog post (admin)
PATCH  /content/blog/:id                - Update blog post (admin)
DELETE /content/blog/:id                - Delete blog post (admin)
```

**Blog Category Controller** (New):
```
GET    /blog-categories                 - Get all categories (public)
GET    /blog-categories/:slug           - Get category by slug (public)
POST   /blog-categories                 - Create category (admin)
PATCH  /blog-categories/:id             - Update category (admin)
DELETE /blog-categories/:id             - Delete category (admin)
```

### Frontend Components

#### 1. Customer-Facing Components

**BlogListingPage**:
- Displays paginated list of blog posts
- Shows featured image, title, excerpt, author, date, categories
- Supports category filtering
- Implements pagination controls

**BlogPostPage**:
- Displays full blog post content
- Shows metadata (author, date, categories)
- Renders rich text content with embedded images
- Shows related posts section
- Includes SEO metadata and structured data

**BlogCategoryFilter**:
- Displays available categories
- Allows filtering by category
- Shows active category state

#### 2. Admin Components

**BlogPostForm**:
- Form for creating/editing blog posts
- Fields: title (EN/VI), slug, excerpt (EN/VI), content (EN/VI), author, featured image, categories, display order, publication status
- Integrates RichTextEditor component
- Category multi-select with existing BlogCategory records
- Validation and error handling

**BlogCategoryManager**:
- List view of all categories
- Create/edit/delete category functionality
- Shows post count per category
- Bilingual name management

**AdminBlogList**:
- Table view of all blog posts (published and drafts)
- Quick actions: edit, delete, publish/unpublish
- Filtering by status and category
- Search by title

## Data Models

### Content (Extended)

```typescript
interface BlogPost extends Content {
  type: 'BLOG';
  slug: string;
  titleEn: string;
  titleVi: string;
  contentEn: string;  // Rich text HTML
  contentVi: string;  // Rich text HTML
  excerptEn: string;  // Short summary
  excerptVi: string;  // Short summary
  authorName: string;
  imageUrl: string;   // Featured image
  displayOrder: number;
  isPublished: boolean;
  publishedAt: Date | null;
  blogCategories: BlogCategoryAssociation[];
  createdAt: Date;
  updatedAt: Date;
}
```

### BlogCategory

```typescript
interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  createdAt: Date;
  updatedAt: Date;
  posts: BlogCategoryAssociation[];
}
```

### DTOs

```typescript
interface CreateBlogPostDto {
  slug: string;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  excerptEn: string;
  excerptVi: string;
  authorName: string;
  imageUrl?: string;
  categoryIds: string[];
  displayOrder?: number;
  isPublished?: boolean;
}

interface CreateBlogCategoryDto {
  slug: string;
  nameEn: string;
  nameVi: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Blog post creation stores all required fields

*For any* valid blog post data with all required fields (title, content, excerpt, author in both languages), creating the blog post should result in a stored record containing all provided fields.

**Validates: Requirements 1.1**

### Property 2: Draft posts are not publicly visible

*For any* blog post with `isPublished` set to false, querying the public blog listing or accessing by slug should not return that post.

**Validates: Requirements 1.3**

### Property 3: Publishing sets timestamp

*For any* blog post that transitions from draft (`isPublished: false`) to published (`isPublished: true`), the `publishedAt` field should be set to a non-null timestamp.

**Validates: Requirements 1.4**

### Property 4: Category associations are bidirectional

*For any* blog post associated with a category, querying posts by that category should include the post, and querying categories for that post should include the category.

**Validates: Requirements 2.1**

### Property 5: Category deletion removes associations

*For any* category that is deleted, all blog posts previously associated with that category should no longer have that association.

**Validates: Requirements 2.4**

### Property 6: Blog listing returns only published posts

*For any* request to the public blog listing endpoint, all returned posts should have `isPublished` set to true.

**Validates: Requirements 3.1**

### Property 7: Blog post displays correct language content

*For any* blog post viewed with a specific locale (en or vi), the displayed title, content, and excerpt should match the corresponding language fields.

**Validates: Requirements 3.3**

### Property 8: Category filtering returns only matching posts

*For any* category filter applied to the blog listing, all returned posts should have an association with that category.

**Validates: Requirements 3.4**

### Property 9: Related posts share categories

*For any* blog post, all posts in the related posts list should share at least one category with the original post.

**Validates: Requirements 4.1**

### Property 10: Related posts exclude current post

*For any* blog post, the related posts list should not include the post itself.

**Validates: Requirements 4.3**

### Property 11: Related posts limit is respected

*For any* blog post, the related posts list should contain at most three posts.

**Validates: Requirements 4.2**

### Property 12: Display order affects sorting

*For any* two blog posts with different display order values, when sorted, the post with the lower display order value should appear before the post with the higher value.

**Validates: Requirements 5.1**

### Property 13: Unpublishing removes from public view

*For any* published blog post that is unpublished (`isPublished` changed from true to false), subsequent public queries should not return that post.

**Validates: Requirements 5.2**

### Property 14: Slug generates SEO-friendly URLs

*For any* blog post with a slug, the generated URL path should contain only lowercase letters, numbers, and hyphens.

**Validates: Requirements 6.4**

### Property 15: Image upload validates file type

*For any* file uploaded through the blog image uploader, if the file type is not JPEG, PNG, GIF, or WebP, the upload should be rejected.

**Validates: Requirements 7.1**

### Property 16: Image upload validates file size

*For any* file uploaded through the blog image uploader, if the file size exceeds 5MB, the upload should be rejected.

**Validates: Requirements 7.1**

### Property 17: Pagination returns correct subset

*For any* blog listing request with page number N and limit L, the returned posts should be the correct subset starting at position (N-1) * L.

**Validates: Requirements 8.2**

### Property 18: Pagination controls reflect state

*For any* blog listing on the last page, the next page control should be disabled.

**Validates: Requirements 8.4**

## Error Handling

### Validation Errors

- **Missing required fields**: Return 400 Bad Request with specific field errors
- **Invalid slug format**: Return 400 Bad Request with slug format requirements
- **Duplicate slug**: Return 400 Bad Request indicating slug already exists
- **Invalid category IDs**: Return 400 Bad Request with list of invalid IDs
- **Invalid file type/size**: Return 400 Bad Request with file requirements

### Not Found Errors

- **Blog post not found**: Return 404 Not Found
- **Category not found**: Return 404 Not Found
- **Unpublished post accessed by non-admin**: Return 404 Not Found (not 403 to avoid information disclosure)

### Authorization Errors

- **Non-admin attempts to create/edit/delete**: Return 403 Forbidden
- **Invalid authentication token**: Return 401 Unauthorized

### Database Errors

- **Connection failures**: Return 503 Service Unavailable with retry-after header
- **Constraint violations**: Return 409 Conflict with explanation
- **Transaction failures**: Rollback and return 500 Internal Server Error

### File System Errors

- **Image upload failures**: Clean up partial uploads, return 500 Internal Server Error
- **Image deletion failures**: Log error but continue with database deletion

## Testing Strategy

### Unit Tests

**Content Service**:
- Test blog post creation with valid data
- Test blog post creation with missing required fields
- Test draft vs published filtering
- Test related posts calculation
- Test category association logic
- Test slug uniqueness validation

**Blog Category Service**:
- Test category CRUD operations
- Test category association/dissociation
- Test category deletion with existing associations

**Content Controller**:
- Test endpoint authorization
- Test request validation
- Test response formatting

### Property-Based Tests

The testing strategy will use **fast-check** (for TypeScript/JavaScript) as the property-based testing library. Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Configuration**:
```typescript
import * as fc from 'fast-check';

// Configure to run 100 iterations minimum
fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
);
```

**Property Test Examples**:

1. **Blog post creation stores all fields** (Property 1):
   - Generate random valid blog post data
   - Create blog post
   - Verify all fields are stored correctly

2. **Draft posts not publicly visible** (Property 2):
   - Generate random blog posts with `isPublished: false`
   - Query public endpoints
   - Verify drafts are not returned

3. **Category filtering returns only matching posts** (Property 8):
   - Generate random blog posts with random category associations
   - Filter by random category
   - Verify all returned posts have that category

4. **Related posts share categories** (Property 9):
   - Generate random blog post with categories
   - Get related posts
   - Verify all related posts share at least one category

5. **Pagination returns correct subset** (Property 17):
   - Generate random list of blog posts
   - Request random page with random limit
   - Verify correct subset is returned

### Integration Tests

- Test complete blog post creation flow including category associations
- Test blog listing with pagination and filtering
- Test related posts retrieval
- Test image upload and embedding in blog content
- Test SEO metadata generation
- Test bilingual content display

### End-to-End Tests

- Admin creates blog post with categories and images
- Customer views blog listing and filters by category
- Customer reads full blog post and sees related posts
- Admin edits and publishes/unpublishes blog post
- Admin deletes blog post and verifies cleanup

## SEO Implementation

### Meta Tags

Each blog post page will include:
- `<title>`: Blog post title + site name
- `<meta name="description">`: Excerpt (first 160 characters)
- `<meta name="author">`: Author name
- Open Graph tags for social sharing
- Twitter Card tags

### Structured Data

Implement JSON-LD structured data for blog posts:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Blog post title",
  "image": "Featured image URL",
  "author": {
    "@type": "Person",
    "name": "Author name"
  },
  "datePublished": "2024-01-01T00:00:00Z",
  "dateModified": "2024-01-02T00:00:00Z",
  "description": "Excerpt"
}
```

### URL Structure

- Blog listing: `/blog` or `/[locale]/blog`
- Blog post: `/blog/[slug]` or `/[locale]/blog/[slug]`
- Category filter: `/blog?category=[slug]` or `/[locale]/blog?category=[slug]`

### Sitemap Integration

Add blog posts to the existing sitemap.ts:
- Include all published blog posts
- Set appropriate priority (0.7) and change frequency (weekly)
- Include lastmod from updatedAt field

## Performance Considerations

### Caching Strategy

- Cache blog listing for 5 minutes (similar to homepage sections)
- Cache individual blog posts for 10 minutes
- Invalidate cache on create/update/delete operations
- Cache related posts calculation results

### Database Optimization

- Add composite indexes for common queries:
  - `(type, isPublished, displayOrder, publishedAt)` for blog listing
  - `(type, isPublished, slug)` for blog post lookup
- Use eager loading for category associations to avoid N+1 queries
- Implement pagination to limit result set size

### Image Optimization

- Reuse existing content-media infrastructure
- Consider adding image resizing for featured images
- Implement lazy loading for blog post images
- Use WebP format where supported

## Migration Strategy

### Database Migration

1. Add new fields to Content model (authorName, excerptEn, excerptVi)
2. Add BLOG to ContentType enum
3. Create BlogCategory table
4. Create BlogCategoryAssociation junction table
5. Add necessary indexes

### Backward Compatibility

- New fields are optional to maintain compatibility with existing content types
- Existing content service methods continue to work unchanged
- Blog-specific methods are additive, not replacing existing functionality

## Future Enhancements

- Comments system for blog posts
- Blog post search functionality
- Author profiles and multi-author support
- Blog post series/collections
- Reading time estimation
- Social sharing buttons
- Newsletter subscription integration
- Blog post analytics (views, engagement)
