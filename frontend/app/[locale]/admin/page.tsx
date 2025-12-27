'use client';

import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SvgCurrency, SvgClipboard, SvgBoxes, SvgUsers, SvgPlus, SvgGrid, SvgTag } from '@/components/Svgs';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatMoney, formatNumber } from '@/app/utils';

export default function AdminDashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  // Integrate useDashboardStats hook
  const { stats: dashboardStats, retryRevenue, retryOrders, retryProducts, retryCustomers } = useDashboardStats();

  const stats = [
    {
      name: t('admin.totalRevenue'),
      stat: dashboardStats.revenue,
      retry: retryRevenue,
      icon: <SvgCurrency className="w-6 h-6" />,
      color: 'bg-blue-500',
      type: 'currency' as const,
    },
    {
      name: t('common.orders'),
      stat: dashboardStats.orders,
      retry: retryOrders,
      icon: <SvgClipboard className="w-6 h-6" />,
      color: 'bg-green-500',
      type: 'number' as const,
    },
    {
      name: t('common.products'),
      stat: dashboardStats.products,
      retry: retryProducts,
      icon: <SvgBoxes className="w-6 h-6" />,
      color: 'bg-purple-500',
      type: 'number' as const,
    },
    {
      name: t('common.customers'),
      stat: dashboardStats.customers,
      retry: retryCustomers,
      icon: <SvgUsers className="w-6 h-6" />,
      color: 'bg-yellow-500',
      type: 'number' as const,
    },
  ];

  const quickActions = [
    {
      name: t('admin.addProduct'),
      href: `/${locale}/admin/products/new`,
      icon: <SvgPlus className="w-5 h-5" />,
    },
    {
      name: t('admin.viewOrders'),
      href: `/${locale}/admin/orders`,
      icon: <SvgClipboard className="w-5 h-5" />,
    },
    {
      name: t('admin.manageCategories'),
      href: `/${locale}/admin/categories`,
      icon: <SvgGrid className="w-5 h-5" />,
    },
    {
      name: t('admin.createPromotion'),
      href: `/${locale}/admin/promotions/new`,
      icon: <SvgTag className="w-5 h-5" />,
    },
  ];

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('admin.dashboard')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('admin.dashboardWelcome')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${stat.color} rounded-md p-3 text-white`}>
                      {stat.icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {/* Loading State */}
                          {stat.stat.loading && (
                            <div
                              className="animate-pulse"
                              aria-live="polite"
                              aria-busy="true"
                              role="status"
                            >
                              <div className="h-8 bg-gray-200 rounded w-24"></div>
                            </div>
                          )}

                          {/* Error State */}
                          {!stat.stat.loading && stat.stat.error && (
                            <div className="space-y-2" role="alert" aria-live="assertive">
                              <p className="text-sm text-red-600">{stat.stat.error}</p>
                              <button
                                onClick={stat.retry}
                                className="text-xs text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                aria-label={`Retry loading ${stat.name}`}
                              >
                                {locale === 'vi' ? 'Thử lại' : 'Retry'}
                              </button>
                            </div>
                          )}

                          {/* Success State - Display formatted value */}
                          {!stat.stat.loading && !stat.stat.error && stat.stat.value !== null && (
                            <span aria-live="polite">
                              {stat.type === 'currency'
                                ? formatMoney(stat.stat.value, locale)
                                : formatNumber(stat.stat.value, locale)
                              }
                            </span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {locale === 'vi' ? 'Thao tác nhanh' : 'Quick Actions'}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex-shrink-0 text-blue-600">{action.icon}</div>
                    <span className="text-sm font-medium text-gray-900">
                      {action.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t('admin.recentActivity')}
              </h2>
              <p className="text-sm text-gray-500">
                {t('common.no') + ' ' + t('admin.recentActivity').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}