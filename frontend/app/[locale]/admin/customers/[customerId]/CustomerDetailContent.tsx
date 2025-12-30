'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { customerApi, CustomerDetail } from '@/lib/customer-api';
import { SvgUsers } from '@/components/Svgs';

interface CustomerDetailContentProps {
  customerId: string;
  locale: string;
}

export default function CustomerDetailContent({ customerId, locale }: CustomerDetailContentProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isVietnamese = locale === 'vi';

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      backToList: { en: 'Back to Customers', vi: 'Quay lại danh sách' },
      customerDetails: { en: 'Customer Details', vi: 'Chi tiết khách hàng' },
      profileInformation: { en: 'Profile Information', vi: 'Thông tin hồ sơ' },
      email: { en: 'Email', vi: 'Email' },
      name: { en: 'Name', vi: 'Tên' },
      registrationDate: { en: 'Registration Date', vi: 'Ngày đăng ký' },
      oauthProviders: { en: 'OAuth Providers', vi: 'Nhà cung cấp OAuth' },
      oauthUsername: { en: 'OAuth Username', vi: 'Tên người dùng OAuth' },
      oauthProviderId: { en: 'Provider ID', vi: 'ID nhà cung cấp' },
      statistics: { en: 'Statistics', vi: 'Thống kê' },
      totalOrders: { en: 'Total Orders', vi: 'Tổng đơn hàng' },
      totalSpent: { en: 'Total Spent', vi: 'Tổng chi tiêu' },
      orderHistory: { en: 'Order History', vi: 'Lịch sử đơn hàng' },
      orderNumber: { en: 'Order Number', vi: 'Mã đơn hàng' },
      date: { en: 'Date', vi: 'Ngày' },
      status: { en: 'Status', vi: 'Trạng thái' },
      paymentStatus: { en: 'Payment Status', vi: 'Trạng thái thanh toán' },
      total: { en: 'Total', vi: 'Tổng tiền' },
      viewOrder: { en: 'View Order', vi: 'Xem đơn hàng' },
      noOrders: { en: 'No orders yet', vi: 'Chưa có đơn hàng' },
      noOrdersDesc: { en: 'This customer has not placed any orders', vi: 'Khách hàng này chưa đặt đơn hàng nào' },
      addresses: { en: 'Addresses', vi: 'Địa chỉ' },
      defaultAddress: { en: 'Default', vi: 'Mặc định' },
      phone: { en: 'Phone', vi: 'Số điện thoại' },
      noAddresses: { en: 'No addresses', vi: 'Chưa có địa chỉ' },
      noAddressesDesc: { en: 'This customer has not added any addresses', vi: 'Khách hàng này chưa thêm địa chỉ nào' },
      loading: { en: 'Loading...', vi: 'Đang tải...' },
      error: { en: 'Error loading customer details', vi: 'Lỗi khi tải thông tin khách hàng' },
      retry: { en: 'Retry', vi: 'Thử lại' },
      notFound: { en: 'Customer not found', vi: 'Không tìm thấy khách hàng' },
      google: { en: 'Google', vi: 'Google' },
      facebook: { en: 'Facebook', vi: 'Facebook' },
      noOAuthProviders: { en: 'None', vi: 'Không có' },
      // Order statuses
      PENDING: { en: 'Pending', vi: 'Chờ xử lý' },
      PROCESSING: { en: 'Processing', vi: 'Đang xử lý' },
      SHIPPED: { en: 'Shipped', vi: 'Đã gửi hàng' },
      DELIVERED: { en: 'Delivered', vi: 'Đã giao hàng' },
      CANCELLED: { en: 'Cancelled', vi: 'Đã hủy' },
      REFUNDED: { en: 'Refunded', vi: 'Đã hoàn tiền' },
      // Payment statuses
      PAID: { en: 'Paid', vi: 'Đã thanh toán' },
      FAILED: { en: 'Failed', vi: 'Thất bại' },
    };
    return translations[key]?.[locale] || translations[key]?.en || key;
  };

  useEffect(() => {
    loadCustomerDetail();
  }, [customerId]);

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getCustomerDetail(customerId);
      setCustomer(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(t('notFound'));
      } else {
        setError(err.response?.data?.message || t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isVietnamese ? 'vi-VN' : 'en-US', {
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

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href={`/${locale}/admin/customers`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          ← {t('backToList')}
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={loadCustomerDetail}
            className="text-red-700 hover:text-red-900 font-medium"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/admin/customers`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          ← {t('backToList')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('customerDetails')}</h1>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('profileInformation')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('email')}</label>
            <p className="mt-1 text-sm text-gray-900">{customer.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('name')}</label>
            <p className="mt-1 text-sm text-gray-900">
              {customer.firstName || customer.lastName
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                : '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('registrationDate')}</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(customer.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('oauthProviders')}</label>
            <div className="mt-1 flex gap-2">
              {customer.googleId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {t('google')}
                </span>
              )}
              {customer.facebookId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {t('facebook')}
                </span>
              )}
              {!customer.googleId && !customer.facebookId && (
                <span className="text-sm text-gray-500">{t('noOAuthProviders')}</span>
              )}
            </div>
          </div>
          {customer.username && (
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('oauthUsername')}</label>
              <p className="mt-1 text-sm text-gray-900">{customer.username}</p>
            </div>
          )}
        </div>

        {/* OAuth Provider Details */}
        {(customer.googleId || customer.facebookId) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">OAuth Provider Details</h3>
            <div className="space-y-4">
              {customer.googleId && (
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {t('google')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">{t('oauthProviderId')}</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{customer.googleId}</p>
                    </div>
                  </div>
                </div>
              )}
              {customer.facebookId && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {t('facebook')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">{t('oauthProviderId')}</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{customer.facebookId}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('statistics')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-600">{t('totalOrders')}</label>
            <p className="mt-2 text-3xl font-bold text-blue-900">{customer.totalOrders}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-green-600">{t('totalSpent')}</label>
            <p className="mt-2 text-3xl font-bold text-green-900">{formatCurrency(customer.totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('addresses')}</h2>
        {customer.addresses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">{t('noAddressesDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 ${
                  address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {address.isDefault && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded mb-2">
                    {t('defaultAddress')}
                  </span>
                )}
                <p className="font-medium text-gray-900">{address.fullName}</p>
                <p className="text-sm text-gray-600 mt-1">{address.addressLine1}</p>
                {address.addressLine2 && (
                  <p className="text-sm text-gray-600">{address.addressLine2}</p>
                )}
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-sm text-gray-600">{address.country}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {t('phone')}: {address.phone}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('orderHistory')}</h2>
        </div>
        {customer.orders.length === 0 ? (
          <div className="text-center py-12">
            <SvgUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noOrders')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('noOrdersDesc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('orderNumber')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('paymentStatus')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('total')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          order.status
                        )}`}
                      >
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(
                          order.paymentStatus
                        )}`}
                      >
                        {t(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/${locale}/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('viewOrder')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
