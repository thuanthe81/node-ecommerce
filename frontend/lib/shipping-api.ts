import apiClient from './api-client';

export interface GenerateLabelData {
  orderId: string;
  carrier: string;
}

export interface ShippingLabel {
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
}

export const shippingApi = {
  /**
   * Generate a shipping label for an order
   */
  async generateLabel(data: GenerateLabelData): Promise<ShippingLabel> {
    const response = await apiClient.post('/shipping/generate-label', data);
    return response.data;
  },
};
