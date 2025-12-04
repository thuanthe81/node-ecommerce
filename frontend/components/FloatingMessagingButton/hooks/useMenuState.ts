/**
 * useMenuState Hook
 * Manages menu open/close state with helper functions
 */

'use client';

import { useState, useCallback } from 'react';
import { UseMenuStateReturn } from '../types';

/**
 * Custom hook to manage menu visibility state
 * Provides toggle, open, and close functions
 *
 * @param {boolean} initialState - Initial state of the menu (default: false)
 * @returns {UseMenuStateReturn} Menu state and control functions
 */
export function useMenuState(initialState: boolean = false): UseMenuStateReturn {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
