import { getTranslations } from 'next-intl/server';
import HomeContent from './HomeContent';
import StructuredData from '@/components/StructuredData';
import { generateEnhancedSEOMetadata } from '@/lib/seo-enhanced';
import { generateOrganizationSchema, generateWebsiteSchema } from '@/lib/structured-data';
import {
  detectDeviceType,
  generateMobileViewportMeta,
  generateMobileStructuredData,
  generateMobileCSSClasses,
  getMobilePerformanceConfig
} from '@/lib/mobile-ssr-utils';
import { getFetchOptions } from '@/lib/cache-config';
import { Metadata } from 'next';

// Server-side data fetching interfaces
interface HomepageData {
  featuredProducts: any[];
  promotionalBanners: any[];
  homepageSections: any[];
  categories: any[];
}

// Server-side data fetching function with mobile optimizations
async function getHomepageData(deviceConfig: any): Promise<HomepageData> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const performanceConfig = getMobilePerformanceConfig(deviceConfig);

  try {
    // Adjust data fetching based on device capabilities
    const featuredProductsLimit = deviceConfig.isMobile ? 4 : 8; // Fewer products on mobile
    const fetchOptions = getFetchOptions('homepage');

    const [featuredProductsRes, bannersRes, sectionsRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/products?isFeatured=true&limit=${featuredProductsLimit}`, fetchOptions),
      fetch(`${baseUrl}/content/banners`, fetchOptions),
      fetch(`${baseUrl}/content/homepage-sections`, fetchOptions),
      fetch(`${baseUrl}/categories`, fetchOptions)
    ]);

    const [featuredProducts, banners, sections, categories] = await Promise.all([
      featuredProductsRes.ok ? featuredProductsRes.json() : { data: [] },
      bannersRes.ok ? bannersRes.json() : [],
      sectionsRes.ok ? sectionsRes.json() : [],
      categoriesRes.ok ? categoriesRes.json() : []
    ]);

    return {
      featuredProducts: featuredProducts.data || [],
      promotionalBanners: banners || [],
      homepageSections: sections || [],
      categories: categories || []
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      featuredProducts: [],
      promotionalBanners: [],
      homepageSections: [],
      categories: []
    };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  try {
    // Detect device type for mobile-specific optimizations
    const deviceConfig = await detectDeviceType();

    // Fetch homepage data to get counts for enhanced SEO
    const homepageData = await getHomepageData(deviceConfig);

    // Generate base metadata
    const baseMetadata = generateEnhancedSEOMetadata({
      title: t('seo.home.title'),
      description: t('seo.home.description'),
      locale,
      path: '',
      type: 'website',
      keywords: locale === 'vi'
        ? ['handmade', 'thủ công', 'sản phẩm', 'chất lượng', 'độc đáo', 'việt nam', 'nghệ nhân']
        : ['handmade', 'artisan', 'products', 'quality', 'unique', 'vietnam', 'crafted'],
    });

    // Add mobile-specific viewport and meta tags
    const mobileViewportMeta = generateMobileViewportMeta(deviceConfig);

    // Enhance metadata with mobile optimizations
    const enhancedMetadata: Metadata = {
      ...baseMetadata,
      other: {
        ...baseMetadata.other,
        ...mobileViewportMeta
      }
    };

    return enhancedMetadata;
  } catch (error) {
    console.error('Error generating homepage metadata:', error);
    return {
      title: t('seo.home.title'),
      description: t('seo.home.description'),
    };
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Detect device type for mobile optimizations
  const deviceConfig = await detectDeviceType();
  const mobileCSSClasses = generateMobileCSSClasses(deviceConfig);

  // Fetch homepage data server-side with mobile optimizations
  const homepageData = await getHomepageData(deviceConfig);

  // Generate structured data for SEO with mobile optimizations
  const organizationSchema = generateOrganizationSchema(locale);
  const websiteSchema = generateWebsiteSchema(locale);
  const mobileOptimizedOrgSchema = generateMobileStructuredData(organizationSchema, deviceConfig);

  return (
    <>
      {/* Multiple structured data schemas for comprehensive SEO */}
      <StructuredData data={mobileOptimizedOrgSchema} />
      <StructuredData data={websiteSchema} />

      {/* Critical above-the-fold content that renders without JavaScript */}
      <noscript>
        <div className={`w-full bg-zinc-50 dark:bg-black min-h-screen ${mobileCSSClasses.join(' ')}`}>
          <div className="max-w-7xl mx-auto px-4 py-16">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
                {locale === 'vi' ? 'Handmade E-commerce - Sản phẩm thủ công độc đáo' : 'Handmade E-commerce - Unique Artisan Products'}
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                {locale === 'vi'
                  ? 'Khám phá bộ sưu tập các sản phẩm thủ công chất lượng cao được làm bởi nghệ nhân tài ba.'
                  : 'Discover our collection of high-quality handmade products crafted by talented artisans.'
                }
              </p>
            </header>

            {/* Featured products preview for no-JS users */}
            {homepageData.featuredProducts.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-semibold mb-8 text-center">
                  {locale === 'vi' ? 'Sản phẩm nổi bật' : 'Featured Products'}
                </h2>
                <div className={`grid gap-6 ${deviceConfig.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {homepageData.featuredProducts.slice(0, deviceConfig.isMobile ? 3 : 6).map((product: any) => (
                    <div key={product.id} className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-4">
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4">
                        {product.images?.[0]?.url && (
                          <img
                            src={product.images[0].url}
                            alt={locale === 'vi' ? product.nameVi : product.nameEn}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {locale === 'vi' ? product.nameVi : product.nameEn}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">
                        {(locale === 'vi' ? product.descriptionVi : product.descriptionEn)?.substring(0, 100)}...
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-blue-600">
                          {product.price?.toLocaleString('vi-VN')}₫
                        </span>
                        <a
                          href={`/${locale === 'vi' ? '' : 'en/'}products/${product.slug}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {locale === 'vi' ? 'Xem chi tiết' : 'View Details'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Navigation links for no-JS users */}
            <nav className="text-center">
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={`/${locale === 'vi' ? '' : 'en/'}products`}
                  className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  {locale === 'vi' ? 'Xem tất cả sản phẩm' : 'View All Products'}
                </a>
                <a
                  href={`/${locale === 'vi' ? '' : 'en/'}categories`}
                  className="border border-black dark:border-white text-black dark:text-white px-6 py-3 rounded-lg hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  {locale === 'vi' ? 'Danh mục sản phẩm' : 'Product Categories'}
                </a>
              </div>
            </nav>
          </div>
        </div>
      </noscript>

      {/* Main interactive content */}
      <HomeContent
        locale={locale}
        initialData={homepageData}
      />
    </>
  );
}