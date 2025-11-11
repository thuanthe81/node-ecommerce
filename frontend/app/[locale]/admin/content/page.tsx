import { Suspense } from 'react';
import ContentListContent from './ContentListContent';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { useLocale } from 'next-intl';

export default function ContentListPage() {
  const locale = useLocale();

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <Suspense fallback={<div>Loading...</div>}>
          <ContentListContent />
        </Suspense>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}