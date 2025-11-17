'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { ShopInfo } from '@/app/constants';
import { Carousel2D, CarouselItem } from '@/components/Carousel';
import { productApi, Product } from '@/lib/product-api';
import { contentApi, Content } from '@/lib/content-api';

export default function HomeContent() {
  const t = useTranslations('common');
  const { user } = useAuth();

  // State for carousel data
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(true);
  const [carouselError, setCarouselError] = useState<string | null>(null);

  // Fetch featured products or banner content for carousel
  useEffect(() => {
    const fetchCarouselData = async () => {
      setIsLoadingCarousel(true);
      setCarouselError(null);

      try {
        // Try to fetch featured products first
        const productsResponse = await productApi.getProducts({
          isFeatured: true,
          limit: 8,
          inStock: true,
        });

        if (productsResponse.data && productsResponse.data.length >= 3) {
          // Transform products to carousel items
          const items: CarouselItem[] = productsResponse.data.map((product: Product) => ({
            id: product.id,
            imageUrl: product.images?.[0]?.url || '/placeholder-product.jpg',
            alt: product.images?.[0]?.altTextEn || product.nameEn,
            linkUrl: `/products/${product.slug}`,
            title: product.nameEn,
          }));

          setCarouselItems(items);
        } else {
          // Fallback to banner content if not enough featured products
          const banners = await contentApi.getBanners();
          const publishedBanners = banners.filter((banner: Content) => banner.isPublished);

          if (publishedBanners.length >= 3) {
            const items: CarouselItem[] = publishedBanners
              .sort((a: Content, b: Content) => a.displayOrder - b.displayOrder)
              .slice(0, 12) // Maximum 12 items
              .map((banner: Content) => ({
                id: banner.id,
                imageUrl: banner.imageUrl || '/placeholder-banner.jpg',
                alt: banner.titleEn,
                linkUrl: banner.linkUrl || `/pages/${banner.slug}`,
                title: banner.titleEn,
              }));

            setCarouselItems(items);
          } else {
            // Not enough items for carousel
            setCarouselError('Not enough items to display carousel');
          }
        }
      } catch (error) {
        console.error('Error fetching carousel data:', error);
        setCarouselError('Failed to load carousel content');
      } finally {
        setIsLoadingCarousel(false);
      }
    };

    fetchCarouselData();
  }, []);

  return (
    <div className="flex flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      {/* Carousel Section */}
      {!isLoadingCarousel && !carouselError && carouselItems.length >= 3 && (
        <section className="w-full pb-12 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-black">
          <div>
            <Carousel2D
              items={carouselItems}
              autoRotate={true}
              autoRotateInterval={5000}
              showControls={true}
              showIndicators={true}
              className="mb-4"
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

      {/* Main Content Section */}
      <main className="flex w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start mb-[24px]">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {t('home')} - {ShopInfo.name}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Welcome to our handmade products store. Browse our unique collection of artisan crafted
            items.
          </p>
          {/*{isAuthenticated && (*/}
          {/*  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">*/}
          {/*    <p className="text-sm text-green-800 dark:text-green-200">*/}
          {/*      {t('loggedInAs')} {user?.email}*/}
          {/*    </p>*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row mt-[48px]">
          {/*<Link*/}
          {/*  href="/login"*/}
          {/*  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"*/}
          {/*>*/}
          {/*  {t('login').toLocaleUpperCase()}*/}
          {/*</Link>*/}
          {user
            ? <Link
              href="/products"
              className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.4] px-5 transition-colors hover:border-transparent hover:bg-black/[.1] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            >
              {t('shopping').toLocaleUpperCase()}
            </Link>
            : <Link
              href="/register"
              className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.4] px-5 transition-colors hover:border-transparent hover:bg-black/[.1] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            >
              {t('signup').toLocaleUpperCase()}
            </Link>
          }
        </div>
      </main>
    </div>
  );
}