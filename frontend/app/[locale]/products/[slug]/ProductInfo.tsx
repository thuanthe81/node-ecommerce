'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Product } from '@/lib/product-api';
import Link from 'next/link';

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1);

  const name = locale === 'vi' ? product.nameVi : product.nameEn;
  const description = locale === 'vi' ? product.descriptionVi : product.descriptionEn;
  const categoryName = locale === 'vi' ? product.category.nameVi : product.category.nameEn;

  const isOutOfStock = product.stockQuantity <= 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(value, product.stockQuantity));
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', { productId: product.id, quantity });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href={`/${locale}`} className="hover:text-gray-700">
          {locale === 'vi' ? 'Trang chủ' : 'Home'}
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/${locale}/categories/${product.category.slug}`}
          className="hover:text-gray-700"
        >
          {categoryName}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{name}</span>
      </nav>

      {/* Product Name */}
      <h1 className="text-3xl font-bold text-gray-900">{name}</h1>

      {/* Rating */}
      {product.averageRating !== undefined && product._count && (
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-xl ${
                  star <= Math.round(product.averageRating!)
                    ? 'text-yellow-500'
                    : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-gray-600">
            {product.averageRating.toFixed(1)} ({product._count.reviews}{' '}
            {locale === 'vi' ? 'đánh giá' : 'reviews'})
          </span>
        </div>
      )}

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
              style: 'currency',
              currency: 'VND',
            }).format(Number(product.price))}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xl text-gray-500 line-through">
                {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                  style: 'currency',
                  currency: 'VND',
                }).format(Number(product.compareAtPrice))}
              </span>
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                {locale === 'vi' ? 'Giảm' : 'Save'}{' '}
                {Math.round(
                  ((Number(product.compareAtPrice) - Number(product.price)) /
                    Number(product.compareAtPrice)) *
                    100
                )}
                %
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stock Status */}
      <div>
        {isOutOfStock ? (
          <span className="text-red-600 font-semibold">
            {locale === 'vi' ? 'Hết hàng' : 'Out of Stock'}
          </span>
        ) : (
          <span className="text-green-600 font-semibold">
            {locale === 'vi' ? 'Còn hàng' : 'In Stock'} ({product.stockQuantity}{' '}
            {locale === 'vi' ? 'sản phẩm' : 'items'})
          </span>
        )}
      </div>

      {/* Description */}
      <div className="prose max-w-none">
        <h2 className="text-xl font-semibold mb-2">
          {locale === 'vi' ? 'Mô tả sản phẩm' : 'Product Description'}
        </h2>
        <p className="text-gray-700 whitespace-pre-line">{description}</p>
      </div>

      {/* Quantity Selector and Add to Cart */}
      {!isOutOfStock && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="font-semibold">
              {locale === 'vi' ? 'Số lượng:' : 'Quantity:'}
            </label>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="px-4 py-2 hover:bg-gray-100"
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-16 text-center border-x border-gray-300 py-2"
                min="1"
                max={product.stockQuantity}
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="px-4 py-2 hover:bg-gray-100"
                disabled={quantity >= product.stockQuantity}
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            {locale === 'vi' ? 'Thêm vào giỏ hàng' : 'Add to Cart'}
          </button>
        </div>
      )}

      {/* Product Details */}
      <div className="border-t pt-6 space-y-2">
        <h3 className="font-semibold text-lg mb-3">
          {locale === 'vi' ? 'Thông tin chi tiết' : 'Product Details'}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-600">{locale === 'vi' ? 'SKU:' : 'SKU:'}</span>
          <span className="font-medium">{product.sku}</span>

          <span className="text-gray-600">
            {locale === 'vi' ? 'Danh mục:' : 'Category:'}
          </span>
          <Link
            href={`/${locale}/categories/${product.category.slug}`}
            className="font-medium text-blue-600 hover:underline"
          >
            {categoryName}
          </Link>
        </div>
      </div>
    </div>
  );
}
