/**
 * AdminSendInvoiceButton Component
 *
 * Admin-specific send invoice email button that:
 * - Shows/hides based on quote item pricing status
 * - Only appears when all items have prices set
 * - Provides admin feedback messages for invoice email operations
 */

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Order, orderApi, InvoiceEmailResponse } from '@/lib/order-api';
import { hasQuoteItems, validateAllItemsPriced } from '@/lib/quote-item-utils';
import { SvgRefresh, SvgMail, SvgCheck, SvgExclamationCircle } from '../../Svgs';

interface AdminSendInvoiceButtonProps {
  order: Order;
  locale: 'en' | 'vi';
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function AdminSendInvoiceButton({
  order,
  locale,
  className = '',
  onSuccess,
  onError,
}: AdminSendInvoiceButtonProps) {
  const t = useTranslations('admin');
  const tEmail = useTranslations('email.pdfAttachment');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Convert order to the format expected by quote item utilities
  const orderData = useMemo(() => ({
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      id: item.id,
      name: locale === 'vi' ? item.productNameVi : item.productNameEn,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    })),
  }), [order.orderNumber, order.items, locale]);

  // Check if order has quote items and if all items are priced
  const { hasQuotes, allItemsPriced, canSendInvoice } = useMemo(() => {
    const hasQuotes = hasQuoteItems(orderData);
    const allItemsPriced = validateAllItemsPriced(orderData);
    const canSendInvoice = !hasQuotes || allItemsPriced;

    return { hasQuotes, allItemsPriced, canSendInvoice };
  }, [orderData]);

  const handleSendInvoice = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const data: InvoiceEmailResponse = await orderApi.sendInvoiceEmail(order.orderNumber, {
        email: order.email,
        locale,
      });

      if (data.success) {
        const successMessage = data.message || tEmail('sendInvoiceSuccess');

        setMessage({
          type: 'success',
          text: successMessage,
        });
        onSuccess?.(successMessage);
      } else {
        // Handle different error types
        let errorMessage = data.message || tEmail('sendInvoiceError');

        if (data.rateLimited) {
          errorMessage = data.message || tEmail('sendInvoiceRateLimit');
        }

        setMessage({
          type: 'error',
          text: errorMessage,
        });
        onError?.(errorMessage);
      }
    } catch (error: any) {
      console.error('Error sending invoice email:', error);

      // Handle API client errors
      let errorMessage = tEmail('sendInvoiceError');

      if (error.response?.status === 429) {
        errorMessage = error.response?.data?.message || tEmail('sendInvoiceRateLimit');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setMessage({
        type: 'error',
        text: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Warning message when invoice cannot be sent */}
      {!canSendInvoice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <SvgExclamationCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                {locale === 'vi' ? 'Không thể gửi hóa đơn' : 'Cannot Send Invoice'}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {locale === 'vi'
                  ? 'Đơn hàng này chứa sản phẩm chưa có giá. Vui lòng đặt giá cho tất cả sản phẩm trước khi gửi hóa đơn.'
                  : 'This order contains items without prices. Please set prices for all items before sending an invoice.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info message for priced orders */}
      {canSendInvoice && hasQuotes && allItemsPriced && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <SvgCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">
              {locale === 'vi'
                ? 'Tất cả sản phẩm đã có giá. Bạn có thể xếp hàng email hóa đơn với PDF chứa thông tin giá hiện tại.'
                : 'All items are now priced. You can queue the invoice email with PDF containing current pricing information.'}
            </p>
          </div>
        </div>
      )}

      {/* Info message for orders without quote items */}
      {canSendInvoice && !hasQuotes && allItemsPriced && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <SvgCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              {locale === 'vi'
                ? 'Đơn hàng này có thể xếp hàng email hóa đơn với PDF. PDF sẽ chứa thông tin giá mới nhất.'
                : 'This order can queue invoice email with PDF. The PDF will contain the latest pricing information.'}
            </p>
          </div>
        </div>
      )}

      {/* Button section - always present but conditionally enabled */}
      {canSendInvoice && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleSendInvoice}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:bg-orange-700 active:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md ${className}`}
            aria-label={
              locale === 'vi'
                ? 'Xếp hàng email hóa đơn với PDF đính kèm'
                : 'Queue invoice email with PDF attachment'
            }
            title={
              locale === 'vi'
                ? 'Xếp hàng email hóa đơn với PDF đính kèm'
                : 'Queue invoice email with PDF attachment'
            }
          >
            {isLoading ? (
              <>
                <SvgRefresh className="w-5 h-5 animate-spin" aria-hidden="true" />
                <div>
                  {locale === 'vi' ? 'Đang xếp hàng...' : 'Queueing...'}
                </div>
              </>
            ) : (
              <>
                <SvgMail className="w-5 h-5" aria-hidden="true" />
                <div>
                  {locale === 'vi' ? 'Gửi Email Hóa Đơn' : 'Send Invoice Email'}
                </div>
              </>
            )}
          </button>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`max-w-md text-center p-3 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center justify-center gap-2">
                {message.type === 'success' ? (
                  <SvgCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <SvgExclamationCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}