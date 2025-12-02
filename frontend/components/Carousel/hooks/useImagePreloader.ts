import { useState, useCallback } from 'react';

/**
 * Return type for useImagePreloader hook
 */
export interface UseImagePreloaderReturn {
  /**
   * Set of URLs for images that have been successfully loaded
   */
  loadedImages: Set<string>;

  /**
   * Set of URLs for images that failed to load
   */
  failedImages: Set<string>;

  /**
   * Preload an image and return a promise that resolves when loaded or rejects on error
   */
  preloadImage: (url: string) => Promise<void>;

  /**
   * Mark an image as loaded
   */
  markAsLoaded: (url: string) => void;

  /**
   * Mark an image as failed
   */
  markAsFailed: (url: string) => void;

  /**
   * Check if an image is loaded
   */
  isLoaded: (url: string) => boolean;

  /**
   * Check if an image has failed to load
   */
  hasFailed: (url: string) => boolean;
}

/**
 * Custom hook that manages image preloading logic.
 * Tracks loaded and failed images in Sets and provides a preloadImage function.
 *
 * @example
 * ```tsx
 * const {
 *   loadedImages,
 *   failedImages,
 *   preloadImage,
 *   isLoaded,
 *   hasFailed
 * } = useImagePreloader();
 *
 * // Preload an image
 * await preloadImage('https://example.com/image.jpg');
 *
 * // Check if loaded
 * if (isLoaded('https://example.com/image.jpg')) {
 *   console.log('Image is loaded');
 * }
 * ```
 */
export function useImagePreloader(): UseImagePreloaderReturn {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  /**
   * Mark an image as loaded
   */
  const markAsLoaded = useCallback((url: string) => {
    setLoadedImages((prev) => new Set(prev).add(url));
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  }, []);

  /**
   * Mark an image as failed
   */
  const markAsFailed = useCallback((url: string) => {
    setFailedImages((prev) => new Set(prev).add(url));
  }, []);

  /**
   * Check if an image is loaded
   */
  const isLoaded = useCallback(
    (url: string) => {
      return loadedImages.has(url);
    },
    [loadedImages]
  );

  /**
   * Check if an image has failed to load
   */
  const hasFailed = useCallback(
    (url: string) => {
      return failedImages.has(url);
    },
    [failedImages]
  );

  /**
   * Preload an image and return a promise that resolves when loaded or rejects on error
   */
  const preloadImage = useCallback(
    (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // If already loaded, resolve immediately
        if (loadedImages.has(url)) {
          resolve();
          return;
        }

        // If already failed, reject immediately
        if (failedImages.has(url)) {
          reject(new Error('Image previously failed to load'));
          return;
        }

        const img = new window.Image();

        img.onload = () => {
          markAsLoaded(url);
          resolve();
        };

        img.onerror = () => {
          markAsFailed(url);
          reject(new Error('Failed to load image'));
        };

        img.src = url;
      });
    },
    [loadedImages, failedImages, markAsLoaded, markAsFailed]
  );

  return {
    loadedImages,
    failedImages,
    preloadImage,
    markAsLoaded,
    markAsFailed,
    isLoaded,
    hasFailed,
  };
}
