import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import ProductsContent from './ProductsContent';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import SearchFilterBar from '@/components/SearchFilterBar';
import { generateSEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import {useTranslations} from 'next-intl';

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

export default function ProductsPage() {
  const t = useTranslations();

  return (
    <div className="relative container mx-auto px-4 py-8">
      {/* Integrated Search and Filter Bar */}
      <div className="absolute z-10 flex items-center space-x-32 w-[calc(100%-2em)]">
        <h1 className="text-3xl font-bold">{t('common.products')}</h1>
        <SearchFilterBar className="flex-1"/>
      </div>

      {/* Full-width Products Grid */}
      <main className="mt-16">
        <Suspense fallback={<ProductGridSkeleton count={12} />}>
          <ProductsContent />
        </Suspense>
      </main>
    </div>
  );
}