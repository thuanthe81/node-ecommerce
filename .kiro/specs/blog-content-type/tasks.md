# Implementation Plan

- [x] 1. Database schema and migrations
  - Create Prisma migration to add BLOG to ContentType enum
  - Add authorName, excerptEn, excerptVi fields to Content model
  - Create BlogCategory model with slug, nameEn, nameVi fields
  - Create BlogCategoryAssociation junction table for many-to-many relationship
  - Add composite indexes for blog queries: (type, isPublished, displayOrder, publishedAt) and (type, isPublished, slug)
  - Run migration and verify schema changes
  - _Requirements: 1.1, 2.1, 2.2_

- [-] 2. Backend: Blog category service and API
  - [x] 2.1 Create blog category DTOs
    - Create CreateBlogCategoryDto with slug, nameEn, nameVi validation
    - Create UpdateBlogCategoryDto as partial of create DTO
    - Add slug format validation (lowercase, hyphens, alphanumeric)
    - _Requirements: 2.2_

  - [x] 2.2 Implement BlogCategoryService
    - Implement create method with slug uniqueness validation
    - Implement findAll, findOne, findBySlug methods
    - Implement update method with slug uniqueness check
    - Implement remove method with cascade handling
    - Implement associateCategories method for linking posts to categories
    - Implement dissociateCategories method for unlinking
    - Implement getCategoriesForPost method with eager loading
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 2.3 Write property test for category uniqueness
    - **Property 2: Category slug uniqueness**
    - **Validates: Requirements 2.2**

  - [x] 2.4 Create BlogCategoryController
    - Implement GET /blog-categories (public) endpoint
    - Implement GET /blog-categories/:slug (public) endpoint
    - Implement POST /blog-categories (admin) endpoint
    - Implement PATCH /blog-categories/:id (admin) endpoint
    - Implement DELETE /blog-categories/:id (admin) endpoint
    - Add proper authorization guards
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 2.5 Create BlogCategoryModule
    - Register BlogCategoryService
    - Register BlogCategoryController
    - Import PrismaModule
    - Export BlogCategoryService for use in ContentModule
    - _Requirements: 2.1_

- [x] 3. Backend: Extend content service for blog posts
  - [x] 3.1 Update content DTOs for blog type
    - Extend CreateContentDto with authorName, excerptEn, excerptVi, categoryIds fields
    - Add validation for blog-specific required fields
    - Extend UpdateContentDto with same optional fields
    - _Requirements: 1.1, 2.1_

  - [x] 3.2 Add blog validation to ContentService
    - Create validateBlogPost private method
    - Validate required fields: titleEn, titleVi, contentEn, contentVi, excerptEn, excerptVi, authorName
    - Validate slug format for SEO-friendliness
    - Validate categoryIds exist in database
    - _Requirements: 1.1, 6.4_

  - [ ]* 3.3 Write property test for blog post creation
    - **Property 1: Blog post creation stores all required fields**
    - **Validates: Requirements 1.1**

  - [x] 3.4 Extend create method for blog posts
    - Call validateBlogPost when type is BLOG
    - Create blog post with all fields
    - Associate categories using BlogCategoryService
    - Set publishedAt when isPublished is true
    - _Requirements: 1.1, 1.4, 2.1_

  - [ ]* 3.5 Write property test for publishing timestamp
    - **Property 3: Publishing sets timestamp**
    - **Validates: Requirements 1.4**

  - [x] 3.6 Extend update method for blog posts
    - Preserve createdAt field
    - Update updatedAt automatically
    - Handle category association updates
    - Update publishedAt when publishing
    - Clear publishedAt when unpublishing
    - _Requirements: 1.2, 5.2_

  - [ ]* 3.7 Write property test for edit preserves creation date
    - **Property 2: Edit preserves createdAt**
    - **Validates: Requirements 1.2**

  - [x] 3.8 Implement findBlogPosts method
    - Accept pagination parameters (page, limit)
    - Accept categorySlug filter parameter
    - Accept published filter (default true for public)
    - Filter by type: BLOG and isPublished
    - Join with categories when categorySlug provided
    - Sort by displayOrder ASC, publishedAt DESC
    - Return paginated results with total count
    - _Requirements: 3.1, 3.4, 5.4, 8.1, 8.2_

  - [ ]* 3.9 Write property test for draft visibility
    - **Property 2: Draft posts are not publicly visible**
    - **Validates: Requirements 1.3**

  - [ ]* 3.10 Write property test for category filtering
    - **Property 8: Category filtering returns only matching posts**
    - **Validates: Requirements 3.4**

  - [ ]* 3.11 Write property test for sorting
    - **Property 12: Display order affects sorting**
    - **Validates: Requirements 5.1**

  - [ ]* 3.12 Write property test for pagination
    - **Property 17: Pagination returns correct subset**
    - **Validates: Requirements 8.2**

  - [x] 3.13 Implement findBlogPostBySlug method
    - Find by slug and type: BLOG
    - Include associated categories with eager loading
    - Return 404 if not found or not published (for public access)
    - _Requirements: 3.2_

  - [x] 3.14 Implement findRelatedPosts method
    - Get categories for the given post
    - Find other published blog posts sharing at least one category
    - Exclude the current post
    - Limit to 3 results
    - Sort by number of shared categories DESC, then publishedAt DESC
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 3.15 Write property test for related posts
    - **Property 9: Related posts share categories**
    - **Validates: Requirements 4.1**

  - [ ]* 3.16 Write property test for related posts exclusion
    - **Property 10: Related posts exclude current post**
    - **Validates: Requirements 4.3**

  - [ ]* 3.17 Write property test for related posts limit
    - **Property 11: Related posts limit is respected**
    - **Validates: Requirements 4.2**

  - [x] 3.18 Extend remove method for blog posts
    - Delete category associations via cascade
    - Delete blog post record
    - Invalidate cache if caching is implemented
    - _Requirements: 5.3_

  - [ ]* 3.19 Write property test for category deletion
    - **Property 5: Category deletion removes associations**
    - **Validates: Requirements 2.4**

- [x] 4. Backend: Add blog endpoints to content controller
  - [x] 4.1 Add blog-specific endpoints
    - Add GET /content/blog endpoint (public) with pagination and category filter
    - Add GET /content/blog/:slug endpoint (public)
    - Add GET /content/blog/:id/related endpoint (public)
    - Reuse existing POST /content for blog creation (admin)
    - Reuse existing PATCH /content/:id for blog updates (admin)
    - Reuse existing DELETE /content/:id for blog deletion (admin)
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 4.2 Update ContentModule imports
    - Import BlogCategoryModule
    - Inject BlogCategoryService into ContentService
    - _Requirements: 2.1_

- [x] 5. Backend: Add caching for blog endpoints
  - [x] 5.1 Implement blog listing cache
    - Cache blog listing results for 5 minutes
    - Use cache key pattern: 'blog:list:{page}:{limit}:{categorySlug}'
    - Invalidate on blog post create/update/delete
    - _Requirements: 3.1_

  - [x] 5.2 Implement blog post detail cache
    - Cache individual blog posts for 10 minutes
    - Use cache key pattern: 'blog:post:{slug}'
    - Invalidate on blog post update/delete
    - _Requirements: 3.2_

  - [x] 5.3 Implement related posts cache
    - Cache related posts for 10 minutes
    - Use cache key pattern: 'blog:related:{postId}'
    - Invalidate when any blog post is created/updated/deleted
    - _Requirements: 4.1_

- [x] 6. Frontend: Add translations for blog feature
  - [x] 6.1 Add blog translations to translations.json
    - Add blog section with keys: title, readMore, relatedPosts, noPostsFound, categories, author, publishedOn, backToList
    - Add admin.blog section with keys: createPost, editPost, deletePost, title, slug, excerpt, content, author, featuredImage, categories, displayOrder, published, draft, managePosts, manageCategories
    - Add admin.blogCategories section with keys: createCategory, editCategory, deleteCategory, name, slug, postCount
    - Provide both English and Vietnamese translations
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Frontend: Create blog API client
  - [x] 7.1 Create blog-api.ts
    - Implement getBlogPosts(page, limit, categorySlug, locale) function
    - Implement getBlogPost(slug, locale) function
    - Implement getRelatedPosts(postId, locale) function
    - Implement createBlogPost(data, token) function (admin)
    - Implement updateBlogPost(id, data, token) function (admin)
    - Implement deleteBlogPost(id, token) function (admin)
    - Use existing api-client patterns for error handling
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 7.2 Create blog-category-api.ts
    - Implement getBlogCategories(locale) function
    - Implement getBlogCategory(slug, locale) function
    - Implement createBlogCategory(data, token) function (admin)
    - Implement updateBlogCategory(id, data, token) function (admin)
    - Implement deleteBlogCategory(id, token) function (admin)
    - _Requirements: 2.1, 2.2_

- [x] 8. Frontend: Create customer-facing blog components
  - [x] 8.1 Create BlogCard component
    - Display featured image with alt text
    - Display title in current locale
    - Display excerpt in current locale
    - Display author name
    - Display publication date formatted
    - Display category tags as badges
    - Add "Read More" link to blog post detail
    - Make entire card clickable
    - Add hover effects
    - _Requirements: 3.1_

  - [x] 8.2 Create BlogListingPage component
    - Fetch blog posts with pagination using getBlogPosts
    - Display grid of BlogCard components
    - Implement category filter dropdown
    - Implement Pagination component
    - Show empty state when no posts found
    - Handle loading and error states
    - Support locale switching
    - _Requirements: 3.1, 3.4, 3.5, 8.1, 8.2, 8.3_

  - [x] 8.3 Create BlogPostPage component
    - Fetch blog post by slug using getBlogPost
    - Display featured image with alt text
    - Display title in current locale
    - Display author and publication date
    - Display category tags as clickable badges
    - Render rich text content with proper HTML formatting
    - Fetch and display related posts using getRelatedPosts
    - Add breadcrumb navigation
    - Handle 404 for not found posts
    - Support locale switching
    - _Requirements: 3.2, 3.3, 4.1, 4.4_

  - [x] 8.4 Add SEO metadata to BlogPostPage
    - Generate page title with blog post title
    - Generate meta description from excerpt
    - Add Open Graph tags (og:title, og:description, og:image, og:type)
    - Add Twitter Card tags
    - Add JSON-LD structured data for BlogPosting
    - Include author, datePublished, dateModified
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.5 Create blog routes
    - Create app/[locale]/blog/page.tsx for listing
    - Create app/[locale]/blog/[slug]/page.tsx for detail
    - Add blog link to main navigation
    - Update sitemap.ts to include blog posts
    - _Requirements: 3.1, 3.2, 6.4_

- [x] 9. Frontend: Create admin blog management components
  - [x] 9.1 Create BlogPostForm component folder structure
    - Create BlogPostForm/BlogPostForm.tsx main component
    - Create BlogPostForm/components/ for sub-components
    - Create BlogPostForm/types.ts for interfaces
    - Create BlogPostForm/index.tsx for exports
    - _Requirements: 1.1_

  - [x] 9.2 Implement BlogPostForm main component
    - Add form fields: titleEn, titleVi, slug, excerptEn, excerptVi, authorName
    - Integrate two RichTextEditor instances for contentEn and contentVi
    - Add featured image upload/selection
    - Add category multi-select dropdown
    - Add displayOrder number input
    - Add isPublished toggle
    - Implement form validation
    - Handle create and edit modes
    - Show loading state during submission
    - Display success/error messages
    - _Requirements: 1.1, 1.4, 2.1_

  - [x] 9.3 Create BlogCategoryManager component
    - Display table of all categories with nameEn, nameVi, slug, post count
    - Add "Create Category" button
    - Implement inline edit for category names
    - Add delete button with confirmation
    - Show loading and error states
    - _Requirements: 2.2, 2.4_

  - [x] 9.4 Create AdminBlogList component
    - Display table of all blog posts (published and drafts)
    - Show columns: title, author, status, categories, published date, actions
    - Add filter by status (all, published, draft)
    - Add filter by category
    - Add search by title
    - Add "Create Post" button
    - Add edit and delete actions per row
    - Add quick publish/unpublish toggle
    - Implement pagination
    - _Requirements: 1.3, 3.4, 5.1, 5.2_

  - [x] 9.5 Create admin blog routes
    - Create app/[locale]/admin/blog/page.tsx for post list
    - Create app/[locale]/admin/blog/new/page.tsx for create
    - Create app/[locale]/admin/blog/[id]/edit/page.tsx for edit
    - Create app/[locale]/admin/blog/categories/page.tsx for category management
    - Add blog section to admin navigation
    - _Requirements: 1.1, 2.2_

- [ ] 10. Testing and validation
  - [ ] 10.1 Test blog post creation flow
    - Create blog post with all fields via admin interface
    - Verify post appears in admin list
    - Verify draft post does not appear in public listing
    - Publish post and verify it appears in public listing
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ] 10.2 Test category management
    - Create multiple categories
    - Assign categories to blog posts
    - Filter blog listing by category
    - Delete category and verify associations removed
    - _Requirements: 2.1, 2.2, 2.4, 3.4_

  - [ ] 10.3 Test rich text content
    - Create blog post with formatted text
    - Embed images from product gallery
    - Embed images from media library
    - Verify content displays correctly on public page
    - _Requirements: 1.5, 7.3_

  - [ ] 10.4 Test related posts
    - Create multiple blog posts with overlapping categories
    - View blog post detail and verify related posts appear
    - Verify related posts share categories
    - Verify current post is excluded
    - Verify maximum 3 related posts shown
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 10.5 Test pagination
    - Create more than 10 blog posts
    - Verify pagination controls appear
    - Navigate through pages
    - Verify correct posts shown per page
    - Verify last page disables next button
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 10.6 Test SEO features
    - Publish blog post with featured image
    - View page source and verify meta tags present
    - Verify Open Graph tags include image
    - Verify JSON-LD structured data present
    - Verify URL uses slug
    - Check sitemap includes blog posts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 10.7 Test bilingual support
    - Create blog post with different content in EN and VI
    - Switch locale and verify correct content displayed
    - Verify categories display in correct language
    - Verify all UI elements translated
    - _Requirements: 3.3_

- [ ] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise
