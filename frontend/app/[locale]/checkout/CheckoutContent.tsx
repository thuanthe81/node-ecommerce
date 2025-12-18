'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi, CreateOrderData } from '@/lib/order-api';
import { userApi } from '@/lib/user-api';
import { promotionApi } from '@/lib/promotion-api';
import CheckoutStepper from '@/components/CheckoutStepper';
import ShippingAddressForm from '@/components/ShippingAddressForm';
import ShippingMethodSelector from '@/components/ShippingMethodSelector';
import { SvgCheck } from '@/components/Svgs';
import { formatMoney, isContactForPrice, getPriceTBDText, getCartQuoteMessage } from '@/app/utils';

export default function CheckoutContent() {
  const tCheckout = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const tCart = useTranslations('cart');
  const tAuth = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { cart, clearCart, syncing, syncResults, guestCartItems } = useCart();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCompleted, setOrderCompleted] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [billingAddressId, setBillingAddressId] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const paymentMethod = 'bank_transfer'; // Fixed payment method - bank transfer only
  const [notes, setNotes] = useState('');
  const [newShippingAddress, setNewShippingAddress] = useState<any>(null);
  const [newBillingAddress, setNewBillingAddress] = useState<any>(null);
  const [useSameAddress, setUseSameAddress] = useState(true);

  // Authentication check - redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login with checkout URL as redirect parameter
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/${locale}/login?redirect=${redirectUrl}`);
    }
  }, [isAuthenticated, isLoading, router, locale, pathname]);

  useEffect(() => {
    // Don't redirect if order was just completed
    if (!orderCompleted && (!cart || cart.items.length === 0)) {
      router.push(`/${locale}/cart`);
    }
  }, [cart, router, locale, orderCompleted]);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  // Load address when user selects a saved address
  useEffect(() => {
    const loadSelectedAddress = async () => {
      if (shippingAddressId && user) {
        try {
          const addresses = await userApi.getAddresses();
          const selected = addresses.find(addr => addr.id === shippingAddressId);
          if (selected) {
            setCurrentShippingAddress({
              city: selected.city,
              state: selected.state,
              postalCode: selected.postalCode,
              country: selected.country,
            });
          }
        } catch (err) {
          console.error('Failed to load selected address:', err);
        }
      }
    };

    loadSelectedAddress();
  }, [shippingAddressId, user]);

  const handleShippingAddressSelect = (addressId: string) => {
    console.log('[CheckoutContent] Saved address selected:', addressId);
    setShippingAddressId(addressId);
    // Clear new address state since user selected a saved address
    setNewShippingAddress(null);
    if (useSameAddress) {
      setBillingAddressId(addressId);
      setNewBillingAddress(null);
    }
  };

  const handleShippingMethodSelect = (methodId: string) => {
    console.log('[CheckoutContent] Shipping method selected:', methodId);
    setShippingMethod(methodId);

    // Find the selected method and update the cost
    const selectedRate = shippingRates.find(rate => rate.method === methodId);
    console.log('[CheckoutContent] Selected rate:', selectedRate);
    if (selectedRate) {
      console.log('[CheckoutContent] Setting shipping cost to:', selectedRate.cost);
      setCalculatedShippingCost(selectedRate.cost);
    }
  };

  const handleRatesCalculated = (rates: any[]) => {
    console.log('[CheckoutContent] Rates calculated:', rates);
    setShippingRates(rates);

    // If a method is already selected, update its cost
    if (shippingMethod) {
      const selectedRate = rates.find(rate => rate.method === shippingMethod);
      console.log('[CheckoutContent] Auto-updating cost for selected method:', shippingMethod, selectedRate);
      if (selectedRate) {
        setCalculatedShippingCost(selectedRate.cost);
      }
    }
  };

  const handleNewShippingAddress = async (address: any) => {
    console.log('[CheckoutContent] handleNewShippingAddress called - storing address in state only');
    console.log('[CheckoutContent] Address data:', address);
    setNewShippingAddress(address);

    // Update current shipping address for rate calculation
    setCurrentShippingAddress({
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });

    console.log('[CheckoutContent] Shipping address stored in component state, will be created during order placement');
  };

  const handleNewBillingAddress = async (address: any) => {
    console.log('[CheckoutContent] handleNewBillingAddress called - storing address in state only');
    console.log('[CheckoutContent] Address data:', address);
    setNewBillingAddress(address);
    console.log('[CheckoutContent] Billing address stored in component state, will be created during order placement');
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      // Shipping step
      const hasEmail = !!email;
      // For authenticated users: check if they have selected a saved address OR filled out a new address form
      // For guest users: check if they have filled out the address form
      const hasShippingAddress = user
        ? (!!shippingAddressId || !!newShippingAddress)
        : !!newShippingAddress;
      const canProceed = hasEmail && hasShippingAddress;

      console.log('[CheckoutContent] canProceedToNextStep (step 1):', {
        hasEmail,
        user: !!user,
        shippingAddressId,
        newShippingAddress: !!newShippingAddress,
        hasShippingAddress,
        canProceed
      });

      return canProceed;
    }
    if (currentStep === 2) {
      // Shipping method step - payment method is always bank_transfer
      return !!shippingMethod;
    }
    return true;
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    setPromoError('');

    try {
      const result = await promotionApi.validate({
        code: promoCode.trim(),
        orderAmount: subtotal,
      });

      if (result.valid && result.discountAmount && result.promotion) {
        setAppliedPromo({
          code: promoCode.trim().toUpperCase(),
          discountAmount: result.discountAmount,
          promotionId: result.promotion.id,
        });
        setPromoCode('');
      } else {
        setPromoError(result.message || 'Invalid promotion code');
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Failed to validate promotion code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handlePlaceOrder = async () => {
    if (!cart) return;

    console.log('[CheckoutContent] handlePlaceOrder called');
    console.log('[CheckoutContent] Current state:', {
      user: !!user,
      shippingAddressId,
      billingAddressId,
      newShippingAddress: !!newShippingAddress,
      newBillingAddress: !!newBillingAddress,
      useSameAddress
    });

    setLoading(true);
    setError(null);

    try {
      // Initialize with existing address IDs (for saved addresses)
      let finalShippingAddressId = shippingAddressId;
      let finalBillingAddressId = billingAddressId;

      console.log('[CheckoutContent] Starting address creation process');

      // Create shipping address if user filled out new address form and hasn't selected a saved address
      if (newShippingAddress && !shippingAddressId) {
        console.log('[CheckoutContent] Creating new shipping address');
        try {
          const createdShippingAddress = await userApi.createAddress(newShippingAddress);
          console.log('[CheckoutContent] Shipping address created with ID:', createdShippingAddress.id);
          finalShippingAddressId = createdShippingAddress.id;

          // If using same address for billing, reuse the shipping address ID
          if (useSameAddress) {
            console.log('[CheckoutContent] Reusing shipping address for billing');
            finalBillingAddressId = createdShippingAddress.id;
          }
        } catch (err: any) {
          console.error('[CheckoutContent] Failed to create shipping address:', err);
          // Provide specific error message for address creation failure
          const errorMessage = err.response?.data?.message ||
            'Failed to save shipping address. Please check your address details and try again.';
          setError(errorMessage);
          setLoading(false);
          // Prevent order creation by returning early
          return;
        }
      }

      // Create billing address if:
      // 1. User is not using same address for billing AND
      // 2. User filled out new billing address form AND
      // 3. User hasn't selected a saved billing address
      if (!useSameAddress && newBillingAddress && !billingAddressId) {
        console.log('[CheckoutContent] Creating new billing address');
        try {
          const createdBillingAddress = await userApi.createAddress(newBillingAddress);
          console.log('[CheckoutContent] Billing address created with ID:', createdBillingAddress.id);
          finalBillingAddressId = createdBillingAddress.id;
        } catch (err: any) {
          console.error('[CheckoutContent] Failed to create billing address:', err);
          // Provide specific error message for billing address creation failure
          const errorMessage = err.response?.data?.message ||
            'Failed to save billing address. Please check your address details and try again.';
          setError(errorMessage);
          setLoading(false);
          // Prevent order creation by returning early
          return;
        }
      }

      // Validate that we have both address IDs before creating order
      if (!finalShippingAddressId || !finalBillingAddressId) {
        console.error('[CheckoutContent] Missing address IDs:', {
          shippingAddressId: finalShippingAddressId,
          billingAddressId: finalBillingAddressId
        });
        setError('Please provide valid shipping and billing addresses.');
        setLoading(false);
        // Prevent order creation by returning early
        return;
      }

      console.log('[CheckoutContent] Final address IDs:', {
        shippingAddressId: finalShippingAddressId,
        billingAddressId: finalBillingAddressId
      });

      const orderData: CreateOrderData = {
        email,
        shippingAddressId: finalShippingAddressId,
        billingAddressId: finalBillingAddressId,
        shippingMethod,
        shippingCost: calculatedShippingCost,
        paymentMethod,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: notes || undefined,
        promotionId: appliedPromo?.promotionId,
        locale: locale as 'en' | 'vi',
      };

      console.log('[CheckoutContent] Creating order with data:', orderData);
      console.log('[CheckoutContent] Calculated shipping cost at order time:', calculatedShippingCost);

      try {
        const order = await orderApi.createOrder(orderData);
        console.log('[CheckoutContent] Order created successfully:', order.id);

        // Use window.location for immediate redirect to prevent useEffect interference
        // This causes a full page navigation which bypasses React's routing and useEffect hooks
        // window.location.href = `/${locale}/orders/${order.id}/confirmation`;
        router.push(`/${locale}/orders/${order.id}/confirmation`);
      } catch (err: any) {
        console.error('[CheckoutContent] Failed to create order:', err);
        // Provide specific error message for order creation failure
        const errorMessage = err.response?.data?.message ||
          'Failed to create order. Please try again or contact support if the problem persists.';
        setError(errorMessage);
        setLoading(false);
        // Prevent further execution by returning early
        return;
      }
    } catch (err: any) {
      console.error('[CheckoutContent] Unexpected error during checkout:', err);
      // Catch-all for any unexpected errors
      setError(
        err.response?.data?.message ||
          err.message ||
          'An unexpected error occurred. Please try again.',
      );
      setLoading(false);
    }
  };

  // Promotion state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    promotionId: string;
  } | null>(null);

  // State for calculated shipping cost
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number>(0);
  const [shippingRates, setShippingRates] = useState<any[]>([]);

  // State to track the current shipping address for calculation
  const [currentShippingAddress, setCurrentShippingAddress] = useState<{
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null>(null);

  // Show loading state during authentication check or cart sync
  if (isLoading || syncing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">
              {syncing ? tCart('syncingCart') : tCommon('loading')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render checkout if not authenticated (will redirect via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  // Check if cart contains zero-price products
  const hasZeroPriceItems = cart.items.some(item => isContactForPrice(Number(item.product.price)));

  // Calculate subtotal only from non-zero price items
  const subtotal = cart.items.reduce(
    (sum, item) => {
      const price = Number(item.product.price);
      return sum + (price > 0 ? price * item.quantity : 0);
    },
    0,
  );

  // Use calculated shipping cost or default to 0
  const shippingCost = calculatedShippingCost;
  const tax = subtotal * 0.1;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{tCheckout('title')}</h1>

      <CheckoutStepper currentStep={currentStep} />

      {/* Display cart sync results if any */}
      {syncResults && syncResults.length > 0 && (
        <div className="mb-6">
          {syncResults.some(r => !r.success) ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    {tCart('syncPartialSuccess', {
                      successCount: syncResults.filter(r => r.success).length,
                      totalCount: syncResults.length,
                    })}
                  </p>
                  {syncResults.filter(r => !r.success).length > 0 && (
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">{tCart('syncFailedItems')}</p>
                      <ul className="list-disc list-inside space-y-1">
                        {syncResults
                          .filter(r => !r.success)
                          .map((result, idx) => (
                            <li key={idx}>
                              {result.error || 'Unknown error'}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-green-800">{tCart('syncSuccess')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {!user && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              )}

              <ShippingAddressForm
                onAddressSelect={handleShippingAddressSelect}
                onNewAddress={handleNewShippingAddress}
                selectedAddressId={shippingAddressId}
              />

              {!user && (
                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useSameAddress}
                      onChange={(e) => setUseSameAddress(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{tCheckout('billingAddessSame')}</span>
                  </label>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {tCommon('next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping Method */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <ShippingMethodSelector
                selectedMethod={shippingMethod}
                onMethodSelect={handleShippingMethodSelect}
                onRatesCalculated={handleRatesCalculated}
                shippingAddress={currentShippingAddress || undefined}
                cartItems={cart.items}
                orderValue={subtotal}
                locale={locale}
              />

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {tCommon('back')}
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {tCommon('next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">{tCheckout('orderSummary')}</h3>

              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.product.images[0]?.url || '/placeholder.png'}
                      alt={locale == 'vi' ? item.product.nameVi : item.product.nameEn}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {locale == 'vi' ? item.product.nameVi : item.product.nameEn}
                      </div>
                      <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold">
                      {isContactForPrice(Number(item.product.price)) ? (
                        <span className="text-blue-600">{getPriceTBDText(locale)}</span>
                      ) : (
                        formatMoney(Number(item.product.price) * item.quantity)
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message for zero-price items */}
              {hasZeroPriceItems && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-800">
                      {getCartQuoteMessage(locale)}
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Information */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">
                      {tCheckout('paymentMethodLabel')}: {tCheckout('bankTransfer')}
                    </div>
                    <div className="text-sm text-blue-700">{tCheckout('bankTransferInfo')}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tCheckout('orderNotes')} ({tCommon('optional')})
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special instructions for your order..."
                />
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {tCommon('back')}
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? tCheckout('processing') : tCheckout('placeOrder')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">{tCart('orderSummary')}</h3>

            {/* Promotion Code Input */}
            <div className="mb-4">
              <label
                htmlFor="checkoutPromoCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {tCart('promoCode')}
              </label>
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="flex items-center">
                    <SvgCheck className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">{appliedPromo.code}</span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    {tCommon('delete')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="checkoutPromoCode"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder={tCart('enterPromoCode')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    {promoLoading ? tCart('applying') : tCart('apply')}
                  </button>
                </div>
              )}
              {promoError && <p className="mt-1 text-sm text-red-600">{promoError}</p>}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{tCart('subtotal')}</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{tCart('shipping')}</span>
                <span className="font-medium">{formatMoney(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{tCart('tax')}</span>
                <span className="font-medium">{formatMoney(tax)}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    {tCart('discount')} ({appliedPromo.code})
                  </span>
                  <span>-{formatMoney(appliedPromo.discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">{tCart('total')}</span>
                <span className="font-bold text-lg">{formatMoney(total)}</span>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">
                      {tCheckout('paymentMethodLabel')}: {tCheckout('bankTransfer')}
                    </div>
                    <div className="text-blue-700">{tCheckout('bankTransferInfo')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p>{tCheckout('agreeServiceAndPolicy')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}