'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import ShippingMethodForm from '@/components/ShippingMethodForm';
import { shippingMethodApi, ShippingMethod, UpdateShippingMethodDto } from '@/lib/shipping-method-api';

export default function EditShippingMethodPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const shippingMethodId = params.id as string;
  const t = useTranslations('admin.shippingMethods');

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadShippingMethod();
  }, [shippingMethodId]);

  const loadShippingMethod = async () => {
    try {
      setLoading(true);
      const data = await shippingMethodApi.getOne(shippingMethodId);
      setShippingMethod(data);
    } catch (err: any) {
      console.error('Failed to load shipping method:', err);
      setError(err.message || t('failedToLoadShippingMethod'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateShippingMethodDto) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await shippingMethodApi.update(shippingMethodId, data);

      // Show success message (you could use a toast notification here)
      alert(t('shippingMethodUpdatedSuccess'));

      // Redirect to list page
      router.push(`/${locale}/admin/shipping-methods`);
    } catch (err: any) {
      console.error('Failed to update shipping method:', err);
      setError(err.message || t('failedToUpdateShippingMethod'));
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
              {t('editShippingMethod')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('updateShippingMethodInfo')}
            </p>
          </div>

          {loading ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {t('loading')}
              </p>
            </div>
          ) : error ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : shippingMethod ? (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <ShippingMethodForm
                initialData={shippingMethod}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isEdit={true}
                isSubmitting={isSubmitting}
              />
            </>
          ) : null}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
