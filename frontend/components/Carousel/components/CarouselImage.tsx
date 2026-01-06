/**
 * CarouselImage Component
 * Handles individual image display with loading and error states
 */

'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CarouselImageProps } from '../types';
import { SvgSpinner, SvgImagePlaceholder } from '../../Svgs';

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
            <SvgSpinner className="animate-spin h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">{tCommon('loading')}</span>
          </div>
        </div>
      )}

      {/* Error placeholder */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center space-y-2 text-center px-4">
            <SvgImagePlaceholder className="h-12 w-12 text-gray-400" />
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
        className={`w-full h-full object-contain object-center bg-black`}
        style={{opacity: 1}}
        onLoad={handleLoad}
        onError={handleError}
        loading={isActive ? 'eager' : 'lazy'}
      />
    </div>
  );
};

export default CarouselImage;