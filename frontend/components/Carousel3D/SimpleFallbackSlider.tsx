'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface CarouselItem {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl?: string;
  title?: string;
}

interface SimpleFallbackSliderProps {
  items: CarouselItem[];
  itemWidth?: number;
  itemHeight?: number;
  autoSlide?: boolean;
  autoSlideInterval?: number;
  fullWidth?: boolean;
}

/**
 * Simple 2D slider fallback for when there are insufficient items for 3D carousel
 * Used when items.length < 3
 * Supports full-width layout and auto-slide functionality
 */
export default function SimpleFallbackSlider({
  items,
  itemWidth = 300,
  itemHeight = 600,
  autoSlide = true,
  autoSlideInterval = 3000,
  fullWidth = true,
}: SimpleFallbackSliderProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
      setIsTransitioning(false);
    }, 300); // Half of the transition duration
    setIsPaused(true); // Pause auto-slide on manual navigation
  }, [items.length, isTransitioning]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
      setIsTransitioning(false);
    }, 300); // Half of the transition duration
    setIsPaused(true); // Pause auto-slide on manual navigation
  }, [items.length, isTransitioning]);

  const handleImageError = (itemId: string) => {
    setImageError((prev) => new Set(prev).add(itemId));
  };

  // Auto-slide effect
  useEffect(() => {
    if (!autoSlide || isPaused || isHovered || items.length <= 1 || isTransitioning) {
      return;
    }

    const intervalId = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
        setIsTransitioning(false);
      }, 300); // Half of the transition duration
    }, autoSlideInterval);

    return () => clearInterval(intervalId);
  }, [autoSlide, isPaused, isHovered, items.length, autoSlideInterval, isTransitioning]);

  // Resume auto-slide after manual interaction timeout
  useEffect(() => {
    if (!isPaused || !autoSlide) return;

    const timeoutId = setTimeout(() => {
      setIsPaused(false);
    }, 3000); // Resume after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [isPaused, autoSlide]);

  if (items.length === 0) {
    return (
      <div className="simple-slider-empty w-full py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"
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
            <p className="text-gray-600 dark:text-gray-400">
              No items to display
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div
      className="simple-fallback-slider relative w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      role="region"
      aria-label="Featured items slider"
      aria-roledescription="slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Auto-slide play/pause control */}
      {/*{autoSlide && items.length > 1 && (*/}
      {/*  <button*/}
      {/*    onClick={handleToggleAutoSlide}*/}
      {/*    className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"*/}
      {/*    aria-label={isPaused ? 'Play auto-slide' : 'Pause auto-slide'}*/}
      {/*    title={isPaused ? 'Play auto-slide' : 'Pause auto-slide'}*/}
      {/*  >*/}
      {/*    {isPaused ? (*/}
      {/*      <svg*/}
      {/*        className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"*/}
      {/*        fill="currentColor"*/}
      {/*        viewBox="0 0 20 20"*/}
      {/*        xmlns="http://www.w3.org/2000/svg"*/}
      {/*        aria-hidden="true"*/}
      {/*      >*/}
      {/*        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />*/}
      {/*      </svg>*/}
      {/*    ) : (*/}
      {/*      <svg*/}
      {/*        className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"*/}
      {/*        fill="currentColor"*/}
      {/*        viewBox="0 0 20 20"*/}
      {/*        xmlns="http://www.w3.org/2000/svg"*/}
      {/*        aria-hidden="true"*/}
      {/*      >*/}
      {/*        <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />*/}
      {/*      </svg>*/}
      {/*    )}*/}
      {/*  </button>*/}
      {/*)}*/}

      <div className={fullWidth ? 'w-full' : 'max-w-2xl mx-auto px-4'}>
        <div
          className="relative mx-auto"
          style={
            fullWidth
              ? {
                  width: '100%',
                  height: `${Math.min(itemHeight, 600)}px`,
                  maxHeight: '70vh',
                }
              : {
                  width: `${Math.min(itemWidth, 400)}px`,
                  height: `${Math.min(itemHeight, 500)}px`,
                }
          }
        >
          {/* Current Item */}
          <div
            className={`relative w-full h-full overflow-hidden transition-all duration-300 hover:shadow-3xl group ${
              fullWidth ? 'rounded-none' : 'rounded-xl'
            }`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${currentIndex + 1} of ${items.length}: ${currentItem.title || currentItem.alt}`}
            onClick={()=> currentItem.linkUrl && router.push(currentItem.linkUrl)}
            style={{
              animation: isTransitioning ? 'fadeOutLeft 0.6s ease-in-out' : 'fadeInRight 0.6s ease-in-out',
            }}
          >
            {imageError.has(currentItem.id) ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-300 dark:border-gray-600">
                <svg
                  className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-4"
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
                <span className="text-base font-medium text-gray-600 dark:text-gray-400">
                  Image unavailable
                </span>
              </div>
            ) : (
              <>
                <Image
                  src={currentItem.imageUrl}
                  alt={currentItem.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover transition-transform duration-500"
                  onError={() => handleImageError(currentItem.id)}
                  priority
                />
                {currentItem.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 transition-all duration-300 group-hover:from-black/90">
                    <h3 className="text-white text-lg font-semibold">
                      {currentItem.title}
                    </h3>
                  </div>
                )}
                {/* Hover effect border */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/20 dark:group-hover:border-white/10 transition-all duration-300 pointer-events-none" />
              </>
            )}
          </div>

          {/* CSS Animations */}
          <style jsx>{`
            @keyframes fadeInRight {
              0% {
                opacity: 0;
                transform: translateX(100px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
              }
            }

            @keyframes fadeOutLeft {
              0% {
                opacity: 1;
                transform: translateX(0);
              }
              100% {
                opacity: 0;
                transform: translateX(-100px);
              }
            }
          `}</style>

          {/* Navigation Buttons */}
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className={`absolute ${
                  fullWidth ? 'left-4' : 'left-0 -translate-x-12 md:-translate-x-16'
                } top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full p-3 shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 backdrop-blur-sm border border-gray-200 dark:border-gray-700 group z-10 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                aria-label="Previous item"
              >
                <svg
                  className="w-6 h-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={handleNext}
                className={`absolute ${
                  fullWidth ? 'right-4' : 'right-0 translate-x-12 md:translate-x-16'
                } top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full p-3 shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 backdrop-blur-sm border border-gray-200 dark:border-gray-700 group z-10 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                aria-label="Next item"
              >
                <svg
                  className="w-6 h-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Indicators */}
        {/*{items.length > 1 && (*/}
        {/*  <div className="flex justify-center gap-2.5 mt-6 bg-black/30 dark:bg-black/50 backdrop-blur-md rounded-full px-5 py-3 shadow-lg border border-white/10 w-fit mx-auto">*/}
        {/*    {items.map((item, index) => (*/}
        {/*      <button*/}
        {/*        key={item.id}*/}
        {/*        onClick={() => setCurrentIndex(index)}*/}
        {/*        className={`rounded-full transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black/30 ${*/}
        {/*          index === currentIndex*/}
        {/*            ? 'w-10 h-3 bg-white dark:bg-blue-400 shadow-md shadow-white/50'*/}
        {/*            : 'w-3 h-3 bg-white/60 dark:bg-white/50 hover:bg-white/90 dark:hover:bg-white/80'*/}
        {/*        }`}*/}
        {/*        aria-label={`Go to item ${index + 1}`}*/}
        {/*        aria-current={index === currentIndex ? 'true' : 'false'}*/}
        {/*      />*/}
        {/*    ))}*/}
        {/*  </div>*/}
        {/*)}*/}

        {/* Item counter */}
        {/*<div className="text-center mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">*/}
        {/*  {currentIndex + 1} / {items.length}*/}
        {/*</div>*/}
      </div>
    </div>
  );
}