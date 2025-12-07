import apiClient from './api-client';

/**
 * Content Media interface
 * Represents a media item in the content media library
 */
export interface ContentMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated Media Response interface
 * Represents a paginated list of media items
 */
export interface PaginatedMediaResponse {
  items: ContentMedia[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Content Media API client
 * Provides methods to interact with content media endpoints
 */
export const contentMediaApi = {
  /**
   * Upload a new media file
   * Uploads an image file to the content media library
   * Requires admin authentication
   *
   * @param file - The image file to upload (JPEG, PNG, GIF, or WebP, max 5MB)
   * @returns Promise<ContentMedia> The uploaded media item with metadata
   * @throws Error if the API request fails, file is invalid, or user is not authorized
   */
  async upload(file: File): Promise<ContentMedia> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/content-media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading media:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 400) {
        const message = error.response?.data?.message;
        if (message?.includes('file type')) {
          throw new Error('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image');
        }
        if (message?.includes('size')) {
          throw new Error('File size exceeds 5MB limit. Please select a smaller file');
        }
        throw new Error(message || 'Invalid file upload');
      }
      if (error.response?.status === 413) {
        throw new Error('File size exceeds 5MB limit. Please select a smaller file');
      }

      throw new Error(
        error.response?.data?.message ||
        'Failed to upload media file'
      );
    }
  },

  /**
   * Get all media items with optional search and pagination
   * Fetches a paginated list of media items from the library
   * Requires admin authentication
   *
   * @param search - Optional search query to filter by filename
   * @param page - Optional page number (default: 1)
   * @param limit - Optional items per page (default: 20)
   * @returns Promise<PaginatedMediaResponse> Paginated list of media items
   * @throws Error if the API request fails or user is not authorized
   */
  async getAll(
    search?: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedMediaResponse> {
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (page) params.page = page;
      if (limit) params.limit = limit;

      const response = await apiClient.get('/content-media', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching media list:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }

      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch media list'
      );
    }
  },

  /**
   * Get a specific media item by ID
   * Fetches detailed information about a single media item
   * Requires admin authentication
   *
   * @param id - The unique identifier of the media item
   * @returns Promise<ContentMedia> The media item with metadata
   * @throws Error if the API request fails, item not found, or user is not authorized
   */
  async getById(id: string): Promise<ContentMedia> {
    try {
      const response = await apiClient.get(`/content-media/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching media item:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 404) {
        throw new Error('Media item not found');
      }

      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch media item'
      );
    }
  },

  /**
   * Delete a media item
   * Removes a media item from the library (both database record and physical file)
   * Requires admin authentication
   *
   * @param id - The unique identifier of the media item to delete
   * @returns Promise<void>
   * @throws Error if the API request fails, item not found, or user is not authorized
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/content-media/${id}`);
    } catch (error: any) {
      console.error('Error deleting media item:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 404) {
        throw new Error('Media item not found');
      }

      throw new Error(
        error.response?.data?.message ||
        'Failed to delete media item'
      );
    }
  },
};

// Helper functions for easier usage
export const uploadMedia = (file: File) => contentMediaApi.upload(file);
export const getAllMedia = (search?: string, page?: number, limit?: number) =>
  contentMediaApi.getAll(search, page, limit);
export const getMediaById = (id: string) => contentMediaApi.getById(id);
export const deleteMedia = (id: string) => contentMediaApi.delete(id);
