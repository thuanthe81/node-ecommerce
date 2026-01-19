'use client';

import { EnhancedProduct, Product } from '@/lib/product-api';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[] | EnhancedProduct[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}