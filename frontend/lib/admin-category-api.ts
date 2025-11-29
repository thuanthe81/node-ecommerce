import apiClient from './api-client';
import { Category } from './category-api';

export interface CreateCategoryData {
  slug: string;
  nameEn: string;
  nameVi: string;
  descriptionEn?: string;
  descriptionVi?: string;
  parentId?: string;
  imageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface ProductImage {
  id: string;
  url: string;
  productId: string;
  productNameEn: string;
  productNameVi: string;
  altTextEn?: string;
  altTextVi?: string;
}

export const adminCategoryApi = {
  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  getProductImages: async (): Promise<ProductImage[]> => {
    const response = await apiClient.get('/categories/product-images');
    return response.data;
  },

  uploadCategoryImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // This would need a dedicated upload endpoint
    // For now, we'll return a placeholder
    return { url: URL.createObjectURL(file) };
  },
};
