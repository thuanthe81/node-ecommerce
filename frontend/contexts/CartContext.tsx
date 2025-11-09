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
      const cartData = await cartApi.getCart();
      setCart(cartData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load cart');
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cart on mount and when user changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Merge guest cart with user cart on login
  useEffect(() => {
    const mergeCart = async () => {
      if (user && cart && !cart.userId) {
        try {
          await cartApi.mergeGuestCart();
          await refreshCart();
        } catch (err) {
          console.error('Error merging cart:', err);
        }
      }
    };
    mergeCart();
  }, [user, cart, refreshCart]);

  // Sync cart across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart-updated') {
        refreshCart();
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
      const updatedCart = await cartApi.addItem(productId, quantity);
      setCart(updatedCart);
      notifyCartUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add item to cart');
      throw err;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setError(null);
      const updatedCart = await cartApi.updateItem(itemId, quantity);
      setCart(updatedCart);
      notifyCartUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
      throw err;
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setError(null);
      const updatedCart = await cartApi.removeItem(itemId);
      setCart(updatedCart);
      notifyCartUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove item');
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      const updatedCart = await cartApi.clearCart();
      setCart(updatedCart);
      notifyCartUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear cart');
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
