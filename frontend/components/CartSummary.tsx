'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { promotionApi } from '@/lib/promotion-api';
import { SvgCheck } from '@/components/Svgs';
import { formatMoney } from '@/app/utils';

export default function CartSummary() {
  const locale = useLocale();
  const t = useTranslations('cart');
  const { subtotal, itemCount } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    setPromoError('');

    try {
      const result = await promotionApi.validate({
        code: promoCode.trim(),
        orderAmount: subtotal,
      });

      if (result.valid && result.discountAmount) {
        setAppliedPromo({
          code: promoCode.trim().toUpperCase(),
          discountAmount: result.discountAmount,
        });
        setPromoCode('');
      } else {
        setPromoError(result.message || 'Invalid promotion code');
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Failed to validate promotion code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const finalTotal = appliedPromo
    ? Math.max(0, subtotal - appliedPromo.discountAmount)
    : subtotal;

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{t('orderSummary')}</h2>

      {/* Promotion Code Input */}
      <div className="mb-4">
        <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-2">
          {t('promoCode') || 'Promotion Code'}
        </label>
        {appliedPromo ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div className="flex items-center">
              <SvgCheck className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">{appliedPromo.code}</span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-sm text-red-600 hover:text-red-700"
            >
              {t('remove') || 'Remove'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              id="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder={t('enterPromoCode') || 'Enter code'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {promoLoading ? (t('applying') || 'Applying...') : (t('apply') || 'Apply')}
            </button>
          </div>
        )}
        {promoError && (
          <p className="mt-1 text-sm text-red-600">{promoError}</p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">{t('subtotal')}</span>
          <span className="font-medium">{formatMoney(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('items')}</span>
          <span>{itemCount}</span>
        </div>

        {appliedPromo && (
          <div className="flex justify-between text-green-600">
            <span>{t('discount') || 'Discount'} ({appliedPromo.code})</span>
            <span>-{formatMoney(appliedPromo.discountAmount)}</span>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{t('shipping')}</span>
            <span>{t('calculatedAtCheckout')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('tax')}</span>
            <span>{t('calculatedAtCheckout')}</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span>{t('total')}</span>
            <span>{formatMoney(finalTotal)}</span>
          </div>
        </div>
      </div>

      <Link
        href={`/${locale}/checkout`}
        className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        {t('proceedToCheckout')}
      </Link>

      <Link
        href={`/${locale}/products`}
        className="block w-full text-center py-3 text-blue-600 hover:text-blue-700 mt-3"
      >
        {t('continueShopping')}
      </Link>
    </div>
  );
}