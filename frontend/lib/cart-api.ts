import apiClient from './api-client';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product: {
    id: string;
    slug: string;
    nameEn: string;
    nameVi: string;
    price: string;
    stockQuantity: number;
    images: Array<{
      id: string;
      url: string;
      altTextEn?: string;
      altTextVi?: string;
    }>;
  };
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  expiresAt: string;
  items: CartItem[];
}

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.get('/cart', {
      headers: sessionId ? { 'x-session-id': sessionId } : {},
    });
    return response.data;
  },

  addItem: async (productId: string, quantity: number): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.post(
      '/cart/items',
      { productId, quantity },
      {
        headers: sessionId ? { 'x-session-id': sessionId } : {},
      }
    );
    return response.data;
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.put(
      `/cart/items/${itemId}`,
      { quantity },
      {
        headers: sessionId ? { 'x-session-id': sessionId } : {},
      }
    );
    return response.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.delete(`/cart/items/${itemId}`, {
      headers: sessionId ? { 'x-session-id': sessionId } : {},
    });
    return response.data;
  },

  clearCart: async (): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.delete('/cart', {
      headers: sessionId ? { 'x-session-id': sessionId } : {},
    });
    return response.data;
  },

  mergeGuestCart: async (): Promise<Cart> => {
    const sessionId = getSessionId();
    const response = await apiClient.post(
      '/cart/merge',
      {},
      {
        headers: sessionId ? { 'x-session-id': sessionId } : {},
      }
    );
    return response.data;
  },
};

// Helper function to get or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}
