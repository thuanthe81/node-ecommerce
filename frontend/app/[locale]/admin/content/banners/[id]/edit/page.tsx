'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import EditContentContent from '../../../[id]/edit/EditContentContent';

export default function EditBannerPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <Suspense fallback={<div>{t('common.loading')}</div>}>
          <EditContentContent contentType="BANNER" />
        </Suspense>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
