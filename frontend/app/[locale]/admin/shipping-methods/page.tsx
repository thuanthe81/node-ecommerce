'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { shippingMethodApi, ShippingMethod } from '@/lib/shipping-method-api';
import { useLocale, useTranslations } from 'next-intl';
import { SvgPlus } from '@/components/Svgs';
import { formatMoney } from '@/app/utils';

export default function AdminShippingMethodsPage() {
  const locale = useLocale();
  const t = useTranslations('admin.shippingMethods');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ShippingMethod | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadShippingMethods = async () => {
    try {
      setLoading(true);
      const data = await shippingMethodApi.getAll();
      setShippingMethods(data);
    } catch (error) {
      console.error('Failed to load shipping methods:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent duplicate execution in React Strict Mode (dev) causing double renders
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadShippingMethods().then();
  }, []);

  const handleDelete = async (method: ShippingMethod) => {
    try {
      await shippingMethodApi.deleteMethod(method.id);
      setDeleteConfirm(null);
      // Immediately update local state to remove the deleted method
      setShippingMethods((prevMethods) => prevMethods.filter((m) => m.id !== method.id));
    } catch (error: any) {
      console.error('Failed to delete shipping method:', error);
      const errorMessage = error?.message || t('deleteError');
      alert(errorMessage);
    }
  };

  const handleToggleActive = async (method: ShippingMethod) => {
    const previousState = method.isActive;

    // Optimistically update UI
    setShippingMethods((prevMethods) =>
      prevMethods.map((m) =>
        m.id === method.id ? { ...m, isActive: !m.isActive } : m
      )
    );

    setTogglingId(method.id);

    try {
      await shippingMethodApi.update(method.id, { isActive: !previousState });
    } catch (error: any) {
      console.error('Failed to toggle shipping method status:', error);
      const errorMessage = error?.message || t('toggleError');
      alert(errorMessage);

      // Revert on failure
      setShippingMethods((prevMethods) =>
        prevMethods.map((m) =>
          m.id === method.id ? { ...m, isActive: previousState } : m
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const formatEstimatedDays = (min: number, max: number) => {
    if (min === max) {
      return `${min} ${locale === 'vi' ? 'ngày' : 'days'}`;
    }
    return `${min}-${max} ${locale === 'vi' ? 'ngày' : 'days'}`;
  };

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('shippingMethodManagement')}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {t('manageShippingMethods')}
              </p>
            </div>
            <Link
              href={`/${locale}/admin/shipping-methods/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <SvgPlus className="w-5 h-5" />
              <span>{t('addShippingMethod')}</span>
            </Link>
          </div>

          {/* Shipping Methods Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('loading')}</p>
              </div>
            ) : shippingMethods.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {t('noShippingMethods')}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('description')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('carrier')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('baseRate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('estimatedDelivery')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {locale === 'vi' ? 'Thao tác' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shippingMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {locale === 'vi' ? method.nameVi : method.nameEn}
                        </div>
                        <div className="text-xs text-gray-500">
                          {method.methodId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {locale === 'vi' ? method.descriptionVi : method.descriptionEn}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {method.carrier || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatMoney(method.baseRate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatEstimatedDays(method.estimatedDaysMin, method.estimatedDaysMax)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(method)}
                          disabled={togglingId === method.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            method.isActive ? 'bg-green-600' : 'bg-gray-300'
                          } ${togglingId === method.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          aria-label={method.isActive ? t('deactivateMethod') : t('activateMethod')}
                          title={method.isActive ? t('deactivateMethod') : t('activateMethod')}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              method.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/${locale}/admin/shipping-methods/${method.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {t('edit')}
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(method)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('confirmDelete')}
              </h3>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">
                  {t('confirmDeleteMessage')}
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {locale === 'vi' ? deleteConfirm.nameVi : deleteConfirm.nameEn}
                    </p>
                    <p className="text-xs text-gray-500">
                      {locale === 'vi' ? 'Mã: ' : 'ID: '}{deleteConfirm.methodId}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
