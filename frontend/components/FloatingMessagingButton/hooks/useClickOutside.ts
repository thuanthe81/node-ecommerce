/**
 * useClickOutside Hook
 * Detects clicks outside a referenced element and calls a handler function
 */

'use client';

import { useEffect, RefObject } from 'react';

/**
 * Custom hook to detect clicks outside a referenced element
 * Useful for closing menus, modals, or dropdowns when clicking outside
 *
 * @param {RefObject<T | null>} ref - React ref to the element to monitor
 * @param {() => void} handler - Callback function to execute when outside click detected
 * @param {boolean} enabled - Whether the hook is active (default: true)
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    // Don't set up listeners if not enabled
    if (!enabled) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if the click target is outside the referenced element
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    // Add event listeners for both mouse and touch events
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    // Cleanup: remove event listeners on unmount or when dependencies change
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler, enabled]);
}
