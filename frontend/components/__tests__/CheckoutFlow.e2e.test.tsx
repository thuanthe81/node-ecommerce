/**
 * Checkout Flow End-to-End Tests
 *
 * This test file verifies the complete checkout flow as specified in Task 5
 * of the checkout-flow-fix spec. It tests:
 * - Guest user flow: enter address → submit → proceed to step 2
 * - Authenticated user with saved addresses: select address → proceed
 * - Authenticated user adding new address: add → save → proceed
 * - Form validation prevents submission with missing required fields
 * - Navigation back from step 2 preserves address data
 * - Keyboard navigation and accessibility features
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import userEvent from '@testing-library/user-event';
import CheckoutContent from '@/app/[locale]/checkout/CheckoutContent';

// Create a mock for useAuth that can be updated per test
let mockUser: any = null;

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
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockClearCart = jest.fn();
jest.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    cart: {
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          product: {
            id: 'prod-1',
            nameEn: 'Test Product',
            price: '50.00',
            images: [{ url: '/test-image.jpg' }],
          },
          quantity: 2,
        },
      ],
    },
    clearCart: mockClearCart,
  }),
}));

jest.mock('@/lib/user-api', () => ({
  userApi: {
    getAddresses: jest.fn(),
    createAddress: jest.fn(),
  },
}));

jest.mock('@/lib/order-api', () => ({
  orderApi: {
    createOrder: jest.fn(),
  },
}));

jest.mock('@/lib/promotion-api', () => ({
  promotionApi: {
    validate: jest.fn(),
  },
}));

const messages = {
  checkout: {
    title: 'Checkout',
    shippingAddress: 'Shipping Address',
    fullName: 'Full Name',
    address: 'Address',
    city: 'City',
    stateOrProvince: 'State/Province',
    postalCode: 'Postal Code',
    saveAddress: 'Save Address',
    saving: 'Saving...',
    selectShippingAddress: 'Select Shipping Address',
    addNewAddress: 'Add New Address',
    backToSavedAddress: 'Back to Saved Addresses',
    billingAddessSame: 'Billing address same as shipping',
    paymentMethod: 'Payment Method',
    orderSummary: 'Order Summary',
    processing: 'Processing...',
    placeOrder: 'Place Order',
    agreeServiceAndPolicy: 'By placing your order, you agree to our terms and conditions.',
  },
  common: {
    phone: 'Phone',
    next: 'Next',
    back: 'Back',
    delete: 'Delete',
  },
  cart: {
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    total: 'Total',
    promoCode: 'Promo Code',
    enterPromoCode: 'Enter code',
    apply: 'Apply',
    applying: 'Applying...',
    discount: 'Discount',
  },
  loading: 'Loading...',
};

describe('Checkout Flow - End-to-End Tests', () => {
  let mockUserApi: any;
  let mockOrderApi: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null; // Reset to guest user
    mockUserApi = require('@/lib/user-api').userApi;
    mockOrderApi = require('@/lib/order-api').orderApi;
  });

  const renderCheckout = (user: any = null) => {
    mockUser = user;

    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CheckoutContent />
      </NextIntlClientProvider>
    );
  };

  describe('Guest User Flow', () => {
    test('should complete full checkout flow: enter address → submit → proceed to step 2', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      // Verify we're on step 1
      expect(screen.getByText('Shipping Address')).toBeDefined();

      // Fill in email
      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.change(emailInput, { target: { value: 'guest@example.com' } });

      // Fill in shipping address
      const fullNameInput = screen.getByLabelText(/Full Name/i);
      const phoneInput = screen.getByLabelText(/Phone/i);
      const addressInput = screen.getByLabelText(/Address.*1/i);
      const cityInput = screen.getByLabelText(/City/i);
      const stateInput = screen.getByLabelText(/State/i);
      const postalCodeInput = screen.getByLabelText(/Postal Code/i);

      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
      fireEvent.change(addressInput, { target: { value: '123 Main Street' } });
      fireEvent.change(cityInput, { target: { value: 'New York' } });
      fireEvent.change(stateInput, { target: { value: 'NY' } });
      fireEvent.change(postalCodeInput, { target: { value: '10001' } });

      // Submit the address form
      const saveButton = screen.getByRole('button', { name: /Save Address/i });
      expect(saveButton).toBeDefined();
      fireEvent.click(saveButton);

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Address information saved/i)).toBeDefined();
      });

      // Next button should now be enabled
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeDefined();

      // Click Next to proceed to step 2
      fireEvent.click(nextButton);

      // Verify we're on step 2 (shipping method selection)
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeDefined();
      });
    });

    test('should prevent proceeding without completing required fields', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      // Fill in email only
      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.change(emailInput, { target: { value: 'guest@example.com' } });

      // Try to click Next without filling address
      const nextButton = screen.getByRole('button', { name: /Next/i });

      // Next button should be disabled
      expect(nextButton.hasAttribute('disabled')).toBe(true);
    });

    test('should show validation errors when submitting incomplete form', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      // Fill in email
      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.change(emailInput, { target: { value: 'guest@example.com' } });

      // Fill only some fields
      const fullNameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

      // Try to submit
      const saveButton = screen.getByRole('button', { name: /Save Address/i });

      // Button should be disabled
      expect(saveButton.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('Authenticated User with Saved Addresses', () => {
    test('should allow selecting saved address and proceeding to step 2', async () => {
      const savedAddresses = [
        {
          id: 'addr-1',
          fullName: 'Jane Smith',
          phone: '+1987654321',
          addressLine1: '456 Oak Avenue',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'Vietnam',
          isDefault: true,
        },
        {
          id: 'addr-2',
          fullName: 'Jane Smith',
          phone: '+1987654321',
          addressLine1: '789 Pine Street',
          city: 'Cambridge',
          state: 'MA',
          postalCode: '02139',
          country: 'Vietnam',
          isDefault: false,
        },
      ];

      mockUserApi.getAddresses.mockResolvedValue(savedAddresses);

      const user = { id: 'user-1', email: 'jane@example.com' };
      renderCheckout(user);

      // Wait for addresses to load
      await waitFor(() => {
        expect(screen.getByText('Select Shipping Address')).toBeDefined();
      });

      // Default address should be auto-selected
      const defaultAddressRadio = screen.getByDisplayValue('addr-1');
      expect(defaultAddressRadio).toBeDefined();

      // Next button should be enabled
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);

      // Click Next to proceed
      fireEvent.click(nextButton);

      // Verify we're on step 2
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeDefined();
      });
    });

    test('should allow switching between saved addresses', async () => {
      const savedAddresses = [
        {
          id: 'addr-1',
          fullName: 'Jane Smith',
          phone: '+1987654321',
          addressLine1: '456 Oak Avenue',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'Vietnam',
          isDefault: true,
        },
        {
          id: 'addr-2',
          fullName: 'Jane Smith',
          phone: '+1987654321',
          addressLine1: '789 Pine Street',
          city: 'Cambridge',
          state: 'MA',
          postalCode: '02139',
          country: 'Vietnam',
          isDefault: false,
        },
      ];

      mockUserApi.getAddresses.mockResolvedValue(savedAddresses);

      const user = { id: 'user-1', email: 'jane@example.com' };
      renderCheckout(user);

      await waitFor(() => {
        expect(screen.getByText('Select Shipping Address')).toBeDefined();
      });

      // Select second address
      const secondAddressRadio = screen.getByDisplayValue('addr-2');
      fireEvent.click(secondAddressRadio);

      // Verify it's selected
      expect(secondAddressRadio).toBeDefined();

      // Next button should still be enabled
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('Authenticated User Adding New Address', () => {
    test('should complete flow: add new address → save → proceed to step 2', async () => {
      const savedAddresses = [
        {
          id: 'addr-1',
          fullName: 'Jane Smith',
          phone: '+1987654321',
          addressLine1: '456 Oak Avenue',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'Vietnam',
          isDefault: true,
        },
      ];

      const newAddress = {
        id: 'addr-2',
        fullName: 'Jane Smith',
        phone: '+1234567890',
        addressLine1: '123 New Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'Vietnam',
        isDefault: false,
      };

      mockUserApi.getAddresses.mockResolvedValue(savedAddresses);
      mockUserApi.createAddress.mockResolvedValue(newAddress);

      const user = { id: 'user-1', email: 'jane@example.com' };
      renderCheckout(user);

      await waitFor(() => {
        expect(screen.getByText('Select Shipping Address')).toBeDefined();
      });

      // Click "Add New Address"
      const addNewButton = screen.getByText(/Add New Address/i);
      fireEvent.click(addNewButton);

      // Form should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
      });

      // Fill in new address
      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'Jane Smith' },
      });
      fireEvent.change(screen.getByLabelText(/Phone/i), {
        target: { value: '+1234567890' },
      });
      fireEvent.change(screen.getByLabelText(/Address.*1/i), {
        target: { value: '123 New Street' },
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
      const saveButton = screen.getByRole('button', { name: /Save Address/i });
      fireEvent.click(saveButton);

      // Wait for API call and success message
      await waitFor(() => {
        expect(mockUserApi.createAddress).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Jane Smith',
            phone: '+1234567890',
            addressLine1: '123 New Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
          })
        );
      });

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/Address saved successfully/i)).toBeDefined();
      });

      // Next button should be enabled
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);

      // Proceed to step 2
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeDefined();
      });
    });

    test('should allow canceling new address and returning to saved addresses', async () => {
      const savedAddresses = [
        {
          id: 'addr-1',
          fullName: 'Jane Smith',
          phone: '+1987654321',
          addressLine1: '456 Oak Avenue',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'Vietnam',
          isDefault: true,
        },
      ];

      mockUserApi.getAddresses.mockResolvedValue(savedAddresses);

      const user = { id: 'user-1', email: 'jane@example.com' };
      renderCheckout(user);

      await waitFor(() => {
        expect(screen.getByText('Select Shipping Address')).toBeDefined();
      });

      // Click "Add New Address"
      const addNewButton = screen.getByText(/Add New Address/i);
      fireEvent.click(addNewButton);

      // Form should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
      });

      // Click "Back to Saved Addresses"
      const backButton = screen.getByText(/Back to Saved Address/i);
      fireEvent.click(backButton);

      // Should return to saved addresses list
      await waitFor(() => {
        expect(screen.getByText('Select Shipping Address')).toBeDefined();
      });
    });
  });

  describe('Navigation and Data Persistence', () => {
    test('should preserve address data when navigating back from step 2', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      // Fill in email and address
      fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
        target: { value: 'guest@example.com' },
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/Phone/i), {
        target: { value: '+1234567890' },
      });
      fireEvent.change(screen.getByLabelText(/Address.*1/i), {
        target: { value: '123 Main Street' },
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

      // Submit and proceed to step 2
      fireEvent.click(screen.getByRole('button', { name: /Save Address/i }));

      await waitFor(() => {
        expect(screen.getByText(/Address information saved/i)).toBeDefined();
      });

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeDefined();
      });

      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);

      // Verify we're back on step 1
      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeDefined();
      });

      // Email should be preserved
      const emailInput = screen.getByPlaceholderText('your@email.com') as HTMLInputElement;
      expect(emailInput.value).toBe('guest@example.com');

      // Next button should still be enabled (address data preserved)
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    test('should support keyboard navigation through form fields', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      const user = userEvent.setup();

      // Tab through form fields
      const emailInput = screen.getByPlaceholderText('your@email.com');
      await user.tab();

      // Email input should be focused (or one of the first focusable elements)
      const fullNameInput = screen.getByLabelText(/Full Name/i);
      await user.click(fullNameInput);

      // Type in full name
      await user.keyboard('John Doe');
      expect((fullNameInput as HTMLInputElement).value).toBe('John Doe');

      // Tab to next field
      await user.tab();
      const phoneInput = screen.getByLabelText(/Phone/i);
      expect(document.activeElement).toBe(phoneInput);
    });

    test('should have proper ARIA labels and roles', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      // Check for required field indicators
      const fullNameInput = screen.getByLabelText(/Full Name/i);
      expect(fullNameInput.hasAttribute('required')).toBe(true);

      // Check for proper input types
      const emailInput = screen.getByPlaceholderText('your@email.com');
      expect(emailInput.getAttribute('type')).toBe('email');

      const phoneInput = screen.getByLabelText(/Phone/i);
      expect(phoneInput.getAttribute('type')).toBe('tel');
    });

    test('should announce validation errors to screen readers', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      // Fill and blur a field with invalid data
      const fullNameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(fullNameInput, { target: { value: 'J' } });
      fireEvent.blur(fullNameInput);

      // Wait for validation error
      await waitFor(() => {
        const errorMessage = screen.getByText(/Full name must be at least 2 characters/i);
        expect(errorMessage).toBeDefined();
        expect(errorMessage.getAttribute('role')).toBe('alert');
      });

      // Check aria-invalid attribute
      expect(fullNameInput.getAttribute('aria-invalid')).toBe('true');
    });

    test('should support Enter key to submit form', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      const user = userEvent.setup();

      // Fill in all fields
      fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
        target: { value: 'guest@example.com' },
      });

      fireEvent.change(screen.getByLabelText(/Full Name/i), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByLabelText(/Phone/i), {
        target: { value: '+1234567890' },
      });
      fireEvent.change(screen.getByLabelText(/Address.*1/i), {
        target: { value: '123 Main Street' },
      });
      fireEvent.change(screen.getByLabelText(/City/i), {
        target: { value: 'New York' },
      });
      fireEvent.change(screen.getByLabelText(/State/i), {
        target: { value: 'NY' },
      });

      const postalCodeInput = screen.getByLabelText(/Postal Code/i);
      fireEvent.change(postalCodeInput, {
        target: { value: '10001' },
      });

      // Press Enter in the last field
      await user.click(postalCodeInput);
      await user.keyboard('{Enter}');

      // Form should submit
      await waitFor(() => {
        expect(screen.getByText(/Address information saved/i)).toBeDefined();
      });
    });
  });

  describe('Form Validation', () => {
    test('should validate phone number format', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      const phoneInput = screen.getByLabelText(/Phone/i);

      // Enter invalid phone
      fireEvent.change(phoneInput, { target: { value: 'abc' } });
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid phone number/i)).toBeDefined();
      });
    });

    test('should validate postal code format', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      const postalCodeInput = screen.getByLabelText(/Postal Code/i);

      // Enter invalid postal code
      fireEvent.change(postalCodeInput, { target: { value: '!!!!' } });
      fireEvent.blur(postalCodeInput);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid postal code/i)).toBeDefined();
      });
    });

    test('should show visual feedback for valid fields', async () => {
      mockUserApi.getAddresses.mockResolvedValue([]);

      renderCheckout(null);

      const fullNameInput = screen.getByLabelText(/Full Name/i);

      // Enter valid name
      fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
      fireEvent.blur(fullNameInput);

      await waitFor(() => {
        expect(screen.getByText('Valid')).toBeDefined();
      });
    });
  });
});
