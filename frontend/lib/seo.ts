import { Metadata } from 'next';

export interface SEOProps {
  title: string;
  description: string;
  locale: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
  noindex?: boolean;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export function generateSEOMetadata({
  title,
  description,
  locale,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  price,
  currency = 'VND',
  availability,
  noindex = false,
}: SEOProps): Metadata {
  const localePrefix = locale === 'vi' ? '' : `/${locale}`;
  const url = `${SITE_URL}${localePrefix}${path}`;
  const alternateUrl = locale === 'vi' ? `${SITE_URL}/en${path}` : `${SITE_URL}${path}`;
  const alternateLocale = locale === 'vi' ? 'en' : 'vi';

  const ogType = type === 'product' ? 'website' : type; // OpenGraph doesn't support 'product' type directly

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        [locale]: url,
        [alternateLocale]: alternateUrl,
        'x-default': `${SITE_URL}${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Handmade E-commerce',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      type: ogType,
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
  };

  // Add noindex if specified
  if (noindex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}

export function generateBreadcrumbList(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  availability: 'in stock' | 'out of stock';
  sku: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    url: product.url,
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: product.currency,
      availability:
        product.availability === 'in stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: product.url,
    },
  };

  if (product.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand,
    };
  }

  if (product.rating && product.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toString(),
      reviewCount: product.reviewCount.toString(),
    };
  }

  return schema;
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Handmade E-commerce',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      // Add social media URLs here
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@handmade-ecommerce.com',
    },
  };
}

export function generateReviewSchema(review: {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
  itemReviewed: {
    name: string;
    type: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
    itemReviewed: {
      '@type': review.itemReviewed.type,
      name: review.itemReviewed.name,
    },
  };
}
