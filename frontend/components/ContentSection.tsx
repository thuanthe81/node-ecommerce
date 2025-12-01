'use client';

import Link from 'next/link';
import Image from 'next/image';

export interface ContentSectionProps {
  layout: 'centered' | 'image-left' | 'image-right';
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl?: string;
  imageAlt?: string;
  priority?: boolean;
}

function SectionCenter({
  title,
  description,
  buttonText,
  buttonUrl,
}: ContentSectionProps) {
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

function SectionLeft({
  title,
  description,
  buttonText,
  buttonUrl,
  imageUrl,
  imageAlt,
  priority = false,
}: ContentSectionProps) {
  return (
    <section className="w-full bg-white">
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Image - left side on desktop, top on mobile */}
        <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-[400px] overflow-hidden bg-gray-200">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              style={{ objectFit: 'cover', opacity: 1 }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
              loading="eager"
              unoptimized
            />
          )}
        </div>

        {/* Content - right side on desktop, bottom on mobile */}
        <div className="w-full md:w-1/2 flex items-center">
          <div className="p-8 sm:p-12 md:p-16 lg:p-20">
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

function SectionRight({
  title,
  description,
  buttonText,
  buttonUrl,
  imageUrl,
  imageAlt,
  priority = false,
}: ContentSectionProps) {
  return (
    <section className="w-full bg-gray-50">
      <div className="flex flex-col md:flex-row-reverse items-stretch">
        {/* Image - right side on desktop, top on mobile */}
        <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-[400px] overflow-hidden bg-gray-200">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              style={{ objectFit: 'cover', opacity: 1 }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={priority}
              unoptimized
            />
          )}
        </div>

        {/* Content - left side on desktop, bottom on mobile */}
        <div className="w-full md:w-1/2 flex items-center">
          <div className="p-8 sm:p-12 md:p-16 lg:p-20">
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

export default function ContentSection(props: ContentSectionProps) {

  switch (props.layout) {
    case 'centered':
      return <SectionCenter {...props} />;
    case 'image-left':
      return <SectionLeft {...props} />;
    case 'image-right':
      return <SectionRight {...props} />;
    default:
  }
  return null;
}