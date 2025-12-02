/**
 * CarouselImage Component
 * Handles individual image display with loading and error states
 */

'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CarouselImageProps } from '../types';

/**
 * CarouselImage sub-component
 * Renders an individual carousel image with loading spinner and error handling
 */
const CarouselImage: React.FC<CarouselImageProps> = ({
  image,
  locale,
  isActive,
  isAnimating: _isAnimating,
  animationDirection: _animationDirection,
  position,
  onLoad,
  onError,
}) => {
  const tCommon = useTranslations('common');
  const tCarousel = useTranslations('carousel');
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Get alt text based on locale
  const altText = locale === 'vi' ? image.altTextVi : image.altTextEn;

  // Handle successful image load
  const handleLoad = () => {
    setImageState('loaded');
    onLoad();
  };

  // Handle image load error
  const handleError = () => {
    setImageState('error');
    onError();
  };

  return (
    <div className="carousel-slide content-center absolute inset-0 w-full h-full">
      {/* Loading spinner */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center space-y-2">
            <svg
              className="animate-spin h-8 w-8 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-gray-500">{tCommon('loading')}</span>
          </div>
        </div>
      )}

      {/* Error placeholder */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center space-y-2 text-center px-4">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-gray-500">
              {tCarousel('imageLoadError')}
            </span>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={image.url}
        alt={altText}
        className={`w-full h-full object-contain object-center`}
        style={{opacity: 1}}
        onLoad={handleLoad}
        onError={handleError}
        loading={isActive ? 'eager' : 'lazy'}
      />
    </div>
  );
};

export default CarouselImage;