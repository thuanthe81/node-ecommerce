import { getTranslations } from 'next-intl/server';
import ProductsContent from './ProductsContent';
import { generateSEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { productApi, ProductQueryParams } from '@/lib/product-api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return generateSEOMetadata({
    title: t('seo.products.title'),
    description: t('seo.products.description'),
    locale,
    path: '/products',
    type: 'website',
  });
}

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;

  // Build query parameters for server-side data fetching
  const queryParams: ProductQueryParams = {
    page: parseInt(resolvedSearchParams.page || '1'),
    limit: 20,
    search: resolvedSearchParams.search || undefined,
    categoryId: resolvedSearchParams.categoryId || undefined,
    minPrice: resolvedSearchParams.minPrice
      ? parseInt(resolvedSearchParams.minPrice)
      : undefined,
    maxPrice: resolvedSearchParams.maxPrice
      ? parseInt(resolvedSearchParams.maxPrice)
      : undefined,
    inStock: resolvedSearchParams.inStock === 'true' ? true : undefined,
    sortBy: (resolvedSearchParams.sortBy as any) || 'createdAt',
    sortOrder: (resolvedSearchParams.sortOrder as any) || 'desc',
  };

  // Fetch initial data on the server
  let initialData;
  try {
    initialData = await productApi.getProducts(queryParams);
  } catch (error) {
    console.error('Failed to fetch products on server:', error);
    // Fallback to client-side fetching if server fetch fails
    initialData = null;
  }

  return (
    <main className="container py-4">
      <ProductsContent
        initialData={initialData}
        initialParams={queryParams}
      />
    </main>
  );
}