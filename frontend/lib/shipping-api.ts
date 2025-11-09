import apiClient from './api-client';

export interface ShippingItem {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  quantity: number;
}

export interface CalculateShippingRequest {
  destinationCity: string;
  destinationState: string;
  destinationPostalCode: string;
  destinationCountry: string;
  items: ShippingItem[];
  orderValue?: number;
}

export interface ShippingRate {
  method: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
  carrier?: string;
}

export const shippingApi = {
  /**
   * Calculate shipping rates
   */
  async calculateShipping(
    data: CalculateShippingRequest,
  ): Promise<ShippingRate[]> {
    const response = await apiClient.post('/shipping/calculate', data);
    return response.data;
  },
};
