/**
 * ShippingAddressForm Component Tests
 *
 * This test file verifies the form submission handling for guest users
 * as specified in Task 2 of the checkout-flow-fix spec.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ShippingAddressForm from '../../../components/ShippingAddressForm';

// Mock the auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }), // Guest user
}));

// Mock the user API
jest.mock('@/lib/user-api', () => ({
  userApi: {
    getAddresses: jest.fn().mockResolvedValue([]),
    createAddress: jest.fn(),
  },
}));

const messages = {
  checkout: {
    shippingAddress: 'Shipping Address',
    fullName: 'Full Name',
    address: 'Address',
    city: 'City',
    stateOrProvince: 'State/Province',
    postalCode: 'Postal Code',
    saveAddress: 'Save Address',
    saving: 'Saving...',
  },
  common: {
    phone: 'Phone',
  },
  loading: 'Loading...',
};

describe('ShippingAddressForm - Guest User Form Submission', () => {
  const mockOnAddressSelect = jest.fn();
  const mockOnNewAddress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ShippingAddressForm
          onAddressSelect={mockOnAddressSelect}
          onNewAddress={mockOnNewAddress}
          selectedAddressId={undefined}
        />
      </NextIntlClientProvider>
    );
  };

  test('should call onNewAddress with complete form data when guest user submits valid form', async () => {
    renderComponent();

    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    // Fill in all required fields
    const formData = {
      fullName: 'John Doe',
      phone: '+1234567890',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
    };

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: formData.fullName },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: formData.phone },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: formData.addressLine1 },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: formData.city },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: formData.state },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: formData.postalCode },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Address/i });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    // Verify onNewAddress was called with correct data structure
    await waitFor(() => {
      expect(mockOnNewAddress).toHaveBeenCalledTimes(1);
      expect(mockOnNewAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: 'Vietnam', // Default value
        })
      );
    });
  });

  test('should prevent submission when required fields are empty', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    // Submit button should be disabled when form is empty
    const submitButton = screen.getByRole('button', { name: /Save Address/i });
    expect(submitButton).toBeDisabled();

    // Fill only some fields
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });

    // Button should still be disabled
    expect(submitButton).toBeDisabled();

    // onNewAddress should not be called
    expect(mockOnNewAddress).not.toHaveBeenCalled();
  });

  test('should enable submit button when all required fields are filled', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Save Address/i });
    expect(submitButton).toBeDisabled();

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '10001' },
    });

    // Button should now be enabled
    expect(submitButton).not.toBeDisabled();
  });

  test('should match NewAddressData type structure', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '10001' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Address/i }));

    await waitFor(() => {
      expect(mockOnNewAddress).toHaveBeenCalled();
    });

    const calledWith = mockOnNewAddress.mock.calls[0][0];

    // Verify structure matches Omit<Address, 'id' | 'isDefault'>
    expect(calledWith).toHaveProperty('fullName');
    expect(calledWith).toHaveProperty('phone');
    expect(calledWith).toHaveProperty('addressLine1');
    expect(calledWith).toHaveProperty('city');
    expect(calledWith).toHaveProperty('state');
    expect(calledWith).toHaveProperty('postalCode');
    expect(calledWith).toHaveProperty('country');

    // Should NOT have id or isDefault
    expect(calledWith).not.toHaveProperty('id');
    expect(calledWith).not.toHaveProperty('isDefault');
  });
});

/**
 * Authenticated User Tests - Task 3
 * Tests for authenticated user new address flow with API integration
 */

describe('ShippingAddressForm - Authenticated User New Address Flow', () => {
  const mockOnAddressSelect = jest.fn();
  const mockOnNewAddress = jest.fn();
  const mockCreateAddress = jest.fn();
  const mockGetAddresses = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    jest.mock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: { id: '1', email: 'test@example.com' } }),
    }));

    // Mock user API
    const { userApi } = require('@/lib/user-api');
    userApi.createAddress = mockCreateAddress;
    userApi.getAddresses = mockGetAddresses;
  });

  const renderAuthenticatedComponent = () => {
    // Re-import to get mocked version
    const { useAuth } = require('@/contexts/AuthContext');
    jest.spyOn(require('@/contexts/AuthContext'), 'useAuth').mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
    });

    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ShippingAddressForm
          onAddressSelect={mockOnAddressSelect}
          onNewAddress={mockOnNewAddress}
          selectedAddressId={undefined}
        />
      </NextIntlClientProvider>
    );
  };

  test('should save address to user account via API when authenticated user submits', async () => {
    const savedAddresses = [
      {
        id: '1',
        fullName: 'Existing Address',
        phone: '+1111111111',
        addressLine1: '456 Old St',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'Vietnam',
        isDefault: true,
      },
    ];

    const newAddress = {
      id: '2',
      fullName: 'John Doe',
      phone: '+1234567890',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'Vietnam',
      isDefault: false,
    };

    mockGetAddresses.mockResolvedValue(savedAddresses);
    mockCreateAddress.mockResolvedValue(newAddress);

    renderAuthenticatedComponent();

    // Wait for saved addresses to load
    await waitFor(() => {
      expect(mockGetAddresses).toHaveBeenCalled();
    });

    // Click "Add New Address" button
    const addNewButton = screen.getByText(/Add New Address/i);
    fireEvent.click(addNewButton);

    // Fill in the form
    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '10001' },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Save Address/i });
    fireEvent.click(submitButton);

    // Verify API was called
    await waitFor(() => {
      expect(mockCreateAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          phone: '+1234567890',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'Vietnam',
        })
      );
    });
  });

  test('should auto-select newly created address after successful save', async () => {
    const savedAddresses = [];
    const newAddress = {
      id: '2',
      fullName: 'John Doe',
      phone: '+1234567890',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'Vietnam',
      isDefault: false,
    };

    mockGetAddresses.mockResolvedValue(savedAddresses);
    mockCreateAddress.mockResolvedValue(newAddress);

    renderAuthenticatedComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '10001' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Address/i }));

    // Verify onAddressSelect was called with new address ID
    await waitFor(() => {
      expect(mockOnAddressSelect).toHaveBeenCalledWith('2');
    });
  });

  test('should display error message when address save fails', async () => {
    const savedAddresses = [];
    const errorMessage = 'Network error: Unable to save address';

    mockGetAddresses.mockResolvedValue(savedAddresses);
    mockCreateAddress.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    renderAuthenticatedComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '10001' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Address/i }));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Verify onAddressSelect was NOT called
    expect(mockOnAddressSelect).not.toHaveBeenCalled();
  });

  test('should show loading state during address save', async () => {
    const savedAddresses = [];
    const newAddress = {
      id: '2',
      fullName: 'John Doe',
      phone: '+1234567890',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'Vietnam',
      isDefault: false,
    };

    mockGetAddresses.mockResolvedValue(savedAddresses);
    // Delay the response to test loading state
    mockCreateAddress.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(newAddress), 100);
        })
    );

    renderAuthenticatedComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '10001' },
    });

    const submitButton = screen.getByRole('button', { name: /Save Address/i });
    fireEvent.click(submitButton);

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(mockOnAddressSelect).toHaveBeenCalledWith('2');
    });
  });

  test('should clear error message when user starts editing form', async () => {
    const savedAddresses = [];
    const errorMessage = 'Network error';

    mockGetAddresses.mockResolvedValue(savedAddresses);
    mockCreateAddress.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    renderAuthenticatedComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    });

    // Fill and submit form to trigger error
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Address.*1/i), {
      target: { value: '123 Main St' },
    });
    fireEvent.change(screen.getByLabelText(/City/i), {
      target: { value: 'New York' },
    });
    fireEvent.change(screen.getByLabelText(/State/i), {
      target: { value: 'NY' },
    });
    fireEvent.change(screen.getByLabelText(/Postal Code/i), {
      target: { value: '10001' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Address/i }));

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Edit a field
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Jane Doe' },
    });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });
});
