'use client';

import useSWR from 'swr';
import { productApi, Product, ProductQueryParams, ProductsResponse } from '@/lib/product-api';

const fetcher = async (url: string, params: ProductQueryParams): Promise<ProductsResponse> => {
  return productApi.getProducts(params);
};

export function useProducts(params: ProductQueryParams, initialData?: ProductsResponse | null) {
  const key = ['products', params];

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => fetcher('products', params),
    {
      fallbackData: initialData || undefined,
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
    }
  );

  // isLoading is true only on initial mount
  // isValidating is true whenever data is being fetched (including revalidations)
  // We want to show loading state when fetching new data, even if old data exists
  const actuallyLoading = isValidating;

  return {
    products: data?.data || [],
    meta: data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    isLoading: actuallyLoading,
    isError: error,
    mutate,
  };
}
