import apiClient from './api-client';

export interface BlogCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface CreateBlogCategoryData {
  slug: string;
  nameEn: string;
  nameVi: string;
}

export const blogCategoryApi = {
  /**
   * Get all blog categories
   * @param locale - Locale for content (not used in API call, for frontend filtering)
   */
  getBlogCategories: async (locale?: string): Promise<BlogCategory[]> => {
    const response = await apiClient.get('/blog-categories');
    return response.data;
  },

  /**
   * Get a single blog category by slug
   * @param slug - Category slug
   * @param locale - Locale for content (not used in API call, for frontend filtering)
   */
  getBlogCategory: async (slug: string, locale?: string): Promise<BlogCategory> => {
    const response = await apiClient.get(`/blog-categories/${slug}`);
    return response.data;
  },

  /**
   * Create a new blog category (admin only)
   * @param data - Category data
   * @param token - Admin authentication token (automatically added by interceptor)
   */
  createBlogCategory: async (data: CreateBlogCategoryData): Promise<BlogCategory> => {
    const response = await apiClient.post('/blog-categories', data);
    return response.data;
  },

  /**
   * Update an existing blog category (admin only)
   * @param id - Category ID
   * @param data - Partial category data to update
   * @param token - Admin authentication token (automatically added by interceptor)
   */
  updateBlogCategory: async (
    id: string,
    data: Partial<CreateBlogCategoryData>
  ): Promise<BlogCategory> => {
    const response = await apiClient.patch(`/blog-categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete a blog category (admin only)
   * @param id - Category ID
   * @param token - Admin authentication token (automatically added by interceptor)
   */
  deleteBlogCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/blog-categories/${id}`);
  },
};

// Helper functions for easier usage
export const getBlogCategories = (locale?: string) =>
  blogCategoryApi.getBlogCategories(locale);

export const getBlogCategory = (slug: string, locale?: string) =>
  blogCategoryApi.getBlogCategory(slug, locale);

export const createBlogCategory = (data: CreateBlogCategoryData) =>
  blogCategoryApi.createBlogCategory(data);

export const updateBlogCategory = (id: string, data: Partial<CreateBlogCategoryData>) =>
  blogCategoryApi.updateBlogCategory(id, data);

export const deleteBlogCategory = (id: string) =>
  blogCategoryApi.deleteBlogCategory(id);
