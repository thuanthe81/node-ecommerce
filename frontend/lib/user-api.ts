import apiClient from './api-client';
import { User } from './auth-api';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
}

export interface UpdatePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface Address {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  updatePassword: async (data: UpdatePasswordData): Promise<{ message: string }> => {
    const response = await apiClient.put('/users/password', data);
    return response.data;
  },

  getAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get('/users/addresses');
    return response.data;
  },

  getAddress: async (id: string): Promise<Address> => {
    const response = await apiClient.get(`/users/addresses/${id}`);
    return response.data;
  },

  createAddress: async (data: CreateAddressData): Promise<Address> => {
    const response = await apiClient.post('/users/addresses', data);
    return response.data;
  },

  updateAddress: async (id: string, data: UpdateAddressData): Promise<Address> => {
    const response = await apiClient.put(`/users/addresses/${id}`, data);
    return response.data;
  },

  deleteAddress: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/users/addresses/${id}`);
    return response.data;
  },
};
