import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ShippingMethodSelector } from '../../../components/ShippingMethodSelector/ShippingMethodSelector';
import * as fc from 'fast-check';
import { NextIntlClientProvider } from 'next-intl';

// Mock the shipping API
jest.mock('../../../lib/shipping-api', () => ({
  calculateShipping: jest.fn(),
}));

import { calculateShipping } from '../../../lib/shipping-api';

/**
 * Property-Based Tests for ShippingMethodSelector Localization
 *
 * These tests verify universal properties that should hold across all valid executions
 * of the frontend shipping method localization, using fast-check for property-based testing.
 */
describe('ShippingMethodSelector - Locale Property-Based Tests', () => {
  const mockCalculateShipping = calculateShipping as jest.MockedFunction<typeof calculateShipping>;

  const createMockMessages = (locale: string) => ({
    common: {
      loading: locale === 'vi' ? 'Đang tải...' : 'Loading...',
      error: locale === 'vi' ? 'Lỗi' : 'Error',
    },
    checkout: {
      shippingMethod: locale === 'vi' ? 'Phương thức giao hàng' : 'Shipping Method',
      selectShipping: locale === 'vi' ? 'Chọn phương thức giao hàng' : 'Select shipping method',
    },
  });

  const renderWithIntl = (component: React.ReactElement, locale: string) => {
    const messages = createMockMessages(locale);
    return render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        {component}
      </NextIntlClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: shipping-method-localization, Property 8: Frontend locale passing**
   * **Validates: Requirements 3.1**
   *
   * Property 8: Frontend locale passing
   * For any shipping method request from the frontend, the current user locale
   * should be included in the API call parameters
   */
  it('Property 8: Frontend locale passing - should pass current locale to API calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('en', 'vi'),
          shippingData: fc.record({
            weight: fc.float({ min: 0.1, max: 50 }),
            dimensions: fc.record({
              length: fc.float({ min: 1, max: 100 }),
              width: fc.float({ min: 1, max: 100 }),
              height: fc.float({ min: 1, max: 100 }),
            }),
            destination: fc.record({
              city: fc.string({ minLength: 1, maxLength: 50 }),
              district: fc.string({ minLength: 1, maxLength: 50 }),
              ward: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          shippingMethods: fc.array(
            fc.record({
              method: fc.string({ minLength: 1, maxLength: 50 }),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 200 }),
              nameEn: fc.string({ minLength: 1, maxLength: 100 }),
              nameVi: fc.string({ minLength: 1, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 1, maxLength: 200 }),
              descriptionVi: fc.string({ minLength: 1, maxLength: 200 }),
              cost: fc.float({ min: 0, max: 1000000 }),
              estimatedDays: fc.string({ minLength: 1, maxLength: 20 }),
              isFreeShipping: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        async (params) => {
          const { locale, shippingData, shippingMethods } = params;

          // Mock the API response
          mockCalculateShipping.mockResolvedValue(shippingMethods);

          const mockProps = {
            shippingData,
            onShippingMethodSelect: jest.fn(),
            selectedMethod: null,
            locale, // Pass the locale prop
          };

          renderWithIntl(<ShippingMethodSelector {...mockProps} />, locale);

          // Wait for the component to make the API call
          await waitFor(() => {
            expect(mockCalculateShipping).toHaveBeenCalled();
          });

          // Property: The API should be called with the correct locale parameter
          expect(mockCalculateShipping).toHaveBeenCalledWith({
            ...shippingData,
            locale, // Verify locale is passed to API
          });

          // Property: The API should be called exactly once on initial render
          expect(mockCalculateShipping).toHaveBeenCalledTimes(1);

          // Property: The locale parameter should match the component's locale prop
          const apiCallArgs = mockCalculateShipping.mock.calls[0][0];
          expect(apiCallArgs.locale).toBe(locale);
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
        verbose: true,
      }
    );
  }, 60000);

  /**
   * **Feature: shipping-method-localization, Property 9: Frontend localized field usage**
   * **Validates: Requirements 3.2**
   *
   * Property 9: Frontend localized field usage
   * For any shipping method display in the frontend, the rendered text should match
   * the locale-appropriate fields from the API response
   */
  it('Property 9: Frontend localized field usage - should use locale-appropriate fields for display', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('en', 'vi'),
          shippingData: fc.record({
            weight: fc.float({ min: 0.1, max: 50 }),
            dimensions: fc.record({
              length: fc.float({ min: 1, max: 100 }),
              width: fc.float({ min: 1, max: 100 }),
              height: fc.float({ min: 1, max: 100 }),
            }),
            destination: fc.record({
              city: fc.string({ minLength: 1, maxLength: 50 }),
              district: fc.string({ minLength: 1, maxLength: 50 }),
              ward: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          shippingMethods: fc.array(
            fc.record({
              method: fc.string({ minLength: 1, maxLength: 50 }),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('Vietnamese')),
              nameVi: fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('English')),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }).filter(s => !s.includes('Vietnamese')),
              descriptionVi: fc.string({ minLength: 10, maxLength: 200 }).filter(s => !s.includes('English')),
              cost: fc.float({ min: 0, max: 1000000 }),
              estimatedDays: fc.string({ minLength: 1, maxLength: 20 }),
              isFreeShipping: fc.boolean(),
            }).map(method => ({
              ...method,
              // Set primary fields based on locale for this test
              name: method.nameEn, // Will be overridden by component logic
              description: method.descriptionEn, // Will be overridden by component logic
            })),
            { minLength: 1, maxLength: 3 }
          ),
        }),
        async (params) => {
          const { locale, shippingData, shippingMethods } = params;

          // Ensure the API response has the correct primary fields based on locale
          const localizedMethods = shippingMethods.map(method => ({
            ...method,
            name: locale === 'vi' ? method.nameVi : method.nameEn,
            description: locale === 'vi' ? method.descriptionVi : method.descriptionEn,
          }));

          // Mock the API response
          mockCalculateShipping.mockResolvedValue(localizedMethods);

          const mockProps = {
            shippingData,
            onShippingMethodSelect: jest.fn(),
            selectedMethod: null,
            locale,
          };

          renderWithIntl(<ShippingMethodSelector {...mockProps} />, locale);

          // Wait for the component to render the shipping methods
          await waitFor(() => {
            expect(mockCalculateShipping).toHaveBeenCalled();
          });

          // Property: The displayed text should match the locale-appropriate fields
          for (const method of localizedMethods) {
            // Check if the localized name is displayed
            const expectedName = locale === 'vi' ? method.nameVi : method.nameEn;
            const expectedDescription = locale === 'vi' ? method.descriptionVi : method.descriptionEn;

            // Property: The component should display the correct localized name
            await waitFor(() => {
              expect(screen.getByText(expectedName)).toBeInTheDocument();
            });

            // Property: The component should display the correct localized description
            await waitFor(() => {
              expect(screen.getByText(expectedDescription)).toBeInTheDocument();
            });

            // Property: The component should NOT display the other locale's text
            const otherLocaleName = locale === 'vi' ? method.nameEn : method.nameVi;
            const otherLocaleDescription = locale === 'vi' ? method.descriptionEn : method.descriptionVi;

            expect(screen.queryByText(otherLocaleName)).not.toBeInTheDocument();
            expect(screen.queryByText(otherLocaleDescription)).not.toBeInTheDocument();
          }
        }
      ),
      {
        numRuns: 50, // Reduced runs for DOM-heavy test
        timeout: 45000,
        verbose: true,
      }
    );
  }, 90000);

  /**
   * **Feature: shipping-method-localization, Property 10: Dynamic locale switching**
   * **Validates: Requirements 3.3**
   *
   * Property 10: Dynamic locale switching
   * For any locale change during checkout, the shipping methods should be re-fetched
   * with the new locale parameter
   */
  it('Property 10: Dynamic locale switching - should re-fetch methods when locale changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialLocale: fc.constantFrom('en', 'vi'),
          newLocale: fc.constantFrom('en', 'vi'),
          shippingData: fc.record({
            weight: fc.float({ min: 0.1, max: 50 }),
            dimensions: fc.record({
              length: fc.float({ min: 1, max: 100 }),
              width: fc.float({ min: 1, max: 100 }),
              height: fc.float({ min: 1, max: 100 }),
            }),
            destination: fc.record({
              city: fc.string({ minLength: 1, maxLength: 50 }),
              district: fc.string({ minLength: 1, maxLength: 50 }),
              ward: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          shippingMethods: fc.array(
            fc.record({
              method: fc.string({ minLength: 1, maxLength: 50 }),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }),
              nameVi: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
              descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
              cost: fc.float({ min: 0, max: 1000000 }),
              estimatedDays: fc.string({ minLength: 1, maxLength: 20 }),
              isFreeShipping: fc.boolean(),
            }),
            { minLength: 1, maxLength: 3 }
          ),
        }).filter(params => params.initialLocale !== params.newLocale), // Only test actual locale changes
        async (params) => {
          const { initialLocale, newLocale, shippingData, shippingMethods } = params;

          // Mock different responses for different locales
          const initialMethods = shippingMethods.map(method => ({
            ...method,
            name: initialLocale === 'vi' ? method.nameVi : method.nameEn,
            description: initialLocale === 'vi' ? method.descriptionVi : method.descriptionEn,
          }));

          const newMethods = shippingMethods.map(method => ({
            ...method,
            name: newLocale === 'vi' ? method.nameVi : method.nameEn,
            description: newLocale === 'vi' ? method.descriptionVi : method.descriptionEn,
          }));

          // Setup mock to return different responses based on locale
          mockCalculateShipping
            .mockResolvedValueOnce(initialMethods) // First call with initial locale
            .mockResolvedValueOnce(newMethods); // Second call with new locale

          const mockProps = {
            shippingData,
            onShippingMethodSelect: jest.fn(),
            selectedMethod: null,
            locale: initialLocale,
          };

          const { rerender } = renderWithIntl(<ShippingMethodSelector {...mockProps} />, initialLocale);

          // Wait for initial render and API call
          await waitFor(() => {
            expect(mockCalculateShipping).toHaveBeenCalledTimes(1);
          });

          // Property: Initial API call should use the initial locale
          expect(mockCalculateShipping).toHaveBeenNthCalledWith(1, {
            ...shippingData,
            locale: initialLocale,
          });

          // Change the locale prop
          const updatedProps = { ...mockProps, locale: newLocale };
          rerender(
            <NextIntlClientProvider locale={newLocale} messages={createMockMessages(newLocale)}>
              <ShippingMethodSelector {...updatedProps} />
            </NextIntlClientProvider>
          );

          // Wait for the component to re-fetch with new locale
          await waitFor(() => {
            expect(mockCalculateShipping).toHaveBeenCalledTimes(2);
          });

          // Property: Second API call should use the new locale
          expect(mockCalculateShipping).toHaveBeenNthCalledWith(2, {
            ...shippingData,
            locale: newLocale,
          });

          // Property: The component should make exactly 2 API calls (initial + locale change)
          expect(mockCalculateShipping).toHaveBeenCalledTimes(2);

          // Property: Both API calls should include the shipping data
          const firstCall = mockCalculateShipping.mock.calls[0][0];
          const secondCall = mockCalculateShipping.mock.calls[1][0];

          expect(firstCall.weight).toBe(shippingData.weight);
          expect(firstCall.dimensions).toEqual(shippingData.dimensions);
          expect(firstCall.destination).toEqual(shippingData.destination);

          expect(secondCall.weight).toBe(shippingData.weight);
          expect(secondCall.dimensions).toEqual(shippingData.dimensions);
          expect(secondCall.destination).toEqual(shippingData.destination);
        }
      ),
      {
        numRuns: 50, // Reduced runs for complex DOM test
        timeout: 45000,
        verbose: true,
      }
    );
  }, 90000);

  /**
   * **Feature: shipping-method-localization, Property 11: Frontend fallback behavior**
   * **Validates: Requirements 3.4**
   *
   * Property 11: Frontend fallback behavior
   * For any shipping method with missing translation data, the frontend should
   * display English text gracefully
   */
  it('Property 11: Frontend fallback behavior - should fallback to English for missing translations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locale: fc.constantFrom('vi'), // Test Vietnamese locale with missing translations
          shippingData: fc.record({
            weight: fc.float({ min: 0.1, max: 50 }),
            dimensions: fc.record({
              length: fc.float({ min: 1, max: 100 }),
              width: fc.float({ min: 1, max: 100 }),
              height: fc.float({ min: 1, max: 100 }),
            }),
            destination: fc.record({
              city: fc.string({ minLength: 1, maxLength: 50 }),
              district: fc.string({ minLength: 1, maxLength: 50 }),
              ward: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          shippingMethods: fc.array(
            fc.record({
              method: fc.string({ minLength: 1, maxLength: 50 }),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
              cost: fc.float({ min: 0, max: 1000000 }),
              estimatedDays: fc.string({ minLength: 1, maxLength: 20 }),
              isFreeShipping: fc.boolean(),
            }).map(method => ({
              ...method,
              // Simulate missing Vietnamese translations
              nameVi: fc.sample(fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined)), 1)[0],
              descriptionVi: fc.sample(fc.oneof(fc.constant(''), fc.constant(null), fc.constant(undefined)), 1)[0],
              // Primary fields should fallback to English
              name: method.nameEn,
              description: method.descriptionEn,
            })),
            { minLength: 1, maxLength: 3 }
          ),
        }),
        async (params) => {
          const { locale, shippingData, shippingMethods } = params;

          // Mock the API response with missing Vietnamese translations
          mockCalculateShipping.mockResolvedValue(shippingMethods);

          const mockProps = {
            shippingData,
            onShippingMethodSelect: jest.fn(),
            selectedMethod: null,
            locale,
          };

          renderWithIntl(<ShippingMethodSelector {...mockProps} />, locale);

          // Wait for the component to render
          await waitFor(() => {
            expect(mockCalculateShipping).toHaveBeenCalled();
          });

          // Property: When Vietnamese translations are missing, should display English text
          for (const method of shippingMethods) {
            // Property: Should display English name when Vietnamese is missing
            await waitFor(() => {
              expect(screen.getByText(method.nameEn)).toBeInTheDocument();
            });

            // Property: Should display English description when Vietnamese is missing
            await waitFor(() => {
              expect(screen.getByText(method.descriptionEn)).toBeInTheDocument();
            });

            // Property: Should not display empty or null values
            if (method.nameVi) {
              expect(screen.queryByText(method.nameVi)).not.toBeInTheDocument();
            }
            if (method.descriptionVi) {
              expect(screen.queryByText(method.descriptionVi)).not.toBeInTheDocument();
            }
          }

          // Property: The component should not crash or show error states due to missing translations
          expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
          expect(screen.queryByText(/lỗi/i)).not.toBeInTheDocument();
        }
      ),
      {
        numRuns: 50, // Reduced runs for DOM-heavy test
        timeout: 45000,
        verbose: true,
      }
    );
  }, 90000);

  /**
   * **Feature: shipping-method-localization, Property 18: Frontend error handling**
   * **Validates: Requirements 5.4**
   *
   * Property 18: Frontend error handling
   * For any locale switching failure in the frontend, the current display should be
   * maintained with an appropriate error message
   */
  it('Property 18: Frontend error handling - should handle locale switching failures gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          initialLocale: fc.constantFrom('en', 'vi'),
          newLocale: fc.constantFrom('en', 'vi'),
          shippingData: fc.record({
            weight: fc.float({ min: 0.1, max: 50 }),
            dimensions: fc.record({
              length: fc.float({ min: 1, max: 100 }),
              width: fc.float({ min: 1, max: 100 }),
              height: fc.float({ min: 1, max: 100 }),
            }),
            destination: fc.record({
              city: fc.string({ minLength: 1, maxLength: 50 }),
              district: fc.string({ minLength: 1, maxLength: 50 }),
              ward: fc.string({ minLength: 1, maxLength: 50 }),
            }),
          }),
          initialMethods: fc.array(
            fc.record({
              method: fc.string({ minLength: 1, maxLength: 50 }),
              nameEn: fc.string({ minLength: 5, maxLength: 100 }),
              nameVi: fc.string({ minLength: 5, maxLength: 100 }),
              descriptionEn: fc.string({ minLength: 10, maxLength: 200 }),
              descriptionVi: fc.string({ minLength: 10, maxLength: 200 }),
              cost: fc.float({ min: 0, max: 1000000 }),
              estimatedDays: fc.string({ minLength: 1, maxLength: 20 }),
              isFreeShipping: fc.boolean(),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          errorMessage: fc.string({ minLength: 5, maxLength: 100 }),
        }).filter(params => params.initialLocale !== params.newLocale),
        async (params) => {
          const { initialLocale, newLocale, shippingData, initialMethods, errorMessage } = params;

          // Setup initial successful response
          const localizedInitialMethods = initialMethods.map(method => ({
            ...method,
            name: initialLocale === 'vi' ? method.nameVi : method.nameEn,
            description: initialLocale === 'vi' ? method.descriptionVi : method.descriptionEn,
          }));

          // Mock successful initial call, then error on locale change
          mockCalculateShipping
            .mockResolvedValueOnce(localizedInitialMethods)
            .mockRejectedValueOnce(new Error(errorMessage));

          const mockProps = {
            shippingData,
            onShippingMethodSelect: jest.fn(),
            selectedMethod: null,
            locale: initialLocale,
          };

          const { rerender } = renderWithIntl(<ShippingMethodSelector {...mockProps} />, initialLocale);

          // Wait for initial successful render
          await waitFor(() => {
            expect(mockCalculateShipping).toHaveBeenCalledTimes(1);
          });

          // Property: Initial methods should be displayed
          for (const method of localizedInitialMethods) {
            await waitFor(() => {
              expect(screen.getByText(method.name)).toBeInTheDocument();
            });
          }

          // Change locale to trigger error
          const updatedProps = { ...mockProps, locale: newLocale };
          rerender(
            <NextIntlClientProvider locale={newLocale} messages={createMockMessages(newLocale)}>
              <ShippingMethodSelector {...updatedProps} />
            </NextIntlClientProvider>
          );

          // Wait for the error to occur
          await waitFor(() => {
            expect(mockCalculateShipping).toHaveBeenCalledTimes(2);
          });

          // Property: Should maintain current display when locale switching fails
          for (const method of localizedInitialMethods) {
            expect(screen.getByText(method.name)).toBeInTheDocument();
          }

          // Property: Should show appropriate error message
          const errorText = newLocale === 'vi' ? 'Lỗi' : 'Error';
          await waitFor(() => {
            expect(screen.getByText(new RegExp(errorText, 'i'))).toBeInTheDocument();
          });

          // Property: Should not crash or become unresponsive
          expect(screen.getByRole('radiogroup')).toBeInTheDocument();

          // Property: User should still be able to select from existing methods
          const firstMethodRadio = screen.getAllByRole('radio')[0];
          expect(firstMethodRadio).toBeEnabled();
        }
      ),
      {
        numRuns: 30, // Reduced runs for complex error handling test
        timeout: 60000,
        verbose: true,
      }
    );
  }, 120000);
});