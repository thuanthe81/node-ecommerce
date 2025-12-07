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
  userId: string;
  expiresAt: string;
  items: CartItem[];
}

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    try {
      console.log(`[Cart API] Getting cart for authenticated user`);
      const response = await apiClient.get('/cart');
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
      console.log(`[Cart API] Adding item to cart - ProductId: ${productId}, Quantity: ${quantity}`);
      const response = await apiClient.post('/cart/items', { productId, quantity });
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
      console.log(`[Cart API] Updating item - ItemId: ${itemId}, Quantity: ${quantity}`);
      const response = await apiClient.put(`/cart/items/${itemId}`, { quantity });
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
      console.log(`[Cart API] Removing item - ItemId: ${itemId}`);
      const response = await apiClient.delete(`/cart/items/${itemId}`);
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
      console.log(`[Cart API] Clearing cart for authenticated user`);
      const response = await apiClient.delete('/cart');
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
};
