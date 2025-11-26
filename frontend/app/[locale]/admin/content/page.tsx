import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import ContentListContent from './ContentListContent';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { useLocale } from 'next-intl';

export default function ContentListPage() {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <Suspense fallback={<div>{t('common.loading')}</div>}>
          <ContentListContent />
        </Suspense>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}