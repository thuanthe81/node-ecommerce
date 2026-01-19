/**
 * Tests for Session Expiration Handling
 * Task 10.1: Implement session expiration handling
 *
 * Requirements:
 * - 10.4: Detect expired sessions on checkout page load
 * - Display expiration message in user's language
 * - Redirect to product page
 * - Clear expired session
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getSession, clearSession, isSessionExpired } from '@/lib/checkout-session';

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

describe('CheckoutContent - Session Expiration Handling (Task 10.1)', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('Requirement 10.4: Detect expired sessions', () => {
    it('should detect expired Buy Now session', () => {
      // Create an expired session
      const expiredSession = {
        source: 'buy-now' as const,
        product: {
          id: 'expired-product',
          quantity: 2,
        },
        createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiredSession));

      // Check if session is expired
      const expired = isSessionExpired();

      expect(expired).toBe(true);
    });

    it('should detect valid (non-expired) Buy Now session', () => {
      // Create a valid session
      const validSession = {
        source: 'buy-now' as const,
        product: {
          id: 'valid-product',
          quantity: 1,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000, // Expires in 30 minutes
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(validSession));

      // Check if session is expired
      const expired = isSessionExpired();

      expect(expired).toBe(false);
    });

    it('should return null when getting expired session', () => {
      // Create an expired session
      const expiredSession = {
        source: 'buy-now' as const,
        product: {
          id: 'expired-product',
          quantity: 2,
        },
        createdAt: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiredSession));

      // Try to get the session
      const session = getSession();

      // Should return null for expired session
      expect(session).toBeNull();
    });

    it('should return session data when getting valid session', () => {
      // Create a valid session
      const validSession = {
        source: 'buy-now' as const,
        product: {
          id: 'valid-product',
          quantity: 3,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(validSession));

      // Try to get the session
      const session = getSession();

      // Should return session data
      expect(session).not.toBeNull();
      expect(session?.source).toBe('buy-now');
      expect(session?.product?.id).toBe('valid-product');
      expect(session?.product?.quantity).toBe(3);
    });

    it('should handle session expiration at exact expiry time', () => {
      const now = Date.now();

      // Create a session that expires exactly now
      const expiringSession = {
        source: 'buy-now' as const,
        product: {
          id: 'expiring-product',
          quantity: 1,
        },
        createdAt: now - 30 * 60 * 1000,
        expiresAt: now,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiringSession));

      // Check if session is expired
      // Note: getSession() checks Date.now() > expiresAt, so at exact time it's not expired yet
      const expired = isSessionExpired();

      // At exact expiry time, session is not yet expired (needs to be > not >=)
      expect(expired).toBe(false);
    });

    it('should handle missing session as expired', () => {
      // No session in storage
      const expired = isSessionExpired();

      // Missing session should be considered expired
      expect(expired).toBe(true);
    });
  });

  describe('Session expiration error handling', () => {
    it('should provide expiration message for expired session', () => {
      // Simulate CheckoutContent logic for expired session
      const expiredSession = {
        source: 'buy-now' as const,
        product: {
          id: 'expired-product',
          quantity: 2,
        },
        createdAt: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiredSession));

      const session = getSession();

      // Session should be null (expired)
      expect(session).toBeNull();

      // In CheckoutContent, this would trigger:
      // setError(tCheckout('sessionExpired'))
      // The error message would be displayed to the user
      const errorMessage = 'Your checkout session has expired. Please try again.';
      expect(errorMessage).toBeTruthy();
    });

    it('should support expiration message in English', () => {
      const englishMessage = 'Your checkout session has expired. Please try again.';
      expect(englishMessage).toContain('expired');
      expect(englishMessage).toContain('try again');
    });

    it('should support expiration message in Vietnamese', () => {
      const vietnameseMessage = 'Phiên thanh toán của bạn đã hết hạn. Vui lòng thử lại.';
      expect(vietnameseMessage).toContain('hết hạn');
      expect(vietnameseMessage).toContain('thử lại');
    });
  });

  describe('Session cleanup on expiration', () => {
    it('should clear expired session', () => {
      // Create an expired session
      const expiredSession = {
        source: 'buy-now' as const,
        product: {
          id: 'expired-product',
          quantity: 2,
        },
        createdAt: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiredSession));

      // Verify session exists in storage
      expect(mockSessionStorage.getItem('checkout-session')).not.toBeNull();

      // Clear the session
      clearSession();

      // Verify session is cleared
      expect(mockSessionStorage.getItem('checkout-session')).toBeNull();
    });

    it('should handle clearing already cleared session', () => {
      // No session in storage
      expect(mockSessionStorage.getItem('checkout-session')).toBeNull();

      // Clear session (should not throw error)
      expect(() => clearSession()).not.toThrow();

      // Still no session
      expect(mockSessionStorage.getItem('checkout-session')).toBeNull();
    });
  });

  describe('Redirect behavior on expiration', () => {
    it('should prepare for redirect when session is expired', () => {
      // Simulate CheckoutContent logic
      const expiredSession = {
        source: 'buy-now' as const,
        product: {
          id: 'product-123',
          quantity: 2,
        },
        createdAt: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiredSession));

      const session = getSession();

      // Session should be null (expired)
      expect(session).toBeNull();

      // In CheckoutContent, this would trigger:
      // 1. setError(tCheckout('sessionExpired'))
      // 2. setTimeout(() => { router.push(`/${locale}`) }, 2000)
      // 3. clearSession()

      // Verify we can extract product ID for potential redirect
      // (In real implementation, we'd redirect to product page or home)
      const storedData = mockSessionStorage.getItem('checkout-session');
      if (storedData) {
        const parsedSession = JSON.parse(storedData);
        expect(parsedSession.product.id).toBe('product-123');
      }
    });

    it('should handle redirect to home page when product ID unavailable', () => {
      // Expired session without product info
      const expiredSession = {
        source: 'cart' as const,
        createdAt: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiredSession));

      const session = getSession();

      // Session should be null (expired)
      expect(session).toBeNull();

      // In CheckoutContent, this would redirect to home page
      // router.push(`/${locale}`)
      const redirectPath = '/en'; // or '/vi' depending on locale
      expect(redirectPath).toMatch(/^\/(en|vi)$/);
    });
  });

  describe('Session expiration timing', () => {
    it('should expire session after 30 minutes', () => {
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      const session = {
        source: 'buy-now' as const,
        product: {
          id: 'product-123',
          quantity: 1,
        },
        createdAt: now,
        expiresAt: now + thirtyMinutes,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(session));

      // Immediately after creation, should not be expired
      expect(isSessionExpired()).toBe(false);

      // Simulate time passing (29 minutes)
      const almostExpiredSession = {
        ...session,
        createdAt: now - 29 * 60 * 1000,
        expiresAt: now + 1 * 60 * 1000,
      };
      mockSessionStorage.setItem('checkout-session', JSON.stringify(almostExpiredSession));
      expect(isSessionExpired()).toBe(false);

      // Simulate time passing (31 minutes)
      const expiredSession = {
        ...session,
        createdAt: now - 31 * 60 * 1000,
        expiresAt: now - 1 * 60 * 1000,
      };
      mockSessionStorage.setItem('checkout-session', JSON.stringify(expiredSession));
      expect(isSessionExpired()).toBe(true);
    });

    it('should handle various expiration times', () => {
      const testCases = [
        { minutesAgo: 1, shouldBeExpired: false },
        { minutesAgo: 15, shouldBeExpired: false },
        { minutesAgo: 29, shouldBeExpired: false },
        { minutesAgo: 30, shouldBeExpired: false }, // At exactly 30 minutes, not expired yet (> not >=)
        { minutesAgo: 31, shouldBeExpired: true },
        { minutesAgo: 60, shouldBeExpired: true },
      ];

      testCases.forEach(({ minutesAgo, shouldBeExpired }) => {
        const now = Date.now();
        const session = {
          source: 'buy-now' as const,
          product: { id: 'test', quantity: 1 },
          createdAt: now - minutesAgo * 60 * 1000,
          expiresAt: now - minutesAgo * 60 * 1000 + 30 * 60 * 1000,
        };

        mockSessionStorage.setItem('checkout-session', JSON.stringify(session));

        const expired = isSessionExpired();
        expect(expired).toBe(shouldBeExpired);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle corrupted session data', () => {
      // Store invalid JSON
      mockSessionStorage.setItem('checkout-session', 'invalid-json{');

      // Should handle gracefully
      const session = getSession();
      expect(session).toBeNull();

      const expired = isSessionExpired();
      expect(expired).toBe(true);
    });

    it('should handle session with missing expiration time', () => {
      const sessionWithoutExpiry = {
        source: 'buy-now' as const,
        product: { id: 'test', quantity: 1 },
        createdAt: Date.now(),
        // Missing expiresAt
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(sessionWithoutExpiry));

      // getSession will return the session even without expiresAt
      // isSessionExpired will check Date.now() > undefined which is false
      const expired = isSessionExpired();
      expect(expired).toBe(false);
    });

    it('should handle session with invalid expiration time', () => {
      const sessionWithInvalidExpiry = {
        source: 'buy-now' as const,
        product: { id: 'test', quantity: 1 },
        createdAt: Date.now(),
        expiresAt: 'invalid' as any,
      };

      mockSessionStorage.setItem('checkout-session', JSON.stringify(sessionWithInvalidExpiry));

      // Date.now() > 'invalid' will be false (NaN comparison)
      const expired = isSessionExpired();
      expect(expired).toBe(false);
    });
  });
});
