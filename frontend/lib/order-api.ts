import apiClient from './api-client';

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderData {
  email: string;
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: string;
  items: CreateOrderItem[];
  promotionCode?: string;
  promotionId?: string;
  notes?: string;
  locale?: 'en' | 'vi';
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  requiresPricing: boolean;
  shippingMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

export interface OrderItem {
  id: string;
  productId: string;
  productNameEn: string;
  productNameVi: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  product: {
    id: string;
    slug: string;
    images: Array<{
      url: string;
      altTextEn?: string;
      altTextVi?: string;
    }>;
  };
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AdminOrderFilters {
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface UpdateOrderStatusData {
  status: string;
}

export interface UpdatePaymentStatusData {
  paymentStatus: string;
  notes?: string;
}

export interface SetOrderItemPriceData {
  price: number;
}

export interface ResendEmailData {
  email: string;
  locale?: 'en' | 'vi';
}

export interface ResendEmailResponse {
  success: boolean;
  message: string;
  rateLimited?: boolean;
}

export interface CancelOrderData {
  reason?: string;
}

export interface CancelOrderResponse {
  order: Order;
  message: string;
  emailSent: boolean;
}

export interface CancelOrderError {
  status: number;
  code: string;
  message: string;
  details?: any;
}

export class OrderCancellationError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(error: CancelOrderError) {
    super(error.message);
    this.name = 'OrderCancellationError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

/**
 * Helper function to get user-friendly error messages for cancellation failures
 */
export function getCancellationErrorMessage(error: OrderCancellationError, locale: 'en' | 'vi' = 'en'): string {
  const messages = {
    en: {
      400: 'This order cannot be cancelled. It may have already been processed or shipped.',
      401: 'Your session has expired. Please refresh the page and try again.',
      403: 'You do not have permission to cancel this order.',
      404: 'Order not found. Please check the order number and try again.',
      429: 'Too many cancellation requests. Please wait a moment before trying again.',
      500: 'A server error occurred while cancelling your order. Please try again or contact support.',
      default: 'Failed to cancel order. Please try again or contact support if the problem persists.',
    },
    vi: {
      400: 'Không thể hủy đơn hàng này. Đơn hàng có thể đã được xử lý hoặc giao hàng.',
      401: 'Phiên làm việc đã hết hạn. Vui lòng làm mới trang và thử lại.',
      403: 'Bạn không có quyền hủy đơn hàng này.',
      404: 'Không tìm thấy đơn hàng. Vui lòng kiểm tra số đơn hàng và thử lại.',
      429: 'Quá nhiều yêu cầu hủy đơn. Vui lòng đợi một chút trước khi thử lại.',
      500: 'Đã xảy ra lỗi máy chủ khi hủy đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
      default: 'Không thể hủy đơn hàng. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.',
    },
  };

  const localeMessages = messages[locale];
  return localeMessages[error.status as keyof typeof localeMessages] || localeMessages.default;
}

export const orderApi = {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  /**
   * Get all orders for the current user
   */
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  /**
   * Get a single order by ID
   */
  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  /**
   * Get all orders (admin only)
   */
  async getAllOrders(filters?: AdminOrderFilters): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get(`/orders/admin/all?${params.toString()}`);
    return response.data;
  },

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(id: string, data: UpdateOrderStatusData): Promise<Order> {
    const response = await apiClient.patch(`/orders/${id}/status`, data);
    return response.data;
  },

  /**
   * Update order payment status (admin only)
   */
  async updateOrderPaymentStatus(id: string, data: UpdatePaymentStatusData): Promise<Order> {
    const response = await apiClient.patch(`/orders/${id}/payment-status`, data);
    return response.data;
  },

  /**
   * Set price for a zero-price order item (admin only)
   */
  async setOrderItemPrice(
    orderId: string,
    orderItemId: string,
    data: SetOrderItemPriceData
  ): Promise<Order> {
    const response = await apiClient.patch(
      `/orders/${orderId}/items/${orderItemId}/price`,
      data
    );
    return response.data;
  },

  /**
   * Resend order confirmation email with PDF attachment
   */
  async resendOrderEmail(
    orderNumber: string,
    data: ResendEmailData
  ): Promise<ResendEmailResponse> {
    const response = await apiClient.post(`/orders/${orderNumber}/resend-email`, data);
    return response.data;
  },

  /**
   * Cancel an order
   *
   * Handles various cancellation failure scenarios:
   * - 400: Order not cancellable (wrong status)
   * - 401: Unauthorized (session expired)
   * - 403: Forbidden (access denied)
   * - 404: Order not found
   * - 429: Rate limited (too many requests)
   * - 500: Server error (processing failure)
   */
  async cancelOrder(id: string, data?: CancelOrderData): Promise<CancelOrderResponse> {
    try {
      const response = await apiClient.patch(`/orders/${id}/cancel`, data || {});
      return response.data;
    } catch (error: any) {
      // Extract error information from the response
      const status = error.response?.status || 500;
      const errorData = error.response?.data || {};
      const message = errorData.message || 'An unexpected error occurred while cancelling the order';
      const code = errorData.code || 'UNKNOWN_ERROR';

      // Create structured error object
      const cancelError: CancelOrderError = {
        status,
        code,
        message,
        details: errorData.details || errorData,
      };

      // Throw custom error with structured information
      throw new OrderCancellationError(cancelError);
    }
  },
};
