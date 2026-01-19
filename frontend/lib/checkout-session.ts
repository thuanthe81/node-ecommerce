/**
 * Checkout Session Manager
 *
 * Manages temporary checkout state for Buy Now flow.
 * Uses sessionStorage for persistence with fallback to in-memory storage.
 * Sessions expire after 30 minutes of inactivity.
 */

const SESSION_KEY = 'checkout-session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface CheckoutSession {
  source: 'buy-now' | 'cart';
  product?: {
    id: string; // Product slug (for API lookup)
    quantity: number;
  };
  createdAt: number;
  expiresAt: number;
}

// In-memory fallback storage when sessionStorage is unavailable
let inMemorySession: CheckoutSession | null = null;

/**
 * Check if sessionStorage is available
 */
const isSessionStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const testKey = '__storage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Create a Buy Now checkout session
 */
export const createBuyNowSession = (productSlug: string, quantity: number): void => {
  const now = Date.now();
  const session: CheckoutSession = {
    source: 'buy-now',
    product: {
      id: productSlug, // Store slug for API lookup
      quantity,
    },
    createdAt: now,
    expiresAt: now + SESSION_TIMEOUT_MS,
  };

  try {
    if (isSessionStorageAvailable()) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('[Checkout Session] Created Buy Now session:', {
        productSlug,
        quantity,
        expiresAt: new Date(session.expiresAt).toISOString(),
      });
    } else {
      inMemorySession = session;
      console.warn('[Checkout Session] sessionStorage unavailable, using in-memory storage');
    }
  } catch (error) {
    console.error('[Checkout Session] Error creating session:', error);
    inMemorySession = session;
  }
};

/**
 * Get the current checkout session
 */
export const getSession = (): CheckoutSession | null => {
  try {
    if (isSessionStorageAvailable()) {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const session: CheckoutSession = JSON.parse(sessionData);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        console.log('[Checkout Session] Session expired, clearing');
        clearSession();
        return null;
      }

      return session;
    } else {
      // Use in-memory fallback
      if (inMemorySession && Date.now() > inMemorySession.expiresAt) {
        console.log('[Checkout Session] In-memory session expired, clearing');
        inMemorySession = null;
        return null;
      }
      return inMemorySession;
    }
  } catch (error) {
    console.error('[Checkout Session] Error getting session:', error);
    return inMemorySession;
  }
};

/**
 * Clear the checkout session
 */
export const clearSession = (): void => {
  try {
    if (isSessionStorageAvailable()) {
      sessionStorage.removeItem(SESSION_KEY);
      console.log('[Checkout Session] Session cleared');
    }
    inMemorySession = null;
  } catch (error) {
    console.error('[Checkout Session] Error clearing session:', error);
    inMemorySession = null;
  }
};

/**
 * Check if the current session is expired
 */
export const isSessionExpired = (): boolean => {
  const session = getSession();
  if (!session) {
    return true;
  }

  return Date.now() > session.expiresAt;
};

/**
 * Create a cart-based checkout session (for future use)
 */
export const createCartSession = (): void => {
  const now = Date.now();
  const session: CheckoutSession = {
    source: 'cart',
    createdAt: now,
    expiresAt: now + SESSION_TIMEOUT_MS,
  };

  try {
    if (isSessionStorageAvailable()) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('[Checkout Session] Created cart session');
    } else {
      inMemorySession = session;
      console.warn('[Checkout Session] sessionStorage unavailable, using in-memory storage');
    }
  } catch (error) {
    console.error('[Checkout Session] Error creating cart session:', error);
    inMemorySession = session;
  }
};
