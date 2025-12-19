/**
 * OrderDetailView Component
 *
 * Displays detailed information about an order including items, pricing,
 * shipping information, and payment instructions.
 *
 * @param props - Component props
 * @param props.orderId - The ID of the order to display
 * @param props.locale - Current locale for formatting and translations
 * @param props.showSuccessBanner - Whether to show the success banner at the top
 * @param props.showBankTransferForPaidOrders - Whether to show bank transfer info for paid orders
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { OrderDetailViewProps } from './types';
import { useOrderData } from './hooks/useOrderData';
import { useBankSettings } from './hooks/useBankSettings';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { SuccessBanner } from './components/SuccessBanner';
import { OrderHeader } from './components/OrderHeader';
import { OrderSummary } from './components/OrderSummary';
import { OrderItems } from './components/OrderItems';
import { ShippingInfo } from './components/ShippingInfo';
import { BankTransferInfo } from './components/BankTransferInfo';
import { ResendEmailButton } from './components/ResendEmailButton';

export default function OrderDetailView({
  orderId,
  locale,
  showSuccessBanner = false,
  showBankTransferForPaidOrders = true,
}: OrderDetailViewProps) {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("orders");
  const tEmailAttachment = useTranslations("email.pdfAttachment")

  // Fetch order data using custom hook
  const {
    order,
    isLoading: isLoadingOrder,
    error: orderError,
    refetch: refetchOrder,
  } = useOrderData(orderId);

  // Fetch bank settings using custom hook
  const {
    bankSettings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useBankSettings(order, showBankTransferForPaidOrders);

  const handlePrint = () => {
    window.print();
  };

  // Determine if we should show bank transfer section
  const shouldShowBankTransfer = () => {
    if (!order) return false;
    if (showBankTransferForPaidOrders) return true;

    const paidStatuses = ['DELIVERED', 'COMPLETED', 'PAID'];
    return !paidStatuses.includes(order.status);
  };

  // Loading state
  if (isLoadingOrder) {
    return <LoadingState />;
  }

  // Error state
  if (orderError) {
    return (
      <ErrorState
        error={orderError}
        locale={locale}
        isAuthenticated={isAuthenticated}
        onRetry={refetchOrder}
      />
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <main id="main-content" className="max-w-5xl mx-auto">
          {/* Success Banner - Only shown if showSuccessBanner is true */}
          {showSuccessBanner && (
            <SuccessBanner orderNumber={order.orderNumber} />
          )}

          {/* Order Header - Only shown if NOT showing success banner */}
          {!showSuccessBanner && (
            <OrderHeader
              orderNumber={order.orderNumber}
              createdAt={order.createdAt}
              locale={locale}
            />
          )}

          {/* Order Summary Section */}
          <OrderSummary order={order} locale={locale} />

          {/* Order Items */}
          <OrderItems items={order.items} locale={locale} />

          {/* Shipping Information Section */}
          <ShippingInfo
            shippingAddress={order.shippingAddress}
            shippingMethod={order.shippingMethod}
          />

          {/* Bank Transfer Instructions Section - Conditionally shown */}
          {shouldShowBankTransfer() && (
            <BankTransferInfo
              bankSettings={bankSettings}
              order={order}
              locale={locale}
              isLoading={isLoadingSettings}
              error={settingsError}
              onRetry={refetchSettings}
            />
          )}

          {/* Action Buttons */}
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

          {/* Resend Email Section - Only shown on order confirmation pages */}
          {showSuccessBanner && (
            <div className="mt-8 pt-6 border-t border-gray-200 print:hidden">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {tEmailAttachment('resendEmailDescription')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {locale === 'vi'
                    ? 'Nếu bạn không nhận được email xác nhận, vui lòng nhấn nút bên dưới để gửi lại.'
                    : 'If you didn\'t receive the confirmation email, please click the button below to resend it.'
                  }
                </p>
                <ResendEmailButton
                  orderNumber={order.orderNumber}
                  customerEmail={order.email}
                  locale={locale as 'en' | 'vi'}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}