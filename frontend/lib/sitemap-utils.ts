import { MetadataRoute } from 'next';
import { getFetchOptions } from './cache-config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages?: {
      [locale: string]: string;
    };
  };
}

export interface SitemapData {
  products: SitemapEntry[];
  categories: SitemapEntry[];
  blogPosts: SitemapEntry[];
  staticPages: SitemapEntry[];
}

/**
 * Fetch product URLs for sitemap generation
 */
export async function getProductUrls(): Promise<SitemapEntry[]> {
  try {
    const response = await fetch(`${API_URL}/products?limit=1000`, {
      ...getFetchOptions('sitemaps'),
    });

    if (!response.ok) {
      console.error('Failed to fetch products for sitemap:', response.status);
      return [];
    }

    const productsData = await response.json();
    const products = productsData.data || [];

    return products.map((product: any) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: new Date(product.updatedAt || product.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          vi: `${SITE_URL}/products/${product.slug}`,
          en: `${SITE_URL}/en/products/${product.slug}`,
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching product URLs for sitemap:', error);
    return [];
  }
}

/**
 * Fetch category URLs for sitemap generation
 */
export async function getCategoryUrls(): Promise<SitemapEntry[]> {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      ...getFetchOptions('sitemaps'),
    });

    if (!response.ok) {
      console.error('Failed to fetch categories for sitemap:', response.status);
      return [];
    }

    const categories = await response.json();

    return categories.map((category: any) => ({
      url: `${SITE_URL}/categories/${category.slug}`,
      lastModified: new Date(category.updatedAt || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.7,
      alternates: {
        languages: {
          vi: `${SITE_URL}/categories/${category.slug}`,
          en: `${SITE_URL}/en/categories/${category.slug}`,
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching category URLs for sitemap:', error);
    return [];
  }
}

/**
 * Fetch blog post URLs for sitemap generation
 */
export async function getBlogUrls(): Promise<SitemapEntry[]> {
  try {
    const response = await fetch(`${API_URL}/content/blog?limit=1000&published=true`, {
      ...getFetchOptions('sitemaps'),
    });

    if (!response.ok) {
      console.error('Failed to fetch blog posts for sitemap:', response.status);
      return [];
    }

    const blogData = await response.json();
    const posts = blogData.posts || [];

    return posts.map((post: any) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: {
        languages: {
          vi: `${SITE_URL}/blog/${post.slug}`,
          en: `${SITE_URL}/en/blog/${post.slug}`,
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching blog URLs for sitemap:', error);
    return [];
  }
}

/**
 * Get static page URLs for sitemap generation
 */
export function getStaticUrls(): SitemapEntry[] {
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/products', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/shipping-policy', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/returns', priority: 0.4, changeFrequency: 'monthly' as const },
  ];

  return staticPages.map(page => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    alternates: {
      languages: {
        vi: `${SITE_URL}${page.path}`,
        en: `${SITE_URL}/en${page.path}`,
      },
    },
  }));
}

/**
 * Fetch content page URLs for sitemap generation
 */
export async function getContentUrls(): Promise<SitemapEntry[]> {
  try {
    const response = await fetch(`${API_URL}/content/published?type=PAGE`, {
      ...getFetchOptions('sitemaps'),
    });

    if (!response.ok) {
      console.error('Failed to fetch content pages for sitemap:', response.status);
      return [];
    }

    const pages = await response.json();

    return pages.map((page: any) => ({
      url: `${SITE_URL}/pages/${page.slug}`,
      lastModified: new Date(page.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
      alternates: {
        languages: {
          vi: `${SITE_URL}/pages/${page.slug}`,
          en: `${SITE_URL}/en/pages/${page.slug}`,
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching content page URLs for sitemap:', error);
    return [];
  }
}

/**
 * Generate comprehensive sitemap data
 */
export async function generateSitemapData(): Promise<SitemapData> {
  const [products, categories, blogPosts, contentPages] = await Promise.all([
    getProductUrls(),
    getCategoryUrls(),
    getBlogUrls(),
    getContentUrls(),
  ]);

  const staticPages = getStaticUrls();

  return {
    products,
    categories,
    blogPosts: blogPosts,
    staticPages: [...staticPages, ...contentPages],
  };
}

/**
 * Convert sitemap entries to Next.js MetadataRoute.Sitemap format
 */
export function convertToMetadataRoute(entries: SitemapEntry[]): MetadataRoute.Sitemap {
  return entries.map(entry => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    alternates: entry.alternates,
  }));
}