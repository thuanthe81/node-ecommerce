'use client';

import { useCallback } from 'react';
import { trackEvent } from '@/lib/analytics-api';
import * as gtag from '@/lib/gtag';

// Generate a session ID and store it in sessionStorage
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const useAnalytics = () => {
  const trackPageView = useCallback(async (path: string) => {
    const sessionId = getSessionId();
    
    // Track in our backend
    try {
      await trackEvent({
        eventType: 'PAGE_VIEW',
        sessionId,
        metadata: { path },
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }

    // Track in Google Analytics
    gtag.pageview(path);
  }, []);

  const trackProductView = useCallback(async (product: {
    id: string;
    name: string;
    category?: string;
    price: number;
  }) => {
    const sessionId = getSessionId();
    
    // Track in our backend
    try {
      await trackEvent({
        eventType: 'PRODUCT_VIEW',
        sessionId,
        productId: product.id,
        metadata: {
          name: product.name,
          category: product.category,
          price: product.price,
        },
      });
    } catch (error) {
      console.error('Failed to track product view:', error);
    }

    // Track in Google Analytics
    gtag.trackProductView(product);
  }, []);

  const trackAddToCart = useCallback(async (product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
  }) => {
    const sessionId = getSessionId();
    
    // Track in our backend
    try {
      await trackEvent({
        eventType: 'ADD_TO_CART',
        sessionId,
        productId: product.id,
        metadata: {
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: product.quantity,
        },
      });
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }

    // Track in Google Analytics
    gtag.trackAddToCart(product);
  }, []);

  const trackPurchase = useCallback(async (
    orderId: string,
    items: Array<{
      id: string;
      name: string;
      category?: string;
      price: number;
      quantity: number;
    }>,
    total: number,
    tax?: number,
    shipping?: number,
  ) => {
    const sessionId = getSessionId();
    
    // Track in our backend
    try {
      await trackEvent({
        eventType: 'PURCHASE',
        sessionId,
        orderId,
        metadata: {
          items,
          total,
          tax,
          shipping,
        },
      });
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }

    // Track in Google Analytics
    gtag.trackPurchase(orderId, items, total, tax, shipping);
  }, []);

  const trackSearch = useCallback(async (searchTerm: string) => {
    const sessionId = getSessionId();
    
    // Track in our backend
    try {
      await trackEvent({
        eventType: 'SEARCH',
        sessionId,
        metadata: { searchTerm },
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }

    // Track in Google Analytics
    gtag.trackSearch(searchTerm);
  }, []);

  const trackBeginCheckout = useCallback((
    items: Array<{
      id: string;
      name: string;
      category?: string;
      price: number;
      quantity: number;
    }>,
    value: number,
  ) => {
    // Only track in Google Analytics (no backend event for this)
    gtag.trackBeginCheckout(items, value);
  }, []);

  const trackRemoveFromCart = useCallback((product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
  }) => {
    // Only track in Google Analytics (no backend event for this)
    gtag.trackRemoveFromCart(product);
  }, []);

  return {
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackPurchase,
    trackSearch,
    trackBeginCheckout,
    trackRemoveFromCart,
  };
};
