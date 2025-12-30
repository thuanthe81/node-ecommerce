'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { customerApi, Customer, CustomerFilters } from '@/lib/customer-api';
import { SvgUsers } from '@/components/Svgs';

interface CustomerListContentProps {
  locale: string;
}

export default function CustomerListContent({ locale }: CustomerListContentProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomerFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const isVietnamese = locale === 'vi';

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { en: 'Customer Management', vi: 'Quản lý khách hàng' },
      subtitle: { en: 'View and manage customer information', vi: 'Xem và quản lý thông tin khách hàng' },
      search: { en: 'Search', vi: 'Tìm kiếm' },
      searchPlaceholder: { en: 'Search by name or email...', vi: 'Tìm theo tên hoặc email...' },
      filterByDate: { en: 'Filter by Date', vi: 'Lọc theo ngày' },
      from: { en: 'From', vi: 'Từ ngày' },
      to: { en: 'To', vi: 'Đến ngày' },
      clearFilters: { en: 'Clear Filters', vi: 'Xóa bộ lọc' },
      export: { en: 'Export CSV', vi: 'Xuất CSV' },
      email: { en: 'Email', vi: 'Email' },
      name: { en: 'Name', vi: 'Tên' },
      oauthProviders: { en: 'OAuth Providers', vi: 'Nhà cung cấp OAuth' },
      registrationDate: { en: 'Registration Date', vi: 'Ngày đăng ký' },
      totalOrders: { en: 'Total Orders', vi: 'Tổng đơn hàng' },
      totalSpent: { en: 'Total Spent', vi: 'Tổng chi tiêu' },
      actions: { en: 'Actions', vi: 'Thao tác' },
      viewDetails: { en: 'View Details', vi: 'Xem chi tiết' },
      noCustomers: { en: 'No customers found', vi: 'Không tìm thấy khách hàng' },
      noCustomersDesc: { en: 'No customers match your search criteria', vi: 'Không có khách hàng nào phù hợp với tiêu chí tìm kiếm' },
      previous: { en: 'Previous', vi: 'Trước' },
      next: { en: 'Next', vi: 'Tiếp' },
      page: { en: 'Page', vi: 'Trang' },
      of: { en: 'of', vi: 'của' },
      customers: { en: 'customers', vi: 'khách hàng' },
      loading: { en: 'Loading...', vi: 'Đang tải...' },
      error: { en: 'Error loading customers', vi: 'Lỗi khi tải danh sách khách hàng' },
      retry: { en: 'Retry', vi: 'Thử lại' },
      google: { en: 'Google', vi: 'Google' },
      facebook: { en: 'Facebook', vi: 'Facebook' },
      noOAuthProviders: { en: 'None', vi: 'Không có' },
    };
    return translations[key]?.[locale] || translations[key]?.en || key;
  };

  useEffect(() => {
    loadCustomers();
  }, [filters]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerApi.getAllCustomers(filters);
      setCustomers(data.customers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleDateFilter = (field: 'startDate' | 'endDate', value: string) => {
    if (value === '') {
      const { [field]: _, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    } else {
      setFilters({ ...filters, [field]: value, page: 1 });
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchTerm('');
  };

  const handleSort = (column: 'createdAt' | 'totalOrders' | 'totalSpent') => {
    if (filters.sortBy === column) {
      setFilters({
        ...filters,
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
      });
    } else {
      setFilters({
        ...filters,
        sortBy: column,
        sortOrder: 'desc',
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await customerApi.exportCustomers(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isVietnamese ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return '↕';
    return filters.sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('subtitle')}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || customers.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {exporting ? t('loading') : t('export')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('search')}
          </button>
        </form>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('from')}
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleDateFilter('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('to')}
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleDateFilter('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={loadCustomers}
            className="text-red-700 hover:text-red-900 font-medium"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <SvgUsers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noCustomers')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('noCustomersDesc')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('oauthProviders')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('registrationDate')} {getSortIcon('createdAt')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalOrders')}
                    >
                      {t('totalOrders')} {getSortIcon('totalOrders')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalSpent')}
                    >
                      {t('totalSpent')} {getSortIcon('totalSpent')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.firstName || customer.lastName
                            ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(customer.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.totalOrders}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalSpent)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/${locale}/admin/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('viewDetails')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {t('previous')}
                </button>
                <button
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {t('next')}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t('page')} <span className="font-medium">{filters.page}</span> {t('of')}{' '}
                    <span className="font-medium">{totalPages}</span> ({total} {t('customers')})
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {t('previous')}
                    </button>
                    <button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {t('next')}
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
