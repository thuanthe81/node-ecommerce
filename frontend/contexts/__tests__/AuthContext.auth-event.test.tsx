/**
 * Tests for AuthContext auth:logout event handling
 * Validates Requirements: 6.1, 6.2, 6.3, 6.5
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock auth API
jest.mock('@/lib/auth-api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

describe('AuthContext auth:logout Event Handling', () => {
  let mockPush: jest.Mock;
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

    // Setup router mock
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Default pathname
    (usePathname as jest.Mock).mockReturnValue('/en/checkout');

    jest.clearAllMocks();
  });

  // Test component to access auth context
  const TestComponent = () => {
    const { user } = useAuth();
    return <div data-testid="user-state">{user ? 'authenticated' : 'unauthenticated'}</div>;
  };

  describe('Event Listener Setup', () => {
    it('should handle auth:logout event with client-side navigation (Requirement 6.2)', async () => {
      // Setup: User is authenticated
      mockLocalStorage['user'] = JSON.stringify({ id: '1', email: 'test@example.com' });
      mockLocalStorage['accessToken'] = 'token';

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify initial state
      await waitFor(() => {
        expect(getByTestId('user-state').textContent).toBe('authenticated');
      });

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: router.push was called (client-side navigation, no page reload)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/login');
      });

      // Verify: user state was cleared
      await waitFor(() => {
        expect(getByTestId('user-state').textContent).toBe('unauthenticated');
      });
    });

    it('should NOT use window.location.href (Requirement 6.1)', async () => {
      const originalHref = window.location.href;

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Verify: window.location.href was not changed (no page reload)
      expect(window.location.href).toBe(originalHref);
    });
  });

  describe('Locale Preservation', () => {
    it('should preserve English locale in redirect URL (Requirement 6.3)', async () => {
      (usePathname as jest.Mock).mockReturnValue('/en/checkout');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: redirected to /en/login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/login');
      });
    });

    it('should preserve Vietnamese locale in redirect URL (Requirement 6.3)', async () => {
      (usePathname as jest.Mock).mockReturnValue('/vi/checkout');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: redirected to /vi/login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/vi/login');
      });
    });

    it('should handle root path with default locale (Requirement 6.3)', async () => {
      (usePathname as jest.Mock).mockReturnValue('/');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: redirected to /en/login (default locale)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/login');
      });
    });

    it('should extract locale from nested paths (Requirement 6.3)', async () => {
      (usePathname as jest.Mock).mockReturnValue('/en/account/orders');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: redirected to /en/login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/login');
      });
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up event listener on unmount (Requirement 6.5)', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify: event listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith('auth:logout', expect.any(Function));

      // Get the handler function that was registered
      const handler = addEventListenerSpy.mock.calls.find(
        call => call[0] === 'auth:logout'
      )?.[1];

      // Unmount component
      unmount();

      // Verify: event listener was removed with the same handler
      expect(removeEventListenerSpy).toHaveBeenCalledWith('auth:logout', handler);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should not respond to events after unmount', async () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Unmount component
      unmount();

      // Clear previous calls
      mockPush.mockClear();

      // Dispatch event after unmount
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: router.push was NOT called
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      }, { timeout: 100 });
    });
  });

  describe('User State Management', () => {
    it('should clear user state when auth:logout event is received', async () => {
      // Setup: User is authenticated
      mockLocalStorage['user'] = JSON.stringify({ id: '1', email: 'test@example.com' });
      mockLocalStorage['accessToken'] = 'token';

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify initial authenticated state
      await waitFor(() => {
        expect(getByTestId('user-state').textContent).toBe('authenticated');
      });

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: user state was cleared
      await waitFor(() => {
        expect(getByTestId('user-state').textContent).toBe('unauthenticated');
      });
    });
  });

  describe('Integration with Router', () => {
    it('should use Next.js router for navigation (Requirement 6.2)', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Dispatch auth:logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      // Verify: router.push was called (not window.location)
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
      });
    });
  });
});
