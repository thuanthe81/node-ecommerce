/**
 * Tests for combined filter functionality in SearchFilterBar
 * Validates Requirements 1.4, 1.5
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import SearchFilterBar from '../../../components/SearchFilterBar';
import { categoryApi } from '@/lib/category-api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
  useTranslations: jest.fn(),
}));

jest.mock('@/lib/category-api', () => ({
  categoryApi: {
    getCategories: jest.fn(),
  },
}));

const mockCategories = [
  { id: 'cat-1', slug: 'jewelry', nameEn: 'Jewelry', nameVi: 'Trang sức' },
  { id: 'cat-2', slug: 'pottery', nameEn: 'Pottery', nameVi: 'Gốm sứ' },
  { id: 'cat-3', slug: 'textiles', nameEn: 'Textiles', nameVi: 'Vải dệt' },
];

describe('SearchFilterBar - Combined Filter Functionality', () => {
  let mockPush: jest.Mock;
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    mockPush = jest.fn();
    mockSearchParams = new URLSearchParams();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    (useLocale as jest.Mock).mockReturnValue('en');

    (useTranslations as jest.Mock).mockReturnValue((key: string, params?: any) => {
      const translations: Record<string, string> = {
        category: 'Category',
        allCategories: 'All Categories',
        clearFilters: 'Clear Filters',
        loading: 'Loading...',
        unavailable: 'Unavailable',
        errorLoadingCategories: 'Unable to load categories. Please try again later.',
        searchProducts: 'Search products',
        searchProductsPlaceholder: 'Search products...',
        searchProductsHint: 'Enter keywords to search for products. Press Escape to clear search.',
        categoryFilterHint: 'Select a category to filter products. Press Escape to clear selection.',
        searchingProducts: params ? `Searching products for "${params.search}"` : 'Searching products',
        filteringByCategory: params ? `Filtering products by category "${params.category}"` : 'Filtering by category',
        filteringBySearchAndCategory: params ? `Filtering products by search "${params.search}" and category "${params.category}"` : 'Filtering',
        showingAllProducts: 'Showing all products',
      };
      return translations[key] || key;
    });

    (categoryApi.getCategories as jest.Mock).mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Combined Search and Category Filters', () => {
    it('should update URL with both search and category parameters when both are active', async () => {
      const user = userEvent.setup();
      render(<SearchFilterBar />);

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Enter search query
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'handmade');

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      // Verify search parameter was added
      const firstCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(firstCall).toContain('search=handmade');

      // Now select a category
      const categoryButton = screen.getByRole('combobox');
      await user.click(categoryButton);
      const jewelryOption = await screen.findByRole('option', { name: 'Jewelry' });
      await user.click(jewelryOption);

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockPush.mock.calls.length).toBeGreaterThan(1);
        },
        { timeout: 500 }
      );

      // Verify both parameters are in URL
      const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('search=handmade');
      expect(lastCall).toContain('categoryId=cat-1');
    });

    it('should maintain search parameter when category is changed', async () => {
      const user = userEvent.setup();

      // Start with existing search parameter
      mockSearchParams.set('search', 'silver');

      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Select a category
      const categoryButton = screen.getByRole('combobox');
      await user.click(categoryButton);
      const potteryOption = await screen.findByRole('option', { name: 'Pottery' });
      await user.click(potteryOption);

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      // Verify both parameters are preserved
      const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('search=silver');
      expect(lastCall).toContain('categoryId=cat-2');
    });

    it('should maintain category parameter when search is changed', async () => {
      const user = userEvent.setup();

      // Start with existing category parameter
      mockSearchParams.set('categoryId', 'cat-3');

      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Enter search query
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'blue');

      // Wait for debounce
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      // Verify both parameters are preserved
      const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('search=blue');
      expect(lastCall).toContain('categoryId=cat-3');
    });

    it('should handle multiple filter state changes correctly', async () => {
      const user = userEvent.setup();
      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const searchInput = screen.getByRole('searchbox');
      const categoryButton = screen.getByRole('combobox');

      // First: Add search
      await user.type(searchInput, 'ceramic');
      await waitFor(() => expect(mockPush).toHaveBeenCalled(), { timeout: 500 });

      let lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('search=ceramic');

      // Second: Add category
      await user.click(categoryButton);
      let jewelryOption = await screen.findByRole('option', { name: 'Jewelry' });
      await user.click(jewelryOption);
      await waitFor(() => expect(mockPush.mock.calls.length).toBeGreaterThan(1), { timeout: 500 });

      lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('search=ceramic');
      expect(lastCall).toContain('categoryId=cat-1');

      // Third: Change category
      await user.click(categoryButton);
      const potteryOption = await screen.findByRole('option', { name: 'Pottery' });
      await user.click(potteryOption);
      await waitFor(() => expect(mockPush.mock.calls.length).toBeGreaterThan(2), { timeout: 500 });

      lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('search=ceramic');
      expect(lastCall).toContain('categoryId=cat-2');

      // Fourth: Clear category
      await user.click(categoryButton);
      const allCategoriesOption = await screen.findByRole('option', { name: 'All Categories' });
      await user.click(allCategoriesOption);
      await waitFor(() => expect(mockPush.mock.calls.length).toBeGreaterThan(3), { timeout: 500 });

      lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).toContain('search=ceramic');
      expect(lastCall).not.toContain('categoryId');
    });

    it('should remove page parameter when filters change', async () => {
      const user = userEvent.setup();

      // Start with page parameter
      mockSearchParams.set('page', '3');

      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Change search
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'test');

      await waitFor(() => expect(mockPush).toHaveBeenCalled(), { timeout: 500 });

      // Verify page parameter is removed
      const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
      expect(lastCall).not.toContain('page=3');
      expect(lastCall).toContain('search=test');
    });

  });

  describe('Filter State Synchronization', () => {
    it('should synchronize state from URL parameters on mount', async () => {
      // Set initial URL parameters
      mockSearchParams.set('search', 'wooden');
      mockSearchParams.set('categoryId', 'cat-1');

      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Verify search input has correct value
      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      expect(searchInput.value).toBe('wooden');

      // Verify category dropdown shows correct selection
      const categoryButton = screen.getByRole('combobox');
      expect(categoryButton).toHaveTextContent('Jewelry');
    });

    it('should handle empty/missing URL parameters', async () => {
      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      // Verify defaults
      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      expect(searchInput.value).toBe('');

      const categoryButton = screen.getByRole('combobox');
      expect(categoryButton).toHaveTextContent('All Categories');
    });
  });
});
