'use client';

import useSWR from 'swr';
import { productApi, Product } from '@/lib/product-api';

const fetcher = async (slug: string): Promise<Product> => {
  return productApi.getProductBySlug(slug);
};

export function useProduct(slug: string) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? ['product', slug] : null,
    () => fetcher(slug),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    product: data,
    isLoading,
    isError: error,
    mutate,
  };
}
