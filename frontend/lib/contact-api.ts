import apiClient from './api-client';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}

export const submitContactForm = async (
  data: ContactFormData
): Promise<ContactFormResponse> => {
  const response = await apiClient.post('/contact', data);
  return response.data;
};
