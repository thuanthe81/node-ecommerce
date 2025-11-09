'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { contentApi, Content } from '@/lib/content-api';
import { useLocale } from 'next-intl';

export default function PromotionalBanner() {
  const locale = useLocale();
  const [banners, setBanners] = useState<Content[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // Change banner every 5 seconds

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const data = await contentApi.getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const title = locale === 'vi' ? currentBanner.titleVi : currentBanner.titleEn;
  const content = locale === 'vi' ? currentBanner.contentVi : currentBanner.contentEn;

  const BannerContent = () => (
    <div className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      {currentBanner.imageUrl ? (
        <div className="relative h-64 md:h-96">
          <img
            src={currentBanner.imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center px-4">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">{title}</h2>
              <p className="text-lg md:text-xl mb-6">{content}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 md:py-20 px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{title}</h2>
          <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto">{content}</p>
        </div>
      )}

      {/* Navigation Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (currentBanner.linkUrl) {
    return (
      <Link href={currentBanner.linkUrl} className="block">
        <BannerContent />
      </Link>
    );
  }

  return <BannerContent />;
}
