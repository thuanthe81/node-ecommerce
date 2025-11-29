/**
 * Hook for responsive carousel configuration
 */

import { useState, useEffect } from 'react';
import { ResponsiveConfig } from '../types';
import { RESPONSIVE_CONFIG } from '../constants';

/**
 * Custom hook that returns responsive configuration based on screen size
 * Adjusts ring radius, item dimensions, and other settings for mobile/tablet/desktop
 * Listens to window resize events and updates configuration accordingly
 *
 * @returns Responsive configuration object
 *
 * @example
 * ```typescript
 * function Carousel() {
 *   const config = useResponsiveConfig();
 *
 *   return (
 *     <div style={{ perspective: config.perspective }}>
 *       <CarouselRing radius={config.ringRadius} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useResponsiveConfig(): ResponsiveConfig {
  const [config, setConfig] = useState<ResponsiveConfig>(RESPONSIVE_CONFIG.desktop);

  useEffect(() => {
    // Function to update config based on window width
    const updateConfig = () => {
      const width = window.innerWidth;

      if (width < 768) {
        // Mobile breakpoint
        setConfig(RESPONSIVE_CONFIG.mobile);
      } else if (width < 1024) {
        // Tablet breakpoint
        setConfig(RESPONSIVE_CONFIG.tablet);
      } else {
        // Desktop breakpoint
        setConfig(RESPONSIVE_CONFIG.desktop);
      }
    };

    // Set initial config
    updateConfig();

    // Add resize listener
    window.addEventListener('resize', updateConfig);

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
}
