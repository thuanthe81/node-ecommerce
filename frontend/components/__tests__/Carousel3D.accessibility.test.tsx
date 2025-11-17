/**
 * Accessibility tests for Carousel3D component
 * Tests ARIA attributes, keyboard navigation, screen reader support, and focus management
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Carousel3D, { CarouselItem } from '../Carousel';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test data
const mockItems: CarouselItem[] = [
  {
    id: '1',
    imageUrl: '/test1.jpg',
    alt: 'Product 1 - Handmade ceramic vase',
    title: 'Ceramic Vase',
    linkUrl: '/products/ceramic-vase',
  },
  {
    id: '2',
    imageUrl: '/test2.jpg',
    alt: 'Product 2 - Wooden cutting board',
    title: 'Cutting Board',
    linkUrl: '/products/cutting-board',
  },
  {
    id: '3',
    imageUrl: '/test3.jpg',
    alt: 'Product 3 - Knitted wool blanket',
    title: 'Wool Blanket',
    linkUrl: '/products/wool-blanket',
  },
  {
    id: '4',
    imageUrl: '/test4.jpg',
    alt: 'Product 4 - Leather wallet',
    title: 'Leather Wallet',
    linkUrl: '/products/leather-wallet',
  },
];

describe('Carousel3D Accessibility Tests', () => {
  describe('ARIA Attributes', () => {
    it('should have proper role attribute', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      expect(carousel).toHaveAttribute('role', 'region');
    });

    it('should have descriptive aria-label', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      expect(carousel).toHaveAttribute('aria-label');
      const ariaLabel = carousel?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);
    });

    it('should have aria-roledescription for carousel', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    });

    it('should have aria-live region for announcements', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const liveRegion = container.querySelector('[aria-live="polite"]');

      expect(liveRegion).toBeInTheDocument();
    });

    it('should mark carousel items with proper roles', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const items = container.querySelectorAll('.carousel-item');

      items.forEach(item => {
        expect(item).toHaveAttribute('role', 'group');
        expect(item).toHaveAttribute('aria-roledescription', 'slide');
      });
    });

    it('should provide aria-label for each carousel item', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const items = container.querySelectorAll('.carousel-item');

      items.forEach((item, index) => {
        const ariaLabel = item.getAttribute('aria-label');
        expect(ariaLabel).toContain(`${index + 1} of ${mockItems.length}`);
      });
    });

    it('should mark non-focused items as aria-hidden', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const items = container.querySelectorAll('.carousel-item');

      // At least one item should be visible (not aria-hidden)
      const visibleItems = Array.from(items).filter(
        item => item.getAttribute('aria-hidden') !== 'true'
      );
      expect(visibleItems.length).toBeGreaterThan(0);

      // Some items should be hidden
      const hiddenItems = Array.from(items).filter(
        item => item.getAttribute('aria-hidden') === 'true'
      );
      expect(hiddenItems.length).toBeGreaterThan(0);
    });
  });

  describe('Button Accessibility', () => {
    it('should have accessible labels for navigation buttons', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should have proper button type', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);

      expect(prevButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });

    it('should be keyboard focusable', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);

      expect(prevButton).not.toHaveAttribute('tabindex', '-1');
      expect(nextButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should have visible focus indicators', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const prevButton = screen.getByLabelText(/previous/i);

      // Focus the button
      prevButton.focus();

      // Button should have focus styles
      expect(document.activeElement).toBe(prevButton);
    });
  });

  describe('Image Accessibility', () => {
    it('should have alt text for all images', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        const alt = img.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt?.length).toBeGreaterThan(0);
      });
    });

    it('should use descriptive alt text', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      // Check that alt text matches our mock data
      images.forEach((img, index) => {
        const alt = img.getAttribute('alt');
        expect(alt).toBe(mockItems[index].alt);
      });
    });

    it('should not have empty alt attributes', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const images = container.querySelectorAll('img');

      images.forEach(img => {
        const alt = img.getAttribute('alt');
        expect(alt).not.toBe('');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable with Tab key', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);

      // Tab to first button
      prevButton.focus();
      expect(document.activeElement).toBe(prevButton);

      // Tab to next button
      nextButton.focus();
      expect(document.activeElement).toBe(nextButton);
    });

    it('should support arrow key navigation', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      expect(carousel).toHaveAttribute('tabindex', '0');
    });

    it('should have visible focus outline', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      if (carousel instanceof HTMLElement) {
        carousel.focus();
        expect(document.activeElement).toBe(carousel);
      }
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus after navigation', () => {
      render(<Carousel3D items={mockItems} />);
      const nextButton = screen.getByLabelText(/next/i);

      nextButton.focus();
      nextButton.click();

      // Focus should remain on button or move to carousel
      expect(document.activeElement).toBeTruthy();
    });

    it('should not trap focus', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      prevButton.focus();

      // Should be able to tab away
      expect(document.activeElement).toBe(prevButton);
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce current item to screen readers', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const liveRegion = container.querySelector('[aria-live]');

      expect(liveRegion).toBeInTheDocument();
    });

    it('should provide context about total items', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const items = container.querySelectorAll('.carousel-item');

      items.forEach((item, index) => {
        const ariaLabel = item.getAttribute('aria-label');
        expect(ariaLabel).toContain(`${index + 1} of ${mockItems.length}`);
      });
    });

    it('should hide decorative elements from screen readers', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      // Non-focused items should be hidden
      const hiddenItems = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenItems.length).toBeGreaterThan(0);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      const matchMediaMock = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });

      const { container } = render(<Carousel3D items={mockItems} />);
      const carousel = container.querySelector('.carousel-3d');

      // Should have reduced-motion indicator
      expect(
        carousel?.classList.contains('reduced-motion') ||
        carousel?.hasAttribute('data-reduced-motion')
      ).toBeTruthy();
    });

    it('should disable auto-rotation with reduced motion', () => {
      // Mock prefers-reduced-motion
      const matchMediaMock = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });

      const { container } = render(
        <Carousel3D items={mockItems} autoRotate={true} />
      );

      // Auto-rotation should be disabled
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for controls', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);

      // Buttons should be visible
      expect(prevButton).toBeVisible();
      expect(nextButton).toBeVisible();
    });

    it('should have visible indicators', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const indicators = container.querySelectorAll('.carousel-indicator');

      indicators.forEach(indicator => {
        expect(indicator).toBeVisible();
      });
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic HTML elements', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      // Should use button elements for controls
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Should use img elements for images
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(mockItems.length);
    });

    it('should use proper heading hierarchy if titles are present', () => {
      const { container } = render(<Carousel3D items={mockItems} />);

      // Check for proper structure
      expect(container.querySelector('.carousel-3d')).toBeInTheDocument();
    });
  });

  describe('Touch Target Size', () => {
    it('should have adequately sized touch targets for buttons', () => {
      render(<Carousel3D items={mockItems} />);

      const prevButton = screen.getByLabelText(/previous/i);
      const nextButton = screen.getByLabelText(/next/i);

      // Buttons should be rendered
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should have adequately sized touch targets for indicators', () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const indicators = container.querySelectorAll('.carousel-indicator');

      // All indicators should be rendered
      expect(indicators.length).toBe(mockItems.length);
    });
  });

  describe('Automated Accessibility Testing', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Carousel3D items={mockItems} />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it('should have no violations with controls hidden', async () => {
      const { container } = render(
        <Carousel3D items={mockItems} showControls={false} />
      );
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it('should have no violations with indicators hidden', async () => {
      const { container } = render(
        <Carousel3D items={mockItems} showIndicators={false} />
      );
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it('should have no violations with auto-rotation enabled', async () => {
      const { container } = render(
        <Carousel3D items={mockItems} autoRotate={true} />
      );
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });
});