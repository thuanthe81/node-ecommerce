'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import { formatMoney, isContactForPrice, getPriceTBDText } from '@/app/utils';
import { Product } from '@/lib/product-api';

interface GuestCartItemProps {
  productId: string;
  quantity: number;
  product: Product;
}

export default function GuestCartItem({ productId, quantity, product }: GuestCartItemProps) {
  const locale = useLocale();
  const t = useTranslations('cart');
  const { updateQuantity, removeItem } = useCart();
  const [updating, setUpdating] = useState(false);

  const productName = locale === 'vi' ? product.nameVi : product.nameEn;
  const imageUrl = product.images[0]?.url || '/placeholder.png';
  const imageAlt = locale === 'vi'
    ? product.images[0]?.altTextVi || productName
    : product.images[0]?.altTextEn || productName;

  const isZeroPrice = isContactForPrice(product.price);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > product.stockQuantity) return;

    setUpdating(true);
    try {
      // For guest cart, itemId is the productId
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    setUpdating(true);
    try {
      // For guest cart, itemId is the productId
      await removeItem(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setUpdating(false);
    }
  };

  const itemTotal = product.price * quantity;

  return (
    <div className="flex gap-4 py-4">
      <Link href={`/${locale}/products/${product.slug}`} className="flex-shrink-0">
        <Image
          src={imageUrl}
          alt={imageAlt}
          width={100}
          height={100}
          style={{ opacity: 1 }}
          priority={true}
          unoptimized
          className="object-cover object-center rounded"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/${locale}/products/${product.slug}`}
          className="font-medium hover:text-blue-600 line-clamp-2"
        >
          {productName}
        </Link>

        <p className="text-sm mt-1">
          {isZeroPrice ? (
            <span className="text-blue-600 font-semibold">
              {getPriceTBDText(locale)}
            </span>
          ) : (
            <span className="text-gray-600">{formatMoney(product.price)}</span>
          )}
        </p>

        {product.stockQuantity < 10 && (
          <p className="text-sm text-orange-600 mt-1">
            {t('lowStock', { count: product.stockQuantity })}
          </p>
        )}

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center border rounded">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={updating || quantity <= 1}
              className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('decreaseQuantity')}
            >
              -
            </button>
            <span className="px-4 py-1 border-x min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={updating || quantity >= product.stockQuantity}
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
        <p className="font-semibold">
          {isZeroPrice ? (
            <span className="text-blue-600">{getPriceTBDText(locale)}</span>
          ) : (
            formatMoney(itemTotal)
          )}
        </p>
      </div>
    </div>
  );
}
