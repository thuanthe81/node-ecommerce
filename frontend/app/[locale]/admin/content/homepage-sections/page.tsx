'use client';

import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import ContentListContent from '../ContentListContent';

export default function HomepageSectionsPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <ContentListContent contentType="HOMEPAGE_SECTION" />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
