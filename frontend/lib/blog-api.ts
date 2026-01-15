import apiClient from './api-client';

export interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  type: 'BLOG';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  excerptEn: string;
  excerptVi: string;
  authorName: string;
  imageUrl?: string;
  imageBackground?: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  blogCategories?: Array<{
    category: BlogCategory;
  }>;
}

export interface PaginatedBlogPosts {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBlogPostData {
  slug: string;
  type: 'BLOG';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  excerptEn: string;
  excerptVi: string;
  authorName: string;
  imageUrl?: string;
  imageBackground?: string;
  categoryIds: string[];
  displayOrder?: number;
  isPublished?: boolean;
}

export const blogApi = {
  /**
   * Get paginated blog posts with optional category filtering
   * @param page - Page number (default: 1)
   * @param limit - Number of posts per page (default: 10)
   * @param published - blog published or not or both (undefined: both)
   * @param categorySlug - Optional category slug to filter by
   * @param locale - Locale for content (not used in API call, for frontend filtering)
   */
  getBlogPosts: async (
    page: number = 1,
    limit: number = 10,
    published?: boolean,
    categorySlug?: string,
    locale?: string
  ): Promise<PaginatedBlogPosts> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (published !== undefined) {
      params.append('published', published.toString());
    }

    if (categorySlug) {
      params.append('categorySlug', categorySlug);
    }

    const response = await apiClient.get(`/content/blog?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single blog post by slug
   * @param slug - Blog post slug
   * @param locale - Locale for content (not used in API call, for frontend filtering)
   */
  getBlogPost: async (slug: string, locale?: string): Promise<BlogPost> => {
    const response = await apiClient.get(`/content/blog/${slug}`);
    return response.data;
  },

  /**
   * Get related blog posts for a given post
   * @param postId - Blog post ID
   * @param locale - Locale for content (not used in API call, for frontend filtering)
   */
  getRelatedPosts: async (postId: string, locale?: string): Promise<BlogPost[]> => {
    const response = await apiClient.get(`/content/blog/${postId}/related`);
    return response.data;
  },

  /**
   * Create a new blog post (admin only)
   * @param data - Blog post data
   * @param token - Admin authentication token (automatically added by interceptor)
   */
  createBlogPost: async (data: CreateBlogPostData): Promise<BlogPost> => {
    const response = await apiClient.post('/content', data);
    return response.data;
  },

  /**
   * Update an existing blog post (admin only)
   * @param id - Blog post ID
   * @param data - Partial blog post data to update
   * @param token - Admin authentication token (automatically added by interceptor)
   */
  updateBlogPost: async (
    id: string,
    data: Partial<CreateBlogPostData>
  ): Promise<BlogPost> => {
    const response = await apiClient.patch(`/content/${id}`, data);
    return response.data;
  },

  /**
   * Delete a blog post (admin only)
   * @param id - Blog post ID
   * @param token - Admin authentication token (automatically added by interceptor)
   */
  deleteBlogPost: async (id: string): Promise<void> => {
    await apiClient.delete(`/content/${id}`);
  },
};

// Helper functions for easier usage
export const getBlogPosts = (
  page?: number,
  limit?: number,
  published?: boolean,
  categorySlug?: string,
  locale?: string
) => blogApi.getBlogPosts(page, limit, published, categorySlug, locale);

export const getBlogPost = (slug: string, locale?: string) =>
  blogApi.getBlogPost(slug, locale);

export const getRelatedPosts = (postId: string, locale?: string) =>
  blogApi.getRelatedPosts(postId, locale);

export const createBlogPost = (data: CreateBlogPostData) =>
  blogApi.createBlogPost(data);

export const updateBlogPost = (id: string, data: Partial<CreateBlogPostData>) =>
  blogApi.updateBlogPost(id, data);

export const deleteBlogPost = (id: string) => blogApi.deleteBlogPost(id);