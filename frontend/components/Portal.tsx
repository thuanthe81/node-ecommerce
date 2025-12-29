/**
 * Portal Component
 *
 * Renders children in a portal outside the current DOM hierarchy.
 * This is useful for modals, tooltips, and other overlay components
 * that need to escape stacking context issues.
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  /** The target element to render into. Defaults to document.body */
  target?: Element;
}

export function Portal({ children, target }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(children, target || document.body);
}