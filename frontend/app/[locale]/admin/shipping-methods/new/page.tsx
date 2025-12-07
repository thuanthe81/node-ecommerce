'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import ShippingMethodForm from '@/components/ShippingMethodForm';
import { shippingMethodApi, CreateShippingMethodDto, UpdateShippingMethodDto } from '@/lib/shipping-method-api';
import { useState } from 'react';

export default function NewShippingMethodPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('admin.shippingMethods');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateShippingMethodDto | UpdateShippingMethodDto) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // In create mode, data will always be CreateShippingMethodDto
      await shippingMethodApi.create(data as CreateShippingMethodDto);

      // Show success message (you could use a toast notification here)
      alert(t('shippingMethodCreatedSuccess'));

      // Redirect to list page
      router.push(`/${locale}/admin/shipping-methods`);
    } catch (err: any) {
      console.error('Failed to create shipping method:', err);
      setError(err.message || t('failedToCreateShippingMethod'));
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/admin/shipping-methods`);
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('addNewShippingMethod')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('createNewShippingMethod')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <ShippingMethodForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
