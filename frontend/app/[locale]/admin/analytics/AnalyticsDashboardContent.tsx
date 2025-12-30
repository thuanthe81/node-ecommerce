'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import {
  getDashboardMetrics,
  getSalesReport,
  DashboardMetrics,
  SalesReport,
} from '@/lib/analytics-api';
import { formatMoney } from '@/app/utils';

export default function AnalyticsDashboardContent() {
  const locale = useLocale();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily',
  );

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, salesData] = await Promise.all([
        getDashboardMetrics(dateRange),
        getSalesReport(dateRange),
      ]);
      setMetrics(metricsData);
      setSalesReport(salesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Invalid date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(
      locale === 'vi' ? 'vi-VN' : 'en-US',
    );
  };

  const getSalesData = () => {
    if (!salesReport) return [];
    switch (viewMode) {
      case 'daily':
        return salesReport.dailySales;
      case 'weekly':
        return salesReport.weeklySales;
      case 'monthly':
        return salesReport.monthlySales;
      default:
        return salesReport.dailySales;
    }
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              {locale === 'vi' ? 'Bảng điều khiển phân tích' : 'Analytics Dashboard'}
            </h1>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'vi' ? 'Từ ngày' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'vi' ? 'Đến ngày' : 'End Date'}
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <button
                onClick={fetchData}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {locale === 'vi' ? 'Áp dụng' : 'Apply'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">
                {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!loading && !error && metrics && salesReport && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">
                    {locale === 'vi' ? 'Tổng doanh thu' : 'Total Revenue'}
                  </h3>
                  <p className="text-2xl font-bold mt-2">
                    {formatMoney(metrics.revenue.totalRevenue, locale)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {metrics.revenue.totalOrders}{' '}
                    {locale === 'vi' ? 'đơn hàng' : 'orders'}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">
                    {locale === 'vi' ? 'Lượt xem trang' : 'Page Views'}
                  </h3>
                  <p className="text-2xl font-bold mt-2">
                    {metrics.overview.totalPageViews.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">
                    {locale === 'vi' ? 'Lượt xem sản phẩm' : 'Product Views'}
                  </h3>
                  <p className="text-2xl font-bold mt-2">
                    {metrics.overview.totalProductViews.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">
                    {locale === 'vi' ? 'Thêm vào giỏ' : 'Add to Cart'}
                  </h3>
                  <p className="text-2xl font-bold mt-2">
                    {metrics.overview.totalAddToCarts.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Sales Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {locale === 'vi' ? 'Doanh số bán hàng' : 'Sales Revenue'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('daily')}
                      className={`px-3 py-1 rounded ${
                        viewMode === 'daily'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {locale === 'vi' ? 'Ngày' : 'Daily'}
                    </button>
                    <button
                      onClick={() => setViewMode('weekly')}
                      className={`px-3 py-1 rounded ${
                        viewMode === 'weekly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {locale === 'vi' ? 'Tuần' : 'Weekly'}
                    </button>
                    <button
                      onClick={() => setViewMode('monthly')}
                      className={`px-3 py-1 rounded ${
                        viewMode === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {locale === 'vi' ? 'Tháng' : 'Monthly'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">
                          {locale === 'vi' ? 'Thời gian' : 'Period'}
                        </th>
                        <th className="text-right py-2">
                          {locale === 'vi' ? 'Doanh thu' : 'Revenue'}
                        </th>
                        <th className="text-right py-2">
                          {locale === 'vi' ? 'Đơn hàng' : 'Orders'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSalesData().map((item: any, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">
                            {item.date
                              ? formatDate(item.date)
                              : item.week || item.month}
                          </td>
                          <td className="text-right py-2">
                            {formatMoney(item.revenue, locale)}
                          </td>
                          <td className="text-right py-2">{item.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">
                  {locale === 'vi' ? 'Sản phẩm hàng đầu' : 'Top Products'}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">
                          {locale === 'vi' ? 'Sản phẩm' : 'Product'}
                        </th>
                        <th className="text-right py-2">
                          {locale === 'vi' ? 'Lượt xem' : 'Views'}
                        </th>
                        <th className="text-right py-2">
                          {locale === 'vi' ? 'Đã bán' : 'Purchases'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topProducts.map((product) => (
                        <tr key={product.productId} className="border-b">
                          <td className="py-2">
                            {locale === 'vi' ? product.nameVi : product.nameEn}
                          </td>
                          <td className="text-right py-2">{product.views}</td>
                          <td className="text-right py-2">
                            {product.purchases}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alert */}
              {metrics.lowStockProducts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4 text-yellow-800">
                    {locale === 'vi'
                      ? 'Cảnh báo tồn kho thấp'
                      : 'Low Stock Alert'}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-yellow-300">
                          <th className="text-left py-2">
                            {locale === 'vi' ? 'Sản phẩm' : 'Product'}
                          </th>
                          <th className="text-left py-2">SKU</th>
                          <th className="text-right py-2">
                            {locale === 'vi' ? 'Tồn kho' : 'Stock'}
                          </th>
                          <th className="text-right py-2">
                            {locale === 'vi' ? 'Ngưỡng' : 'Threshold'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.lowStockProducts.map((product) => (
                          <tr key={product.id} className="border-b border-yellow-200">
                            <td className="py-2">
                              {locale === 'vi' ? product.nameVi : product.nameEn}
                            </td>
                            <td className="py-2">{product.sku}</td>
                            <td className="text-right py-2 font-bold text-red-600">
                              {product.stockQuantity}
                            </td>
                            <td className="text-right py-2">
                              {product.lowStockThreshold}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Cart Abandonment */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">
                  {locale === 'vi'
                    ? 'Tỷ lệ bỏ giỏ hàng'
                    : 'Cart Abandonment Rate'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'vi' ? 'Thêm vào giỏ' : 'Add to Cart'}
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.cartAbandonment.addToCartCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'vi' ? 'Hoàn thành mua' : 'Completed Purchases'}
                    </p>
                    <p className="text-2xl font-bold">
                      {metrics.cartAbandonment.purchaseCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {locale === 'vi' ? 'Tỷ lệ bỏ giỏ' : 'Abandonment Rate'}
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {metrics.cartAbandonment.abandonmentRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
