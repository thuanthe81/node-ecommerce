'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductQueryParams } from '@/lib/product-api';
import { useProducts } from '@/hooks/useProducts';
import ProductGrid from '@/components/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import Pagination from '@/components/Pagination';

export default function ProductsContent() {
  const searchParams = useSearchParams();

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

  const { products, meta, isLoading } = useProducts(params);

  if (isLoading) {
    return <ProductGridSkeleton count={12} />;
  }

  return (
    <>
      <ProductGrid products={products} />
      <Pagination currentPage={meta.page} totalPages={meta.totalPages} />
    </>
  );
}