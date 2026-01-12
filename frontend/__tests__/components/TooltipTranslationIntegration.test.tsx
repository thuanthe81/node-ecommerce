/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslations, useLocale } from 'next-intl';
import { useTooltipContentResolver, createTooltipContent, isValidTooltipContent } from '@/components/Tooltip';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
  useLocale: jest.fn(),
}));

describe('Tooltip Translation Integration', () => {
  const mockT = jest.fn();
  const mockUseTranslations = useTranslations as jest.Mock;
  const mockUseLocale = useLocale as jest.Mock;

  beforeEach(() => {
    mockUseTranslations.mockReturnValue(mockT);
    mockUseLocale.mockReturnValue('en');
    mockT.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        menu: 'Menu',
        close: 'Close',
        cart: 'Shopping Cart',
        home: 'Home',
        search: 'Search',
      };
      return translations[key] || key;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('useTooltipContentResolver', () => {
    it('should resolve string content as translation key', () => {
      const TestComponent = () => {
        const resolveContent = useTooltipContentResolver();
        const content = resolveContent('menu');
        return <div data-testid="content">{content}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('content')).toHaveTextContent('Menu');
    });

    it('should resolve string content as direct text when translation key not found', () => {
      const TestComponent = () => {
        const resolveContent = useTooltipContentResolver();
        const content = resolveContent('Custom Tooltip Text');
        return <div data-testid="content">{content}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('content')).toHaveTextContent('Custom Tooltip Text');
    });

    it('should resolve translation object based on current locale (English)', () => {
      mockUseLocale.mockReturnValue('en');

      const TestComponent = () => {
        const resolveContent = useTooltipContentResolver();
        const content = resolveContent({ en: 'English Text', vi: 'Vietnamese Text' });
        return <div data-testid="content">{content}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('content')).toHaveTextContent('English Text');
    });

    it('should resolve translation object based on current locale (Vietnamese)', () => {
      mockUseLocale.mockReturnValue('vi');

      const TestComponent = () => {
        const resolveContent = useTooltipContentResolver();
        const content = resolveContent({ en: 'English Text', vi: 'Vietnamese Text' });
        return <div data-testid="content">{content}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('content')).toHaveTextContent('Vietnamese Text');
    });

    it('should fallback to English when locale is not supported', () => {
      mockUseLocale.mockReturnValue('fr'); // Unsupported locale

      const TestComponent = () => {
        const resolveContent = useTooltipContentResolver();
        const content = resolveContent({ en: 'English Text', vi: 'Vietnamese Text' });
        return <div data-testid="content">{content}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('content')).toHaveTextContent('English Text');
    });

    it('should return undefined for empty or invalid content', () => {
      const TestComponent = () => {
        const resolveContent = useTooltipContentResolver();
        const content1 = resolveContent(undefined);
        const content2 = resolveContent('');
        return (
          <div>
            <div data-testid="content1">{content1 || 'undefined'}</div>
            <div data-testid="content2">{content2 || 'empty'}</div>
          </div>
        );
      };

      render(<TestComponent />);
      expect(screen.getByTestId('content1')).toHaveTextContent('undefined');
      expect(screen.getByTestId('content2')).toHaveTextContent('empty');
    });
  });

  describe('createTooltipContent', () => {
    it('should create valid tooltip content object', () => {
      const content = createTooltipContent('English Text', 'Vietnamese Text');
      expect(content).toEqual({
        en: 'English Text',
        vi: 'Vietnamese Text',
      });
    });
  });

  describe('isValidTooltipContent', () => {
    it('should validate string content', () => {
      expect(isValidTooltipContent('Valid string')).toBe(true);
      expect(isValidTooltipContent('')).toBe(false);
      expect(isValidTooltipContent(null)).toBe(false);
      expect(isValidTooltipContent(undefined)).toBe(false);
    });

    it('should validate translation object content', () => {
      expect(isValidTooltipContent({ en: 'English', vi: 'Vietnamese' })).toBe(true);
      expect(isValidTooltipContent({ en: '', vi: 'Vietnamese' })).toBe(false);
      expect(isValidTooltipContent({ en: 'English', vi: '' })).toBe(false);
      expect(isValidTooltipContent({ en: 'English' })).toBe(false);
      expect(isValidTooltipContent({ vi: 'Vietnamese' })).toBe(false);
      expect(isValidTooltipContent({})).toBe(false);
    });

    it('should reject invalid content types', () => {
      expect(isValidTooltipContent(123)).toBe(false);
      expect(isValidTooltipContent([])).toBe(false);
      expect(isValidTooltipContent(true)).toBe(false);
    });
  });
});