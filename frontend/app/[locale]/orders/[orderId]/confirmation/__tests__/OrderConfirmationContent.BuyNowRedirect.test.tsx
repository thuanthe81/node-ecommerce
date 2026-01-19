/**
 * Tests for Buy Now Order Confirmation Page
 * Task 9.2: Verify order confirmation page for Buy Now
 *
 * Requirements:
 * - 5.4: Buy Now orders redirect to same confirmation page as cart orders
 * - Confirmation page displays Buy Now orders correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderConfirmationContent from '../OrderConfirmationContent';
import { useCart } from '@/contexts/CartContext';
import { getSession, clearSession } from '@/lib/checkout-session';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/components/OrderDetailView', () => {
  return function MockOrderDetailView({ orderId, locale, showSuccessBanner, showBankTransferForPaidOrders }: any) {
    return (
      <div data-testid="order-detail-view">
        <div data-testid="order-id">{orderId}</div>
        <div data-testid="locale">{locale}</div>
        <div data-testid="success-banner">{showSuccessBanner ? 'true' : 'false'}</div>
        <div data-testid="bank-transfer-info">{showBankTransferForPaidOrders ? 'true' : 'false'}</div>
      </div>
    );
  };
});

jest.mock('@/lib/checkout-session', () => ({
  getSession: jest.fn(),
  clearSession: jest.fn(),
}));

import { useParams } from 'next/navigation';

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockClearSession = clearSession as jest.MockedFunction<typeof clearSession>;

describe('OrderConfirmationContent - Buy Now Redirect (Task 9.2)', () => {
  let mockClearCart: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup cart context mock
    mockClearCart = jest.fn();
    (useCart as jest.Mock).mockReturnValue({
      clearCart: mockClearCart,
    });

    // Setup default params
    mockUseParams.mockReturnValue({
      orderId: 'test-order-123',
      locale: 'en',
    });
  });

  describe('Requirement 5.4: Same confirmation page for Buy Now and Cart', () => {
    it('should render OrderDetailView for Buy Now orders', () => {
      // Setup: Buy Now session
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: {
          id: 'product-123',
          quantity: 2,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      // Render
      render(<OrderConfirmationContent />);

      // Verify: OrderDetailView is rendered
      expect(screen.getByTestId('order-detail-view')).toBeInTheDocument();
    });

    it('should render OrderDetailView for cart orders', () => {
      // Setup: Cart session
      mockGetSession.mockReturnValue({
        source: 'cart',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      // Render
      render(<OrderConfirmationContent />);

      // Verify: OrderDetailView is rendered
      expect(screen.getByTestId('order-detail-view')).toBeInTheDocument();
    });

    it('should pass same props to OrderDetailView for Buy Now and Cart orders', () => {
      const orderId = 'order-456';
      const locale = 'vi';

      mockUseParams.mockReturnValue({
        orderId,
        locale,
      });

      // Test Buy Now
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: { id: 'prod-1', quantity: 1 },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      const { unmount: unmountBuyNow } = render(<OrderConfirmationContent />);

      // Verify Buy Now props
      expect(screen.getByTestId('order-id')).toHaveTextContent(orderId);
      expect(screen.getByTestId('locale')).toHaveTextContent(locale);
      expect(screen.getByTestId('success-banner')).toHaveTextContent('true');
      expect(screen.getByTestId('bank-transfer-info')).toHaveTextContent('true');

      unmountBuyNow();
      jest.clearAllMocks();

      // Test Cart
      mockGetSession.mockReturnValue({
        source: 'cart',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Verify Cart props (should be identical)
      expect(screen.getByTestId('order-id')).toHaveTextContent(orderId);
      expect(screen.getByTestId('locale')).toHaveTextContent(locale);
      expect(screen.getByTestId('success-banner')).toHaveTextContent('true');
      expect(screen.getByTestId('bank-transfer-info')).toHaveTextContent('true');
    });

    it('should use orderId from URL params for both Buy Now and Cart', () => {
      const testCases = [
        {
          name: 'Buy Now',
          orderId: 'buy-now-order-789',
          session: {
            source: 'buy-now' as const,
            product: { id: 'prod-1', quantity: 1 },
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000,
          },
        },
        {
          name: 'Cart',
          orderId: 'cart-order-101',
          session: {
            source: 'cart' as const,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000,
          },
        },
      ];

      testCases.forEach(({ name, orderId, session }) => {
        jest.clearAllMocks();

        mockUseParams.mockReturnValue({
          orderId,
          locale: 'en',
        });

        mockGetSession.mockReturnValue(session);

        const { unmount } = render(<OrderConfirmationContent />);

        // Verify correct orderId is passed
        expect(screen.getByTestId('order-id')).toHaveTextContent(orderId);

        unmount();
      });
    });
  });

  describe('Confirmation page display for Buy Now orders', () => {
    it('should show success banner for Buy Now orders', () => {
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: { id: 'prod-1', quantity: 1 },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Verify success banner is shown
      expect(screen.getByTestId('success-banner')).toHaveTextContent('true');
    });

    it('should show bank transfer information for Buy Now orders', () => {
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: { id: 'prod-1', quantity: 1 },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Verify bank transfer info is shown
      expect(screen.getByTestId('bank-transfer-info')).toHaveTextContent('true');
    });

    it('should display Buy Now orders in both English and Vietnamese', () => {
      const testLocales = ['en', 'vi'];

      testLocales.forEach((locale) => {
        jest.clearAllMocks();

        mockUseParams.mockReturnValue({
          orderId: 'test-order',
          locale,
        });

        mockGetSession.mockReturnValue({
          source: 'buy-now',
          product: { id: 'prod-1', quantity: 1 },
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000,
        });

        const { unmount } = render(<OrderConfirmationContent />);

        // Verify locale is passed correctly
        expect(screen.getByTestId('locale')).toHaveTextContent(locale);

        unmount();
      });
    });

    it('should handle Buy Now orders with different product quantities', () => {
      const quantities = [1, 2, 5, 10];

      quantities.forEach((quantity) => {
        jest.clearAllMocks();

        mockGetSession.mockReturnValue({
          source: 'buy-now',
          product: {
            id: `product-qty-${quantity}`,
            quantity,
          },
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000,
        });

        const { unmount } = render(<OrderConfirmationContent />);

        // Verify OrderDetailView is rendered regardless of quantity
        expect(screen.getByTestId('order-detail-view')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Navigation and URL handling', () => {
    it('should handle different order ID formats for Buy Now', () => {
      const orderIds = [
        'order-123',
        'ORD-456-ABC',
        'buy-now-789',
        '12345',
      ];

      orderIds.forEach((orderId) => {
        jest.clearAllMocks();

        mockUseParams.mockReturnValue({
          orderId,
          locale: 'en',
        });

        mockGetSession.mockReturnValue({
          source: 'buy-now',
          product: { id: 'prod-1', quantity: 1 },
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 60 * 1000,
        });

        const { unmount } = render(<OrderConfirmationContent />);

        // Verify orderId is passed correctly
        expect(screen.getByTestId('order-id')).toHaveTextContent(orderId);

        unmount();
      });
    });

    it('should use same URL structure for Buy Now and Cart orders', () => {
      // The URL structure is: /[locale]/orders/[orderId]/confirmation
      // This should be the same for both Buy Now and Cart orders

      const orderId = 'same-structure-order';
      const locale = 'en';

      mockUseParams.mockReturnValue({
        orderId,
        locale,
      });

      // Test Buy Now
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: { id: 'prod-1', quantity: 1 },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      const { unmount: unmountBuyNow } = render(<OrderConfirmationContent />);

      expect(screen.getByTestId('order-id')).toHaveTextContent(orderId);
      expect(screen.getByTestId('locale')).toHaveTextContent(locale);

      unmountBuyNow();
      jest.clearAllMocks();

      // Test Cart
      mockGetSession.mockReturnValue({
        source: 'cart',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Same URL structure (same params)
      expect(screen.getByTestId('order-id')).toHaveTextContent(orderId);
      expect(screen.getByTestId('locale')).toHaveTextContent(locale);
    });
  });

  describe('Session cleanup on confirmation page', () => {
    it('should clear session after Buy Now order confirmation', () => {
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: { id: 'prod-1', quantity: 1 },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Verify session is cleared
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });

    it('should clear session after cart order confirmation', () => {
      mockGetSession.mockReturnValue({
        source: 'cart',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Verify session is cleared
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });

    it('should not clear cart for Buy Now orders', () => {
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: { id: 'prod-1', quantity: 1 },
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Verify cart is NOT cleared for Buy Now
      expect(mockClearCart).not.toHaveBeenCalled();
    });

    it('should clear cart for cart orders', () => {
      mockGetSession.mockReturnValue({
        source: 'cart',
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      });

      render(<OrderConfirmationContent />);

      // Verify cart IS cleared for cart orders
      expect(mockClearCart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing session gracefully', () => {
      mockGetSession.mockReturnValue(null);

      render(<OrderConfirmationContent />);

      // Should still render OrderDetailView
      expect(screen.getByTestId('order-detail-view')).toBeInTheDocument();

      // Should clear cart (default behavior)
      expect(mockClearCart).toHaveBeenCalledTimes(1);

      // Should clear session
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });

    it('should handle expired Buy Now session', () => {
      mockGetSession.mockReturnValue({
        source: 'buy-now',
        product: { id: 'prod-1', quantity: 1 },
        createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
        expiresAt: Date.now() - 30 * 60 * 1000, // Expired 30 minutes ago
      });

      render(<OrderConfirmationContent />);

      // Should still render confirmation page
      expect(screen.getByTestId('order-detail-view')).toBeInTheDocument();

      // Should not clear cart (Buy Now behavior)
      expect(mockClearCart).not.toHaveBeenCalled();

      // Should clear session
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });
  });
});
