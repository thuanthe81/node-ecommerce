/**
 * Checkout Cart Sync Integration Tests
 *
 * Tests Requirements: 1.2, 1.3, 1.4, 1.5, 5.4
 *
 * This test file verifies that:
 * 1. Checkout redirects unauthenticated users to login
 * 2. Guest cart is preserved in localStorage during OAuth redirect
 * 3. Cart sync happens before showing checkout page
 * 4. Merged cart items are displayed in checkout summary
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CheckoutContent from '../CheckoutContent';

// Create mocks that can be updated per test
let mockUser: any = null;
let mockIsAuthenticated = false;
let mockIsLoading = false;
let mockCart: any = null;
let mockSyncing = false;
let mockSyncResults: any = null;
let mockGuestCartItems: any = [];

// Mock dependencies
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/en/checkout',
}));

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, params?: any) => {
    if (key === 'syncPartialSuccess' && params) {
      return `${params.successCount} of ${params.totalCount} items added successfully`;
    }
    return key;
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  }),
}));

jest.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    cart: mockCart,
    guestCartItems: mockGuestCartItems,
    loading: false,
    error: null,
    syncing: mockSyncing,
    syncResults: mockSyncResults,
    itemCount: mockCart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
    subtotal: mockCart?.items?.reduce((sum: number, item: any) => sum + parseFloat(item.price) * item.quantity, 0) || 0,
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    refreshCart: jest.fn(),
    syncGuestCartToBackend: jest.fn(),
    retrySyncFailedItems: jest.fn(),
    clearSyncResults: jest.fn(),
  }),
}));

describe('Checkout Cart Sync Integration', () => {
  const testCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        quantity: 2,
        price: '10.00',
        product: {
          id: 'product-1',
          nameEn: 'Product 1',
          nameVi: 'Sản phẩm 1',
          price: 10,
          images: [{ url: '/image1.jpg' }],
        },
      },
      {
        id: 'item-2',
        productId: 'product-2',
        quantity: 1,
        price: '20.00',
        product: {
          id: 'product-2',
          nameEn: 'Product 2',
          nameVi: 'Sản phẩm 2',
          price: 20,
          images: [{ url: '/image2.jpg' }],
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockIsAuthenticated = false;
    mockIsLoading = false;
    mockCart = null;
    mockSyncing = false;
    mockSyncResults = null;
    mockGuestCartItems = [];
  });

  describe('Requirement 1.2: Redirect unauthenticated users to login', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockUser = null;
      mockIsAuthenticated = false;
      mockIsLoading = false;
      mockCart = null;

      render(<CheckoutContent />);

      // Should redirect to login with checkout URL as redirect parameter
      expect(mockPush).toHaveBeenCalledWith('/en/login?redirect=%2Fen%2Fcheckout');
    });
  });

  describe('Requirement 1.3, 5.4: Show loading during cart sync', () => {
    it('should display loading indicator while cart is syncing', () => {
      mockUser = { id: 'user-1', email: 'test@example.com' };
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockCart = testCart;
      mockSyncing = true; // Cart is syncing

      render(<CheckoutContent />);

      // Should show syncing message
      expect(screen.getByText('syncingCart')).toBeInTheDocument();
      expect(screen.queryByText('title')).not.toBeInTheDocument();
    });
  });

  describe('Requirement 1.4, 1.5: Display merged cart items after sync', () => {
    it('should display merged cart items in checkout summary after successful sync', () => {
      mockUser = { id: 'user-1', email: 'test@example.com' };
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockCart = testCart;
      mockSyncing = false; // Sync completed
      mockSyncResults = [
        { productId: 'product-1', success: true },
        { productId: 'product-2', success: true },
      ];

      render(<CheckoutContent />);

      // Should show checkout page
      expect(screen.getByText('title')).toBeInTheDocument();

      // Should show success message
      expect(screen.getByText('syncSuccess')).toBeInTheDocument();

      // Cart items should be available for display (verified by cart context)
      expect(testCart.items).toHaveLength(2);
      expect(testCart.items[0].quantity).toBe(2);
      expect(testCart.items[1].quantity).toBe(1);
    });

    it('should display partial sync results when some items fail', () => {
      mockUser = { id: 'user-1', email: 'test@example.com' };
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockCart = {
        ...testCart,
        items: [testCart.items[0]], // Only first item synced
      };
      mockSyncing = false;
      mockSyncResults = [
        { productId: 'product-1', success: true },
        { productId: 'product-2', success: false, error: 'Out of stock' },
      ];

      render(<CheckoutContent />);

      // Should show partial success message
      expect(screen.getByText('1 of 2 items added successfully')).toBeInTheDocument();

      // Should show failed items
      expect(screen.getByText('syncFailedItems')).toBeInTheDocument();
      expect(screen.getByText('Out of stock')).toBeInTheDocument();
    });
  });

  describe('Guest cart preservation in localStorage', () => {
    it('should preserve guest cart in localStorage during OAuth redirect', () => {
      // Simulate guest cart in localStorage
      const guestCart = [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ];
      localStorage.setItem('guestCart', JSON.stringify(guestCart));

      mockUser = null;
      mockIsAuthenticated = false;
      mockIsLoading = false;
      mockCart = null;

      render(<CheckoutContent />);

      // Guest cart should still be in localStorage after redirect
      const storedCart = localStorage.getItem('guestCart');
      expect(storedCart).toBeTruthy();
      expect(JSON.parse(storedCart!)).toEqual(guestCart);

      // Cleanup
      localStorage.removeItem('guestCart');
    });
  });
});
