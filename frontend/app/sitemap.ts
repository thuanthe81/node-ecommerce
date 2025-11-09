import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    '',
    '/products',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/shipping-policy',
    '/returns',
  ];

  const staticRoutes: MetadataRoute.Sitemap = [];

  // Add both locales for each static page
  for (const page of staticPages) {
    // Vietnamese (default)
    staticRoutes.push({
      url: `${SITE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.8,
      alternates: {
        languages: {
          vi: `${SITE_URL}${page}`,
          en: `${SITE_URL}/en${page}`,
        },
      },
    });
  }

  // Fetch dynamic product pages
  try {
    const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?limit=1000`);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const products = productsData.data || [];

      for (const product of products) {
        staticRoutes.push({
          url: `${SITE_URL}/products/${product.slug}`,
          lastModified: new Date(product.updatedAt || product.createdAt),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: {
              vi: `${SITE_URL}/products/${product.slug}`,
              en: `${SITE_URL}/en/products/${product.slug}`,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // Fetch dynamic category pages
  try {
    const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();

      for (const category of categories) {
        staticRoutes.push({
          url: `${SITE_URL}/categories/${category.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: {
            languages: {
              vi: `${SITE_URL}/categories/${category.slug}`,
              en: `${SITE_URL}/en/categories/${category.slug}`,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // Fetch dynamic content pages
  try {
    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content/pages`);
    if (contentResponse.ok) {
      const pages = await contentResponse.json();

      for (const page of pages) {
        if (page.isPublished) {
          staticRoutes.push({
            url: `${SITE_URL}/pages/${page.slug}`,
            lastModified: new Date(page.updatedAt),
            changeFrequency: 'monthly',
            priority: 0.5,
            alternates: {
              languages: {
                vi: `${SITE_URL}/pages/${page.slug}`,
                en: `${SITE_URL}/en/pages/${page.slug}`,
              },
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching content pages for sitemap:', error);
  }

  return staticRoutes;
}
