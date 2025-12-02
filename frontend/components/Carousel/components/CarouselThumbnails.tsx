/**
 * CarouselThumbnails Component
 * Thumbnail strip for quick navigation in the carousel
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CarouselThumbnailsProps } from '../types';

/**
 * CarouselThumbnails sub-component
 * Renders a grid of thumbnail images with visual indicators for the active thumbnail
 */
const CarouselThumbnails: React.FC<CarouselThumbnailsProps> = ({
  images,
  currentIndex,
  locale,
  onThumbnailClick,
}) => {
  const t = useTranslations('carousel');

  /**
   * Get alt text based on current locale
   */
  const getAltText = (image: typeof images[0]) => {
    return locale === 'vi' ? image.altTextVi : image.altTextEn;
  };

  // Don't render if there's only one image or no images
  if (images.length <= 1) {
    return null;
  }

  return (
    <div className="carousel-thumbnails mt-4 flex gap-2 overflow-x-auto">
      {images.map((image, index) => {
        const isActive = index === currentIndex;

        return (
          <button
            key={image.id}
            onClick={() => onThumbnailClick(index)}
            aria-current={isActive ? 'true' : 'false'}
            aria-label={`${t('thumbnailLabel')} ${index + 1}`}
            className={`carousel-thumbnail flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
              isActive
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <img
              src={image.url}
              alt={getAltText(image)}
              className="w-full h-full object-cover"
            />
          </button>
        );
      })}
    </div>
  );
};

export default CarouselThumbnails;
