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
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [validationResults, setValidationResults] = useState<{[key: string]: any}>({});

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

  // Check if a shipping method has complete translations
  const hasCompleteTranslations = (method: ShippingMethod): boolean => {
    return !!(
      method.nameEn?.trim() &&
      method.nameVi?.trim() &&
      method.descriptionEn?.trim() &&
      method.descriptionVi?.trim()
    );
  };

  // Get translation status for a shipping method
  const getTranslationStatus = (method: ShippingMethod) => {
    const missingFields: string[] = [];

    if (!method.nameEn?.trim()) missingFields.push('nameEn');
    if (!method.nameVi?.trim()) missingFields.push('nameVi');
    if (!method.descriptionEn?.trim()) missingFields.push('descriptionEn');
    if (!method.descriptionVi?.trim()) missingFields.push('descriptionVi');

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      hasEnglish: !!(method.nameEn?.trim() && method.descriptionEn?.trim()),
      hasVietnamese: !!(method.nameVi?.trim() && method.descriptionVi?.trim()),
    };
  };

  // Run bulk validation
  const runBulkValidation = () => {
    const results: {[key: string]: any} = {};
    const totalMethods = shippingMethods.length;
    let completeCount = 0;
    let incompleteCount = 0;

    shippingMethods.forEach(method => {
      const status = getTranslationStatus(method);
      results[method.id] = status;

      if (status.isComplete) {
        completeCount++;
      } else {
        incompleteCount++;
      }
    });

    setValidationResults({
      ...results,
      summary: {
        total: totalMethods,
        complete: completeCount,
        incomplete: incompleteCount,
        completionRate: totalMethods > 0 ? Math.round((completeCount / totalMethods) * 100) : 0,
      }
    });
    setShowValidationPanel(true);
  };

  // Render translation indicator badge
  const renderTranslationIndicator = (method: ShippingMethod) => {
    const status = getTranslationStatus(method);

    if (status.isComplete) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full" title={t('allTranslationsComplete')}>
          ✓
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full" title={t('incompleteTranslations')}>
        ⚠
      </span>
    );
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
            <div className="flex space-x-3">
              <button
                onClick={runBulkValidation}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <span>📋</span>
                <span>{t('validateTranslations')}</span>
              </button>
              <Link
                href={`/${locale}/admin/shipping-methods/new`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <SvgPlus className="w-5 h-5" />
                <span>{t('addShippingMethod')}</span>
              </Link>
            </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('translationCompleteness')}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderTranslationIndicator(method)}
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

        {/* Bulk Translation Validation Panel */}
        {showValidationPanel && validationResults.summary && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('bulkTranslationValidation')}
                </h3>
                <button
                  onClick={() => setShowValidationPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  {locale === 'vi' ? 'Tổng quan' : 'Summary'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {validationResults.summary.total}
                    </div>
                    <div className="text-sm text-gray-600">
                      {locale === 'vi' ? 'Tổng số' : 'Total'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {validationResults.summary.complete}
                    </div>
                    <div className="text-sm text-gray-600">
                      {locale === 'vi' ? 'Hoàn chỉnh' : 'Complete'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {validationResults.summary.incomplete}
                    </div>
                    <div className="text-sm text-gray-600">
                      {locale === 'vi' ? 'Chưa hoàn chỉnh' : 'Incomplete'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {validationResults.summary.completionRate}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {locale === 'vi' ? 'Tỷ lệ hoàn thành' : 'Completion Rate'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  {locale === 'vi' ? 'Chi tiết' : 'Details'}
                </h4>

                {shippingMethods.map((method) => {
                  const status = validationResults[method.id];
                  if (!status) return null;

                  return (
                    <div
                      key={method.id}
                      className={`p-4 rounded-lg border ${
                        status.isComplete
                          ? 'border-green-200 bg-green-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            status.isComplete
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {status.isComplete ? '✓ Complete' : '⚠ Incomplete'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {locale === 'vi' ? method.nameVi || method.nameEn : method.nameEn || method.nameVi}
                            </div>
                            <div className="text-sm text-gray-500">
                              {method.methodId}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/${locale}/admin/shipping-methods/${method.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          {t('edit')}
                        </Link>
                      </div>

                      {!status.isComplete && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-700 mb-2">
                            {locale === 'vi' ? 'Trường thiếu:' : 'Missing fields:'}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {status.missingFields.map((field: string) => (
                              <span
                                key={field}
                                className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                              >
                                {field === 'nameEn' && (locale === 'vi' ? 'Tên (EN)' : 'Name (EN)')}
                                {field === 'nameVi' && (locale === 'vi' ? 'Tên (VI)' : 'Name (VI)')}
                                {field === 'descriptionEn' && (locale === 'vi' ? 'Mô tả (EN)' : 'Description (EN)')}
                                {field === 'descriptionVi' && (locale === 'vi' ? 'Mô tả (VI)' : 'Description (VI)')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowValidationPanel(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  {locale === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
