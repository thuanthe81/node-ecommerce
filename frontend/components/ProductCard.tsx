'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Product } from '@/lib/product-api';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const locale = useLocale();
  const name = locale === 'vi' ? product.nameVi : product.nameEn;
  // const imageUrl = product.images[0]?.url || '/placeholder-product.png';
  const imageUrl = '/placeholder-product.png';
  const altText =
    locale === 'vi'
      ? product.images[0]?.altTextVi || name
      : product.images[0]?.altTextEn || name;

  const isOutOfStock = product.stockQuantity <= 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <article className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link
        href={`/${locale}/products/${product.slug}`}
        aria-label={`${name} - ${new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
          style: 'currency',
          currency: 'VND',
        }).format(Number(product.price))}`}
        className="touch-manipulation"
      >
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            preload={priority}
            loading={priority ? 'eager' : 'lazy'}
            quality={75}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center" role="status">
              <span className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
                {locale === 'vi' ? 'Hết hàng' : 'Out of Stock'}
              </span>
            </div>
          )}
          {hasDiscount && !isOutOfStock && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md text-sm font-semibold" role="status">
              {locale === 'vi' ? 'Giảm giá' : 'Sale'}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-gray-900" aria-label={locale === 'vi' ? 'Giá' : 'Price'}>
              {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                style: 'currency',
                currency: 'VND',
              }).format(Number(product.price))}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through" aria-label={locale === 'vi' ? 'Giá gốc' : 'Original price'}>
                {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                  style: 'currency',
                  currency: 'VND',
                }).format(Number(product.compareAtPrice))}
              </span>
            )}
          </div>
          {product.averageRating !== undefined && product._count && (
            <div className="flex items-center gap-1 text-sm text-gray-600" role="group" aria-label={locale === 'vi' ? 'Đánh giá' : 'Rating'}>
              <span className="text-yellow-500" aria-hidden="true">★</span>
              <span aria-label={`${product.averageRating.toFixed(1)} ${locale === 'vi' ? 'sao' : 'stars'}`}>
                {product.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-400" aria-label={`${product._count.reviews} ${locale === 'vi' ? 'đánh giá' : 'reviews'}`}>
                ({product._count.reviews})
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}