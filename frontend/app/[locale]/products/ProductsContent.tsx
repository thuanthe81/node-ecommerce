'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { productApi, Product, ProductQueryParams } from '@/lib/product-api';
import ProductGrid from '@/components/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import Pagination from '@/components/Pagination';

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: ProductQueryParams = {
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
          sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
          sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
        };

        const response = await productApi.getProducts(params);
        setProducts(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  if (loading) {
    return <ProductGridSkeleton count={12} />;
  }

  return (
    <>
      <ProductGrid products={products} />
      <Pagination currentPage={meta.page} totalPages={meta.totalPages} />
    </>
  );
}
