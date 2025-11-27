import apiClient from './api-client';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    slug: string;
    nameEn: string;
    nameVi: string;
  };
  images: ProductImage[];
  averageRating?: number;
  _count?: {
    reviews: number;
  };
}

export interface ProductImage {
  id: string;
  url: string;
  altTextEn?: string;
  altTextVi?: string;
  displayOrder: number;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductCountResponse {
  count: number;
}

export const productApi = {
  getProducts: async (params?: ProductQueryParams): Promise<ProductsResponse> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${slug}`);
    return response.data;
  },

  searchProducts: async (query: string, limit?: number): Promise<Product[]> => {
    const response = await apiClient.get('/products/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  createProduct: async (data: FormData): Promise<Product> => {
    const response = await apiClient.post('/products', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.patch(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  uploadProductImage: async (
    productId: string,
    file: File,
    imageData?: { altTextEn?: string; altTextVi?: string; displayOrder?: number }
  ): Promise<ProductImage> => {
    const formData = new FormData();
    formData.append('file', file);
    if (imageData?.altTextEn) formData.append('altTextEn', imageData.altTextEn);
    if (imageData?.altTextVi) formData.append('altTextVi', imageData.altTextVi);
    if (imageData?.displayOrder !== undefined)
      formData.append('displayOrder', imageData.displayOrder.toString());

    const response = await apiClient.post(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProductImage: async (productId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/images/${imageId}`);
  },

  getProductCount: async (): Promise<ProductCountResponse> => {
    const response = await apiClient.get('/products/count');
    return response.data;
  },
};
