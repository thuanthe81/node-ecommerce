'use client';

import { useState, memo, useCallback } from 'react';
import Image from 'next/image';

export interface CarouselItemData {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl?: string;
  title?: string;
}

export interface CarouselItemProps {
  item: CarouselItemData;
  index: number;
  totalItems: number;
  rotation: number;
  ringRadius: number;
  itemWidth: number;
  itemHeight: number;
  isFocused: boolean;
  onClick: () => void;
  transform: string;
  scale: number;
  opacity: number;
  zIndex: number;
}

// Separate memoized image component that never re-renders unless the image URL changes
const CarouselImage = memo(({
  imageUrl,
  alt,
  itemWidth,
  onError,
  onLoad
}: {
  imageUrl: string;
  alt: string;
  itemWidth: number;
  onError: () => void;
  onLoad: () => void;
}) => {
  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      style={{ objectFit: 'cover' }}
      sizes={`(max-width: 768px) 150px, (max-width: 1024px) 180px, ${itemWidth}px`}
      className="transition-transform duration-500 group-hover:scale-105"
      onError={onError}
      onLoad={onLoad}
      loading="eager"
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if the image URL or callbacks change
  // itemWidth changes won't trigger re-render since sizes are responsive
  return (
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.onError === nextProps.onError &&
    prevProps.onLoad === nextProps.onLoad
  );
});

CarouselImage.displayName = 'CarouselImage';

function CarouselItem({
  item,
  index,
  totalItems,
  rotation,
  ringRadius,
  itemWidth,
  itemHeight,
  isFocused,
  onClick,
  transform,
  scale,
  opacity,
  zIndex,
}: CarouselItemProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Memoize callbacks to prevent CarouselImage from re-rendering
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="carousel-item absolute"
      style={{
        transform,
        width: `${itemWidth}px`,
        height: `${itemHeight}px`,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
        zIndex,
      }}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${totalItems}: ${item.title || item.alt}`}
      aria-hidden={!isFocused}
    >
      <div
        className={`carousel-item-content relative w-full h-full cursor-pointer transition-all duration-300 ${
          isFocused
            ? 'ring-4 ring-blue-500 dark:ring-blue-400 ring-offset-4 ring-offset-white dark:ring-offset-gray-900'
            : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 hover:ring-offset-2'
        }`}
        style={{
          transform: `scale(${scale})`,
          opacity,
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={isFocused ? 0 : -1}
        role="button"
        aria-label={isFocused ? `View ${item.title || item.alt}` : undefined}
      >
        {/* Image or Placeholder */}
        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-600">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center px-4">
              Image unavailable
            </span>
          </div>
        ) : (
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 group">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-500 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
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
              </div>
            )}
            <CarouselImage
              imageUrl={item.imageUrl}
              alt={item.alt}
              itemWidth={itemWidth}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {/* Overlay for non-focused items */}
            {!isFocused && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent group-hover:from-black/20 group-hover:via-black/5 transition-all duration-300" />
            )}
            {/* Focused item indicator */}
            {isFocused && (
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-transparent pointer-events-none" />
            )}
            {/* Title overlay */}
            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-5 transition-all duration-300 group-hover:from-black/90">
                <h3 className={`text-white font-semibold truncate transition-all duration-300 ${
                  isFocused ? 'text-base sm:text-lg' : 'text-sm'
                }`}>
                  {item.title}
                </h3>
                {isFocused && (
                  <p className="text-white/80 text-xs mt-1 animate-fade-in">
                    Click to view details
                  </p>
                )}
              </div>
            )}
            {/* Hover effect border */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/20 dark:group-hover:border-white/10 transition-all duration-300 pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Only re-render when key props change
// Note: isFocused is intentionally included to update visual indicators
// but the Image component itself should not re-download due to stable props
export default memo(CarouselItem, (prevProps, nextProps) => {
  // Compare all props that affect rendering
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.transform === nextProps.transform &&
    prevProps.scale === nextProps.scale &&
    prevProps.opacity === nextProps.opacity &&
    prevProps.zIndex === nextProps.zIndex &&
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.itemWidth === nextProps.itemWidth &&
    prevProps.itemHeight === nextProps.itemHeight
  );
});