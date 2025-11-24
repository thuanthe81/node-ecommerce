'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface ContentSectionProps {
  layout: 'centered' | 'image-left' | 'image-right';
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl?: string;
  imageAlt?: string;
}

export default function ContentSection({
  layout,
  title,
  description,
  buttonText,
  buttonUrl,
  imageUrl,
  imageAlt,
}: ContentSectionProps) {
  // Centered layout - no image, centered text
  if (layout === 'centered') {
    return (
      <section className="w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            {title}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
          <Link
            href={buttonUrl}
            className="inline-block bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors touch-manipulation text-sm sm:text-base"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {buttonText}
          </Link>
        </div>
      </section>
    );
  }

  // Image-left layout - image on left, content on right with left-aligned text
  if (layout === 'image-left') {
    return (
      <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {/* Image - left side on desktop, top on mobile */}
            <div className="w-full md:w-1/2">
              <div className="relative aspect-square sm:aspect-[4/3] md:aspect-[4/3] overflow-hidden rounded-lg shadow-md">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={imageAlt || title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                    quality={85}
                    priority={false}
                  />
                )}
              </div>
            </div>

            {/* Content - right side on desktop, bottom on mobile */}
            <div className="w-full md:w-1/2 text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                {title}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                {description}
              </p>
              <Link
                href={buttonUrl}
                className="inline-block bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors touch-manipulation text-sm sm:text-base"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Image-right layout - content on left with right-aligned text, image on right
  if (layout === 'image-right') {
    return (
      <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row-reverse items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {/* Image - right side on desktop, top on mobile */}
            <div className="w-full md:w-1/2">
              <div className="relative aspect-square sm:aspect-[4/3] md:aspect-[4/3] overflow-hidden rounded-lg shadow-md">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={imageAlt || title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                    quality={85}
                    priority={false}
                  />
                )}
              </div>
            </div>

            {/* Content - left side on desktop, bottom on mobile */}
            <div className="w-full md:w-1/2 text-left md:text-right">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                {title}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                {description}
              </p>
              <Link
                href={buttonUrl}
                className="inline-block bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors touch-manipulation text-sm sm:text-base"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback - should never reach here
  return null;
}
