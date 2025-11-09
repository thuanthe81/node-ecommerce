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
  paymentMethod: string;
  items: CreateOrderItem[];
  promotionCode?: string;
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
};
