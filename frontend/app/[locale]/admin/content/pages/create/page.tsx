'use client';

import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import NewContentContent from '../../new/NewContentContent';

export default function CreatePagePage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <NewContentContent defaultType="PAGE" />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
