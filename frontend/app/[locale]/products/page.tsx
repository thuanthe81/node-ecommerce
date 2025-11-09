import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import ProductsContent from './ProductsContent';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import FilterPanel from '@/components/FilterPanel';
import SearchBar from '@/components/SearchBar';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return {
    title: t('products.title') || 'Products',
    description: t('products.description') || 'Browse our handmade products',
  };
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Products</h1>
        <SearchBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-1">
          <FilterPanel />
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <ProductsContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
