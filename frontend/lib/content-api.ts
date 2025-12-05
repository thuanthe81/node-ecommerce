import apiClient from './api-client';

export interface Content {
  id: string;
  slug: string;
  type: 'PAGE' | 'FAQ' | 'BANNER' | 'HOMEPAGE_SECTION';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt?: string;
  buttonTextEn?: string;
  buttonTextVi?: string;
  layout?: 'centered' | 'image-left' | 'image-right';
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentData {
  slug: string;
  type: 'PAGE' | 'FAQ' | 'BANNER' | 'HOMEPAGE_SECTION';
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder?: number;
  isPublished?: boolean;
  buttonTextEn?: string;
  buttonTextVi?: string;
  layout?: 'centered' | 'image-left' | 'image-right';
}

export const contentApi = {
  getTypes: async (): Promise<string[]> => {
    const response = await apiClient.get('/content/types');
    return response.data;
  },

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

  getHomepageSections: async (): Promise<Content[]> => {
    const response = await apiClient.get('/content/homepage-sections');
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

  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/content/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Helper functions for easier usage
export const getContentTypes = () => contentApi.getTypes();
export const getContents = (type?: string) => contentApi.getAll(type);
export const getPublishedContents = (type?: string) => contentApi.getPublished(type);
export const getBanners = () => contentApi.getBanners();
export const getHomepageSections = () => contentApi.getHomepageSections();
export const getContentById = (id: string) => contentApi.getById(id);
export const getContentBySlug = (slug: string) => contentApi.getBySlug(slug);
export const createContent = (data: CreateContentData) => contentApi.create(data);
export const updateContent = (id: string, data: Partial<CreateContentData>) => contentApi.update(id, data);
export const deleteContent = (id: string) => contentApi.delete(id);
export const uploadContentImage = (file: File) => contentApi.uploadImage(file);
