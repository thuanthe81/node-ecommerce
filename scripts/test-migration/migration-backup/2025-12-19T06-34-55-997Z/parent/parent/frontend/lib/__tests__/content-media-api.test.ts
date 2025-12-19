import { contentMediaApi, ContentMedia, PaginatedMediaResponse } from '../content-media-api';
import apiClient from '../api-client';

// Mock the api-client
jest.mock('../api-client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('contentMediaApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload a file successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse: ContentMedia = {
        id: '1',
        filename: 'media-123.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/content-media/media-123.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await contentMediaApi.upload(mockFile);

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/content-media/upload',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    });

    it('should throw error for invalid file type', async () => {
      mockedApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid file type' },
        },
      });

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(contentMediaApi.upload(mockFile)).rejects.toThrow(
        'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image'
      );
    });

    it('should throw error for file size exceeded', async () => {
      mockedApiClient.post.mockRejectedValue({
        response: {
          status: 413,
          data: { message: 'File too large' },
        },
      });

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(contentMediaApi.upload(mockFile)).rejects.toThrow(
        'File size exceeds 5MB limit. Please select a smaller file'
      );
    });
  });

  describe('getAll', () => {
    it('should fetch all media items', async () => {
      const mockResponse: PaginatedMediaResponse = {
        items: [
          {
            id: '1',
            filename: 'media-123.jpg',
            originalName: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024,
            url: '/uploads/content-media/media-123.jpg',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await contentMediaApi.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/content-media', {
        params: {},
      });
    });

    it('should fetch media items with search and pagination', async () => {
      const mockResponse: PaginatedMediaResponse = {
        items: [],
        total: 0,
        page: 2,
        totalPages: 0,
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await contentMediaApi.getAll('test', 2, 10);

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/content-media', {
        params: { search: 'test', page: 2, limit: 10 },
      });
    });
  });

  describe('getById', () => {
    it('should fetch a specific media item', async () => {
      const mockResponse: ContentMedia = {
        id: '1',
        filename: 'media-123.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/content-media/media-123.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await contentMediaApi.getById('1');

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/content-media/1');
    });

    it('should throw error for not found', async () => {
      mockedApiClient.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      });

      await expect(contentMediaApi.getById('999')).rejects.toThrow(
        'Media item not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete a media item', async () => {
      mockedApiClient.delete.mockResolvedValue({ data: undefined });

      await contentMediaApi.delete('1');

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/content-media/1');
    });

    it('should throw error for unauthorized', async () => {
      mockedApiClient.delete.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      });

      await expect(contentMediaApi.delete('1')).rejects.toThrow(
        'Unauthorized: Admin access required'
      );
    });
  });
});
