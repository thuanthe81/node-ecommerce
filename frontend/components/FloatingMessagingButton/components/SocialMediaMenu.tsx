/**
 * SocialMediaMenu Component
 * Displays social media messaging links in a curved arc layout
 */

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  SvgFacebook,
  SvgTikTok,
  SvgZalo,
  SvgWhatsApp,
} from '@/components/Svgs';
import { SocialMediaMenuProps, SocialMediaPlatform } from '../types';
import { calculateArcPosition } from '../utils/animations';

/**
 * SocialMediaMenu - Popup menu with social media links
 * Displays icons in a curved arc layout with staggered animations
 *
 * @param {SocialMediaMenuProps} props - Component props
 * @returns Rendered social media menu or null if not open
 */
export function SocialMediaMenu({
  isOpen,
  socialMediaUrls,
  onClose,
}: SocialMediaMenuProps) {
  const t = useTranslations('messaging');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Track window size for responsive positioning
  useEffect(() => {
    // Set initial size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Update on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mark as animated when menu opens
  useEffect(() => {
    if (isOpen && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isOpen, hasAnimated]);

  /**
   * Platform configuration with icons and colors
   * Filters out platforms without configured URLs
   */
  const platforms = useMemo<SocialMediaPlatform[]>(() => {
    const allPlatforms: SocialMediaPlatform[] = [
      {
        id: 'facebook',
        name: 'Facebook',
        url: socialMediaUrls.facebook || null,
        color: '#1877F2',
        translationKey: 'contactViaFacebook',
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        url: socialMediaUrls.tiktok || null,
        color: '#000000',
        translationKey: 'contactViaTikTok',
      },
      {
        id: 'zalo',
        name: 'Zalo',
        url: socialMediaUrls.zalo || null,
        color: '#0068FF',
        translationKey: 'contactViaZalo',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        url: socialMediaUrls.whatsapp || null,
        color: '#25D366',
        translationKey: 'contactViaWhatsApp',
      },
    ];

    // Filter to only include platforms with configured URLs
    return allPlatforms.filter(
      (platform) => platform.url && platform.url.trim() !== ''
    );
  }, [socialMediaUrls]);

  /**
   * Calculate positions for each platform icon in the arc
   * Recalculates when window size changes for responsive positioning
   */
  const positions = useMemo(() => {
    return platforms.map((_, index) =>
      calculateArcPosition(index, platforms.length)
    );
  }, [platforms.length, windowSize.width, windowSize.height]);

  /**
   * Get the appropriate SVG icon component for a platform
   */
  const getIcon = (platformId: string) => {
    switch (platformId) {
      case 'facebook':
        return SvgFacebook;
      case 'tiktok':
        return SvgTikTok;
      case 'zalo':
        return SvgZalo;
      case 'whatsapp':
        return SvgWhatsApp;
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        absolute pointer-events-none
        bottom-16 right-16
        transition-opacity duration-200
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      role="menu"
      aria-label={t('openMessaging')}
    >
      {/* Social media icons in arc layout */}
      {platforms.map((platform, index) => {
        const position = positions[index];
        const IconComponent = getIcon(platform.id);

        if (!IconComponent) return null;

        return (
          <a
            key={platform.id}
            href={platform.url!}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            aria-label={t(platform.translationKey as any)}
            className={`
              absolute
              w-12 h-12
              bg-white
              rounded-full
              shadow-lg hover:shadow-xl
              flex items-center justify-center
              transition-all duration-150 ease-in-out
              hover:scale-110
              focus:outline-none focus:ring-4 focus:ring-blue-300
              min-w-[44px] min-h-[44px]
              touch-manipulation
              active:scale-95
              pointer-events-auto
              max-sm:w-11 max-sm:h-11
              max-[374px]:w-10 max-[374px]:h-10
              ${!hasAnimated && isOpen ? 'animate-fade-in' : ''}
            `}
            style={{
              // Position using calculated x and y offsets
              transform: `translate(${position.x}px, ${position.y}px)`,
              // Staggered animation delay (only on first open)
              animationDelay: !hasAnimated && isOpen ? `${position.delay}ms` : '0ms',
              // Hover color based on platform brand
              ['--hover-color' as any]: platform.color,
              // Ensure proper touch target spacing
              WebkitTapHighlightColor: 'rgba(37, 99, 235, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'gray';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = platform.color;
            }}
            onTouchStart={(e) => {
              // Add touch feedback
              e.currentTarget.style.backgroundColor = platform.color;
              e.currentTarget.style.color = '#ffffff';
            }}
            onTouchEnd={(e) => {
              // Reset after touch
              setTimeout(() => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = platform.color;
              }, 150);
            }}
          >
            <IconComponent
              className="
                w-6 h-6
                transition-colors duration-150
                max-sm:w-5 max-sm:h-5
                max-[374px]:w-4 max-[374px]:h-4
              "
              style={{ color: platform.color }}
              aria-hidden="true"
            />
          </a>
        );
      })}
    </div>
  );
}