'use client';

import { useState, useCallback } from 'react';
import { ProductImage } from '@/lib/product-api';
import { useLocale } from 'next-intl';
import { Carousel } from '@/components/Carousel/index';
import type { CarouselImage } from '@/components/Carousel/types';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  locale?: string;
  // Auto-advance configuration
  autoAdvance?: boolean;
  autoAdvanceInterval?: number;
  transitionDuration?: number;
}

export default function ProductImageGallery({
  images,
  productName,
  locale: localeProp,
  autoAdvance: autoAdvanceProp = true,
  autoAdvanceInterval,
  transitionDuration,
}: ProductImageGalleryProps) {
  const localeFromHook = useLocale();
  const locale = localeProp || localeFromHook;

  // Product-specific state: zoom functionality
  const [isZoomed, setIsZoomed] = useState(false);

  // Handle empty images case with placeholder
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  // Transform ProductImage[] to CarouselImage[]
  const carouselImages: CarouselImage[] = images.map((img) => ({
    id: img.id,
    url: img.url,
    altTextEn: img.altTextEn || productName,
    altTextVi: img.altTextVi || productName,
  }));

  // Handle image change from carousel - reset zoom when image changes
  const handleImageChange = useCallback(() => {
    setIsZoomed(false);
  }, []);

  // Handle zoom toggle
  const handleZoomToggle = useCallback((e: React.MouseEvent) => {
    // Only toggle zoom if clicking on the main image area (not controls or thumbnails)
    const target = e.target as HTMLElement;
    const isCarouselMain = target.closest('.carousel-main');
    const isControl = target.closest('button');

    if (isCarouselMain && !isControl) {
      setIsZoomed((prev) => !prev);
    }
  }, []);

  return (
    <div className="product-image-gallery">
      {/* Wrapper with click handler for zoom */}
      <div onClick={handleZoomToggle}>
        {/* Apply zoom transform to carousel */}
        <div
          className={`transition-transform duration-200 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
          }`}
          style={{
            transformOrigin: 'center center',
          }}
        >
          <Carousel
            images={carouselImages}
            showThumbnails={images.length > 1}
            showControls={true}
            autoAdvance={autoAdvanceProp}
            autoAdvanceInterval={autoAdvanceInterval}
            transitionDuration={transitionDuration}
            aspectRatio="square"
            ariaLabel={`${productName} image gallery`}
            onImageChange={handleImageChange}
          />
        </div>
      </div>
    </div>
  );
}