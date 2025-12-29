'use client';

import { useState } from 'react';
import { Portal } from '@/components/Portal';

interface PaymentStatusUpdateModalProps {
  isOpen: boolean;
  currentStatus: string;
  onClose: () => void;
  onConfirm: (paymentStatus: string, notes?: string) => Promise<void>;
  locale: string;
  translations: any;
}

export default function PaymentStatusUpdateModal({
  isOpen,
  currentStatus,
  onClose,
  onConfirm,
  locale,
  translations,
}: PaymentStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value?.[locale] || value?.en || key;
  };

  const handleConfirm = async () => {
    if (selectedStatus === currentStatus) {
      setError(t('orders.noChangeError'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(selectedStatus, notes || undefined);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || t('orders.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedStatus(currentStatus);
      setNotes('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('orders.updatePaymentStatus')}
        </h3>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {t('orders.updateSuccess')}
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orders.currentStatus')}
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-900">
                  {t(`orders.payment${currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}`)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orders.newStatus')}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="PENDING">{t('orders.paymentPending')}</option>
                  <option value="PAID">{t('orders.paymentPaid')}</option>
                  <option value="FAILED">{t('orders.paymentFailed')}</option>
                  <option value="REFUNDED">{t('orders.paymentRefunded')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orders.notes')} ({t('common.optional')})
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder={t('orders.notesPlaceholder')}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || selectedStatus === currentStatus}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </Portal>
  );
}
