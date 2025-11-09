import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ProductDetailContent from './ProductDetailContent';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations({ locale: params.locale });

  return {
    title: `${params.slug} | ${t('common.products')}`,
    description: t('products.detail.description'),
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        }
      >
        <ProductDetailContent slug={params.slug} locale={params.locale} />
      </Suspense>
    </div>
  );
}
