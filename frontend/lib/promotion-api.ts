import apiClient from './api-client';

export interface Promotion {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orders?: Array<{
    id: string;
    orderNumber: string;
    total: number;
    createdAt: string;
  }>;
}

export interface CreatePromotionData {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface ValidatePromotionData {
  code: string;
  orderAmount: number;
}

export interface ValidatePromotionResponse {
  valid: boolean;
  promotion?: Promotion;
  discountAmount?: number;
  message?: string;
}

export const promotionApi = {
  getAll: async (): Promise<Promotion[]> => {
    const response = await apiClient.get('/promotions');
    return response.data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const response = await apiClient.get(`/promotions/${id}`);
    return response.data;
  },

  create: async (data: CreatePromotionData): Promise<Promotion> => {
    const response = await apiClient.post('/promotions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreatePromotionData>): Promise<Promotion> => {
    const response = await apiClient.patch(`/promotions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/promotions/${id}`);
  },

  validate: async (data: ValidatePromotionData): Promise<ValidatePromotionResponse> => {
    const response = await apiClient.post('/promotions/validate', data);
    return response.data;
  },
};
