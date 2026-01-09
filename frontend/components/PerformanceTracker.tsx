'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initCoreWebVitalsTracking } from '@/lib/performance-monitoring';

/**
 * Client-side performance tracking component
 * Tracks Core Web Vitals and sends metrics to the performance API
 */
export default function PerformanceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Core Web Vitals tracking
    initCoreWebVitalsTracking();

    // Track page navigation
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    // Track page load completion
    const handleLoad = () => {
      const loadTime = Date.now() - startTime;

      // Send page load metrics to API
      fetch('/sitemap-api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'page-load',
          path: pathname,
          requestId,
          metrics: {
            duration: loadTime,
            cacheHit: false, // Will be determined server-side
            errorCount: 0
          }
        })
      }).catch(console.error);
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Track page visibility changes for performance analysis
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden, good time to send any pending metrics
        navigator.sendBeacon('/sitemap-api/performance', JSON.stringify({
          type: 'page-visibility',
          path: pathname,
          timestamp: Date.now()
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  // Track route changes
  useEffect(() => {
    const startTime = Date.now();

    // Track route change completion
    const timer = setTimeout(() => {
      const routeChangeTime = Date.now() - startTime;

      fetch('/sitemap-api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'route-change',
          path: pathname,
          metrics: {
            duration: routeChangeTime
          }
        })
      }).catch(console.error);
    }, 100); // Small delay to ensure route change is complete

    return () => clearTimeout(timer);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to track API call performance
 */
export function useAPIPerformanceTracking() {
  return {
    trackAPICall: async (url: string, options: RequestInit = {}) => {
      const startTime = Date.now();
      const requestId = crypto.randomUUID();

      try {
        const response = await fetch(url, options);
        const duration = Date.now() - startTime;

        // Track successful API call
        fetch('/sitemap-api/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'api-call',
            path: url,
            requestId,
            metrics: {
              duration,
              status: response.status,
              success: response.ok
            }
          })
        }).catch(console.error);

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Track failed API call
        fetch('/sitemap-api/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'api-call',
            path: url,
            requestId,
            metrics: {
              duration,
              error: error instanceof Error ? error.message : 'Unknown error',
              success: false
            }
          })
        }).catch(console.error);

        throw error;
      }
    }
  };
}