'use client';

import useSWR from 'swr';
import { productApi, Product, ProductQueryParams } from '@/lib/product-api';

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetcher = async (url: string, params: ProductQueryParams): Promise<ProductsResponse> => {
  return productApi.getProducts(params);
};

export function useProducts(params: ProductQueryParams) {
  const key = ['products', params];
  
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => fetcher('products', params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      keepPreviousData: true,
    }
  );

  return {
    products: data?.data || [],
    meta: data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    isLoading,
    isError: error,
    mutate,
  };
}
