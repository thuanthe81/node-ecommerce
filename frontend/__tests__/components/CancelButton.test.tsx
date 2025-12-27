/**
 * CancelButton component tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CancelButton } from '@/components/OrderDetailView/components/CancelButton';
import { Order } from '@/lib/order-api';

// Mock useTranslations hook
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      cancelOrderButton: 'Cancel Order',
    };
    return translations[key] || key;
  },
}));

const mockOrder: Order = {
  id: '123',
  orderNumber: 'ORD-123',
  userId: 'user-123',
  email: 'test@example.com',
  status: 'PENDING',
  subtotal: 100000,
  shippingCost: 20000,
  taxAmount: 0,
  discountAmount: 0,
  total: 120000,
  requiresPricing: false,
  shippingMethod: 'standard',
  paymentMethod: 'bank_transfer',
  paymentStatus: 'PENDING',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  items: [],
  shippingAddress: {
    id: '1',
    fullName: 'Test User',
    phone: '123456789',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Vietnam',
  },
  billingAddress: {
    id: '1',
    fullName: 'Test User',
    phone: '123456789',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Vietnam',
  },
};

describe('CancelButton', () => {
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render for PENDING orders', () => {
    const pendingOrder = { ...mockOrder, status: 'PENDING' };
    render(
      <CancelButton
        order={pendingOrder}
        onCancel={mockOnCancel}
        locale="en"
      />
    );

    expect(screen.getByText('Cancel Order')).toBeInTheDocument();
  });

  it('should render for PROCESSING orders', () => {
    const processingOrder = { ...mockOrder, status: 'PROCESSING' };
    render(
      <CancelButton
        order={processingOrder}
        onCancel={mockOnCancel}
        locale="en"
      />
    );

    expect(screen.getByText('Cancel Order')).toBeInTheDocument();
  });

  it('should not render for SHIPPED orders', () => {
    const shippedOrder = { ...mockOrder, status: 'SHIPPED' };
    render(
      <CancelButton
        order={shippedOrder}
        onCancel={mockOnCancel}
        locale="en"
      />
    );

    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
  });

  it('should not render for DELIVERED orders', () => {
    const deliveredOrder = { ...mockOrder, status: 'DELIVERED' };
    render(
      <CancelButton
        order={deliveredOrder}
        onCancel={mockOnCancel}
        locale="en"
      />
    );

    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
  });

  it('should not render for CANCELLED orders', () => {
    const cancelledOrder = { ...mockOrder, status: 'CANCELLED' };
    render(
      <CancelButton
        order={cancelledOrder}
        onCancel={mockOnCancel}
        locale="en"
      />
    );

    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
  });

  it('should call onCancel when clicked', () => {
    const pendingOrder = { ...mockOrder, status: 'PENDING' };
    render(
      <CancelButton
        order={pendingOrder}
        onCancel={mockOnCancel}
        locale="en"
      />
    );

    fireEvent.click(screen.getByText('Cancel Order'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const pendingOrder = { ...mockOrder, status: 'PENDING' };
    render(
      <CancelButton
        order={pendingOrder}
        onCancel={mockOnCancel}
        disabled={true}
        locale="en"
      />
    );

    const button = screen.getByText('Cancel Order');
    expect(button).toBeDisabled();
  });
});