'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/lib/product-api';
import { useLocale } from 'next-intl';
import { SvgAlertTriangle, SvgChevronLeft, SvgChevronRight } from '@/components/Svgs';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  locale?: string;
}

export default function ProductImageGallery({
  images,
  productName,
  locale: localeProp,
}: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const localeFromHook = useLocale();
  const locale = localeProp || localeFromHook;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Handle empty images case with placeholder
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const altText =
    locale === 'vi'
      ? currentImage.altTextVi || productName
      : currentImage.altTextEn || productName;

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
    setImageLoading(true);
    setImageError(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
    setImageLoading(true);
    setImageError(false);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setIsZoomed(false);
    setImageLoading(true);
    setImageError(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    // Only add listener if gallery is in viewport or focused
    if (galleryRef.current) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentIndex, images.length]);

  // Touch/swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  return (
    <div className="space-y-4" ref={galleryRef}>
      {/* Main Image */}
      <div className="relative">
        <div
          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in"
          onClick={() => setIsZoomed(!isZoomed)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <SvgAlertTriangle className="mx-auto h-12 w-12 mb-2" />
                <p>Failed to load image</p>
              </div>
            </div>
          ) : (
            <Image
              src={currentImage.url}
              alt={altText}
              fill
              className={`object-cover object-center transition-transform duration-200 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={{opacity: 1}}
              priority={currentIndex === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          )}
        </div>

        {/* Previous/Next Buttons - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
              aria-label="Previous image"
            >
              <SvgChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
              aria-label="Next image"
            >
              <SvgChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails - Only show if multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToImage(index)}
              className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                currentIndex === index
                  ? 'border-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={currentIndex === index}
            >
              <Image
                src={image.url}
                alt={
                  locale === 'vi'
                    ? image.altTextVi || productName
                    : image.altTextEn || productName
                }
                fill
                className="object-cover object-center"
                style={{opacity: 1}}
                sizes="(max-width: 1024px) 25vw, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}