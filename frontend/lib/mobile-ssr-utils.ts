/**
 * Mobile-specific SSR utilities for optimized mobile rendering
 * Provides mobile-optimized data fetching, responsive image handling, and mobile-specific structured data
 */

import { headers } from 'next/headers';

export interface MobileOptimizationConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenWidth?: number;
  userAgent: string;
}

export interface ResponsiveImageConfig {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  srcSet?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export interface MobileStructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Detect device type from user agent and headers (dynamic version)
 * This function makes the page dynamic and should only be used in server components that don't need static generation
 */
export async function detectDeviceType(): Promise<MobileOptimizationConfig> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  // Parse user agent for device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  // Determine device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile && !isTablet) {
    deviceType = 'mobile';
  } else if (isTablet) {
    deviceType = 'tablet';
  }

  // Try to extract screen width from client hints (if available)
  const viewportWidth = headersList.get('sec-ch-viewport-width');
  const screenWidth = viewportWidth ? parseInt(viewportWidth, 10) : undefined;

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    screenWidth,
    userAgent
  };
}

/**
 * Get default device configuration for static generation
 * This function doesn't use headers() and allows static generation
 */
export function getDefaultDeviceConfig(): MobileOptimizationConfig {
  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
    screenWidth: 1024,
    userAgent: 'static-generation'
  };
}

/**
 * Generate responsive image configuration for mobile optimization
 */
export function generateResponsiveImageConfig(
  baseImageUrl: string,
  alt: string,
  originalWidth: number,
  originalHeight: number,
  deviceConfig: MobileOptimizationConfig
): ResponsiveImageConfig {
  // Define breakpoints for responsive images
  const breakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    large: 1280
  };

  // Generate sizes attribute based on device type
  let sizes: string;
  if (deviceConfig.isMobile) {
    sizes = '(max-width: 640px) 100vw, 640px';
  } else if (deviceConfig.isTablet) {
    sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 768px';
  } else {
    sizes = '(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 1024px';
  }

  // Generate srcSet for different screen densities
  const srcSet = [
    `${baseImageUrl}?w=${breakpoints.mobile}&q=75 ${breakpoints.mobile}w`,
    `${baseImageUrl}?w=${breakpoints.tablet}&q=75 ${breakpoints.tablet}w`,
    `${baseImageUrl}?w=${breakpoints.desktop}&q=75 ${breakpoints.desktop}w`,
    `${baseImageUrl}?w=${breakpoints.large}&q=75 ${breakpoints.large}w`
  ].join(', ');

  // Determine optimal dimensions for the device
  let optimalWidth = originalWidth;
  let optimalHeight = originalHeight;

  if (deviceConfig.isMobile) {
    optimalWidth = Math.min(originalWidth, breakpoints.mobile);
    optimalHeight = Math.round((optimalHeight * optimalWidth) / originalWidth);
  } else if (deviceConfig.isTablet) {
    optimalWidth = Math.min(originalWidth, breakpoints.tablet);
    optimalHeight = Math.round((optimalHeight * optimalWidth) / originalWidth);
  }

  return {
    src: `${baseImageUrl}?w=${optimalWidth}&q=75`,
    alt,
    width: optimalWidth,
    height: optimalHeight,
    sizes,
    srcSet,
    loading: 'lazy', // Default to lazy loading for performance
    priority: false // Can be overridden for above-the-fold images
  };
}

/**
 * Generate mobile-optimized structured data
 */
export function generateMobileStructuredData(
  baseStructuredData: any,
  deviceConfig: MobileOptimizationConfig
): MobileStructuredData {
  const mobileOptimizedData = { ...baseStructuredData };

  // Add mobile-specific properties for products
  if (mobileOptimizedData['@type'] === 'Product') {
    // Add mobile-specific offer information
    if (mobileOptimizedData.offers) {
      mobileOptimizedData.offers = {
        ...mobileOptimizedData.offers,
        // Add mobile payment methods if available
        acceptedPaymentMethod: [
          'http://purl.org/goodrelations/v1#ByBankTransferInAdvance',
          'http://purl.org/goodrelations/v1#Cash',
          'http://purl.org/goodrelations/v1#PayPal'
        ]
      };
    }

    // Add mobile app information if available
    if (process.env.MOBILE_APP_URL) {
      mobileOptimizedData.potentialAction = {
        '@type': 'ViewAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: process.env.MOBILE_APP_URL,
          inLanguage: 'vi',
          actionPlatform: [
            'http://schema.org/AndroidPlatform',
            'http://schema.org/IOSPlatform'
          ]
        }
      };
    }
  }

  // Add mobile-specific organization data
  if (mobileOptimizedData['@type'] === 'Organization') {
    // Add mobile contact information
    mobileOptimizedData.contactPoint = {
      '@type': 'ContactPoint',
      telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
      contactType: 'customer service',
      availableLanguage: ['Vietnamese', 'English']
    };

    // Add mobile-friendly opening hours
    if (process.env.BUSINESS_HOURS) {
      mobileOptimizedData.openingHours = process.env.BUSINESS_HOURS;
    }
  }

  return mobileOptimizedData;
}

/**
 * Generate mobile-optimized viewport meta tags
 */
export function generateMobileViewportMeta(deviceConfig: MobileOptimizationConfig): Record<string, string> {
  const baseMeta = {
    'viewport': 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default'
  };

  // Add device-specific optimizations
  if (deviceConfig.isMobile) {
    return {
      ...baseMeta,
      'theme-color': '#ffffff',
      'apple-mobile-web-app-title': process.env.NEXT_PUBLIC_SITE_NAME || 'Handmade Store',
      'application-name': process.env.NEXT_PUBLIC_SITE_NAME || 'Handmade Store'
    };
  }

  return baseMeta;
}

/**
 * Optimize content for mobile rendering
 */
export function optimizeContentForMobile(
  content: string,
  deviceConfig: MobileOptimizationConfig
): string {
  if (!deviceConfig.isMobile) {
    return content;
  }

  // Mobile-specific content optimizations
  let optimizedContent = content;

  // Reduce content length for mobile if it's too long
  if (optimizedContent.length > 500) {
    // Find a good breaking point (end of sentence)
    const sentences = optimizedContent.split('. ');
    let truncatedContent = '';

    for (const sentence of sentences) {
      if ((truncatedContent + sentence + '. ').length <= 400) {
        truncatedContent += sentence + '. ';
      } else {
        break;
      }
    }

    if (truncatedContent.length > 0) {
      optimizedContent = truncatedContent.trim();
      if (!optimizedContent.endsWith('.')) {
        optimizedContent += '...';
      }
    }
  }

  return optimizedContent;
}

/**
 * Generate mobile-optimized CSS classes
 */
export function generateMobileCSSClasses(deviceConfig: MobileOptimizationConfig): string[] {
  const classes: string[] = [];

  if (deviceConfig.isMobile) {
    classes.push('mobile-optimized', 'touch-friendly');
  }

  if (deviceConfig.isTablet) {
    classes.push('tablet-optimized');
  }

  if (deviceConfig.isDesktop) {
    classes.push('desktop-optimized');
  }

  // Add screen width classes if available
  if (deviceConfig.screenWidth) {
    if (deviceConfig.screenWidth <= 480) {
      classes.push('small-mobile');
    } else if (deviceConfig.screenWidth <= 640) {
      classes.push('large-mobile');
    } else if (deviceConfig.screenWidth <= 768) {
      classes.push('small-tablet');
    } else if (deviceConfig.screenWidth <= 1024) {
      classes.push('large-tablet');
    }
  }

  return classes;
}

/**
 * Check if content should be lazy loaded based on device
 */
export function shouldLazyLoad(
  elementPosition: 'above-fold' | 'below-fold',
  deviceConfig: MobileOptimizationConfig
): boolean {
  // Always lazy load below-the-fold content
  if (elementPosition === 'below-fold') {
    return true;
  }

  // For above-the-fold content, consider device capabilities
  // Mobile devices might benefit from eager loading of critical content
  if (deviceConfig.isMobile && elementPosition === 'above-fold') {
    return false; // Eager load critical above-fold content on mobile
  }

  return true; // Default to lazy loading
}

/**
 * Generate mobile-optimized preload hints
 */
export function generateMobilePreloadHints(
  deviceConfig: MobileOptimizationConfig,
  criticalResources: string[]
): Array<{ rel: string; href: string; as?: string; type?: string }> {
  const preloadHints: Array<{ rel: string; href: string; as?: string; type?: string }> = [];

  // Add critical resource preloads
  criticalResources.forEach(resource => {
    if (resource.endsWith('.css')) {
      preloadHints.push({
        rel: 'preload',
        href: resource,
        as: 'style'
      });
    } else if (resource.endsWith('.js')) {
      preloadHints.push({
        rel: 'preload',
        href: resource,
        as: 'script'
      });
    } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
      // Only preload critical images on mobile to save bandwidth
      if (!deviceConfig.isMobile || criticalResources.indexOf(resource) < 2) {
        preloadHints.push({
          rel: 'preload',
          href: resource,
          as: 'image'
        });
      }
    }
  });

  // Add DNS prefetch for external domains
  const externalDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  externalDomains.forEach(domain => {
    preloadHints.push({
      rel: 'dns-prefetch',
      href: domain
    });
  });

  // Add preconnect for critical external resources
  if (!deviceConfig.isMobile) {
    // Only preconnect on non-mobile to avoid unnecessary connections
    preloadHints.push({
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    });
  }

  return preloadHints;
}

/**
 * Mobile-specific performance optimizations
 */
export interface MobilePerformanceConfig {
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
  enableResourceHints: boolean;
  enableContentOptimization: boolean;
  maxImageWidth: number;
  imageQuality: number;
}

export function getMobilePerformanceConfig(deviceConfig: MobileOptimizationConfig): MobilePerformanceConfig {
  return {
    enableImageOptimization: true,
    enableLazyLoading: true,
    enableResourceHints: !deviceConfig.isMobile, // Reduce resource hints on mobile
    enableContentOptimization: deviceConfig.isMobile,
    maxImageWidth: deviceConfig.isMobile ? 640 : deviceConfig.isTablet ? 768 : 1024,
    imageQuality: deviceConfig.isMobile ? 70 : 75 // Lower quality on mobile to save bandwidth
  };
}