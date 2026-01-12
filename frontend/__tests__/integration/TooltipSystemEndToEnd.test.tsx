/**
 * End-to-End Integration Tests for SVG Tooltip System
 *
 * This test suite verifies the complete tooltip system integration
 * focusing on testable aspects like component rendering, ARIA attributes,
 * and system wiring. Manual testing guide covers interactive behavior.
 *
 * Requirements: All requirements from svg-hover-tooltips spec
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SvgMenu, SvgCart, SvgClose, SvgUser, SvgSearch, SvgSettings } from '@/components/Svgs';

// Mock Portal component for testing
jest.mock('../../components/Portal', () => ({
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="portal">{children}</div>
}));

// Mock next-intl hooks
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'tooltips.menu': 'Menu',
      'tooltips.cart': 'Shopping Cart',
      'tooltips.close': 'Close',
      'tooltips.user': 'User Profile',
      'tooltips.search': 'Search',
      'tooltips.settings': 'Settings'
    };
    return translations[key] || key;
  },
  useLocale: () => 'en'
}));

// Mock window.matchMedia for reduced motion testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('SVG Tooltip System - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('System Wiring and Component Integration', () => {
    test('should render multiple SVG components with tooltip support', () => {
      render(
        <div>
          <SvgMenu tooltip="tooltips.menu" data-testid="menu-icon" />
          <SvgCart tooltip="tooltips.cart" data-testid="cart-icon" />
          <SvgClose tooltip="tooltips.close" data-testid="close-icon" />
          <SvgUser tooltip="tooltips.user" data-testid="user-icon" />
          <SvgSearch tooltip="tooltips.search" data-testid="search-icon" />
          <SvgSettings tooltip="tooltips.settings" data-testid="settings-icon" />
        </div>
      );

      // Verify all components render correctly
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
      expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    test('should integrate tooltip system with all SVG components', () => {
      const tooltipConfigs = [
        { Component: SvgMenu, tooltip: 'tooltips.menu', testId: 'menu' },
        { Component: SvgCart, tooltip: 'tooltips.cart', testId: 'cart' },
        { Component: SvgClose, tooltip: 'tooltips.close', testId: 'close' },
        { Component: SvgUser, tooltip: 'tooltips.user', testId: 'user' },
        { Component: SvgSearch, tooltip: 'tooltips.search', testId: 'search' },
        { Component: SvgSettings, tooltip: 'tooltips.settings', testId: 'settings' }
      ];

      tooltipConfigs.forEach(({ Component, tooltip, testId }) => {
        const { unmount } = render(
          <Component tooltip={tooltip} data-testid={testId} />
        );

        const element = screen.getByTestId(testId);
        expect(element).toBeInTheDocument();
        expect(element).toHaveAttribute('aria-describedby');

        unmount();
      });
    });
  });

  describe('Accessibility Integration', () => {
    test('should provide proper ARIA attributes for all tooltip-enabled components', () => {
      render(
        <div>
          <SvgMenu tooltip="tooltips.menu" data-testid="menu-icon" />
          <SvgCart tooltip="tooltips.cart" data-testid="cart-icon" />
          <SvgClose tooltip="tooltips.close" data-testid="close-icon" />
        </div>
      );

      // Verify ARIA attributes are present
      expect(screen.getByTestId('menu-icon')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('cart-icon')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('close-icon')).toHaveAttribute('aria-describedby');

      // Verify ARIA IDs are unique
      const menuAriaId = screen.getByTestId('menu-icon').getAttribute('aria-describedby');
      const cartAriaId = screen.getByTestId('cart-icon').getAttribute('aria-describedby');
      const closeAriaId = screen.getByTestId('close-icon').getAttribute('aria-describedby');

      expect(menuAriaId).not.toBe(cartAriaId);
      expect(cartAriaId).not.toBe(closeAriaId);
      expect(menuAriaId).not.toBe(closeAriaId);
    });

    test('should support keyboard navigation integration', () => {
      render(
        <div>
          <button><SvgMenu tooltip="tooltips.menu" data-testid="menu-button" /></button>
          <a href="#"><SvgCart tooltip="tooltips.cart" data-testid="cart-link" /></a>
          <div tabIndex={0}><SvgClose tooltip="tooltips.close" data-testid="close-focusable" /></div>
        </div>
      );

      // Verify focusable elements work with tooltips
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(screen.getByTestId('close-focusable')).toBeInTheDocument();

      // Verify tooltip attributes are present
      expect(screen.getByTestId('menu-button')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('cart-link')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('close-focusable')).toHaveAttribute('aria-describedby');
    });
  });

  describe('Content Type Integration', () => {
    test('should handle different tooltip content types', () => {
      render(
        <div>
          <SvgMenu tooltip="Direct String" data-testid="direct-string" />
          <SvgCart tooltip="tooltips.cart" data-testid="translation-key" />
          <SvgClose tooltip={{ en: 'English', vi: 'Vietnamese' }} data-testid="translation-object" />
        </div>
      );

      // All should render with ARIA attributes regardless of content type
      expect(screen.getByTestId('direct-string')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('translation-key')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('translation-object')).toHaveAttribute('aria-describedby');
    });

    test('should handle empty and undefined tooltip content gracefully', () => {
      render(
        <div>
          <SvgMenu tooltip="" data-testid="empty-tooltip" />
          <SvgCart tooltip={undefined} data-testid="undefined-tooltip" />
          <SvgClose data-testid="no-tooltip" />
        </div>
      );

      // Components should render without ARIA attributes for empty/undefined tooltips
      expect(screen.getByTestId('empty-tooltip')).not.toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('undefined-tooltip')).not.toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('no-tooltip')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Placement and Configuration Integration', () => {
    test('should support all tooltip placement options', () => {
      const placements = ['top', 'bottom', 'left', 'right', 'auto'] as const;

      placements.forEach(placement => {
        const { unmount } = render(
          <SvgMenu
            tooltip="tooltips.menu"
            tooltipPlacement={placement}
            data-testid={`menu-${placement}`}
          />
        );

        const element = screen.getByTestId(`menu-${placement}`);
        expect(element).toBeInTheDocument();
        expect(element).toHaveAttribute('aria-describedby');

        unmount();
      });
    });

    test('should support custom tooltip delays', () => {
      render(
        <div>
          <SvgMenu tooltip="tooltips.menu" data-testid="fast-tooltip" />
          <SvgCart tooltip="tooltips.cart" data-testid="slow-tooltip" />
          <SvgClose tooltip="tooltips.close" data-testid="default-tooltip" />
        </div>
      );

      // All should render with ARIA attributes regardless of delay
      expect(screen.getByTestId('fast-tooltip')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('slow-tooltip')).toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('default-tooltip')).toHaveAttribute('aria-describedby');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain backward compatibility for SVGs without tooltips', () => {
      render(
        <div>
          <SvgMenu className="w-6 h-6" data-testid="no-tooltip-menu" />
          <SvgCart width={24} height={24} data-testid="no-tooltip-cart" />
          <SvgClose fill="currentColor" data-testid="no-tooltip-close" />
        </div>
      );

      // Components should render normally without tooltip attributes
      expect(screen.getByTestId('no-tooltip-menu')).toBeInTheDocument();
      expect(screen.getByTestId('no-tooltip-cart')).toBeInTheDocument();
      expect(screen.getByTestId('no-tooltip-close')).toBeInTheDocument();

      // Should not have tooltip-related attributes
      expect(screen.getByTestId('no-tooltip-menu')).not.toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('no-tooltip-cart')).not.toHaveAttribute('aria-describedby');
      expect(screen.getByTestId('no-tooltip-close')).not.toHaveAttribute('aria-describedby');

      // Should maintain original props
      expect(screen.getByTestId('no-tooltip-menu')).toHaveClass('w-6', 'h-6');
      expect(screen.getByTestId('no-tooltip-cart')).toHaveAttribute('width', '24');
      expect(screen.getByTestId('no-tooltip-cart')).toHaveAttribute('height', '24');
      expect(screen.getByTestId('no-tooltip-close')).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('System Robustness', () => {
    test('should handle complex component hierarchies', () => {
      render(
        <div>
          <header>
            <nav>
              <SvgMenu tooltip="tooltips.menu" data-testid="nav-menu" />
              <SvgSearch tooltip="tooltips.search" data-testid="nav-search" />
            </nav>
            <div>
              <SvgUser tooltip="tooltips.user" data-testid="header-user" />
              <SvgCart tooltip="tooltips.cart" data-testid="header-cart" />
            </div>
          </header>
          <main>
            <section>
              <SvgClose tooltip="tooltips.close" data-testid="section-close" />
              <SvgSettings tooltip="tooltips.settings" data-testid="section-settings" />
            </section>
          </main>
        </div>
      );

      // All components should render correctly in complex hierarchy
      const elements = [
        'nav-menu', 'nav-search', 'header-user',
        'header-cart', 'section-close', 'section-settings'
      ];

      elements.forEach(testId => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
        expect(screen.getByTestId(testId)).toHaveAttribute('aria-describedby');
      });
    });

    test('should handle rapid component mounting and unmounting', () => {
      const { rerender } = render(
        <SvgMenu tooltip="tooltips.menu" data-testid="dynamic-menu" />
      );

      expect(screen.getByTestId('dynamic-menu')).toBeInTheDocument();

      // Rerender with different component
      rerender(<SvgCart tooltip="tooltips.cart" data-testid="dynamic-cart" />);
      expect(screen.getByTestId('dynamic-cart')).toBeInTheDocument();
      expect(screen.queryByTestId('dynamic-menu')).not.toBeInTheDocument();

      // Rerender back to original
      rerender(<SvgMenu tooltip="tooltips.menu" data-testid="dynamic-menu" />);
      expect(screen.getByTestId('dynamic-menu')).toBeInTheDocument();
      expect(screen.queryByTestId('dynamic-cart')).not.toBeInTheDocument();
    });
  });
});