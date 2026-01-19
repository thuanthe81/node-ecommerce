'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ProductQueryParams, ProductsResponse } from '@/lib/product-api';
import { useProducts } from '@/hooks/useProducts';
import ProductGrid from '@/components/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import Pagination from '@/components/Pagination';

interface ProductsContentProps {
  initialData?: ProductsResponse | null;
  initialParams?: ProductQueryParams;
}

export default function ProductsContent({ initialData, initialParams }: ProductsContentProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('common');

  const params: ProductQueryParams = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 20,
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice')
      ? parseInt(searchParams.get('minPrice')!)
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? parseInt(searchParams.get('maxPrice')!)
      : undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
    sortBy: (searchParams.get('sortBy') as never) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as never) || 'desc',
  }), [searchParams]);

  const { products, meta, isLoading } = useProducts(params, initialData);

  // Show loading only if we don't have any data (neither initial nor from SWR)
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('searchingProducts')}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('noProductsFound')}</p>
      </div>
    );
  }

  return (
    <>
      <ProductGrid products={products} />
      <Pagination currentPage={meta.page} totalPages={meta.totalPages} />
    </>
  );
}