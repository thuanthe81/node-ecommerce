# Enhanced SSR Infrastructure for Ecommerce SEO

This document describes the comprehensive Server-Side Rendering (SSR) infrastructure created for the Next.js ecommerce frontend to improve SEO performance, search engine rankings, and user experience.

## Overview

The SSR infrastructure consists of several interconnected utilities that provide:

- **Enhanced SEO metadata generation** with multilingual support
- **Comprehensive structured data** following Schema.org standards
- **Robust error handling** with fallback mechanisms
- **Performance monitoring** and timeout management
- **Type-safe interfaces** for all data models
- **High-level utilities** for common SSR operations

## Core Components

### 1. SEO Enhanced (`seo-enhanced.ts`)

Provides advanced SEO metadata generation with comprehensive features:

```typescript
import { generateEnhancedSEOMetadata, generateProductSEOMetadata } from '@/lib/seo-enhanced';

// Generate comprehensive metadata
const metadata = generateEnhancedSEOMetadata({
  title: 'Product Name',
  description: 'Product description',
  locale: 'vi',
  path: '/products/product-slug',
  type: 'product',
  price: 100000,
  availability: 'InStock',
  keywords: ['handmade', 'quality'],
});

// Generate product-specific metadata
const productMetadata = generateProductSEOMetadata({
  product: productData,
  locale: 'vi',
  path: '/products/product-slug',
});
```

**Features:**
- Multilingual meta tags (Vietnamese/English)
- Open Graph and Twitter Card support
- Product-specific pricing and availability markup
- Article-specific author and publication data
- Canonical URLs and hreflang links
- SEO-optimized titles and descriptions

### 2. Structured Data (`structured-data.ts`)

Generates comprehensive Schema.org structured data:

```typescript
import {
  generateProductSchema,
  generateCategorySchema,
  generateBreadcrumbSchema,
  combineStructuredData
} from '@/lib/structured-data';

// Generate product structured data
const productSchema = generateProductSchema(product, locale, reviews);

// Generate breadcrumb structured data
const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs, locale);

// Combine multiple schemas
const jsonLd = combineStructuredData([productSchema, breadcrumbSchema]);
```

**Supported Schema Types:**
- Product with offers, reviews, and ratings
- Category with product listings
- Breadcrumb navigation
- Blog articles with author and publisher
- Organization and website information
- FAQ pages

### 3. SSR Error Handling (`ssr-error-handling.ts`)

Provides comprehensive error handling for SSR operations:

```typescript
import {
  safeSSRFetch,
  retrySSROperation,
  withSSRTimeout,
  classifySSRError
} from '@/lib/ssr-error-handling';

// Safe data fetching with fallbacks
const result = await safeSSRFetch(
  () => fetch('/api/products'),
  fallbackData,
  { apiTimeout: 5000, retryAttempts: 2 }
);

// Retry operations with exponential backoff
const data = await retrySSROperation(
  () => fetchProductData(),
  { maxAttempts: 3, baseDelay: 1000 }
);
```

**Features:**
- Automatic error classification and handling
- Timeout management for API calls
- Exponential backoff retry mechanism
- Fallback to client-side rendering
- Performance monitoring and logging
- User-friendly error messages

### 4. Enhanced Types (`ssr-types.ts`)

Comprehensive TypeScript interfaces for SSR operations:

```typescript
import {
  EnhancedProduct,
  EnhancedCategory,
  SSRDataResult,
  ProductPageData
} from '@/lib/ssr-types';

// Type-safe product data
const product: EnhancedProduct = {
  id: '1',
  slug: 'product-slug',
  nameEn: 'Product Name',
  nameVi: 'Tên Sản Phẩm',
  // ... other properties
};

// SSR result with error handling
const result: SSRDataResult<EnhancedProduct> = {
  data: product,
  error: null,
  fallbackToCSR: false,
  cacheHit: true,
  renderTime: 150,
};
```

**Key Interfaces:**
- `EnhancedProduct` - Complete product data model
- `EnhancedCategory` - Category with product counts
- `SSRDataResult<T>` - Standardized SSR response
- `SEOMetadata` - Comprehensive SEO data
- `BreadcrumbItem` - Navigation breadcrumbs

### 5. SSR Utils (`ssr-utils.ts`)

High-level utilities that combine all SSR functionality:

```typescript
import {
  fetchProductSSR,
  generateProductMetadata,
  generateProductStructuredData,
  shouldFallbackToCSR
} from '@/lib/ssr-utils';

// Fetch product with error handling
const result = await fetchProductSSR('product-slug');

// Generate metadata for Next.js
export async function generateMetadata({ params }) {
  const { slug, locale } = await params;
  return generateProductMetadata(slug, locale);
}

// Check if fallback is needed
if (shouldFallbackToCSR(result)) {
  // Render loading state or client-side component
}
```

**Available Functions:**
- `fetchProductSSR()` - Product data with error handling
- `fetchCategorySSR()` - Category and products data
- `fetchHomepageSSR()` - Homepage sections and featured content
- `fetchBlogPostSSR()` - Blog post with related articles
- `generateProductMetadata()` - Complete product metadata
- `generateCategoryMetadata()` - Category metadata with pagination
- `generateProductStructuredData()` - Product JSON-LD
- `generateCategoryStructuredData()` - Category JSON-LD

## Usage Examples

### Product Page Implementation

```typescript
// app/[locale]/products/[slug]/page.tsx
import { fetchProductSSR, generateProductMetadata } from '@/lib/ssr-utils';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate metadata
export async function generateMetadata({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  return generateProductMetadata(slug, locale);
}

// Page component
export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  const result = await fetchProductSSR(slug);

  if (!result.data) {
    return <div>Product not found</div>;
  }

  const product = result.data;
  const structuredData = generateProductStructuredData(product, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      {/* Product content */}
    </>
  );
}
```

### Category Page with Pagination

```typescript
// app/[locale]/categories/[slug]/page.tsx
import { fetchCategorySSR, generateCategoryMetadata } from '@/lib/ssr-utils';

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = await params;
  const { page } = await searchParams;
  return generateCategoryMetadata(slug, locale, { page });
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = await params;
  const { page = '1' } = await searchParams;

  const result = await fetchCategorySSR(slug, { page: parseInt(page, 10) });

  if (!result.data) {
    return <div>Category not found</div>;
  }

  // Render category with products and pagination
}
```

### Homepage with Multiple Data Sources

```typescript
// app/[locale]/page.tsx
import { fetchHomepageSSR, generateHomepageStructuredData } from '@/lib/ssr-utils';

export default async function Homepage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await fetchHomepageSSR();

  const structuredData = generateHomepageStructuredData(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      {/* Homepage content */}
    </>
  );
}
```

## Configuration

### Environment Variables

```env
# Required for SSR operations
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Optional for enhanced error handling
NODE_ENV=production
```

### Next.js Configuration

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    // Enable ISR for better performance
    isrMemoryCacheSize: 0,
  },
  // Configure image domains for structured data
  images: {
    domains: ['your-domain.com'],
  },
};
```

### ISR Configuration

The utilities are configured for Incremental Static Regeneration:

- **Homepage**: 5 minutes (300s) - Dynamic content
- **Product pages**: 10 minutes (600s) - Regular updates
- **Category pages**: 15 minutes (900s) - Less frequent changes
- **Blog posts**: 1 hour (3600s) - Static content

## Error Handling

The infrastructure provides multiple levels of error handling:

### 1. Automatic Fallbacks

```typescript
const result = await fetchProductSSR('product-slug');

if (shouldFallbackToCSR(result)) {
  // Render client-side loading component
  return <ClientSideProduct slug="product-slug" />;
}
```

### 2. User-Friendly Messages

```typescript
const errorMessage = getSSRErrorMessage(result, locale);
// Returns localized error message for users
```

### 3. Performance Monitoring

```typescript
// Automatic performance tracking
const result = await fetchProductSSR('product-slug');
console.log(`Render time: ${result.renderTime}ms`);
```

## Performance Optimization

### Caching Strategy

- **Static Generation**: For content that rarely changes
- **ISR**: For content with predictable update patterns
- **SSR**: For user-specific or real-time content

### Timeout Configuration

```typescript
const config = {
  apiTimeout: 5000,     // 5 seconds for API calls
  totalTimeout: 10000,  // 10 seconds total SSR time
  retryAttempts: 2,     // Retry failed requests
  retryDelay: 1000,     // 1 second between retries
};
```

### Memory Management

- Automatic cleanup of large responses
- Streaming for large data sets
- Resource usage monitoring

## SEO Benefits

This infrastructure provides significant SEO improvements:

1. **Complete HTML Content**: All critical content rendered server-side
2. **Rich Structured Data**: Comprehensive Schema.org markup
3. **Optimized Meta Tags**: Dynamic, content-specific metadata
4. **Fast Loading**: Optimized caching and error handling
5. **Mobile Optimization**: Responsive server-rendered content
6. **Multilingual Support**: Proper hreflang and locale handling

## Monitoring and Debugging

### Development Mode

- Console logging for SSR operations
- Performance warnings for slow operations
- Detailed error information

### Production Mode

- Integration points for monitoring services
- Performance metrics collection
- Error tracking and alerting

## Migration Guide

To migrate existing pages to use this infrastructure:

1. **Update imports**: Replace existing SEO utilities
2. **Add error handling**: Wrap data fetching in `safeSSRFetch`
3. **Generate metadata**: Use the new metadata functions
4. **Add structured data**: Include JSON-LD scripts
5. **Test thoroughly**: Verify SSR and fallback behavior

## Best Practices

1. **Always handle errors**: Use `shouldFallbackToCSR()` checks
2. **Include structured data**: Add JSON-LD to all pages
3. **Optimize images**: Use proper alt text and lazy loading
4. **Monitor performance**: Track render times and error rates
5. **Test multilingual**: Verify both Vietnamese and English content
6. **Cache appropriately**: Use ISR for optimal performance

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase `apiTimeout` configuration
2. **Memory issues**: Reduce data payload size
3. **Type errors**: Ensure proper interface usage
4. **SEO issues**: Validate structured data with Google's tools

### Debug Tools

- Use browser dev tools to inspect meta tags
- Validate structured data with Schema.org validator
- Test with Google's Rich Results Test
- Monitor Core Web Vitals with Lighthouse

This infrastructure provides a solid foundation for SEO-optimized server-side rendering while maintaining excellent developer experience and robust error handling.