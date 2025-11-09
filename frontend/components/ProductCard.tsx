'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Product } from '@/lib/product-api';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale();
  const name = locale === 'vi' ? product.nameVi : product.nameEn;
  const imageUrl = product.images[0]?.url || '/placeholder-product.png';
  const altText =
    locale === 'vi'
      ? product.images[0]?.altTextVi || name
      : product.images[0]?.altTextEn || name;

  const isOutOfStock = product.stockQuantity <= 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
              {locale === 'vi' ? 'Hết hàng' : 'Out of Stock'}
            </span>
          </div>
        )}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-semibold">
            {locale === 'vi' ? 'Giảm giá' : 'Sale'}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl font-bold text-gray-900">
            {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
              style: 'currency',
              currency: 'VND',
            }).format(Number(product.price))}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                style: 'currency',
                currency: 'VND',
              }).format(Number(product.compareAtPrice))}
            </span>
          )}
        </div>
        {product.averageRating !== undefined && product._count && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span className="text-yellow-500">★</span>
            <span>{product.averageRating.toFixed(1)}</span>
            <span className="text-gray-400">({product._count.reviews})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
