import { Suspense } from 'react';
import HomepageSectionsListContent from './HomepageSectionsListContent';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { useLocale } from 'next-intl';

export default function HomepageSectionsPage() {
  const locale = useLocale();

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <HomepageSectionsListContent />
        </Suspense>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
