import apiClient from './api-client';

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  descriptionEn?: string;
  descriptionVi?: string;
  parentId?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  parent?: Category;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export const categoryApi = {
  // Get all categories as a tree structure
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  // Get a single category by ID
  getCategory: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  // Get a category by slug
  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/slug/${slug}`);
    return response.data;
  },
};
