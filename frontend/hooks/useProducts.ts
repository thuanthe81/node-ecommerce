'use client';

import useSWR from 'swr';
import { productApi, Product, ProductQueryParams, ProductsResponse } from '@/lib/product-api';

const fetcher = async (url: string, params: ProductQueryParams): Promise<ProductsResponse> => {
  return productApi.getProducts(params);
};

export function useProducts(params: ProductQueryParams, initialData?: ProductsResponse | null) {
  const key = ['products', params];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => fetcher('products', params),
    {
      fallbackData: initialData || undefined,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
    }
  );

  // If we have initial data or actual data, we should not be in loading state
  const actuallyLoading = isLoading && !initialData && !data;

  return {
    products: data?.data || [],
    meta: data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    isLoading: actuallyLoading,
    isError: error,
    mutate,
  };
}
