# Blog Endpoints Implementation

This document describes the blog-specific endpoints added to the Content Controller.

## Endpoints

### Public Endpoints

#### GET /content/blog
Get paginated list of published blog posts with optional category filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `categorySlug` (optional): Filter by category slug

**Response:**
```json
{
  "posts": [...],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Example:**
```
GET /content/blog?page=1&limit=10&categorySlug=craftsmanship
```

#### GET /content/blog/:slug
Get a single published blog post by slug, including associated categories.

**Parameters:**
- `slug`: Blog post slug

**Response:**
```json
{
  "id": "...",
  "slug": "pottery-techniques",
  "titleEn": "Traditional Pottery Techniques",
  "titleVi": "Kỹ thuật gốm truyền thống",
  "contentEn": "<p>...</p>",
  "contentVi": "<p>...</p>",
  "excerptEn": "...",
  "excerptVi": "...",
  "authorName": "John Smith",
  "imageUrl": "/uploads/blog/pottery.jpg",
  "categories": [
    {
      "id": "...",
      "slug": "craftsmanship",
      "nameEn": "Craftsmanship",
      "nameVi": "Nghề thủ công"
    }
  ],
  "isPublished": true,
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```
GET /content/blog/pottery-techniques
```

#### GET /content/blog/:id/related
Get up to 3 related blog posts based on shared categories.

**Parameters:**
- `id`: Blog post ID

**Response:**
```json
[
  {
    "id": "...",
    "slug": "weaving-basics",
    "titleEn": "Weaving Basics",
    "titleVi": "Cơ bản về dệt",
    "categories": [...]
  }
]
```

**Example:**
```
GET /content/blog/abc123/related
```

### Admin Endpoints

Blog posts can be created, updated, and deleted using the existing content endpoints:

#### POST /content
Create a new blog post (requires admin authentication).

**Body:**
```json
{
  "type": "BLOG",
  "slug": "my-blog-post",
  "titleEn": "My Blog Post",
  "titleVi": "Bài viết của tôi",
  "contentEn": "<p>Content...</p>",
  "contentVi": "<p>Nội dung...</p>",
  "excerptEn": "Short summary",
  "excerptVi": "Tóm tắt ngắn",
  "authorName": "John Doe",
  "imageUrl": "/uploads/blog/image.jpg",
  "categoryIds": ["cat-id-1", "cat-id-2"],
  "displayOrder": 1,
  "isPublished": true
}
```

#### PATCH /content/:id
Update an existing blog post (requires admin authentication).

**Body:** Same as POST, but all fields are optional.

#### DELETE /content/:id
Delete a blog post (requires admin authentication).

## Implementation Details

### Service Methods

The following methods in `ContentService` power these endpoints:

- `findBlogPosts(options)`: Paginated blog listing with category filtering
- `findBlogPostBySlug(slug, publicAccess)`: Single blog post retrieval
- `findRelatedPosts(postId, limit)`: Related posts based on shared categories
- `create(createContentDto)`: Blog post creation with category associations
- `update(id, updateContentDto)`: Blog post updates with category management
- `remove(id)`: Blog post deletion with cascade category cleanup

### Category Associations

Blog posts are associated with categories through the `BlogCategoryAssociation` junction table. The service automatically:

- Associates categories when creating a blog post
- Updates category associations when editing a blog post
- Removes category associations when deleting a blog post (cascade)

### Validation

Blog posts are validated to ensure:

- Required fields in both languages (title, content, excerpt)
- Author name is provided
- Slug follows SEO-friendly format (lowercase, hyphens, alphanumeric)
- Category IDs exist in the database

### Public vs Admin Access

- Public endpoints only return published blog posts (`isPublished: true`)
- Admin endpoints can access draft posts
- Draft posts return 404 when accessed via public endpoints

## Testing

Run the test script to verify all endpoints:

```bash
npx ts-node scripts/test-blog-endpoints.ts
```

This test script verifies:
- Blog post creation with categories
- Pagination and filtering
- Single post retrieval by slug
- Related posts calculation
- Draft post visibility
- CRUD operations via existing content endpoints
