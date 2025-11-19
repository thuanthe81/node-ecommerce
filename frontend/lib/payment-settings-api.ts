import apiClient from './api-client';

/**
 * Bank Transfer Settings interface
 * Represents the payment settings for bank transfer payments
 */
export interface BankTransferSettings {
  accountName: string;
  accountNumber: string;
  bankName: string;
  qrCodeUrl: string | null;
}

/**
 * Update Bank Transfer Settings DTO
 * Data required to update payment settings
 */
export interface UpdateBankTransferSettingsDto {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

/**
 * Payment Settings API client
 * Provides methods to interact with payment settings endpoints
 */
export const paymentSettingsApi = {
  /**
   * Get bank transfer settings
   * Fetches the current bank transfer payment settings
   * This endpoint is public and does not require authentication
   *
   * @returns Promise<BankTransferSettings> The current bank transfer settings
   * @throws Error if the API request fails
   */
  async getBankTransferSettings(): Promise<BankTransferSettings> {
    try {
      const response = await apiClient.get('/payment-settings/bank-transfer');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bank transfer settings:', error);
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch bank transfer settings'
      );
    }
  },

  /**
   * Update bank transfer settings (Admin only)
   * Updates the bank transfer payment settings with optional QR code image
   * Requires admin authentication
   *
   * @param data - The bank transfer settings data to update
   * @param qrCodeImage - Optional QR code image file to upload
   * @returns Promise<BankTransferSettings> The updated bank transfer settings
   * @throws Error if the API request fails or user is not authorized
   */
  async updateBankTransferSettings(
    data: UpdateBankTransferSettingsDto,
    qrCodeImage?: File
  ): Promise<BankTransferSettings> {
    try {
      // Create FormData to support file upload
      const formData = new FormData();
      formData.append('accountName', data.accountName);
      formData.append('accountNumber', data.accountNumber);
      formData.append('bankName', data.bankName);

      // Add QR code image if provided
      if (qrCodeImage) {
        formData.append('qrCodeImage', qrCodeImage);
      }

      const response = await apiClient.put(
        '/payment-settings/bank-transfer',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating bank transfer settings:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Admin access required');
      }
      if (error.response?.status === 403) {
        throw new Error('Forbidden: Insufficient permissions');
      }

      throw new Error(
        error.response?.data?.message ||
        'Failed to update bank transfer settings'
      );
    }
  },
};
