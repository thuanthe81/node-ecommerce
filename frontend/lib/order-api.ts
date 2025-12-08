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
};
