'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface SSRMetrics {
  totalOperations: number;
  successRate: number;
  averageDuration: number;
  errorRate: number;
  slowOperations: number;
  topErrors: Array<{ code: string; count: number }>;
}

interface SSRAlert {
  id: string;
  type: 'error_rate' | 'performance_degradation' | 'circuit_breaker_open';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: string;
  resolved: boolean;
}

interface DashboardData {
  performance: any;
  ssr: SSRMetrics;
  alerts: SSRAlert[];
  health: {
    overall: boolean;
    performance: boolean;
    ssr: boolean;
    errors: boolean;
    alerts: boolean;
  };
}

interface SSRMonitoringDashboardProps {
  refreshInterval?: number;
  timeWindow?: number;
  locale?: string;
}

/**
 * SSR Monitoring Dashboard Component
 * Displays real-time SSR performance metrics and alerts
 */
export function SSRMonitoringDashboard({
  refreshInterval = 30000, // 30 seconds
  timeWindow = 3600000, // 1 hour
  locale = 'en',
}: SSRMonitoringDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/sitemap-api/performance?type=dashboard&timeWindow=${timeWindow}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/sitemap-api/performance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve-alert',
          alertId,
        }),
      });

      if (response.ok) {
        // Refresh data to show resolved alert
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, timeWindow]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={fetchDashboardData} locale={locale} />;
  }

  if (!data) {
    return <DashboardEmpty locale={locale} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {locale === 'vi' ? 'Giám sát SSR' : 'SSR Monitoring'}
        </h2>
        <div className="text-sm text-gray-500">
          {locale === 'vi' ? 'Cập nhật lần cuối' : 'Last updated'}: {' '}
          {lastUpdated?.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US')}
        </div>
      </div>

      {/* Health Status */}
      <HealthStatusCard health={data.health} locale={locale} />

      {/* Active Alerts */}
      {data.alerts.length > 0 && (
        <AlertsCard alerts={data.alerts} onResolve={resolveAlert} locale={locale} />
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={locale === 'vi' ? 'Tỷ lệ thành công' : 'Success Rate'}
          value={`${(data.ssr.successRate * 100).toFixed(1)}%`}
          status={data.ssr.successRate > 0.95 ? 'good' : data.ssr.successRate > 0.9 ? 'warning' : 'error'}
          icon="✓"
        />
        <MetricCard
          title={locale === 'vi' ? 'Thời gian trung bình' : 'Average Duration'}
          value={`${data.ssr.averageDuration.toFixed(0)}ms`}
          status={data.ssr.averageDuration < 2000 ? 'good' : data.ssr.averageDuration < 5000 ? 'warning' : 'error'}
          icon="⏱"
        />
        <MetricCard
          title={locale === 'vi' ? 'Tỷ lệ lỗi' : 'Error Rate'}
          value={`${(data.ssr.errorRate * 100).toFixed(1)}%`}
          status={data.ssr.errorRate < 0.01 ? 'good' : data.ssr.errorRate < 0.05 ? 'warning' : 'error'}
          icon="⚠"
        />
        <MetricCard
          title={locale === 'vi' ? 'Hoạt động chậm' : 'Slow Operations'}
          value={data.ssr.slowOperations.toString()}
          status={data.ssr.slowOperations < 5 ? 'good' : data.ssr.slowOperations < 20 ? 'warning' : 'error'}
          icon="🐌"
        />
      </div>

      {/* Error Breakdown */}
      {data.ssr.topErrors.length > 0 && (
        <ErrorBreakdownCard errors={data.ssr.topErrors} locale={locale} />
      )}
    </div>
  );
}

/**
 * Health Status Card Component
 */
function HealthStatusCard({ health, locale }: { health: DashboardData['health']; locale: string }) {
  const overallStatus = health.overall ? 'healthy' : 'unhealthy';
  const statusColor = health.overall ? 'text-green-600' : 'text-red-600';
  const statusBg = health.overall ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <div className={`p-6 rounded-lg border ${statusBg}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {locale === 'vi' ? 'Trạng thái tổng quan' : 'Overall Health'}
          </h3>
          <p className={`text-2xl font-bold ${statusColor}`}>
            {health.overall
              ? (locale === 'vi' ? 'Khỏe mạnh' : 'Healthy')
              : (locale === 'vi' ? 'Có vấn đề' : 'Issues Detected')
            }
          </p>
        </div>
        <div className="text-4xl">
          {health.overall ? '✅' : '❌'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
        <HealthIndicator
          label={locale === 'vi' ? 'Hiệu suất' : 'Performance'}
          healthy={health.performance}
        />
        <HealthIndicator
          label="SSR"
          healthy={health.ssr}
        />
        <HealthIndicator
          label={locale === 'vi' ? 'Lỗi' : 'Errors'}
          healthy={health.errors}
        />
        <HealthIndicator
          label={locale === 'vi' ? 'Cảnh báo' : 'Alerts'}
          healthy={health.alerts}
        />
      </div>
    </div>
  );
}

/**
 * Health Indicator Component
 */
function HealthIndicator({ label, healthy }: { label: string; healthy: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-2xl ${healthy ? 'text-green-500' : 'text-red-500'}`}>
        {healthy ? '●' : '●'}
      </div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}

/**
 * Alerts Card Component
 */
function AlertsCard({
  alerts,
  onResolve,
  locale
}: {
  alerts: SSRAlert[];
  onResolve: (alertId: string) => void;
  locale: string;
}) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {locale === 'vi' ? 'Cảnh báo đang hoạt động' : 'Active Alerts'} ({alerts.length})
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(alert.timestamp).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>
              <p className="text-sm text-gray-900 mt-1">{alert.message}</p>
            </div>
            <button
              onClick={() => onResolve(alert.id)}
              className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locale === 'vi' ? 'Giải quyết' : 'Resolve'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  title,
  value,
  status,
  icon
}: {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'error';
  icon: string;
}) {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className={`p-6 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

/**
 * Error Breakdown Card Component
 */
function ErrorBreakdownCard({
  errors,
  locale
}: {
  errors: Array<{ code: string; count: number }>;
  locale: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {locale === 'vi' ? 'Lỗi phổ biến' : 'Top Errors'}
      </h3>
      <div className="space-y-2">
        {errors.map((error, index) => (
          <div key={error.code} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              <span className="text-sm font-mono text-gray-900">{error.code}</span>
            </div>
            <span className="text-sm font-medium text-red-600">{error.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error State Component
 */
function DashboardError({
  error,
  onRetry,
  locale
}: {
  error: string;
  onRetry: () => void;
  locale: string;
}) {
  return (
    <div className="text-center p-8">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {locale === 'vi' ? 'Không thể tải dữ liệu' : 'Failed to load dashboard'}
      </h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {locale === 'vi' ? 'Thử lại' : 'Retry'}
      </button>
    </div>
  );
}

/**
 * Empty State Component
 */
function DashboardEmpty({ locale }: { locale: string }) {
  return (
    <div className="text-center p-8">
      <div className="text-gray-400 text-4xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {locale === 'vi' ? 'Chưa có dữ liệu' : 'No data available'}
      </h3>
      <p className="text-gray-600">
        {locale === 'vi'
          ? 'Dữ liệu giám sát sẽ xuất hiện khi có hoạt động SSR.'
          : 'Monitoring data will appear once SSR activity is detected.'
        }
      </p>
    </div>
  );
}

/**
 * Utility function to get severity color classes
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low':
      return 'bg-blue-100 text-blue-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default SSRMonitoringDashboard;