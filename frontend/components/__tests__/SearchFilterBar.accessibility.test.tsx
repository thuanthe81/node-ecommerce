/**
 * Accessibility tests for SearchFilterBar component
 * Validates Requirements 6.1, 6.2, 6.3
 * Tests ARIA labels, keyboard navigation, screen reader announcements, and focus management
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import SearchFilterBar from '../SearchFilterBar';
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
];

describe('SearchFilterBar - Accessibility Features', () => {
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
      const currentLocale = (useLocale as jest.Mock).mock.results[0]?.value || 'en';
      const translations: Record<string, Record<string, string>> = {
        en: {
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
        },
        vi: {
          category: 'Danh mục',
          allCategories: 'Tất cả danh mục',
          clearFilters: 'Xóa bộ lọc',
          loading: 'Đang tải...',
          unavailable: 'Không khả dụng',
          errorLoadingCategories: 'Không thể tải danh mục. Vui lòng thử lại sau.',
          searchProducts: 'Tìm kiếm sản phẩm',
          searchProductsPlaceholder: 'Tìm kiếm sản phẩm...',
          searchProductsHint: 'Nhập từ khóa để tìm kiếm sản phẩm. Nhấn Escape để xóa tìm kiếm.',
          categoryFilterHint: 'Chọn danh mục để lọc sản phẩm. Nhấn Escape để xóa lựa chọn.',
          searchingProducts: params ? `Đang tìm kiếm sản phẩm với từ khóa "${params.search}"` : 'Đang tìm kiếm sản phẩm',
          filteringByCategory: params ? `Đang lọc sản phẩm theo danh mục "${params.category}"` : 'Đang lọc theo danh mục',
          filteringBySearchAndCategory: params ? `Đang lọc sản phẩm theo từ khóa "${params.search}" và danh mục "${params.category}"` : 'Đang lọc',
          showingAllProducts: 'Hiển thị tất cả sản phẩm',
        },
      };
      return translations[currentLocale]?.[key] || key;
    });

    (categoryApi.getCategories as jest.Mock).mockResolvedValue(mockCategories);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ARIA Labels and Semantic HTML', () => {
    it('should have proper ARIA labels for search input', async () => {
      render(<SearchFilterBar />);

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Search products');
      expect(searchInput).toHaveAttribute('id', 'search-filter-input');

      // Check for label element
      const label = screen.getByLabelText('Search products');
      expect(label).toBe(searchInput);
    });

    it('should have proper ARIA labels for category dropdown', async () => {
      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const categorySelect = screen.getByRole('combobox');
      expect(categorySelect).toHaveAttribute('aria-label', 'Category');
      expect(categorySelect).toHaveAttribute('id', 'category-filter-select');

      // Check for label element
      const label = screen.getByLabelText('Category');
      expect(label).toBe(categorySelect);
    });

    it('should use semantic search role for container', () => {
      const { container } = render(<SearchFilterBar />);

      const searchRegion = container.querySelector('[role="search"]');
      expect(searchRegion).toBeInTheDocument();
    });

    it('should have aria-describedby for search input with hint', () => {
      render(<SearchFilterBar />);

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-hint');

      const hint = document.getElementById('search-hint');
      expect(hint).toBeInTheDocument();
      expect(hint).toHaveTextContent(/Enter keywords to search for products/i);
    });

    it('should have aria-describedby for category select with hint', async () => {
      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const categorySelect = screen.getByRole('combobox');
      expect(categorySelect).toHaveAttribute('aria-describedby', 'category-hint');

      const hint = document.getElementById('category-hint');
      expect(hint).toBeInTheDocument();
      expect(hint).toHaveTextContent(/Select a category to filter products/i);
    });

    it('should mark decorative icons as aria-hidden', () => {
      const { container } = render(<SearchFilterBar />);

      const searchIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow Tab navigation between category dropdown and search input', async () => {
      const user = userEvent.setup();
      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const searchInput = screen.getByRole('searchbox');
      const categorySelect = screen.getByRole('combobox');

      // Focus category dropdown (now first in tab order)
      categorySelect.focus();
      expect(categorySelect).toHaveFocus();

      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();
    });

    it('should clear search input when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<SearchFilterBar />);

      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;

      // Type in search input
      await user.type(searchInput, 'test query');
      expect(searchInput.value).toBe('test query');

      // Press Escape
      await user.keyboard('{Escape}');

      // Value should be cleared
      expect(searchInput.value).toBe('');
    });

    it('should not clear search input when Escape is pressed if already empty', async () => {
      const user = userEvent.setup();
      render(<SearchFilterBar />);

      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      expect(searchInput.value).toBe('');

      // Press Escape on empty input
      await user.keyboard('{Escape}');

      // Should remain empty (no error)
      expect(searchInput.value).toBe('');
    });

    it('should clear category selection when Escape is pressed', async () => {
      const user = userEvent.setup();
      mockSearchParams.set('categoryId', 'cat-1');

      render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const categoryButton = screen.getByRole('combobox');

      // Check that Jewelry is selected
      await waitFor(() => {
        expect(categoryButton).toHaveTextContent('Jewelry');
      });

      // Focus and press Escape
      categoryButton.focus();
      await user.keyboard('{Escape}');

      // Wait for state update - should show "All Categories"
      await waitFor(() => {
        expect(categoryButton).toHaveTextContent('All Categories');
      });
    });

  });

  describe('Screen Reader Announcements', () => {
    it('should have live region for announcements', () => {
      const { container } = render(<SearchFilterBar />);

      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce search filter changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const liveRegion = container.querySelector('[role="status"]');
      const searchInput = screen.getByRole('searchbox');

      // Type search query
      await user.type(searchInput, 'handmade');

      // Wait for debounce and announcement
      await waitFor(() => {
        expect(liveRegion?.textContent).toContain('Searching products for "handmade"');
      }, { timeout: 500 });
    });

    it('should announce category filter changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const liveRegion = container.querySelector('[role="status"]');
      const categoryButton = screen.getByRole('combobox');

      // Open dropdown and select category
      await user.click(categoryButton);
      const jewelryOption = await screen.findByRole('option', { name: 'Jewelry' });
      await user.click(jewelryOption);

      // Wait for debounce and announcement
      await waitFor(() => {
        expect(liveRegion?.textContent).toContain('Filtering products by category "Jewelry"');
      }, { timeout: 500 });
    });

    it('should announce combined filter changes', async () => {
      const user = userEvent.setup();
      const { container } = render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const liveRegion = container.querySelector('[role="status"]');
      const searchInput = screen.getByRole('searchbox');
      const categoryButton = screen.getByRole('combobox');

      // Add search
      await user.type(searchInput, 'ceramic');
      await waitFor(() => expect(mockPush).toHaveBeenCalled(), { timeout: 500 });

      // Open dropdown and select category
      await user.click(categoryButton);
      const potteryOption = await screen.findByRole('option', { name: 'Pottery' });
      await user.click(potteryOption);

      // Wait for announcement
      await waitFor(() => {
        expect(liveRegion?.textContent).toContain('Filtering products by search "ceramic" and category "Pottery"');
      }, { timeout: 500 });
    });

    it('should announce showing all products when filters are removed', async () => {
      const user = userEvent.setup();
      mockSearchParams.set('search', 'test');

      const { container } = render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const liveRegion = container.querySelector('[role="status"]');
      const searchInput = screen.getByRole('searchbox');

      // Clear search by deleting text
      await user.clear(searchInput);

      // Wait for debounce and announcement
      await waitFor(() => {
        expect(liveRegion?.textContent).toBe('Showing all products');
      }, { timeout: 500 });
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus on search input during typing', async () => {
      const user = userEvent.setup();
      render(<SearchFilterBar />);

      const searchInput = screen.getByRole('searchbox');

      // Focus and type
      searchInput.focus();
      await user.type(searchInput, 'test');

      // Focus should remain on input
      expect(searchInput).toHaveFocus();
    });

  });

  describe('Locale Support for Accessibility', () => {
    it('should use Vietnamese ARIA labels when locale is vi', async () => {
      (useLocale as jest.Mock).mockReturnValue('vi');

      render(<SearchFilterBar />);

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Tìm kiếm sản phẩm');

      const hint = document.getElementById('search-hint');
      expect(hint?.textContent).toContain('Nhập từ khóa để tìm kiếm sản phẩm');
    });

    it('should announce in Vietnamese when locale is vi', async () => {
      (useLocale as jest.Mock).mockReturnValue('vi');
      const user = userEvent.setup();
      const { container } = render(<SearchFilterBar />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).not.toBeDisabled();
      });

      const liveRegion = container.querySelector('[role="status"]');
      const searchInput = screen.getByRole('searchbox');

      // Type search query
      await user.type(searchInput, 'thủ công');

      // Wait for Vietnamese announcement
      await waitFor(() => {
        expect(liveRegion?.textContent).toContain('Đang tìm kiếm sản phẩm với từ khóa "thủ công"');
      }, { timeout: 500 });
    });
  });
});
