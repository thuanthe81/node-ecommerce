/**
 * Comprehensive structured data generators for Schema.org markup
 * Supports products, categories, breadcrumbs, articles, and organization data
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'Handmade Ecommerce';

export interface ProductData {
  id: string;
  slug: string;
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
    slug: string;
  };
  images: Array<{
    url: string;
    altTextEn?: string;
    altTextVi?: string;
  }>;
  averageRating?: number;
  _count?: {
    reviews: number;
  };
}

export interface CategoryData {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  descriptionEn?: string;
  descriptionVi?: string;
  _count?: {
    products: number;
  };
}

export interface BlogPostData {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  publishedAt: string;
  updatedAt: string;
  imageUrl?: string;
  category?: {
    nameEn: string;
    nameVi: string;
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
  position: number;
}

export interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
  isVerified: boolean;
}

/**
 * Generates product structured data with comprehensive Schema.org markup
 */
export function generateProductSchema(
  product: ProductData,
  locale: string,
  reviews?: ReviewData[]
): object {
  const isVietnamese = locale === 'vi';
  const name = isVietnamese ? product.nameVi : product.nameEn;
  const description = isVietnamese ? product.descriptionVi : product.descriptionEn;
  const categoryName = isVietnamese ? product.category.nameVi : product.category.nameEn;

  const productUrl = `${SITE_URL}${locale === 'vi' ? '' : `/${locale}`}/products/${product.slug}`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name,
    description,
    sku: product.sku,
    url: productUrl,
    image: product.images.map(img => `${SITE_URL}${img.url}`),
    category: categoryName,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    manufacturer: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      '@id': `${productUrl}#offer`,
      url: productUrl,
      priceCurrency: 'VND',
      price: product.price.toString(),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      availability: product.stockQuantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  };

  // Add compare at price if available
  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    schema.offers.highPrice = product.compareAtPrice.toString();
  }

  // Add aggregate rating if available
  if (product.averageRating && product._count?.reviews) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating.toString(),
      reviewCount: product._count.reviews.toString(),
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add individual reviews if provided
  if (reviews && reviews.length > 0) {
    schema.review = reviews.map(review => ({
      '@type': 'Review',
      '@id': `${productUrl}#review-${review.id}`,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      author: {
        '@type': 'Person',
        name: review.authorName,
      },
      reviewBody: review.comment,
      datePublished: review.createdAt,
    }));
  }

  return schema;
}

/**
 * Generates category page structured data with product listings
 */
export function generateCategorySchema(
  category: CategoryData,
  products: ProductData[],
  locale: string,
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  }
): object {
  const isVietnamese = locale === 'vi';
  const name = isVietnamese ? category.nameVi : category.nameEn;
  const description = isVietnamese ? category.descriptionVi : category.descriptionEn;

  const categoryUrl = `${SITE_URL}${locale === 'vi' ? '' : `/${locale}`}/categories/${category.slug}`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': categoryUrl,
    name,
    description,
    url: categoryUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: pagination?.totalItems || products.length,
      itemListElement: products.map((product, index) => {
        const productName = isVietnamese ? product.nameVi : product.nameEn;
        const productUrl = `${SITE_URL}${locale === 'vi' ? '' : `/${locale}`}/products/${product.slug}`;

        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            '@id': productUrl,
            name: productName,
            url: productUrl,
            image: product.images[0]?.url ? `${SITE_URL}${product.images[0].url}` : undefined,
            offers: {
              '@type': 'Offer',
              price: product.price.toString(),
              priceCurrency: 'VND',
              availability: product.stockQuantity > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          },
        };
      }),
    },
  };

  // Add pagination information if available
  if (pagination && pagination.totalPages > 1) {
    schema.mainEntity.itemListOrder = 'https://schema.org/ItemListOrderAscending';

    if (pagination.currentPage > 1) {
      schema.relatedLink = [
        {
          '@type': 'WebPage',
          url: `${categoryUrl}?page=${pagination.currentPage - 1}`,
          name: `${name} - Page ${pagination.currentPage - 1}`,
        },
      ];
    }

    if (pagination.currentPage < pagination.totalPages) {
      schema.relatedLink = schema.relatedLink || [];
      schema.relatedLink.push({
        '@type': 'WebPage',
        url: `${categoryUrl}?page=${pagination.currentPage + 1}`,
        name: `${name} - Page ${pagination.currentPage + 1}`,
      });
    }
  }

  return schema;
}

/**
 * Generates breadcrumb structured data
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; path: string }> | BreadcrumbItem[],
  locale: string
): object {
  const localePrefix = locale === 'vi' ? '' : `/${locale}`;

  // Handle both interfaces
  const items = breadcrumbs.map((crumb, index) => {
    if ('position' in crumb) {
      // BreadcrumbItem interface
      return {
        '@type': 'ListItem',
        position: crumb.position,
        name: crumb.name,
        item: `${SITE_URL}${localePrefix}${crumb.path}`,
      };
    } else {
      // Simple interface
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${SITE_URL}${localePrefix}${crumb.path}`,
      };
    }
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generates blog post/article structured data
 */
export function generateArticleSchema(
  post: BlogPostData,
  locale: string,
  author: string = SITE_NAME
): object {
  const isVietnamese = locale === 'vi';
  const title = isVietnamese ? post.titleVi : post.titleEn;
  const content = isVietnamese ? post.contentVi : post.contentEn;
  const categoryName = post.category
    ? (isVietnamese ? post.category.nameVi : post.category.nameEn)
    : undefined;

  const articleUrl = `${SITE_URL}${locale === 'vi' ? '' : `/${locale}`}/blog/${post.slug}`;

  // Extract plain text from HTML content for description
  const description = content.replace(/<[^>]*>/g, '').substring(0, 160);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': articleUrl,
    headline: title,
    description,
    image: post.imageUrl ? `${SITE_URL}${post.imageUrl}` : undefined,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.jpg`,
        width: 200,
        height: 60,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    articleSection: categoryName,
    inLanguage: locale === 'vi' ? 'vi-VN' : 'en-US',
  };
}

/**
 * Enhanced blog post structured data with categories and related content
 */
export function generateBlogPostSchema(data: {
  title: string;
  description: string;
  image: string;
  author: string;
  datePublished: string;
  dateModified: string;
  url: string;
  locale: string;
  categories?: Array<{ name: string; url: string }>;
}): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': data.url,
    headline: data.title,
    description: data.description,
    image: {
      '@type': 'ImageObject',
      url: data.image,
      width: 1200,
      height: 630,
    },
    author: {
      '@type': 'Person',
      name: data.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.jpg`,
        width: 200,
        height: 60,
      },
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
    inLanguage: data.locale === 'vi' ? 'vi-VN' : 'en-US',
  };

  // Add categories if available
  if (data.categories && data.categories.length > 0) {
    schema.about = data.categories.map(category => ({
      '@type': 'Thing',
      name: category.name,
      url: category.url,
    }));

    // Use first category as article section
    schema.articleSection = data.categories[0].name;
  }

  return schema;
}

/**
 * Generates organization structured data for homepage
 */
export function generateOrganizationSchema(locale: string): object {
  const isVietnamese = locale === 'vi';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}#organization`,
    name: SITE_NAME,
    alternateName: isVietnamese ? 'Handmade Thủ Công' : 'Handmade Artisan',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.jpg`,
      width: 200,
      height: 60,
    },
    description: isVietnamese
      ? 'Chuyên cung cấp sản phẩm handmade chất lượng cao, độc đáo và tinh tế'
      : 'Specializing in high-quality, unique and exquisite handmade products',
    foundingDate: '2024',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@handmade-ecommerce.com',
        availableLanguage: ['Vietnamese', 'English'],
      },
    ],
    sameAs: [
      // Add social media URLs when available
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'VN',
      addressLocality: 'Ho Chi Minh City',
    },
  };
}

/**
 * Generates website structured data for homepage
 */
export function generateWebsiteSchema(locale: string): object {
  const isVietnamese = locale === 'vi';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: SITE_NAME,
    alternateName: isVietnamese ? 'Handmade Thủ Công' : 'Handmade Artisan',
    url: SITE_URL,
    description: isVietnamese
      ? 'Nền tảng thương mại điện tử chuyên về sản phẩm handmade chất lượng cao'
      : 'E-commerce platform specializing in high-quality handmade products',
    inLanguage: [locale === 'vi' ? 'vi-VN' : 'en-US'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}${locale === 'vi' ? '' : '/en'}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates FAQ structured data
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
  locale: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Combines multiple structured data objects into a single JSON-LD script
 */
export function combineStructuredData(schemas: object[]): string {
  const validSchemas = schemas.filter(schema => schema && typeof schema === 'object');

  if (validSchemas.length === 0) {
    return '';
  }

  if (validSchemas.length === 1) {
    return JSON.stringify(validSchemas[0], null, 0);
  }

  // Multiple schemas - wrap in array
  return JSON.stringify(validSchemas, null, 0);
}

/**
 * Generates structured data script tag for Next.js pages
 * Returns the JSON-LD string that can be used in a script tag
 */
export function generateStructuredDataScript(schemas: object[]): string | null {
  const jsonLd = combineStructuredData(schemas);

  if (!jsonLd) {
    return null;
  }

  return jsonLd;
}