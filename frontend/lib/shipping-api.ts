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

export interface ShippingItem {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  quantity: number;
}

export interface CalculateShippingData {
  destinationCity: string;
  destinationState: string;
  destinationPostalCode: string;
  destinationCountry: string;
  items: ShippingItem[];
  orderValue?: number;
}

export interface ShippingRate {
  method: string;  // Backend returns 'method' not 'methodId'
  name: string;
  description: string;
  cost: number;
  originalCost?: number;
  estimatedDays: string;
  carrier?: string;
  isFreeShipping: boolean;
}

export const shippingApi = {
  /**
   * Generate a shipping label for an order
   */
  async generateLabel(data: GenerateLabelData): Promise<ShippingLabel> {
    const response = await apiClient.post('/shipping/generate-label', data);
    return response.data;
  },

  /**
   * Calculate shipping rates for an order
   */
  async calculateShipping(data: CalculateShippingData): Promise<ShippingRate[]> {
    const response = await apiClient.post('/shipping/calculate', data);
    return response.data;
  },
};
