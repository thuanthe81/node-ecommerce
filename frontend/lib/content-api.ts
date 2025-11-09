import apiClient from './api-client';

export interface Content {
  id: string;
  slug: string;
  type: 'PAGE' | 'FAQ' | 'BANNER';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentData {
  slug: string;
  type: 'PAGE' | 'FAQ' | 'BANNER';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export const contentApi = {
  getAll: async (type?: string): Promise<Content[]> => {
    const params = type ? `?type=${type}` : '';
    const response = await apiClient.get(`/content${params}`);
    return response.data;
  },

  getPublished: async (type?: string): Promise<Content[]> => {
    const params = type ? `?type=${type}` : '';
    const response = await apiClient.get(`/content/published${params}`);
    return response.data;
  },

  getBanners: async (): Promise<Content[]> => {
    const response = await apiClient.get('/content/banners');
    return response.data;
  },

  getById: async (id: string): Promise<Content> => {
    const response = await apiClient.get(`/content/${id}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Content> => {
    const response = await apiClient.get(`/content/slug/${slug}`);
    return response.data;
  },

  create: async (data: CreateContentData): Promise<Content> => {
    const response = await apiClient.post('/content', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateContentData>): Promise<Content> => {
    const response = await apiClient.patch(`/content/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/content/${id}`);
  },
};
