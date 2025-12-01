'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import { SvgCart, SvgClose } from '@/components/Svgs';
import { formatMoney } from '@/app/utils';

export default function MiniCart() {
  const locale = useLocale();
  const t = useTranslations('cart');
  const { cart, itemCount, subtotal, removeItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen]);

  const handleRemoveItem = async (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={`${t('cart')} - ${itemCount} ${itemCount === 1 ? t('item') : t('items')}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <SvgCart className="w-6 h-6" aria-hidden="true" />
        {itemCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            aria-label={`${itemCount} ${itemCount === 1 ? t('item') : t('items')} in cart`}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50"
          role="dialog"
          aria-label={t('shoppingCart')}
        >
          <div className="p-4 border-b">
            <h3 className="font-semibold">{t('shoppingCart')}</h3>
            <p className="text-sm text-gray-600" role="status">
              {itemCount} {itemCount === 1 ? t('item') : t('items')}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!cart || cart.items.length === 0 ? (
              <div className="p-8 text-center text-gray-500" role="status">
                <SvgCart className="w-16 h-16 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                <p>{t('emptyCart')}</p>
              </div>
            ) : (
              <ul className="divide-y" role="list">
                {cart.items.map((item) => {
                  const productName = locale === 'vi' ? item.product.nameVi : item.product.nameEn;
                  const imageUrl = item.product.images[0]?.url || '/placeholder.png';
                  const imageAlt = locale === 'vi'
                    ? item.product.images[0]?.altTextVi || productName
                    : item.product.images[0]?.altTextEn || productName;

                  return (
                    <li key={item.id}>
                      <Link
                        href={`/${locale}/products/${item.product.slug}`}
                        className="flex gap-3 p-4 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                        aria-label={`${productName} - ${item.quantity} × ${parseFloat(item.price).toFixed(2)}`}
                      >
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          width={60}
                          height={60}
                          style={{ opacity: 1 }}
                          priority={true}
                          unoptimized
                          className="object-cover object-center rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{productName}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.quantity} × {formatMoney(item.price)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={(e) => handleRemoveItem(item.id, e)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            aria-label={`${t('remove')} ${productName}`}
                          >
                            <SvgClose className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <p className="text-sm font-semibold">
                            {formatMoney(parseFloat(item.price) * item.quantity)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {cart && cart.items.length > 0 && (
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <div className="flex justify-between mb-3">
                <span className="font-semibold">{t('subtotal')}</span>
                <span className="font-semibold" aria-label={`${t('subtotal')} $${subtotal.toFixed(2)}`}>
                  {formatMoney(subtotal)}
                </span>
              </div>
              <Link
                href={`/${locale}/cart`}
                className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsOpen(false)}
                aria-label={t('viewCart')}
              >
                {t('viewCart')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}