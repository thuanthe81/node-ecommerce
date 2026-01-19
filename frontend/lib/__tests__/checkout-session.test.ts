/**
 * Tests for Checkout Session Manager
 */

import {
  createBuyNowSession,
  getSession,
  clearSession,
  isSessionExpired,
  createCartSession,
  CheckoutSession,
} from '../checkout-session';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('Checkout Session Manager', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('createBuyNowSession', () => {
    it('should create a buy-now session with correct data', () => {
      const productId = 'product-123';
      const quantity = 2;

      createBuyNowSession(productId, quantity);

      const session = getSession();

      expect(session).not.toBeNull();
      expect(session?.source).toBe('buy-now');
      expect(session?.product?.id).toBe(productId);
      expect(session?.product?.quantity).toBe(quantity);
      expect(session?.createdAt).toBeDefined();
      expect(session?.expiresAt).toBeDefined();
    });

    it('should set expiration time to 30 minutes from creation', () => {
      const productId = 'product-123';
      const quantity = 1;
      const beforeCreate = Date.now();

      createBuyNowSession(productId, quantity);

      const session = getSession();
      const afterCreate = Date.now();

      expect(session).not.toBeNull();

      // Session should expire approximately 30 minutes from now
      const expectedExpiration = 30 * 60 * 1000; // 30 minutes in ms
      const actualDuration = session!.expiresAt - session!.createdAt;

      expect(actualDuration).toBe(expectedExpiration);
      expect(session!.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(session!.createdAt).toBeLessThanOrEqual(afterCreate);
    });
  });

  describe('createCartSession', () => {
    it('should create a cart session with correct data', () => {
      createCartSession();

      const session = getSession();

      expect(session).not.toBeNull();
      expect(session?.source).toBe('cart');
      expect(session?.product).toBeUndefined();
      expect(session?.createdAt).toBeDefined();
      expect(session?.expiresAt).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', () => {
      const productId = 'product-456';
      const quantity = 3;

      createBuyNowSession(productId, quantity);
      const session = getSession();

      expect(session).not.toBeNull();
      expect(session?.product?.id).toBe(productId);
      expect(session?.product?.quantity).toBe(quantity);
    });

    it('should return null when no session exists', () => {
      const session = getSession();

      expect(session).toBeNull();
    });

    it('should return null for expired sessions', () => {
      const productId = 'product-789';
      const quantity = 1;

      // Create a session
      createBuyNowSession(productId, quantity);

      // Manually modify the session to be expired
      const sessionData = mockSessionStorage.getItem('checkout-session');
      if (sessionData) {
        const session: CheckoutSession = JSON.parse(sessionData);
        session.expiresAt = Date.now() - 1000; // Expired 1 second ago
        mockSessionStorage.setItem('checkout-session', JSON.stringify(session));
      }

      // Try to get the expired session
      const retrievedSession = getSession();

      expect(retrievedSession).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('should clear an existing session', () => {
      createBuyNowSession('product-123', 1);

      // Verify session exists
      expect(getSession()).not.toBeNull();

      // Clear the session
      clearSession();

      // Verify session is cleared
      expect(getSession()).toBeNull();
    });

    it('should not throw error when clearing non-existent session', () => {
      expect(() => clearSession()).not.toThrow();
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for valid session', () => {
      createBuyNowSession('product-123', 1);

      expect(isSessionExpired()).toBe(false);
    });

    it('should return true for expired session', () => {
      createBuyNowSession('product-123', 1);

      // Manually expire the session
      const sessionData = mockSessionStorage.getItem('checkout-session');
      if (sessionData) {
        const session: CheckoutSession = JSON.parse(sessionData);
        session.expiresAt = Date.now() - 1000; // Expired 1 second ago
        mockSessionStorage.setItem('checkout-session', JSON.stringify(session));
      }

      expect(isSessionExpired()).toBe(true);
    });

    it('should return true when no session exists', () => {
      expect(isSessionExpired()).toBe(true);
    });
  });

  describe('session round-trip', () => {
    it('should correctly store and retrieve session data', () => {
      const testCases = [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 5 },
        { productId: 'prod-3', quantity: 10 },
      ];

      testCases.forEach(({ productId, quantity }) => {
        // Clear previous session
        clearSession();

        // Create new session
        createBuyNowSession(productId, quantity);

        // Retrieve and verify
        const session = getSession();
        expect(session?.source).toBe('buy-now');
        expect(session?.product?.id).toBe(productId);
        expect(session?.product?.quantity).toBe(quantity);
      });
    });
  });

  describe('session persistence', () => {
    it('should persist session data in sessionStorage', () => {
      const productId = 'product-persist';
      const quantity = 2;

      createBuyNowSession(productId, quantity);

      // Directly check sessionStorage
      const storedData = mockSessionStorage.getItem('checkout-session');
      expect(storedData).not.toBeNull();

      const parsedData: CheckoutSession = JSON.parse(storedData!);
      expect(parsedData.source).toBe('buy-now');
      expect(parsedData.product?.id).toBe(productId);
      expect(parsedData.product?.quantity).toBe(quantity);
    });
  });
});
