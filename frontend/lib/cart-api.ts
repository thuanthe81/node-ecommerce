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
    try {
      const sessionId = getSessionId();
      console.log(`[Cart API] Getting cart with session ID: ${sessionId}`);
      const response = await apiClient.get('/cart', {
        headers: sessionId ? { 'x-session-id': sessionId } : {},
      });
      syncSessionId(response.data);
      console.log(`[Cart API] Successfully retrieved cart`);
      return response.data;
    } catch (error: any) {
      console.error('[Cart API] Error getting cart:', {
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  addItem: async (productId: string, quantity: number): Promise<Cart> => {
    try {
      const sessionId = getSessionId();
      console.log(`[Cart API] Adding item to cart - ProductId: ${productId}, Quantity: ${quantity}, SessionId: ${sessionId}`);
      const response = await apiClient.post(
        '/cart/items',
        { productId, quantity },
        {
          headers: sessionId ? { 'x-session-id': sessionId } : {},
        }
      );
      syncSessionId(response.data);
      console.log(`[Cart API] Successfully added item to cart`);
      return response.data;
    } catch (error: any) {
      console.error('[Cart API] Error adding item to cart:', {
        productId,
        quantity,
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    try {
      const sessionId = getSessionId();
      console.log(`[Cart API] Updating item - ItemId: ${itemId}, Quantity: ${quantity}, SessionId: ${sessionId}`);
      const response = await apiClient.put(
        `/cart/items/${itemId}`,
        { quantity },
        {
          headers: sessionId ? { 'x-session-id': sessionId } : {},
        }
      );
      syncSessionId(response.data);
      console.log(`[Cart API] Successfully updated item`);
      return response.data;
    } catch (error: any) {
      console.error('[Cart API] Error updating item:', {
        itemId,
        quantity,
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    try {
      const sessionId = getSessionId();
      console.log(`[Cart API] Removing item - ItemId: ${itemId}, SessionId: ${sessionId}`);
      const response = await apiClient.delete(`/cart/items/${itemId}`, {
        headers: sessionId ? { 'x-session-id': sessionId } : {},
      });
      syncSessionId(response.data);
      console.log(`[Cart API] Successfully removed item`);
      return response.data;
    } catch (error: any) {
      console.error('[Cart API] Error removing item:', {
        itemId,
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  clearCart: async (): Promise<Cart> => {
    try {
      const sessionId = getSessionId();
      console.log(`[Cart API] Clearing cart with session ID: ${sessionId}`);
      const response = await apiClient.delete('/cart', {
        headers: sessionId ? { 'x-session-id': sessionId } : {},
      });
      syncSessionId(response.data);
      console.log(`[Cart API] Successfully cleared cart`);
      return response.data;
    } catch (error: any) {
      console.error('[Cart API] Error clearing cart:', {
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  mergeGuestCart: async (): Promise<Cart> => {
    try {
      const sessionId = getSessionId();
      console.log(`[Cart API] Merging guest cart with session ID: ${sessionId}`);
      const response = await apiClient.post(
        '/cart/merge',
        {},
        {
          headers: sessionId ? { 'x-session-id': sessionId } : {},
        }
      );
      syncSessionId(response.data);
      console.log(`[Cart API] Successfully merged guest cart`);
      return response.data;
    } catch (error: any) {
      console.error('[Cart API] Error merging guest cart:', {
        error: error.response?.data?.message || error.message,
        details: error.response?.data?.details,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },
};

// Helper function to get or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('sessionId', sessionId);
    console.log(`[Cart API] Generated new session ID: ${sessionId}`);
  }
  return sessionId;
}

// Helper function to sync session ID from cart response
function syncSessionId(cart: Cart): void {
  if (cart.sessionId && typeof window !== 'undefined') {
    const currentSessionId = localStorage.getItem('sessionId');
    if (currentSessionId !== cart.sessionId) {
      console.log(`[Cart API] Syncing session ID: ${currentSessionId} -> ${cart.sessionId}`);
      localStorage.setItem('sessionId', cart.sessionId);
    }
  }
}
