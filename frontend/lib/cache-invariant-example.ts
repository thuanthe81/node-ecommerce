/**
 * Example usage of Cache Invariant Error Handling
 *
 * This file demonstrates how to integrate cache invariant error handling
 * into Next.js pages and API calls during build time.
 */

import {
  withCacheErrorHandling,
  withCacheErrorHandlingForParams,
  fetchWithCacheErrorHandling,
  createBuildApiClient
} from './build-cache-integration';

// Example 1: Using cache error handling in getStaticProps
export const getStaticPropsWithCacheHandling = withCacheErrorHandling(async () => {
  try {
    // This API call will automatically handle cache invariant errors
    const data = await fetchWithCacheErrorHandling<any>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/content`,
      {},
      'homepage' // pageId for tracking
    );

    return {
      props: {
        content: data,
        generatedAt: new Date().toISOString(),
        error: undefined as string | undefined, // Make error optional for consistency
      },
    };
  } catch (error) {
    console.error('Failed to fetch content:', error);

    // Return fallback props
    return {
      props: {
        content: null,
        error: 'Failed to load content' as string | undefined,
        generatedAt: new Date().toISOString(),
      },
    };
  }
});

// Example 2: Using cache error handling for generateStaticParams
export const generateStaticParamsWithCacheHandling = withCacheErrorHandlingForParams(async () => {
  try {
    // Create a cache-aware API client
    const apiClient = createBuildApiClient(process.env.NEXT_PUBLIC_API_URL || '');

    // Fetch dynamic routes with cache error handling
    const products = await apiClient.get<Array<{ id: string }>>('/api/products', 'product-list');

    return products.map(product => ({
      id: product.id,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
});

// Example 3: Manual usage in a custom function
export async function fetchProductsWithCacheHandling(categoryId: string) {
  try {
    const products = await fetchWithCacheErrorHandling<any[]>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products?category=${categoryId}`,
      {},
      `products-${categoryId}`
    );

    return products;
  } catch (error) {
    console.error(`Failed to fetch products for category ${categoryId}:`, error);

    // Return empty array as fallback
    return [];
  }
}

// Example 4: Using in a Next.js 13+ app directory page
export async function generateMetadataWithCacheHandling(params: { id: string }) {
  try {
    const product = await fetchWithCacheErrorHandling<any>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products/${params.id}`,
      {},
      `product-${params.id}`
    );

    return {
      title: product.name,
      description: product.description,
    };
  } catch (error) {
    console.error(`Failed to fetch metadata for product ${params.id}:`, error);

    return {
      title: 'Product Not Found',
      description: 'The requested product could not be loaded.',
    };
  }
}

// Example 5: Batch operations with cache error handling
export async function fetchMultipleResourcesWithCacheHandling() {
  const apiClient = createBuildApiClient(process.env.NEXT_PUBLIC_API_URL || '');

  try {
    // These will run in parallel, each with their own cache error handling
    const [products, categories, settings] = await Promise.allSettled([
      apiClient.get<any[]>('/api/products', 'products-batch'),
      apiClient.get<any[]>('/api/categories', 'categories-batch'),
      apiClient.get<any>('/api/settings', 'settings-batch'),
    ]);

    return {
      products: products.status === 'fulfilled' ? products.value : [],
      categories: categories.status === 'fulfilled' ? categories.value : [],
      settings: settings.status === 'fulfilled' ? settings.value : {},
    };
  } catch (error) {
    console.error('Failed to fetch multiple resources:', error);

    return {
      products: [],
      categories: [],
      settings: {},
    };
  }
}

// Example 6: Custom error handling with recovery information
export async function fetchWithDetailedErrorHandling(url: string, pageId: string) {
  const {
    buildPageWithCacheErrorHandling
  } = await import('./build-operation-wrapper');

  const result = await buildPageWithCacheErrorHandling(
    pageId,
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }
  );

  if (!result.success) {
    console.error('Build operation failed:', {
      error: result.error?.message,
      cacheErrorsHandled: result.cacheErrorsHandled,
      usedFallback: result.usedFallback,
      fallbackType: result.fallbackType,
      duration: result.duration,
    });

    throw result.error || new Error('Build operation failed');
  }

  if (result.cacheErrorsHandled > 0) {
    console.warn(`Successfully recovered from ${result.cacheErrorsHandled} cache error(s) for ${pageId}`);
  }

  return result.data;
}

// Example 7: Environment-specific usage
export function createEnvironmentAwareApiClient() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // In development, use more lenient error handling
    return createBuildApiClient(baseUrl);
  } else {
    // In production, use strict error handling with detailed logging
    return createBuildApiClient(baseUrl);
  }
}

// Example usage in a Next.js page component:
/*
// pages/products/[id].tsx or app/products/[id]/page.tsx

export async function getStaticProps({ params }: { params: { id: string } }) {
  return getStaticPropsWithCacheHandling();
}

export async function generateStaticParams() {
  return generateStaticParamsWithCacheHandling();
}

export default function ProductPage({ product, error }: any) {
  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
*/