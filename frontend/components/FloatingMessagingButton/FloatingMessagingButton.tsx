/**
 * FloatingMessagingButton Component
 * A floating button that displays social media messaging options
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useFooterSettings } from './hooks/useFooterSettings';
import { useMenuState } from './hooks/useMenuState';
import { useClickOutside } from './hooks/useClickOutside';
import { TriggerButton } from './components/TriggerButton';
import { SocialMediaMenu } from './components/SocialMediaMenu';
import { SocialMediaUrls } from './types';

/**
 * Main FloatingMessagingButton component
 * Provides quick access to social media messaging platforms
 */
const FloatingMessagingButton: React.FC = () => {
  const t = useTranslations('messaging');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch footer settings to get social media URLs
  const { footerSettings, isLoading, error } = useFooterSettings();

  // Manage menu open/close state
  const { isOpen, toggle, close } = useMenuState(false);

  // Close menu when clicking outside
  useClickOutside(containerRef, close, isOpen);

  // Handle Escape key to close menu
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, close]);

  // Extract social media URLs from footer settings
  const socialMediaUrls: SocialMediaUrls = {
    facebook: footerSettings?.facebookUrl || null,
    tiktok: footerSettings?.tiktokUrl || null,
    zalo: footerSettings?.zaloUrl || null,
    whatsapp: footerSettings?.whatsappUrl || null,
  };

  // Check if at least one social media URL is configured
  const hasAnySocialMediaUrl = Object.values(socialMediaUrls).some(
    (url) => url && url.trim() !== ''
  );

  // Don't render if loading
  if (isLoading) {
    return null;
  }

  // Don't render if API request failed
  if (error) {
    console.error('[FloatingMessagingButton] API error:', error);
    return null;
  }

  // Don't render if no social media URLs are configured
  if (!hasAnySocialMediaUrl) {
    console.warn('[FloatingMessagingButton] No social media URLs configured');
    return null;
  }

  return (
    <div ref={containerRef} style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }}>
      <TriggerButton
        isOpen={isOpen}
        onClick={toggle}
        ariaLabel={isOpen ? t('closeMessaging') : t('openMessaging')}
      />
      <SocialMediaMenu
        isOpen={isOpen}
        socialMediaUrls={socialMediaUrls}
        onClose={close}
      />
    </div>
  );
};

export default FloatingMessagingButton;