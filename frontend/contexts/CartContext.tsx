'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi, Cart, CartItem } from '@/lib/cart-api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[CartContext] Refreshing cart`);
      const cartData = await cartApi.getCart();
      setCart(cartData);
      console.log(`[CartContext] Successfully refreshed cart`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load cart';
      console.error('[CartContext] Error loading cart:', {
        error: errorMessage,
        details: err.response?.data?.details,
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cart on mount and when user changes
  const didMountRef = React.useRef(false);
  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    refreshCart().then();
  }, [refreshCart]);

  // Merge guest cart with user cart on login
  useEffect(() => {
    const mergeCart = async () => {
      try {
        await cartApi.mergeGuestCart();
        await refreshCart();
      } catch (err) {
        console.error('Error merging cart:', err);
      }
    };
    if (user && cart && !cart.userId) {
      mergeCart().then();
    }
  }, [user, cart, refreshCart]);

  // Sync cart across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart-updated') {
        refreshCart().then();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshCart]);

  // Notify other tabs when cart is updated
  const notifyCartUpdate = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart-updated', Date.now().toString());
    }
  };

  const addToCart = async (productId: string, quantity: number) => {
    try {
      setError(null);
      console.log(`[CartContext] Adding item to cart - ProductId: ${productId}, Quantity: ${quantity}`);
      const updatedCart = await cartApi.addItem(productId, quantity);
      setCart(updatedCart);
      notifyCartUpdate();
      console.log(`[CartContext] Successfully added item to cart`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add item to cart';
      console.error(`[CartContext] Error adding item to cart:`, {
        productId,
        quantity,
        error: errorMessage,
        details: err.response?.data?.details,
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
      throw err;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setError(null);
      console.log(`[CartContext] Updating item quantity - ItemId: ${itemId}, Quantity: ${quantity}`);
      const updatedCart = await cartApi.updateItem(itemId, quantity);
      setCart(updatedCart);
      notifyCartUpdate();
      console.log(`[CartContext] Successfully updated item quantity`);
    } catch (err: any) {
      // Check if it's a session mismatch error
      if (err.response?.data?.message?.includes('does not belong to session') ||
          err.response?.data?.error === 'CART_SESSION_MISMATCH') {
        console.log('[CartContext] Session mismatch detected in updateQuantity, refreshing cart and retrying...', {
          itemId,
          quantity,
          errorDetails: err.response?.data?.details,
        });
        try {
          // Refresh cart to sync session ID
          await refreshCart();
          console.log('[CartContext] Cart refreshed, retrying updateQuantity...');
          // Retry the operation once
          const updatedCart = await cartApi.updateItem(itemId, quantity);
          setCart(updatedCart);
          notifyCartUpdate();
          console.log('[CartContext] Successfully updated item quantity after retry');
          return; // Success on retry
        } catch (retryErr: any) {
          console.error('[CartContext] Retry failed for updateQuantity:', {
            itemId,
            quantity,
            error: retryErr.response?.data?.message,
            details: retryErr.response?.data?.details,
            timestamp: new Date().toISOString(),
          });
          setError('Failed to update quantity. Please refresh the page and try again.');
          throw retryErr;
        }
      }

      const errorMessage = err.response?.data?.message || 'Failed to update item';
      console.error(`[CartContext] Error updating item quantity:`, {
        itemId,
        quantity,
        error: errorMessage,
        details: err.response?.data?.details,
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
      throw err;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setError(null);
      console.log(`[CartContext] Removing item from cart - ItemId: ${itemId}`);
      const updatedCart = await cartApi.removeItem(itemId);
      setCart(updatedCart);
      notifyCartUpdate();
      console.log(`[CartContext] Successfully removed item from cart`);
    } catch (err: any) {
      // Check if it's a session mismatch error
      if (err.response?.data?.message?.includes('does not belong to session') ||
          err.response?.data?.error === 'CART_SESSION_MISMATCH') {
        console.log('[CartContext] Session mismatch detected in removeItem, refreshing cart and retrying...', {
          itemId,
          errorDetails: err.response?.data?.details,
        });
        try {
          // Refresh cart to sync session ID
          await refreshCart();
          console.log('[CartContext] Cart refreshed, retrying removeItem...');
          // Retry the operation once
          const updatedCart = await cartApi.removeItem(itemId);
          setCart(updatedCart);
          notifyCartUpdate();
          console.log('[CartContext] Successfully removed item from cart after retry');
          return; // Success on retry
        } catch (retryErr: any) {
          console.error('[CartContext] Retry failed for removeItem:', {
            itemId,
            error: retryErr.response?.data?.message,
            details: retryErr.response?.data?.details,
            timestamp: new Date().toISOString(),
          });
          setError('Failed to remove item. Please refresh the page and try again.');
          throw retryErr;
        }
      }

      const errorMessage = err.response?.data?.message || 'Failed to remove item';
      console.error(`[CartContext] Error removing item from cart:`, {
        itemId,
        error: errorMessage,
        details: err.response?.data?.details,
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      console.log(`[CartContext] Clearing cart`);
      const updatedCart = await cartApi.clearCart();
      setCart(updatedCart);
      notifyCartUpdate();
      console.log(`[CartContext] Successfully cleared cart`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to clear cart';
      console.error(`[CartContext] Error clearing cart:`, {
        error: errorMessage,
        details: err.response?.data?.details,
        timestamp: new Date().toISOString(),
      });
      setError(errorMessage);
      throw err;
    }
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subtotal = cart?.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  ) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}