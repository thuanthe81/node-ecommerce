/**
 * CarouselControls Component
 * Navigation buttons for the carousel (previous/next)
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CarouselControlsProps } from '../types';
import { SvgChevronLeft, SvgChevronRight } from '../../Svgs';

/**
 * CarouselControls sub-component
 * Renders previous and next navigation buttons with proper ARIA labels
 */
const CarouselControls: React.FC<CarouselControlsProps> = ({
  onPrevious,
  onNext,
  isVisible,
  disabled,
}) => {
  const t = useTranslations('carousel');

  return (
    <div
      className={`carousel-controls absolute inset-0 flex items-center justify-between px-4 pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Previous button */}
      <button
        onClick={onPrevious}
        disabled={disabled}
        aria-label={t('previousButton')}
        className="carousel-control-prev pointer-events-auto bg-white/80 hover:bg-white rounded-full p-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <SvgChevronLeft className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={disabled}
        aria-label={t('nextButton')}
        className="carousel-control-next pointer-events-auto bg-white/80 hover:bg-white rounded-full p-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <SvgChevronRight className="w-6 h-6" aria-hidden="true" />
      </button>
    </div>
  );
};

export default CarouselControls;
