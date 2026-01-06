/**
 * Enhanced SEO utilities for comprehensive server-side rendering
 * Provides advanced metadata generation, structured data, and multilingual support
 */

import { Metadata } from 'next';
import {
  generateCanonicalURL,
  generateMultilingualURLs,
  normalizePath,
  generatePaginationURLs
} from './url-utils';

// Enhanced interfaces for SEO data
export interface EnhancedSEOOptions {
  title: string;
  description: string;
  locale: string;
  path: string;
  type: 'website' | 'product' | 'article' | 'category';
  image?: string;
  price?: number;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
  brand?: string;
  sku?: string;
  category?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  keywords?: string[];
  noindex?: boolean;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface HreflangLink {
  hreflang: string;
  href: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  ogImage?: string;
  structuredData: any[];
  breadcrumbs: BreadcrumbItem[];
  hreflangLinks: HreflangLink[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const DEFAULT_IMAGE = `${SITE_URL}/logo.jpg`;
const SITE_NAME = 'Handmade Ecommerce';

/**
 * Generates comprehensive SEO metadata with enhanced features
 */
export function generateEnhancedSEOMetadata(options: EnhancedSEOOptions): Metadata {
  const {
    title,
    description,
    locale,
    path,
    type,
    image = DEFAULT_IMAGE,
    price,
    availability,
    rating,
    reviewCount,
    brand,
    sku,
    category,
    author,
    publishedDate,
    modifiedDate,
    keywords = [],
    noindex = false,
  } = options;

  // Generate canonical URL using URL utilities
  const canonicalUrl = generateCanonicalURL({ path, locale });

  // Generate multilingual URLs
  const multilingualUrls = generateMultilingualURLs(path);

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: multilingualUrls,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: type === 'article' ? 'article' : 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };

  // Add product-specific Open Graph properties
  if (type === 'product' && price !== undefined) {
    metadata.openGraph = {
      ...metadata.openGraph,
      // @ts-ignore - Extended OpenGraph properties for products
      'product:price:amount': price.toString(),
      'product:price:currency': 'VND',
      'product:availability': availability?.toLowerCase() || 'in stock',
      'product:brand': brand,
      'product:category': category,
    };
  }

  // Add article-specific properties
  if (type === 'article' && author) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article' as any, // OpenGraph article type
      // @ts-ignore - Extended OpenGraph properties for articles
      'article:author': author,
      'article:published_time': publishedDate,
      'article:modified_time': modifiedDate,
    };
  }

  return metadata;
}

/**
 * Generates product-specific SEO metadata
 */
export function generateProductSEOMetadata(options: {
  product: {
    nameEn: string;
    nameVi: string;
    descriptionEn: string;
    descriptionVi: string;
    price: number;
    compareAtPrice?: number;
    sku: string;
    stockQuantity: number;
    category: {
      nameEn: string;
      nameVi: string;
    };
    images: Array<{ url: string; altTextEn?: string; altTextVi?: string }>;
    averageRating?: number;
    _count?: { reviews: number };
  };
  locale: string;
  path: string;
}): Metadata {
  const { product, locale, path } = options;
  const isVietnamese = locale === 'vi';

  const name = isVietnamese ? product.nameVi : product.nameEn;
  const description = isVietnamese ? product.descriptionVi : product.descriptionEn;
  const categoryName = isVietnamese ? product.category.nameVi : product.category.nameEn;

  // Generate SEO-optimized title
  const title = product.compareAtPrice
    ? `${name} - ${product.price.toLocaleString('vi-VN')}₫ (${isVietnamese ? 'Giảm từ' : 'Down from'} ${product.compareAtPrice.toLocaleString('vi-VN')}₫)`
    : `${name} - ${product.price.toLocaleString('vi-VN')}₫`;

  // Generate keywords
  const keywords = [
    name.toLowerCase(),
    categoryName.toLowerCase(),
    product.sku.toLowerCase(),
    isVietnamese ? 'handmade' : 'handmade',
    isVietnamese ? 'thủ công' : 'artisan',
  ];

  return generateEnhancedSEOMetadata({
    title,
    description,
    locale,
    path,
    type: 'product',
    image: product.images[0]?.url ? `${SITE_URL}${product.images[0].url}` : undefined,
    price: product.price,
    availability: product.stockQuantity > 0 ? 'InStock' : 'OutOfStock',
    rating: product.averageRating,
    reviewCount: product._count?.reviews,
    sku: product.sku,
    category: categoryName,
    keywords,
  });
}

/**
 * Generates category-specific SEO metadata
 */
export function generateCategorySEOMetadata(options: {
  category: {
    nameEn: string;
    nameVi: string;
    descriptionEn?: string;
    descriptionVi?: string;
    _count?: { products: number };
  };
  locale: string;
  path: string;
  page?: number;
}): Metadata {
  const { category, locale, path, page = 1 } = options;
  const isVietnamese = locale === 'vi';

  const name = isVietnamese ? category.nameVi : category.nameEn;
  const description = isVietnamese ? category.descriptionVi : category.descriptionEn;

  const title = page > 1
    ? `${name} - ${isVietnamese ? 'Trang' : 'Page'} ${page}`
    : name;

  const metaDescription = description ||
    `${isVietnamese ? 'Khám phá' : 'Discover'} ${name.toLowerCase()} ${isVietnamese ? 'chất lượng cao' : 'high-quality products'}${category._count?.products ? ` - ${category._count.products} ${isVietnamese ? 'sản phẩm' : 'products'}` : ''}`;

  const keywords = [
    name.toLowerCase(),
    isVietnamese ? 'danh mục' : 'category',
    isVietnamese ? 'sản phẩm' : 'products',
    isVietnamese ? 'handmade' : 'handmade',
  ];

  return generateEnhancedSEOMetadata({
    title,
    description: metaDescription,
    locale,
    path,
    type: 'category',
    keywords,
  });
}

/**
 * Generates homepage SEO metadata
 */
export function generateHomepageSEOMetadata(options: {
  locale: string;
  featuredProductsCount?: number;
  categoriesCount?: number;
}): Metadata {
  const { locale, featuredProductsCount = 0, categoriesCount = 0 } = options;
  const isVietnamese = locale === 'vi';

  const title = isVietnamese
    ? 'Handmade Ecommerce - Sản phẩm thủ công chất lượng cao'
    : 'Handmade Ecommerce - High Quality Artisan Products';

  const description = isVietnamese
    ? `Khám phá ${featuredProductsCount} sản phẩm handmade độc đáo từ ${categoriesCount} danh mục khác nhau. Chất lượng cao, giá cả hợp lý, giao hàng toàn quốc.`
    : `Discover ${featuredProductsCount} unique handmade products across ${categoriesCount} categories. High quality, reasonable prices, nationwide delivery.`;

  const keywords = isVietnamese
    ? ['handmade', 'thủ công', 'sản phẩm', 'chất lượng', 'độc đáo', 'việt nam']
    : ['handmade', 'artisan', 'products', 'quality', 'unique', 'vietnam'];

  return generateEnhancedSEOMetadata({
    title,
    description,
    locale,
    path: '',
    type: 'website',
    keywords,
  });
}

/**
 * Generates blog post SEO metadata
 */
export function generateBlogPostSEOMetadata(options: {
  post: {
    titleEn: string;
    titleVi: string;
    contentEn: string;
    contentVi: string;
    slug: string;
    publishedAt: string;
    updatedAt: string;
    imageUrl?: string;
  };
  locale: string;
  author?: string;
}): Metadata {
  const { post, locale, author = 'Handmade Ecommerce' } = options;
  const isVietnamese = locale === 'vi';

  const title = isVietnamese ? post.titleVi : post.titleEn;
  const content = isVietnamese ? post.contentVi : post.contentEn;

  // Extract description from content (first 160 characters)
  const description = content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';

  const keywords = [
    ...title.toLowerCase().split(' ').filter(word => word.length > 3),
    isVietnamese ? 'blog' : 'blog',
    isVietnamese ? 'bài viết' : 'article',
    isVietnamese ? 'handmade' : 'handmade',
  ];

  return generateEnhancedSEOMetadata({
    title,
    description,
    locale,
    path: `/blog/${post.slug}`,
    type: 'article',
    image: post.imageUrl ? `${SITE_URL}${post.imageUrl}` : undefined,
    author,
    publishedDate: post.publishedAt,
    modifiedDate: post.updatedAt,
    keywords,
  });
}

/**
 * Generates multilingual hreflang links
 */
export function generateHreflangLinks(path: string): HreflangLink[] {
  const multilingualUrls = generateMultilingualURLs(path);

  return [
    { hreflang: 'vi', href: multilingualUrls.vi },
    { hreflang: 'en', href: multilingualUrls.en },
    { hreflang: 'x-default', href: multilingualUrls['x-default'] },
  ];
}

/**
 * Generates pagination meta tags for category and blog listing pages
 */
export function generatePaginationMetadata(options: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  locale: string;
  searchParams?: Record<string, string>;
}): Pick<Metadata, 'alternates'> {
  const { currentPage, totalPages, basePath, locale, searchParams = {} } = options;

  const paginationUrls = generatePaginationURLs({
    basePath,
    currentPage,
    totalPages,
    locale,
    searchParams,
  });

  const alternates: any = {
    canonical: paginationUrls.canonical,
  };

  if (paginationUrls.prev) {
    alternates.prev = paginationUrls.prev;
  }

  if (paginationUrls.next) {
    alternates.next = paginationUrls.next;
  }

  return { alternates };
}