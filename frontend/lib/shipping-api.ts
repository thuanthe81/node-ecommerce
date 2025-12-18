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
  locale?: 'en' | 'vi';
}

export interface ShippingRate {
  method: string;  // Backend returns 'method' not 'methodId'
  nameEn: string;        // Always include English for fallback
  nameVi: string;        // Always include Vietnamese for frontend switching
  descriptionEn: string; // Always include English for fallback
  descriptionVi: string; // Always include Vietnamese for frontend switching
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
