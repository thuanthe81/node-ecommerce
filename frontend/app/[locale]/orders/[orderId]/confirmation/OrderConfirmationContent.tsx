'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi, Order } from '@/lib/order-api';
import { paymentSettingsApi, BankTransferSettings } from '@/lib/payment-settings-api';
import { formatMoney } from '@/app/utils';
import { useLocale, useTranslations } from 'next-intl';

export default function OrderConfirmationContent() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const orderId = params.orderId as string;
  const locale = params.locale as string;
  const t = useTranslations("orders");

  const [order, setOrder] = useState<Order | null>(null);
  const [bankSettings, setBankSettings] = useState<BankTransferSettings | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        console.error('[OrderConfirmation] No order ID provided');
        setOrderError('Invalid order ID');
        setIsLoadingOrder(false);
        return;
      }

      try {
        setIsLoadingOrder(true);
        setOrderError(null);
        console.log('[OrderConfirmation] Fetching order:', orderId);
        const orderData = await orderApi.getOrder(orderId);
        console.log('[OrderConfirmation] Order fetched successfully:', orderData.orderNumber);
        setOrder(orderData);
      } catch (error: any) {
        console.error('[OrderConfirmation] Error fetching order:', {
          orderId,
          status: error.response?.status,
          message: error.message,
          error: error.response?.data || error
        });

        if (error.response?.status === 404) {
          setOrderError(t('orderNotFound'));
        } else if (error.response?.status === 403) {
          setOrderError(t('permissionViewOrder'));
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          setOrderError(t('timeoutError'));
        } else if (!navigator.onLine) {
          setOrderError(t('networkError'));
        } else {
          setOrderError(t('loadOrderFailed'));
        }
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderId, t]);

  // Fetch bank transfer settings
  useEffect(() => {
    const fetchBankSettings = async () => {
      try {
        setIsLoadingSettings(true);
        setSettingsError(null);
        console.log('[OrderConfirmation] Fetching bank transfer settings');
        const settings = await paymentSettingsApi.getBankTransferSettings();
        console.log('[OrderConfirmation] Bank transfer settings fetched:', {
          hasAccountName: !!settings.accountName,
          hasAccountNumber: !!settings.accountNumber,
          hasBankName: !!settings.bankName,
          hasQrCode: !!settings.qrCodeUrl
        });
        setBankSettings(settings);
      } catch (error: any) {
        console.error('[OrderConfirmation] Error fetching bank transfer settings:', {
          status: error.response?.status,
          message: error.message,
          error: error.response?.data || error
        });

        if (error.response?.status === 404) {
          // Settings not configured yet - this is not critical
          console.warn('[OrderConfirmation] Bank transfer settings not configured');
          setBankSettings({
            accountName: '',
            accountNumber: '',
            bankName: '',
            qrCodeUrl: null
          });
          setSettingsError(null); // Don't show error for unconfigured settings
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          setSettingsError(t('timeoutLoadingPaymentInstructions'));
        } else if (!navigator.onLine) {
          setSettingsError(t('networkLoadingPaymentInstructions'));
        } else {
          setSettingsError(t('failedLoadingPaymentInstructions'));
        }
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchBankSettings();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleRetryOrder = () => {
    if (!orderId) {
      console.error('[OrderConfirmation] Cannot retry: No order ID');
      return;
    }

    console.log('[OrderConfirmation] Retrying order fetch:', orderId);
    setIsLoadingOrder(true);
    setOrderError(null);

    orderApi.getOrder(orderId)
      .then((orderData) => {
        console.log('[OrderConfirmation] Order retry successful:', orderData.orderNumber);
        setOrder(orderData);
      })
      .catch((error) => {
        console.error('[OrderConfirmation] Order retry failed:', {
          orderId,
          status: error.response?.status,
          message: error.message,
          error: error.response?.data || error
        });

        if (error.response?.status === 404) {
          setOrderError('Order not found');
        } else if (error.response?.status === 403) {
          setOrderError(t('permissionDenied'));
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          setOrderError(t('timeoutError'));
        } else if (!navigator.onLine) {
          setOrderError(t('networkError'));
        } else {
          setOrderError(t('failedLoadOrder'));
        }
      })
      .finally(() => setIsLoadingOrder(false));
  };

  const handleRetrySettings = () => {
    console.log('[OrderConfirmation] Retrying bank transfer settings fetch');
    setIsLoadingSettings(true);
    setSettingsError(null);

    paymentSettingsApi.getBankTransferSettings()
      .then((settings) => {
        console.log('[OrderConfirmation] Settings retry successful:', {
          hasAccountName: !!settings.accountName,
          hasAccountNumber: !!settings.accountNumber,
          hasBankName: !!settings.bankName,
          hasQrCode: !!settings.qrCodeUrl
        });
        setBankSettings(settings);
      })
      .catch((error) => {
        console.error('[OrderConfirmation] Settings retry failed:', {
          status: error.response?.status,
          message: error.message,
          error: error.response?.data || error
        });

        if (error.response?.status === 404) {
          // Settings not configured - not critical
          console.warn('[OrderConfirmation] Bank transfer settings not configured');
          setBankSettings({
            accountName: '',
            accountNumber: '',
            bankName: '',
            qrCodeUrl: null
          });
          setSettingsError(null);
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          setSettingsError(t('timeoutLoadingPaymentInstructions'));
        } else if (!navigator.onLine) {
          setSettingsError(t('networkError'));
        } else {
          setSettingsError(t('failedLoadingPaymentInstructions'));
        }
      })
      .finally(() => setIsLoadingSettings(false));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getProductName = (item: any) => {
    return locale === 'vi' ? item.productNameVi : item.productNameEn;
  };

  // Loading state
  if (isLoadingOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="animate-pulse"
            role="status"
            aria-live="polite"
            aria-label="Loading order details"
          >
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <span className="sr-only">{t('loadingOrder')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state - Order not found or failed to load
  if (orderError) {
    const isNotFound = orderError === 'Order not found';
    const isPermissionDenied = orderError.includes('permission');
    const isTimeout = orderError.includes('timeout') || orderError.includes('timed out');
    const isNetworkError = orderError.includes('internet') || orderError.includes('network');

    let errorTitle = orderError;
    let errorDescription = t('loadingError');

    if (isNotFound) {
      errorTitle = t('orderNotFound');
      errorDescription = t('orderNotFoundDesc');
    } else if (isPermissionDenied) {
      errorTitle = t('permissionDenied');
      errorDescription = t('contactSupport');
    } else if (isTimeout) {
      errorTitle = t('timeoutError');
      errorDescription = t('contactSupport');
    } else if (isNetworkError) {
      errorTitle = t('networkError');
      errorDescription = '';
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="bg-red-50 border-2 border-red-300 rounded-xl shadow-lg p-8 text-center"
            role="alert"
            aria-live="assertive"
          >
            <svg
              className="w-20 h-20 text-red-500 mx-auto mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {errorTitle}
            </h1>
            {errorDescription && (
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                {errorDescription}
              </p>
            )}
            <nav className="flex gap-4 justify-center flex-wrap" aria-label="Error recovery actions">
              {!isNotFound && !isPermissionDenied && (
                <button
                  onClick={handleRetryOrder}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
                  aria-label="Retry loading order"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('tryAgain')}
                </button>
              )}
              {isAuthenticated && (
                <Link
                  href={`/${locale}/account/orders`}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  {t('viewAllOrders')}
                </Link>
              )}
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {t('continueShopping')}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <main id="main-content" className="max-w-5xl mx-auto">
          {/* Success Banner - Enhanced with better visual hierarchy */}
          <div
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 text-center print:border print:border-gray-800 print:shadow-none"
            role="status"
            aria-live="polite"
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full mb-4 shadow-md"
              aria-hidden="true"
            >
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 print:text-3xl">
              {t('successTitle')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 font-semibold">
              {t('orderNumber')} <span className="text-green-700">#{order.orderNumber}</span>
            </p>
          </div>

          {/* Order Summary Section - Enhanced with better spacing and hierarchy */}
          <section
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 print:shadow-none print:border print:border-gray-300"
            aria-labelledby="order-details-heading"
          >
            <h2
              id="order-details-heading"
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200"
            >
              {t('orderDetails')}
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 sm:p-2">
              <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                <dt className="text-sm text-gray-600 mb-1 font-medium">{t('orderDate')}</dt>
                <dd className="text-base font-semibold text-gray-900">
                  {formatDate(order.createdAt)}
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                <dt className="text-sm text-gray-600 mb-1 font-medium">{t('status')}</dt>
                <dd className="text-base font-semibold text-gray-900 capitalize">{order.status}</dd>
              </div>
            </dl>

            {/* Order Items - Enhanced with better mobile layout */}
            <div className="mb-6 p-4 sm:p-6">
              <h3
                id="order-items-heading"
                className="font-semibold text-lg sm:text-xl mb-4 text-gray-900"
              >
                {t('items')}
              </h3>
              <ul className="space-y-4 sm:space-y-6" aria-labelledby="order-items-heading">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                  >
                    {item.product?.images?.[0]?.url && (
                      <img
                        src={item.product.images[0].url}
                        alt={`${getProductName(item)} product image`}
                        className="w-full sm:w-24 sm:h-24 h-48 object-cover rounded-lg shadow-sm print:w-20 print:h-20"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/${locale}/products/${item.product.slug}`}
                        className="font-semibold text-base sm:text-lg text-gray-900 hover:text-blue-600 focus:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors block mb-2 print:text-black print:no-underline"
                      >
                        {getProductName(item)}
                      </Link>
                      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div>
                          <dt className="inline font-medium">{t('quantity')}:</dt>
                          <dd className="inline ml-1">{item.quantity}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium">SKU:</dt>
                          <dd className="inline ml-1">{item.sku}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="text-left sm:text-right flex sm:flex-col justify-between sm:justify-start gap-2">
                      <div>
                        <p className="text-sm text-gray-600 sm:hidden">Unit Price:</p>
                        <p
                          className="font-semibold text-base sm:text-lg text-gray-900"
                          aria-label={`Unit price: ${formatMoney(item.price, locale)}`}
                        >
                          {formatMoney(item.price, locale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('subtotal')}:</p>
                        <p
                          className="font-bold text-base sm:text-lg text-gray-900"
                          aria-label={`Item subtotal: ${formatMoney(item.total, locale)}`}
                        >
                          {formatMoney(item.total, locale)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Order Totals - Enhanced with better visual hierarchy */}
            <div
              className="bg-gray-50 rounded-lg p-4 sm:p-6 mt-6 print:bg-white print:border print:border-gray-300"
              role="region"
              aria-labelledby="order-totals-heading"
            >
              <h3 id="order-totals-heading" className="sr-only">
                Order Totals
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between text-sm sm:text-base">
                  <dt className="text-gray-700 font-medium">{t('subtotal')}</dt>
                  <dd className="font-semibold text-gray-900">
                    {formatMoney(order.subtotal, locale)}
                  </dd>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <dt className="text-gray-700 font-medium">{t('shipping')}</dt>
                  <dd className="font-semibold text-gray-900">
                    {formatMoney(order.shippingCost, locale)}
                  </dd>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <dt className="text-gray-700 font-medium">{t('tax')}</dt>
                  <dd className="font-semibold text-gray-900">
                    {formatMoney(order.taxAmount, locale)}
                  </dd>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-green-700">
                    <dt className="font-medium">{t('discount')}</dt>
                    <dd className="font-semibold">-{formatMoney(order.discountAmount, locale)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-lg sm:text-xl lg:text-2xl font-bold border-t-2 border-gray-300 pt-3 mt-3">
                  <dt className="text-gray-900">{t('total')}</dt>
                  <dd className="text-blue-600">{formatMoney(order.total, locale)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Shipping Information Section - Enhanced with better layout */}
          <section
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 print:shadow-none print:border print:border-gray-300"
            aria-labelledby="shipping-info-heading"
          >
            <h2
              id="shipping-info-heading"
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200"
            >
              {t('shippingInfo')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 print:bg-white print:border print:border-gray-300">
                <h3
                  id="delivery-address-heading"
                  className="font-semibold text-base sm:text-lg mb-3 text-gray-900 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {t('deliveryAddress')}
                </h3>
                <address
                  className="not-italic text-gray-700 text-sm sm:text-base leading-relaxed"
                  aria-labelledby="delivery-address-heading"
                >
                  <strong className="text-gray-900">{order.shippingAddress.fullName}</strong>
                  <br />
                  {order.shippingAddress.addressLine1}
                  <br />
                  {order.shippingAddress.addressLine2 && (
                    <>
                      {order.shippingAddress.addressLine2}
                      <br />
                    </>
                  )}
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                  <br />
                  <span className="inline-flex items-center gap-1 mt-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {t('phone')}: <strong>{order.shippingAddress.phone}</strong>
                  </span>
                </address>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 print:bg-white print:border print:border-gray-300">
                <h3
                  id="shipping-method-heading"
                  className="font-semibold text-base sm:text-lg mb-3 text-gray-900 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  {t('shippingMethod')}
                </h3>
                <p
                  className="text-gray-900 text-base sm:text-lg font-semibold capitalize bg-white rounded px-4 py-3 border border-gray-200 print:border-gray-300"
                  aria-labelledby="shipping-method-heading"
                >
                  {order.shippingMethod}
                </p>
              </div>
            </div>
          </section>

          {/* Bank Transfer Instructions Section - Enhanced with prominent styling */}
          <section
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-300 rounded-xl shadow-xl p-6 sm:p-8 mb-6 print:bg-white print:border print:border-gray-800 print:shadow-none"
            aria-labelledby="payment-instructions-heading"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2
                id="payment-instructions-heading"
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900"
              >
                {t('paymentInstructions')}
              </h2>
            </div>

            <div
              className="bg-blue-100 border-l-4 border-blue-600 rounded-r-lg p-4 mb-6 print:bg-white print:border print:border-gray-600"
              role="note"
              aria-label="Payment notice"
            >
              <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
                {t('paymentNotice')}
              </p>
            </div>

            {isLoadingSettings ? (
              <div
                className="animate-pulse"
                role="status"
                aria-label="Loading payment instructions"
              >
                <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-blue-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-blue-200 rounded w-2/3"></div>
                <span className="sr-only">{t('loadingPaymentInstructions')}</span>
              </div>
            ) : settingsError ? (
              <div
                className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 shadow-md"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-3 mb-4">
                  <svg
                    className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-2 text-lg">
                      {t('paymentInstructionsUnavailable')}
                    </h3>
                    <p className="text-yellow-800 mb-3">{settingsError}</p>
                    <button
                      onClick={handleRetrySettings}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors font-medium text-sm shadow-sm"
                      aria-label="Retry loading payment instructions"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      {t('tryAgain')}
                    </button>
                  </div>
                </div>
                <div className="bg-white border border-yellow-200 rounded p-4 mt-4">
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      {t('paymentEmailNotice')}
                    </span>
                  </p>
                </div>
              </div>
            ) : bankSettings &&
              (bankSettings.accountName || bankSettings.accountNumber || bankSettings.bankName) ? (
              <>
                {/* Bank Details Card - Highlighted and prominent */}
                <div
                  className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 sm:p-8 mb-6 print:border print:border-gray-800"
                  role="region"
                  aria-labelledby="bank-details-heading"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <h3
                      id="bank-details-heading"
                      className="font-bold text-lg sm:text-xl text-gray-900"
                    >
                      {t('bankDetails')}
                    </h3>
                  </div>
                  <dl className="space-y-4">
                    {bankSettings.accountName && (
                      <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                        <dt className="text-sm font-medium text-gray-600 mb-1">
                          {t('accountName')}
                        </dt>
                        <dd className="text-base sm:text-lg font-semibold text-gray-900">
                          {bankSettings.accountName}
                        </dd>
                      </div>
                    )}
                    {bankSettings.accountNumber && (
                      <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                        <dt className="text-sm font-medium text-gray-600 mb-1">
                          {t('accountNumber')}
                        </dt>
                        <dd className="text-base sm:text-lg font-bold text-gray-900 font-mono tracking-wider">
                          {bankSettings.accountNumber}
                        </dd>
                      </div>
                    )}
                    {bankSettings.bankName && (
                      <div className="bg-gray-50 rounded-lg p-4 print:bg-white print:border print:border-gray-300">
                        <dt className="text-sm font-medium text-gray-600 mb-1">
                          {t('bankName')}
                        </dt>
                        <dd className="text-base sm:text-lg font-semibold text-gray-900">
                          {bankSettings.bankName}
                        </dd>
                      </div>
                    )}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-5 sm:p-6 shadow-md print:bg-white print:border-2 print:border-gray-800">
                      <dt className="text-sm font-medium text-blue-100 mb-2 print:text-gray-700">
                        {t('amountToTransfer')}
                      </dt>
                      <dd className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white print:text-gray-900">
                        {formatMoney(order.total, locale)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* QR Code Section - Properly sized and scannable */}
                {bankSettings.qrCodeUrl && (
                  <div
                    className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 sm:p-8 text-center print:border print:border-gray-800"
                    role="region"
                    aria-labelledby="qr-code-heading"
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      <h3
                        id="qr-code-heading"
                        className="font-bold text-lg sm:text-xl text-gray-900"
                      >
                        {t('scanToPay')}
                      </h3>
                    </div>
                    <div className="inline-block bg-white p-4 rounded-lg shadow-inner border-2 border-gray-200 print:border-gray-800">
                      <img
                        src={bankSettings.qrCodeUrl}
                        alt={`${t('qrCodeAlt')} for payment of ${formatMoney(order.total, locale)} to ${bankSettings.accountName || 'merchant account'}`}
                        className="w-48 h-48 sm:w-64 sm:h-64 mx-auto object-contain print:w-48 print:h-48"
                        style={{ imageRendering: 'crisp-edges' }}
                        // priority={true}
                        // loading="lazy"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 mt-4 font-medium">
                      {t('qrHint')}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-gray-700">
                  {t('paymentEmailNotice')}
                </p>
              </div>
            )}
          </section>

          {/* Action Buttons - Enhanced with better mobile layout */}
          <nav
            className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mt-8 print:hidden"
            aria-label="Order actions"
          >
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:bg-gray-800 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              aria-label="Print order details"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              {t('printOrder')}
            </button>

            {isAuthenticated && (
              <Link
                href={`/${locale}/account/orders`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                aria-label="View all your orders"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                {t('viewAllOrders')}
              </Link>
            )}

            <Link
              href={`/${locale}/products`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              aria-label="Continue shopping for more products"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {t('continueShopping')}
            </Link>
          </nav>
        </main>
      </div>
    </div>
  );
}