/**
 * Unit tests for OrderConfirmationContent component
 * Tests cart clearing and session cleanup logic for Buy Now vs Cart checkout
 */

import React from 'react';
import { render } from '@testing-library/react';
import OrderConfirmationContent from '../OrderConfirmationContent';
import { useCart } from '@/contexts/CartContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: () => ({
    orderId: 'test-order-123',
    locale: 'en',
  }),
}));

jest.mock('@/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/components/OrderDetailView', () => {
  return function MockOrderDetailView() {
    return <div data-testid="order-detail-view">Order Detail View</div>;
  };
});

// Mock checkout session functions
jest.mock('@/lib/checkout-session', () => ({
  getSession: jest.fn(),
  clearSession: jest.fn(),
}));

import { getSession, clearSession } from '@/lib/checkout-session';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockClearSession = clearSession as jest.MockedFunction<typeof clearSession>;

describe('OrderConfirmationContent - Order Creation Logic', () => {
  let mockClearCart: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup cart context mock
    mockClearCart = jest.fn();
    (useCart as jest.Mock).mockReturnValue({
      clearCart: mockClearCart,
    });
  });

  describe('Buy Now Checkout', () => {
    it('should NOT clear cart for Buy Now checkout', () => {
      // Setup: Buy Now session exists
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: {
          id: 'test-product-123',
          quantity: 2,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      // Render component
      render(<OrderConfirmationContent />);

      // Verify: Cart should NOT be cleared for Buy Now
      expect(mockClearCart).not.toHaveBeenCalled();
    });

    it('should clear checkout session after Buy Now order', () => {
      // Setup: Buy Now session exists
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: {
          id: 'test-product-123',
          quantity: 2,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      // Render component
      render(<OrderConfirmationContent />);

      // Verify: Session should be cleared
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cart Checkout', () => {
    it('should clear cart for cart-based checkout', () => {
      // Setup: Cart session exists
      mockGetSession.mockReturnValue({
        source: 'cart',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      // Render component
      render(<OrderConfirmationContent />);

      // Verify: Cart should be cleared for cart checkout
      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });

    it('should clear checkout session after cart order', () => {
      // Setup: Cart session exists
      mockGetSession.mockReturnValue({
        source: 'cart',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      // Render component
      render(<OrderConfirmationContent />);

      // Verify: Session should be cleared
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });

    it('should clear cart when no session exists (legacy behavior)', () => {
      // Setup: No session exists (legacy cart checkout)
      mockGetSession.mockReturnValue(null);

      // Render component
      render(<OrderConfirmationContent />);

      // Verify: Cart should be cleared (default to cart behavior)
      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });

    it('should clear session even when no session exists', () => {
      // Setup: No session exists
      mockGetSession.mockReturnValue(null);

      // Render component
      render(<OrderConfirmationContent />);

      // Verify: clearSession should still be called (safe cleanup)
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Cleanup', () => {
    it('should always clear session regardless of source', () => {
      const testCases = [
        {
          name: 'Buy Now',
          session: {
            source: 'buy-now' as const,
            product: { id: 'prod-1', quantity: 1 },
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000,
          },
        },
        {
          name: 'Cart',
          session: {
            source: 'cart' as const,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000,
          },
        },
        {
          name: 'No session',
          session: null,
        },
      ];

      testCases.forEach(({ name, session }) => {
        // Reset mocks for each test case
        jest.clearAllMocks();

        // Setup session
        mockGetSession.mockReturnValue(session);

        // Render component
        const { unmount } = render(<OrderConfirmationContent />);

        // Verify: Session should always be cleared
        expect(mockClearSession).toHaveBeenCalledTimes(1);

        // Cleanup
        unmount();
      });
    });
  });

  describe('Cart Preservation', () => {
    it('should preserve cart items for Buy Now checkout', () => {
      // Setup: Buy Now session with product
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: {
          id: 'buy-now-product',
          quantity: 3,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      // Render component
      render(<OrderConfirmationContent />);

      // Verify: Cart should NOT be cleared (preserves existing cart items)
      expect(mockClearCart).not.toHaveBeenCalled();

      // Verify: Session should be cleared (cleanup)
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });
  });
});
