'use client';

import { useTranslations } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function CartSummary() {
  const locale = useLocale();
  const t = useTranslations('cart');
  const { subtotal, itemCount } = useCart();

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{t('orderSummary')}</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">{t('subtotal')}</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('items')}</span>
          <span>{itemCount}</span>
        </div>
        
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
            <span>${subtotal.toFixed(2)}</span>
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
