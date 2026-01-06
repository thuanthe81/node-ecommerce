import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AdminLayout from '@/components/AdminLayout';
import SSRMonitoringDashboard from '@/components/SSRMonitoringDashboard';

interface SSRMonitoringPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SSRMonitoringPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });

  return {
    title: `${t('ssrMonitoring')} - Admin`,
    description: t('ssrMonitoringDescription'),
  };
}

export default async function SSRMonitoringPage({ params }: SSRMonitoringPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('ssrMonitoring')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('ssrMonitoringDescription')}
          </p>
        </div>

        <SSRMonitoringDashboard
          refreshInterval={30000} // 30 seconds
          timeWindow={3600000} // 1 hour
          locale={locale}
        />
      </div>
    </AdminLayout>
  );
}