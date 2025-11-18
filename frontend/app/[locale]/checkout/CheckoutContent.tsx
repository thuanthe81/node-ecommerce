'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { formatMoney } from '@/app/utils';

export default function CheckoutContent() {
  const tCheckout = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const tCart = useTranslations('cart');
  const locale = useLocale();
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [billingAddressId, setBillingAddressId] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [notes, setNotes] = useState('');
  const [newShippingAddress, setNewShippingAddress] = useState<any>(null);
  const [newBillingAddress, setNewBillingAddress] = useState<any>(null);
  const [useSameAddress, setUseSameAddress] = useState(true);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      router.push(`/${locale}/cart`);
    }
  }, [cart, router, locale]);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  const handleShippingAddressSelect = (addressId: string) => {
    setShippingAddressId(addressId);
    if (useSameAddress) {
      setBillingAddressId(addressId);
    }
  };

  const handleNewShippingAddress = async (address: any) => {
    setNewShippingAddress(address);

    // If user is logged in, save the address
    if (user) {
      try {
        const savedAddress = await userApi.createAddress(address);
        setShippingAddressId(savedAddress.id);
        if (useSameAddress) {
          setBillingAddressId(savedAddress.id);
        }
      } catch (error) {
        console.error('Failed to save address:', error);
      }
    }
  };

  const handleNewBillingAddress = async (address: any) => {
    setNewBillingAddress(address);

    // If user is logged in, save the address
    if (user) {
      try {
        const savedAddress = await userApi.createAddress(address);
        setBillingAddressId(savedAddress.id);
      } catch (error) {
        console.error('Failed to save address:', error);
      }
    }
  };

  const canProceedToNextStep = () => {
    console.log('can next', !email, !!newShippingAddress)
    if (currentStep === 1) {
      // Shipping step
      if (!email) return false;
      if (user) {
        return !!shippingAddressId;
      } else {
        return !!newShippingAddress;
      }
    }
    if (currentStep === 2) {
      // Payment step
      return !!shippingMethod && !!paymentMethod;
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

    setLoading(true);
    setError(null);

    try {
      // Create addresses if needed (for guest checkout)
      let finalShippingAddressId = shippingAddressId;
      let finalBillingAddressId = billingAddressId;

      if (!user && newShippingAddress) {
        // For guest checkout, we need to create temporary addresses
        // In a real implementation, you might want to handle this differently
        const tempShippingAddress = await userApi.createAddress(
          newShippingAddress,
        );
        finalShippingAddressId = tempShippingAddress.id;

        if (useSameAddress) {
          finalBillingAddressId = tempShippingAddress.id;
        } else if (newBillingAddress) {
          const tempBillingAddress = await userApi.createAddress(
            newBillingAddress,
          );
          finalBillingAddressId = tempBillingAddress.id;
        }
      }

      const orderData: CreateOrderData = {
        email,
        shippingAddressId: finalShippingAddressId,
        billingAddressId: finalBillingAddressId,
        shippingMethod,
        paymentMethod,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: notes || undefined,
        promotionId: appliedPromo?.promotionId,
      };

      const order = await orderApi.createOrder(orderData);

      // Clear cart after successful order
      await clearCart();

      // Redirect to order confirmation page
      router.push(`/${locale}/checkout/success?orderId=${order.id}`);
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setError(
        err.response?.data?.message ||
          'Failed to place order. Please try again.',
      );
    } finally {
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

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const shippingCost =
    shippingMethod === 'standard'
      ? 5.0
      : shippingMethod === 'express'
        ? 15.0
        : 25.0;
  const tax = subtotal * 0.1;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const total = Math.max(0, subtotal + shippingCost + tax - discountAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{tCheckout('title')}</h1>

      <CheckoutStepper currentStep={currentStep} />

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
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
                    <span className="text-sm text-gray-700">
                      {tCheckout('billingAddessSame')}
                    </span>
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

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <ShippingMethodSelector
                selectedMethod={shippingMethod}
                onMethodSelect={setShippingMethod}
              />

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  {tCheckout('paymentMethod')}
                </h3>
                <div className="space-y-3">
                  <label className="block p-4 border rounded-lg cursor-pointer border-blue-600 bg-blue-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-semibold">Credit/Debit Card</span>
                  </label>
                </div>
              </div>

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
              <h3 className="text-lg font-semibold mb-4">
                {tCheckout('orderSummary')}
              </h3>

              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.product.images[0]?.url || '/placeholder.png'}
                      alt={item.product.nameEn}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.product.nameEn}</div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold">
                      ${(Number(item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Notes (Optional)
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
            <h3 className="text-lg font-semibold mb-4">
              {tCart('orderSummary')}
            </h3>

            {/* Promotion Code Input */}
            <div className="mb-4">
              <label htmlFor="checkoutPromoCode" className="block text-sm font-medium text-gray-700 mb-2">
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
              {promoError && (
                <p className="mt-1 text-sm text-red-600">{promoError}</p>
              )}
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
                  <span>{tCart('discount')} ({appliedPromo.code})</span>
                  <span>-{formatMoney(appliedPromo.discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">{tCart('total')}</span>
                <span className="font-bold text-lg">{formatMoney(total)}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p>
                {tCheckout('agreeServiceAndPolicy')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}