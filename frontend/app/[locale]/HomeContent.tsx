'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { ShopInfo } from '@/app/constants';
import { Carousel, CarouselImage } from '@/components/Carousel';
import { productApi, Product } from '@/lib/product-api';
import { contentApi, Content } from '@/lib/content-api';
import ContentSection from '@/components/ContentSection';

interface HomepageData {
  featuredProducts: any[];
  promotionalBanners: any[];
  homepageSections: any[];
  categories: any[];
}

interface HomeContentProps {
  locale: string;
  initialData: HomepageData;
}

export default function HomeContent({ locale, initialData }: HomeContentProps) {
  const t = useTranslations('common');
  const { user } = useAuth();

  // State for carousel data - use server-side data as initial state
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(false);
  const [carouselError, setCarouselError] = useState<string | null>(null);

  // State for homepage sections - use server-side data as initial state
  const [homepageSections, setHomepageSections] = useState<Content[]>(initialData.homepageSections);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  // Process server-side data for carousel on component mount
  useEffect(() => {
    const processCarouselData = () => {
      try {
        // Try featured products first
        if (initialData.featuredProducts && initialData.featuredProducts.length >= 3) {
          const images: CarouselImage[] = initialData.featuredProducts.map((product: any) => ({
            id: product.id,
            url: product.images?.[0]?.url || '/placeholder-product.jpg',
            altTextEn: product.images?.[0]?.altTextEn || product.nameEn,
            altTextVi: product.images?.[0]?.altTextVi || product.nameVi || product.nameEn,
          }));
          setCarouselImages(images);
        } else if (initialData.promotionalBanners && initialData.promotionalBanners.length >= 3) {
          // Fallback to banners
          const publishedBanners = initialData.promotionalBanners.filter((banner: any) => banner.isPublished);

          if (publishedBanners.length >= 3) {
            const images: CarouselImage[] = publishedBanners
              .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
              .slice(0, 12)
              .map((banner: any) => ({
                id: banner.id,
                url: banner.imageUrl || '/placeholder-banner.jpg',
                altTextEn: banner.titleEn,
                altTextVi: banner.titleVi || banner.titleEn,
              }));
            setCarouselImages(images);
          } else {
            setCarouselError('Not enough items to display carousel');
          }
        } else {
          setCarouselError('Not enough items to display carousel');
        }
      } catch (error) {
        console.error('Error processing carousel data:', error);
        setCarouselError('Failed to process carousel content');
      }
    };

    processCarouselData();
  }, [initialData]);

  return (
    <div className="flex flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      {/* Carousel Section */}
      {!isLoadingCarousel && !carouselError && carouselImages.length >= 3 && (
        <section className="w-full pb-12 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-black">
          <div className="w-full">
            <Carousel
              images={carouselImages}
              autoAdvance={true}
              aspectRatio="wide"
              className="mb-4"
              ariaLabel="Featured products and promotions"
            />
          </div>
        </section>
      )}

      {/* Loading state for carousel */}
      {isLoadingCarousel && (
        <section className="w-full py-12 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-black">
          <div className="px-4">
            <div className="flex items-center justify-center" style={{ height: '450px' }}>
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mb-4"></div>
                <p className="text-zinc-600 dark:text-zinc-400">Loading featured items...</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error state for carousel (silent - just don't show carousel) */}
      {/* We don't show error to users, just log it and continue with the rest of the page */}

      {/* Homepage Content Sections - Loading State */}
      {isLoadingSections && (
        <div className="w-full py-16 px-4">
          <div className="max-w-7xl mx-auto space-y-16">
            {/* Skeleton loader for sections */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="w-full md:w-1/2 bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square md:aspect-[4/3]"></div>
                  <div className="w-full md:w-1/2 space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-32 mt-6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Homepage Content Sections - Error State */}
      {!isLoadingSections && sectionsError && (
        <div className="w-full py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-red-600 dark:text-red-400">
              {sectionsError}
            </p>
          </div>
        </div>
      )}

      {/* Homepage Content Sections - Success State */}
      {!isLoadingSections && !sectionsError && homepageSections.length > 0 && (
        <div className="w-full">
          {homepageSections.map((section, index) => {
            const isVietnamese = locale === 'vi';
            return (
              <ContentSection
                key={section.id}
                layout={section.layout || 'centered'}
                title={isVietnamese ? section.titleVi : section.titleEn}
                description={isVietnamese ? section.contentVi : section.contentEn}
                buttonText={isVietnamese ? (section.buttonTextVi || 'Tìm hiểu thêm') : (section.buttonTextEn || 'Learn More')}
                buttonUrl={section.linkUrl || '#'}
                imageUrl={section.imageUrl}
                imageAlt={isVietnamese ? section.titleVi : section.titleEn}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}