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

  /**
   * Create a new product with optional multiple images.
   * FormData should contain product fields and optionally multiple files under the 'images' key.
   * Example:
   *   formData.append('nameEn', 'Product Name');
   *   formData.append('images', file1);
   *   formData.append('images', file2);
   */
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

  uploadMultipleImages: async (
    productId: string,
    files: File[],
    imageData?: { altTextEn?: string; altTextVi?: string }
  ): Promise<{ images: ProductImage[]; errors?: Array<{ filename: string; error: string }> }> => {
    // Upload images sequentially to maintain order
    const results: ProductImage[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        const image = await productApi.uploadProductImage(productId, file, imageData);
        results.push(image);
      } catch (error: any) {
        errors.push({
          filename: file.name,
          error: error.response?.data?.message || error.message || 'Upload failed',
        });
      }
    }

    return {
      images: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  deleteProductImage: async (productId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/images/${imageId}`);
  },

  reorderImages: async (
    productId: string,
    images: Array<{ imageId: string; displayOrder: number }>
  ): Promise<ProductImage[]> => {
    const response = await apiClient.patch(`/products/${productId}/images/reorder`, {
      images,
    });
    return response.data;
  },

  updateImageMetadata: async (
    productId: string,
    imageId: string,
    data: { altTextEn?: string; altTextVi?: string; displayOrder?: number }
  ): Promise<ProductImage> => {
    const response = await apiClient.patch(`/products/${productId}/images/${imageId}`, data);
    return response.data;
  },

  getProductCount: async (): Promise<ProductCountResponse> => {
    const response = await apiClient.get('/products/count');
    return response.data;
  },
};
