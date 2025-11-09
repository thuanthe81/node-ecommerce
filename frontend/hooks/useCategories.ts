'use client';

import useSWR from 'swr';
import { categoryApi, Category } from '@/lib/category-api';

const fetcher = async (): Promise<Category[]> => {
  return categoryApi.getCategoryTree();
};

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    'categories-tree',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 1800000, // 30 minutes
    }
  );

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
