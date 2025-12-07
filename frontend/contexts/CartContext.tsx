'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi, Cart } from '@/lib/cart-api';
import { productApi, Product } from '@/lib/product-api';
import { useAuth } from './AuthContext';

interface GuestCartItem {
  productId: string;
  quantity: number;
}

interface GuestCartItemWithProduct extends GuestCartItem {
  product: Product;
}

interface SyncResult {
  productId: string;
  success: boolean;
  error?: string;
}

interface CartContextType {
  cart: Cart | null;
  guestCartItems: GuestCartItemWithProduct[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncResults: SyncResult[] | null;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  syncGuestCartToBackend: () => Promise<void>;
  retrySyncFailedItems: () => Promise<void>;
  clearSyncResults: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// localStorage key for guest cart
const GUEST_CART_KEY = 'guestCart';

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('[CartContext] localStorage is not available:', e);
    return false;
  }
};

// Safe localStorage operations with fallback
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isLocalStorageAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('[CartContext] Error reading from localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (!isLocalStorageAvailable()) {
      console.warn('[CartContext] Cannot save to localStorage - storage unavailable');
      return false;
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('[CartContext] Error writing to localStorage:', e);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (!isLocalStorageAvailable()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('[CartContext] Error removing from localStorage:', e);
      return false;
    }
  },
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);
  const [localStorageWarningShown, setLocalStorageWarningShown] = useState(false);
  const { isAuthenticated } = useAuth();
  const [previousAuthState, setPreviousAuthState] = useState(false);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if localStorage is available
      if (!isLocalStorageAvailable() && !localStorageWarningShown) {
        console.warn('[CartContext] localStorage is not available. Guest cart will not persist across sessions.');
        setError('Cart storage is unavailable. Your cart will not be saved if you close this page.');
        setLocalStorageWarningShown(true);
      }

      const stored = safeLocalStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        try {
          const parsedCart = JSON.parse(stored);
          setGuestCart(parsedCart);
          console.log(`[CartContext] Loaded guest cart from localStorage: ${parsedCart.length} items`);
        } catch (err) {
          console.error('[CartContext] Failed to parse guest cart:', err);
          safeLocalStorage.removeItem(GUEST_CART_KEY);
        }
      }
    }
    setLoading(false);
  }, [localStorageWarningShown]);

  // Fetch product details for guest cart items
  useEffect(() => {
    const fetchGuestCartProducts = async () => {
      if (isAuthenticated || guestCart.length === 0) {
        setGuestCartItems([]);
        return;
      }

      console.log(`[CartContext] Fetching product details for ${guestCart.length} guest cart items`);
      setLoading(true);

      try {
        // Fetch all products once and filter by IDs
        // Note: This is not optimal for large catalogs. Consider adding a backend endpoint
        // to fetch products by IDs: GET /products/by-ids?ids=id1,id2,id3
        const productsResponse = await productApi.getProducts({ limit: 1000 });
        const productsMap = new Map(productsResponse.data.map(p => [p.id, p]));

        const itemsWithProducts: GuestCartItemWithProduct[] = [];

        for (const item of guestCart) {
          const product = productsMap.get(item.productId);

          if (product) {
            itemsWithProducts.push({
              ...item,
              product,
            });
          } else {
            console.warn(`[CartContext] Product not found for guest cart item: ${item.productId}`);
          }
        }

        setGuestCartItems(itemsWithProducts);
        console.log(`[CartContext] Loaded ${itemsWithProducts.length} guest cart items with product details`);
      } catch (err) {
        console.error('[CartContext] Error fetching guest cart products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestCartProducts();
  }, [guestCart, isAuthenticated]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[CartContext] Skipping cart refresh - user not authenticated');
      return;
    }

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
  }, [isAuthenticated]);

  // Load cart on mount for authenticated users
  const didMountRef = React.useRef(false);
  useEffect(() => {
    if (didMountRef.current) return;
    didMountRef.current = true;
    if (isAuthenticated) {
      refreshCart().then();
    }
  }, [refreshCart, isAuthenticated]);

  // Sync cart across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart-updated') {
        if (isAuthenticated) {
          refreshCart().then();
        }
      } else if (e.key === GUEST_CART_KEY && !isAuthenticated) {
        // Sync guest cart changes across tabs
        const stored = e.newValue;
        if (stored) {
          try {
            setGuestCart(JSON.parse(stored));
            console.log('[CartContext] Guest cart synced from another tab');
          } catch (err) {
            console.error('[CartContext] Failed to parse guest cart from storage event:', err);
          }
        } else {
          setGuestCart([]);
          console.log('[CartContext] Guest cart cleared from another tab');
        }
      }
    };

    if (isLocalStorageAvailable()) {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [refreshCart, isAuthenticated]);

  // Notify other tabs when cart is updated
  const notifyCartUpdate = () => {
    if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
      safeLocalStorage.setItem('cart-updated', Date.now().toString());
    }
  };

  // Sync guest cart to backend after login
  const syncGuestCartToBackend = useCallback(async () => {
    if (!isAuthenticated || guestCart.length === 0) {
      console.log('[CartContext] Skipping sync - no guest cart items or not authenticated');
      if (isAuthenticated) {
        // Fetch user's existing cart
        await refreshCart();
      }
      return;
    }

    console.log(`[CartContext] Starting cart sync - User ID: ${isAuthenticated ? 'authenticated' : 'not authenticated'}, Guest cart items: ${guestCart.length}`);
    setSyncing(true);
    setError(null);
    setSyncResults(null);

    const results: SyncResult[] = [];
    const failedItems: GuestCartItem[] = [];

    try {
      // Push each item to backend and track results
      for (const item of guestCart) {
        try {
          console.log(`[CartContext] Syncing item to backend - ProductId: ${item.productId}, Quantity: ${item.quantity}`);
          await cartApi.addItem(item.productId, item.quantity);
          results.push({ productId: item.productId, success: true });
          console.log(`[CartContext] Successfully synced item: ${item.productId}`);
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to add item';
          const statusCode = err.response?.status;

          // Categorize errors for better user feedback
          let userFriendlyError = errorMsg;
          if (statusCode === 404 || errorMsg.toLowerCase().includes('not found')) {
            userFriendlyError = 'Product no longer available';
            console.warn(`[CartContext] Product not found during sync: ${item.productId}`);
          } else if (statusCode === 400 && (errorMsg.toLowerCase().includes('stock') || errorMsg.toLowerCase().includes('insufficient'))) {
            userFriendlyError = 'Out of stock';
            console.warn(`[CartContext] Product out of stock during sync: ${item.productId}`);
          } else if (statusCode === 400 && errorMsg.toLowerCase().includes('not available')) {
            userFriendlyError = 'Product not available';
            console.warn(`[CartContext] Product not available during sync: ${item.productId}`);
          }

          console.error(`[CartContext] Failed to sync item ${item.productId}:`, {
            error: errorMsg,
            userFriendlyError,
            statusCode,
            details: err.response?.data?.details,
            timestamp: new Date().toISOString(),
          });

          results.push({ productId: item.productId, success: false, error: userFriendlyError });
          failedItems.push(item);
        }
      }

      // Store sync results for UI display
      setSyncResults(results);

      // Handle sync results
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`[CartContext] Cart sync completed - Success: ${successCount}, Failed: ${failureCount}`);

      if (failureCount === 0) {
        // All items synced successfully - clear entire guest cart
        console.log('[CartContext] All items synced successfully, clearing guest cart from localStorage');
        const removed = safeLocalStorage.removeItem(GUEST_CART_KEY);
        if (!removed) {
          console.warn('[CartContext] Could not remove guest cart from localStorage, but clearing in-memory state');
        }
        setGuestCart([]);
        setError(null);
      } else if (successCount > 0) {
        // Partial sync - keep only failed items in localStorage
        console.log(`[CartContext] Partial sync - keeping ${failedItems.length} failed items in localStorage`);
        const saved = safeLocalStorage.setItem(GUEST_CART_KEY, JSON.stringify(failedItems));
        if (!saved) {
          console.warn('[CartContext] Could not save failed items to localStorage');
        }
        setGuestCart(failedItems);

        const failedErrors = results
          .filter(r => !r.success)
          .map(r => r.error || 'Unknown error')
          .join(', ');
        setError(`Some items couldn't be added: ${failedErrors}`);
        console.warn('[CartContext] Partial sync failure:', failedErrors);
      } else {
        // All items failed - keep entire guest cart
        console.error('[CartContext] All items failed to sync, keeping guest cart in localStorage');
        const allErrors = results
          .map(r => r.error || 'Unknown error')
          .join(', ');
        setError(`Failed to sync cart: ${allErrors}`);
      }

      // Refresh cart from backend to show merged items
      console.log('[CartContext] Refreshing cart from backend to display merged items');
      await refreshCart();
      console.log('[CartContext] Cart sync process completed');
    } catch (err: any) {
      console.error('[CartContext] Unexpected error during cart sync:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
      setError('Failed to sync cart. Please try again.');
      setSyncResults([]);
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated, guestCart, refreshCart]);

  // Retry syncing failed items
  const retrySyncFailedItems = useCallback(async () => {
    console.log('[CartContext] Retrying sync for failed items');
    await syncGuestCartToBackend();
  }, [syncGuestCartToBackend]);

  // Clear sync results (dismiss notification)
  const clearSyncResults = useCallback(() => {
    console.log('[CartContext] Clearing sync results');
    setSyncResults(null);
    setError(null);
  }, []);

  // Detect login and trigger cart sync
  useEffect(() => {
    const handleLogin = async () => {
      if (isAuthenticated && !previousAuthState) {
        console.log('[CartContext] User logged in, syncing guest cart to backend');
        await syncGuestCartToBackend();
      }
      setPreviousAuthState(isAuthenticated);
    };

    handleLogin();
  }, [isAuthenticated, previousAuthState, syncGuestCartToBackend]);

  const addToCart = async (productId: string, quantity: number) => {
    try {
      setError(null);

      if (isAuthenticated) {
        // Authenticated: call backend
        console.log(`[CartContext] Adding item to backend cart - ProductId: ${productId}, Quantity: ${quantity}`);
        const updatedCart = await cartApi.addItem(productId, quantity);
        setCart(updatedCart);
        notifyCartUpdate();
        console.log(`[CartContext] Successfully added item to backend cart`);
      } else {
        // Guest: update localStorage
        console.log(`[CartContext] Adding item to guest cart - ProductId: ${productId}, Quantity: ${quantity}`);
        const existingItemIndex = guestCart.findIndex(item => item.productId === productId);

        let updatedGuestCart: GuestCartItem[];
        if (existingItemIndex >= 0) {
          // Update quantity
          updatedGuestCart = [...guestCart];
          updatedGuestCart[existingItemIndex].quantity += quantity;
          console.log(`[CartContext] Updated existing guest cart item quantity to ${updatedGuestCart[existingItemIndex].quantity}`);
        } else {
          // Add new item
          updatedGuestCart = [...guestCart, { productId, quantity }];
          console.log(`[CartContext] Added new item to guest cart`);
        }

        setGuestCart(updatedGuestCart);
        const saved = safeLocalStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedGuestCart));
        if (!saved && !localStorageWarningShown) {
          console.warn('[CartContext] Could not save guest cart to localStorage');
          setError('Cart storage is unavailable. Your cart will not be saved if you close this page.');
          setLocalStorageWarningShown(true);
        }
        console.log(`[CartContext] Guest cart saved to localStorage: ${updatedGuestCart.length} items`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add item to cart';
      console.error(`[CartContext] Error adding item:`, {
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

      if (isAuthenticated) {
        // Authenticated: call backend
        console.log(`[CartContext] Updating backend cart item quantity - ItemId: ${itemId}, Quantity: ${quantity}`);
        const updatedCart = await cartApi.updateItem(itemId, quantity);
        setCart(updatedCart);
        notifyCartUpdate();
        console.log(`[CartContext] Successfully updated backend cart item quantity`);
      } else {
        // Guest: update localStorage
        // For guest cart, itemId is actually the productId
        console.log(`[CartContext] Updating guest cart item quantity - ProductId: ${itemId}, Quantity: ${quantity}`);
        const existingItemIndex = guestCart.findIndex(item => item.productId === itemId);

        if (existingItemIndex >= 0) {
          const updatedGuestCart = [...guestCart];
          updatedGuestCart[existingItemIndex].quantity = quantity;
          setGuestCart(updatedGuestCart);
          safeLocalStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedGuestCart));
          console.log(`[CartContext] Updated guest cart item quantity to ${quantity}`);
        } else {
          console.warn(`[CartContext] Guest cart item not found: ${itemId}`);
        }
      }
    } catch (err: any) {
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

      if (isAuthenticated) {
        // Authenticated: call backend
        console.log(`[CartContext] Removing item from backend cart - ItemId: ${itemId}`);
        const updatedCart = await cartApi.removeItem(itemId);
        setCart(updatedCart);
        notifyCartUpdate();
        console.log(`[CartContext] Successfully removed item from backend cart`);
      } else {
        // Guest: update localStorage
        // For guest cart, itemId is actually the productId
        console.log(`[CartContext] Removing item from guest cart - ProductId: ${itemId}`);
        const updatedGuestCart = guestCart.filter(item => item.productId !== itemId);
        setGuestCart(updatedGuestCart);
        safeLocalStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedGuestCart));
        console.log(`[CartContext] Removed item from guest cart, ${updatedGuestCart.length} items remaining`);
      }
    } catch (err: any) {
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

      if (isAuthenticated) {
        // Authenticated: call backend
        console.log(`[CartContext] Clearing backend cart`);
        const updatedCart = await cartApi.clearCart();
        setCart(updatedCart);
        notifyCartUpdate();
        console.log(`[CartContext] Successfully cleared backend cart`);
      } else {
        // Guest: clear localStorage
        console.log(`[CartContext] Clearing guest cart`);
        setGuestCart([]);
        safeLocalStorage.removeItem(GUEST_CART_KEY);
        console.log(`[CartContext] Successfully cleared guest cart`);
      }
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

  // Calculate item count and subtotal based on authentication state
  const itemCount = isAuthenticated
    ? (cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0)
    : guestCart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate subtotal including guest cart items with product details
  const subtotal = isAuthenticated
    ? (cart?.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) || 0)
    : guestCartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        guestCartItems,
        loading,
        error,
        syncing,
        syncResults,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        syncGuestCartToBackend,
        retrySyncFailedItems,
        clearSyncResults,
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