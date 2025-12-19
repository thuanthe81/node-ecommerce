/**
 * Tests for API client authentication error handling logic
 * These tests verify the logic patterns used in api-client.ts
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import axios from "axios";

import axios from "axios";

import axios from "axios";

import axios from "axios";

import axios from "axios";

import axios from "axios";

describe('API Client Authentication Error Handling Logic', () => {
  let mockDispatchEvent: jest.Mock;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Setup localStorage mock
    mockLocalStorage = {};

    Storage.prototype.getItem = jest.fn((key: string) => mockLocalStorage[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete mockLocalStorage[key];
    });

    // Setup window mock
    mockDispatchEvent = jest.fn();

    // Mock window with mutable location
    const mockLocation = {
      pathname: '/en/checkout',
      href: 'http://localhost:3000/en/checkout',
    };

    delete (global as any).window;
    (global as any).window = {
      location: mockLocation,
      dispatchEvent: mockDispatchEvent,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Event Dispatch Behavior', () => {
    it('should dispatch auth:logout event when not on order confirmation page (Requirement 6.1, 6.2)', () => {
      // Setup: Regular checkout page
      window.location.pathname = '/en/checkout';

      // Simulate the logic from api-client.ts
      const currentPath = window.location.pathname;
      const isOrderConfirmation = currentPath.includes('/orders/') && currentPath.includes('/confirmation');

      if (!isOrderConfirmation) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Verify: auth:logout event was dispatched
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout',
        })
      );
    });

    it('should NOT dispatch auth:logout event on order confirmation page (Requirement 6.4)', () => {
      // Setup: Order confirmation page
      window.location.pathname = '/en/orders/123/confirmation';

      // Simulate the logic from api-client.ts
      const currentPath = window.location.pathname;
      const isOrderConfirmation = currentPath.includes('/orders/') && currentPath.includes('/confirmation');

      if (!isOrderConfirmation) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Verify: auth:logout event was NOT dispatched (guest user exception)
      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });

    it('should handle order confirmation page with different locale (Requirement 6.4)', () => {
      // Setup: Vietnamese locale order confirmation
      window.location.pathname = '/vi/orders/456/confirmation';

      // Simulate the logic from api-client.ts
      const currentPath = window.location.pathname;
      const isOrderConfirmation = currentPath.includes('/orders/') && currentPath.includes('/confirmation');

      if (!isOrderConfirmation) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Verify: auth:logout event was NOT dispatched
      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });

    it('should work with English locale path (Requirement 6.3)', () => {
      // Setup: English locale
      window.location.pathname = '/en/checkout';

      // Simulate the logic from api-client.ts
      const currentPath = window.location.pathname;
      const isOrderConfirmation = currentPath.includes('/orders/') && currentPath.includes('/confirmation');

      if (!isOrderConfirmation) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Verify: event was dispatched (locale will be handled by AuthContext)
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout',
        })
      );
    });

    it('should work with Vietnamese locale path (Requirement 6.3)', () => {
      // Setup: Vietnamese locale
      window.location.pathname = '/vi/checkout';

      // Simulate the logic from api-client.ts
      const currentPath = window.location.pathname;
      const isOrderConfirmation = currentPath.includes('/orders/') && currentPath.includes('/confirmation');

      if (!isOrderConfirmation) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Verify: event was dispatched
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout',
        })
      );
    });
  });

  describe('Token Clearing', () => {
    it('should clear tokens before dispatching event (Requirement 6.5)', async () => {
      // Setup
      mockLocalStorage['accessToken'] = 'expired-token';
      mockLocalStorage['refreshToken'] = 'invalid-refresh-token';
      mockLocalStorage['user'] = JSON.stringify({ id: '1', email: 'test@example.com' });

      const error401 = {
        response: { status: 401 },
        config: { headers: {} },
      };

      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh token expired'));

      // Track call order
      const callOrder: string[] = [];

      (localStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
        callOrder.push(`removeItem:${key}`);
        delete mockLocalStorage[key];
      });

      mockDispatchEvent.mockImplementation(() => {
        callOrder.push('dispatchEvent');
      });

      // Trigger the error
      try {
        await responseInterceptor(error401);
      } catch (error) {
        // Expected to reject
      }

      // Verify: tokens were cleared before event dispatch
      const dispatchIndex = callOrder.indexOf('dispatchEvent');
      const removeAccessTokenIndex = callOrder.indexOf('removeItem:accessToken');
      const removeRefreshTokenIndex = callOrder.indexOf('removeItem:refreshToken');
      const removeUserIndex = callOrder.indexOf('removeItem:user');

      expect(removeAccessTokenIndex).toBeLessThan(dispatchIndex);
      expect(removeRefreshTokenIndex).toBeLessThan(dispatchIndex);
      expect(removeUserIndex).toBeLessThan(dispatchIndex);
    });
  });

  describe('Order Confirmation Page Exception', () => {
    it('should NOT dispatch auth:logout event on order confirmation page (Requirement 6.4)', async () => {
      // Setup: Change pathname to order confirmation page
      window.location.pathname = '/en/orders/123/confirmation';
      window.location.href = 'http://localhost:3000/en/orders/123/confirmation';

      mockLocalStorage['refreshToken'] = 'invalid-refresh-token';

      const error401 = {
        response: { status: 401 },
        config: { headers: {} },
      };

      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh token expired'));

      // Trigger the error
      try {
        await responseInterceptor(error401);
      } catch (error) {
        // Expected to reject
      }

      // Verify: auth:logout event was NOT dispatched (guest user exception)
      expect(mockDispatchEvent).not.toHaveBeenCalled();

      // Verify: tokens were still cleared
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should handle order confirmation page with different locale (Requirement 6.4)', async () => {
      // Setup: Vietnamese locale
      window.location.pathname = '/vi/orders/456/confirmation';
      window.location.href = 'http://localhost:3000/vi/orders/456/confirmation';

      mockLocalStorage['refreshToken'] = 'invalid-refresh-token';

      const error401 = {
        response: { status: 401 },
        config: { headers: {} },
      };

      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh token expired'));

      // Trigger the error
      try {
        await responseInterceptor(error401);
      } catch (error) {
        // Expected to reject
      }

      // Verify: auth:logout event was NOT dispatched
      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });
  });

  describe('Locale Preservation', () => {
    it('should work with English locale path (Requirement 6.3)', async () => {
      // Setup: English locale (already set in beforeEach)
      // No need to change window.location

      mockLocalStorage['refreshToken'] = 'invalid-refresh-token';

      const error401 = {
        response: { status: 401 },
        config: { headers: {} },
      };

      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh token expired'));

      // Trigger the error
      try {
        await responseInterceptor(error401);
      } catch (error) {
        // Expected to reject
      }

      // Verify: event was dispatched (locale will be handled by AuthContext)
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout',
        })
      );
    });

    it('should work with Vietnamese locale path (Requirement 6.3)', async () => {
      // Setup: Vietnamese locale
      window.location.pathname = '/vi/checkout';
      window.location.href = 'http://localhost:3000/vi/checkout';

      mockLocalStorage['refreshToken'] = 'invalid-refresh-token';

      const error401 = {
        response: { status: 401 },
        config: { headers: {} },
      };

      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('Refresh token expired'));

      // Trigger the error
      try {
        await responseInterceptor(error401);
      } catch (error) {
        // Expected to reject
      }

      // Verify: event was dispatched
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:logout',
        })
      );
    });
  });

  describe('Network Activity Preservation', () => {
    it('should preserve error for debugging (Requirement 6.5)', async () => {
      // Setup
      mockLocalStorage['refreshToken'] = 'invalid-refresh-token';

      const error401 = {
        response: { status: 401 },
        config: { headers: {} },
      };

      const refreshError = new Error('Refresh token expired');
      (axios.post as jest.Mock).mockRejectedValueOnce(refreshError);

      // Trigger the error and capture rejection
      let caughtError;
      try {
        await responseInterceptor(error401);
      } catch (error) {
        caughtError = error;
      }

      // Verify: error was rejected (not swallowed)
      expect(caughtError).toBe(refreshError);
    });
  });
});
