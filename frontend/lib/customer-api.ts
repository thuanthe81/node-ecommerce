import apiClient from './api-client';

export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface CustomerDetail extends Customer {
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'totalOrders' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const customerApi = {
  /**
   * Get all customers with optional filters
   */
  async getAllCustomers(filters?: CustomerFilters): Promise<CustomerListResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/admin/customers?${params.toString()}`);
    return response.data;
  },

  /**
   * Get customer detail by ID
   */
  async getCustomerDetail(customerId: string): Promise<CustomerDetail> {
    const response = await apiClient.get(`/admin/customers/${customerId}`);
    return response.data;
  },

  /**
   * Export customers to CSV
   */
  async exportCustomers(filters?: CustomerFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get(`/admin/customers/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
