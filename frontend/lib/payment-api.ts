import apiClient from './api-client';

export interface RefundPaymentData {
  orderId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  order: any;
  refundAmount: number;
  message: string;
}

export interface RefundInfo {
  orderId: string;
  orderNumber: string;
  canRefund: boolean;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
}

export const paymentApi = {
  /**
   * Process a refund for an order
   */
  async processRefund(data: RefundPaymentData): Promise<RefundResponse> {
    const response = await apiClient.post('/payments/refund', data);
    return response.data;
  },

  /**
   * Get refund information for an order
   */
  async getRefundInfo(orderId: string): Promise<RefundInfo> {
    const response = await apiClient.get(`/payments/refund-info/${orderId}`);
    return response.data;
  },
};
