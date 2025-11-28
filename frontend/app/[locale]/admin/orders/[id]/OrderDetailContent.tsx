'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderApi, Order } from '@/lib/order-api';
import { paymentApi, RefundInfo } from '@/lib/payment-api';
import { shippingApi, ShippingLabel } from '@/lib/shipping-api';
import PaymentStatusUpdateModal from '@/components/PaymentStatusUpdateModal';
import { isContactForPrice, getAdminOrderPricingMessage } from '@/app/utils';
import translations from '@/locales/translations.json';

interface OrderDetailContentProps {
  locale: string;
  orderId: string;
}

export default function OrderDetailContent({ locale, orderId }: OrderDetailContentProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [shippingLabel, setShippingLabel] = useState<ShippingLabel | null>(null);
  const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [itemPrices, setItemPrices] = useState<Record<string, string>>({});
  const [settingPrice, setSettingPrice] = useState<string | null>(null);
  const router = useRouter();

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value?.[locale] || value?.en || key;
  };

  useEffect(() => {
    loadOrder();
    loadRefundInfo();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderApi.getOrder(orderId);
      setOrder(data);
      setSelectedStatus(data.status);
      setRefundAmount(data.total.toString());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const loadRefundInfo = async () => {
    try {
      const info = await paymentApi.getRefundInfo(orderId);
      setRefundInfo(info);
    } catch (err: any) {
      console.error('Failed to load refund info:', err);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || selectedStatus === order.status) return;

    try {
      setUpdating(true);
      const updatedOrder = await orderApi.updateOrderStatus(orderId, { status: selectedStatus });
      setOrder(updatedOrder);
      alert(t('orders.updateSuccess'));
    } catch (err: any) {
      alert(err.response?.data?.message || t('orders.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!order || !refundInfo?.canRefund) return;

    if (!confirm(t('orders.confirmRefund'))) {
      return;
    }

    try {
      setProcessingRefund(true);
      const amount = refundAmount ? parseFloat(refundAmount) : undefined;

      const result = await paymentApi.processRefund({
        orderId,
        amount,
        reason: refundReason,
      });

      alert(t('orders.refundSuccess'));
      setShowRefundModal(false);

      // Reload order data
      await loadOrder();
      await loadRefundInfo();
    } catch (err: any) {
      alert(err.response?.data?.message || t('orders.refundError'));
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleGenerateLabel = async () => {
    if (!order || !selectedCarrier) return;

    try {
      setGeneratingLabel(true);
      const label = await shippingApi.generateLabel({
        orderId,
        carrier: selectedCarrier,
      });

      setShippingLabel(label);
      alert(t('orders.labelGenerated'));
      setShowLabelModal(false);

      // Reload order data
      await loadOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || t('orders.labelError'));
    } finally {
      setGeneratingLabel(false);
    }
  };

  const canGenerateLabel = order &&
    order.status !== 'CANCELLED' &&
    order.status !== 'REFUNDED' &&
    order.paymentStatus === 'PAID';

  const handlePaymentStatusUpdate = async (paymentStatus: string, notes?: string) => {
    if (!order) return;

    const updatedOrder = await orderApi.updateOrderPaymentStatus(orderId, {
      paymentStatus,
      notes,
    });

    setOrder(updatedOrder);
    setToastType('success');
    setToastMessage(t('orders.paymentStatusUpdateSuccess'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePriceChange = (itemId: string, value: string) => {
    setItemPrices((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleSetPrice = async (itemId: string) => {
    if (!order) return;

    const priceValue = itemPrices[itemId];
    if (!priceValue || parseFloat(priceValue) <= 0) {
      showToast(
        locale === 'vi' ? 'Vui lòng nhập giá hợp lệ' : 'Please enter a valid price',
        'error'
      );
      return;
    }

    try {
      setSettingPrice(itemId);
      const updatedOrder = await orderApi.setOrderItemPrice(order.id, itemId, {
        price: parseFloat(priceValue),
      });
      setOrder(updatedOrder);
      setItemPrices((prev) => {
        const newPrices = { ...prev };
        delete newPrices[itemId];
        return newPrices;
      });
      showToast(
        locale === 'vi' ? 'Đã cập nhật giá thành công' : 'Price updated successfully',
        'success'
      );
    } catch (err: any) {
      showToast(
        err.response?.data?.message ||
          (locale === 'vi' ? 'Không thể cập nhật giá' : 'Failed to update price'),
        'error'
      );
    } finally {
      setSettingPrice(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Order not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/${locale}/admin/orders`}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← {t('common.back')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('orders.orderDetails')} - {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-4">
          {order.requiresPricing && (
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
              {locale === 'vi' ? '💰 Cần đặt giá' : '💰 Needs Pricing'}
            </span>
          )}
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(
              order.status
            )}`}
          >
            {t(`orders.status${order.status.charAt(0) + order.status.slice(1).toLowerCase()}`)}
          </span>
        </div>
      </div>

      {/* Warning message for orders requiring pricing */}
      {order.requiresPricing && order.items.some((item) => isContactForPrice(item.price)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{getAdminOrderPricingMessage(locale)}</p>
        </div>
      )}

      {/* Status Update */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.updateStatus')}</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="PENDING">{t('orders.statusPending')}</option>
            <option value="PROCESSING">{t('orders.statusProcessing')}</option>
            <option value="SHIPPED">{t('orders.statusShipped')}</option>
            <option value="DELIVERED">{t('orders.statusDelivered')}</option>
            <option value="CANCELLED">{t('orders.statusCancelled')}</option>
            <option value="REFUNDED">{t('orders.statusRefunded')}</option>
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === order.status}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {updating ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Payment Status Update */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.paymentStatus')}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{t('orders.currentStatus')}:</span>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusBadgeColor(
                order.paymentStatus
              )}`}
            >
              {t(`orders.payment${order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase()}`)}
            </span>
          </div>
          <button
            onClick={() => setShowPaymentStatusModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('orders.updatePaymentStatus')}
          </button>
        </div>
      </div>

      {/* Refund Section */}
      {refundInfo?.canRefund && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.processRefund')}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('orders.total')}: {formatCurrency(order.total)}
          </p>
          <button
            onClick={() => setShowRefundModal(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('orders.processRefund')}
          </button>
        </div>
      )}

      {/* Shipping Label Section */}
      {canGenerateLabel && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.generateLabel')}</h2>
          {shippingLabel ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">{t('orders.trackingNumber')}: </span>
                <span className="text-sm text-gray-900">{shippingLabel.trackingNumber}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">{t('orders.carrier')}: </span>
                <span className="text-sm text-gray-900">{shippingLabel.carrier}</span>
              </div>
              <a
                href={shippingLabel.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('orders.downloadLabel')}
              </a>
            </div>
          ) : (
            <button
              onClick={() => setShowLabelModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('orders.generateLabel')}
            </button>
          )}
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.processRefund')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orders.refundAmount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formatCurrency(order.total)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('orders.fullRefund')}: {formatCurrency(order.total)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orders.refundReason')}
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('orders.refundReason')}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={processingRefund}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRefund}
                disabled={processingRefund}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {processingRefund ? t('common.loading') : t('orders.processRefund')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Label Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.generateLabel')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orders.selectCarrier')}
                </label>
                <select
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('orders.selectCarrier')}</option>
                  <option value="Vietnam Post">Vietnam Post</option>
                  <option value="Express Delivery">Express Delivery</option>
                  <option value="DHL">DHL</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {t('orders.shippingMethod')}: {order.shippingMethod}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLabelModal(false)}
                disabled={generatingLabel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleGenerateLabel}
                disabled={generatingLabel || !selectedCarrier}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {generatingLabel ? t('common.loading') : t('orders.generateLabel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.orderInfo')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orders.orderNumber')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orders.date')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orders.status')}</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                    order.status
                  )}`}
                >
                  {t(`orders.status${order.status.charAt(0) + order.status.slice(1).toLowerCase()}`)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orders.paymentStatus')}</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(
                    order.paymentStatus
                  )}`}
                >
                  {t(`orders.payment${order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase()}`)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orders.paymentMethod')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('orders.shippingMethod')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.shippingMethod}</dd>
            </div>
            {order.notes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('orders.notes')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.customerInfo')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('auth.email')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.email}</dd>
            </div>
          </dl>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.shippingInfo')}</h2>
          <address className="not-italic text-sm text-gray-900">
            <div className="font-medium">{order.shippingAddress.fullName}</div>
            <div>{order.shippingAddress.phone}</div>
            <div className="mt-2">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && (
                <>
                  <br />
                  {order.shippingAddress.addressLine2}
                </>
              )}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </div>
          </address>
        </div>

        {/* Billing Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orders.billingInfo')}</h2>
          <address className="not-italic text-sm text-gray-900">
            <div className="font-medium">{order.billingAddress.fullName}</div>
            <div>{order.billingAddress.phone}</div>
            <div className="mt-2">
              {order.billingAddress.addressLine1}
              {order.billingAddress.addressLine2 && (
                <>
                  <br />
                  {order.billingAddress.addressLine2}
                </>
              )}
              <br />
              {order.billingAddress.city}, {order.billingAddress.state}{' '}
              {order.billingAddress.postalCode}
              <br />
              {order.billingAddress.country}
            </div>
          </address>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('orders.orderItems')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product.sku')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product.quantity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product.price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orders.total')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id} className={isContactForPrice(item.price) ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.product?.images?.[0] && (
                        <img
                          src={item.product.images[0].url}
                          alt={locale === 'vi' ? item.productNameVi : item.productNameEn}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {locale === 'vi' ? item.productNameVi : item.productNameEn}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isContactForPrice(item.price) ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder={locale === 'vi' ? 'Nhập giá' : 'Enter price'}
                          value={itemPrices[item.id] || ''}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          disabled={settingPrice === item.id}
                          className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                        <button
                          onClick={() => handleSetPrice(item.id)}
                          disabled={settingPrice === item.id || !itemPrices[item.id]}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {settingPrice === item.id
                            ? locale === 'vi'
                              ? 'Đang lưu...'
                              : 'Saving...'
                            : locale === 'vi'
                            ? 'Đặt giá'
                            : 'Set Price'}
                        </button>
                      </div>
                    ) : (
                      formatCurrency(item.price)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {isContactForPrice(item.price) ? (
                      <span className="text-yellow-600 font-semibold">
                        {locale === 'vi' ? 'Chưa có giá' : 'Not Priced'}
                      </span>
                    ) : (
                      formatCurrency(item.total)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-600">{t('orders.subtotal')}</dt>
              <dd className="text-gray-900">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-600">{t('orders.shipping')}</dt>
              <dd className="text-gray-900">{formatCurrency(order.shippingCost)}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-600">{t('orders.tax')}</dt>
              <dd className="text-gray-900">{formatCurrency(order.taxAmount)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">{t('orders.discount')}</dt>
                <dd className="text-green-600">-{formatCurrency(order.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
              <dt className="text-gray-900">{t('orders.total')}</dt>
              <dd className="text-gray-900">{formatCurrency(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Payment Status Update Modal */}
      <PaymentStatusUpdateModal
        isOpen={showPaymentStatusModal}
        currentStatus={order.paymentStatus}
        onClose={() => setShowPaymentStatusModal(false)}
        onConfirm={handlePaymentStatusUpdate}
        locale={locale}
        translations={translations}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toastType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
