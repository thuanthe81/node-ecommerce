import apiClient from './api-client';

/**
 * Footer Settings interface
 * Represents the footer configuration for the website
 */
export interface FooterSettings {
  id: string;
  copyrightText: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  zaloUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update Footer Settings DTO
 * Data required to update footer settings
 */
export interface UpdateFooterSettingsDto {
  copyrightText: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  googleMapsUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  zaloUrl?: string;
}

/**
 * Footer Settings API client
 * Provides methods to interact with footer settings endpoints
 */
export const footerSettingsApi = {
  /**
   * Get footer settings
   * Fetches the current footer settings
   * This endpoint is public and does not require authentication
   *
   * @returns Promise<FooterSettings> The current footer settings
   * @throws Error if the API request fails
   */
  async getFooterSettings(): Promise<FooterSettings> {
    try {
      const response = await apiClient.get('/footer-settings');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching footer settings:', error);
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch footer settings'
      );
    }
  },

  /**
   * Update footer settings (Admin only)
   * Updates the footer settings with new values
   * Requires admin authentication
   *
   * @param data - The footer settings data to update
   * @returns Promise<FooterSettings> The updated footer settings
   * @throws Error if the API request fails or user is not authorized
   */
  async updateFooterSettings(
    data: UpdateFooterSettingsDto
  ): Promise<FooterSettings> {
    try {
      const response = await apiClient.patch('/footer-settings', data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating footer settings:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message ||
          'Invalid footer settings data'
        );
      }

      throw new Error(
        error.response?.data?.message ||
        'Failed to update footer settings'
      );
    }
  },
};
