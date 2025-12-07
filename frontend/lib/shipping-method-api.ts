import apiClient from './api-client';

/**
 * Shipping Method interface
 * Represents a delivery option with pricing and delivery timeframes
 */
export interface ShippingMethod {
  id: string;
  methodId: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  carrier: string | null;
  baseRate: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  weightThreshold: number | null;
  weightRate: number | null;
  freeShippingThreshold: number | null;
  regionalPricing: Record<string, number> | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Shipping Method DTO
 * Data required to create a new shipping method
 */
export interface CreateShippingMethodDto {
  methodId: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  carrier?: string;
  baseRate: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  weightThreshold?: number;
  weightRate?: number;
  freeShippingThreshold?: number;
  regionalPricing?: Record<string, number>;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Update Shipping Method DTO
 * Data that can be updated on an existing shipping method
 * Note: methodId is immutable and cannot be updated
 */
export interface UpdateShippingMethodDto {
  nameEn?: string;
  nameVi?: string;
  descriptionEn?: string;
  descriptionVi?: string;
  carrier?: string;
  baseRate?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  weightThreshold?: number;
  weightRate?: number;
  freeShippingThreshold?: number;
  regionalPricing?: Record<string, number>;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Shipping Method API client
 * Provides methods to interact with shipping method endpoints
 * All endpoints require ADMIN role authentication
 */
export const shippingMethodApi = {
  /**
   * Get all shipping methods (including inactive)
   * GET /shipping-methods
   * Admin only
   *
   * @returns Promise<ShippingMethod[]> Array of all shipping methods
   * @throws Error if the API request fails or user is not authorized
   */
  async getAll(): Promise<ShippingMethod[]> {
    try {
      const response = await apiClient.get('/shipping-methods');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching shipping methods:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }

      throw new Error(
        error.response?.data?.message || 'Failed to fetch shipping methods'
      );
    }
  },

  /**
   * Get all active shipping methods
   * GET /shipping-methods/active
   * Admin only
   *
   * @returns Promise<ShippingMethod[]> Array of active shipping methods
   * @throws Error if the API request fails or user is not authorized
   */
  async getActive(): Promise<ShippingMethod[]> {
    try {
      const response = await apiClient.get('/shipping-methods/active');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active shipping methods:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }

      throw new Error(
        error.response?.data?.message ||
          'Failed to fetch active shipping methods'
      );
    }
  },

  /**
   * Get a single shipping method by ID
   * GET /shipping-methods/:id
   * Admin only
   *
   * @param id - The shipping method ID
   * @returns Promise<ShippingMethod> The shipping method
   * @throws Error if the API request fails, method not found, or user is not authorized
   */
  async getOne(id: string): Promise<ShippingMethod> {
    try {
      const response = await apiClient.get(`/shipping-methods/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching shipping method:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 404) {
        throw new Error('Shipping method not found');
      }

      throw new Error(
        error.response?.data?.message || 'Failed to fetch shipping method'
      );
    }
  },

  /**
   * Create a new shipping method
   * POST /shipping-methods
   * Admin only
   *
   * @param data - The shipping method data to create
   * @returns Promise<ShippingMethod> The created shipping method
   * @throws Error if the API request fails, validation fails, or user is not authorized
   */
  async create(data: CreateShippingMethodDto): Promise<ShippingMethod> {
    try {
      const response = await apiClient.post('/shipping-methods', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating shipping method:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message || 'Invalid shipping method data'
        );
      }
      if (error.response?.status === 409) {
        throw new Error(
          error.response?.data?.message ||
            'Shipping method with this identifier already exists'
        );
      }

      throw new Error(
        error.response?.data?.message || 'Failed to create shipping method'
      );
    }
  },

  /**
   * Update an existing shipping method
   * PATCH /shipping-methods/:id
   * Admin only
   * Note: methodId cannot be updated
   *
   * @param id - The shipping method ID
   * @param data - The shipping method data to update
   * @returns Promise<ShippingMethod> The updated shipping method
   * @throws Error if the API request fails, validation fails, or user is not authorized
   */
  async update(
    id: string,
    data: UpdateShippingMethodDto
  ): Promise<ShippingMethod> {
    try {
      const response = await apiClient.patch(`/shipping-methods/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating shipping method:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 404) {
        throw new Error('Shipping method not found');
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message || 'Invalid shipping method data'
        );
      }

      throw new Error(
        error.response?.data?.message || 'Failed to update shipping method'
      );
    }
  },

  /**
   * Delete a shipping method
   * DELETE /shipping-methods/:id
   * Admin only
   * Note: Cannot delete methods that are referenced by existing orders
   *
   * @param id - The shipping method ID
   * @returns Promise<void>
   * @throws Error if the API request fails, method is in use, or user is not authorized
   */
  async deleteMethod(id: string): Promise<void> {
    try {
      await apiClient.delete(`/shipping-methods/${id}`);
    } catch (error: any) {
      console.error('Error deleting shipping method:', error);

      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 404) {
        throw new Error('Shipping method not found');
      }
      if (error.response?.status === 409) {
        throw new Error(
          error.response?.data?.message ||
            'Cannot delete shipping method that is used by existing orders'
        );
      }

      throw new Error(
        error.response?.data?.message || 'Failed to delete shipping method'
      );
    }
  },
};
