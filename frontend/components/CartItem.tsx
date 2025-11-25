'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { CartItem as CartItemType } from '@/lib/cart-api';
import { useCart } from '@/contexts/CartContext';
import { formatMoney } from '@/app/utils';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const locale = useLocale();
  const t = useTranslations('cart');
  const { updateQuantity, removeItem } = useCart();
  const [updating, setUpdating] = useState(false);

  const productName = locale === 'vi' ? item.product.nameVi : item.product.nameEn;
  const imageUrl = item.product.images[0]?.url || '/placeholder.png';
  const imageAlt = locale === 'vi'
    ? item.product.images[0]?.altTextVi || productName
    : item.product.images[0]?.altTextEn || productName;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > item.product.stockQuantity) return;

    setUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setUpdating(true);
    try {
      await removeItem(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setUpdating(false);
    }
  };

  const itemTotal = parseFloat(item.price) * item.quantity;

  return (
    <div className="flex gap-4 py-4">
      <Link href={`/${locale}/products/${item.product.slug}`} className="flex-shrink-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          width={100}
          height={100}
          style={{ opacity: 1 }}
          priority={true}
          unoptimized
          className="object-cover rounded"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/${locale}/products/${item.product.slug}`}
          className="font-medium hover:text-blue-600 line-clamp-2"
        >
          {productName}
        </Link>

        <p className="text-sm text-gray-600 mt-1">
          {formatMoney(item.price)}
        </p>

        {item.product.stockQuantity < 10 && (
          <p className="text-sm text-orange-600 mt-1">
            {t('lowStock', { count: item.product.stockQuantity })}
          </p>
        )}

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center border rounded">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('decreaseQuantity')}
            >
              -
            </button>
            <span className="px-4 py-1 border-x min-w-[3rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updating || item.quantity >= item.product.stockQuantity}
              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('increaseQuantity')}
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={updating}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {t('remove')}
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold">{formatMoney(itemTotal)}</p>
      </div>
    </div>
  );
}