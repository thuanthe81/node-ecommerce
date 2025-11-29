/**
 * Property-Based Tests for ContentForm
 * Feature: admin-content-edit
 */

import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import ContentForm from '../ContentForm';
import { Content } from '@/lib/content-api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock ImagePickerModal
jest.mock('../ImagePickerModal', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock content-api
jest.mock('@/lib/content-api', () => ({
  ...jest.requireActual('@/lib/content-api'),
  getContentTypes: jest.fn().mockResolvedValue(['PAGE', 'FAQ', 'BANNER', 'HOMEPAGE_SECTION']),
}));

describe('ContentForm Property-Based Tests', () => {
  /**
   * Feature: admin-content-edit, Property 2: All editable fields are present
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 2.7
   *
   * For any content item, when the edit form is displayed, all standard content fields
   * (slug, type, titleEn, titleVi, contentEn, contentVi, displayOrder, isPublished)
   * should be editable in the form
   */
  test('Property 2: All editable fields are present', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary content objects
        fc.record({
          id: fc.uuid(),
          slug: fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
          type: fc.constantFrom('PAGE', 'FAQ', 'BANNER'),
          titleEn: fc.string({ minLength: 1, maxLength: 200 }),
          titleVi: fc.string({ minLength: 1, maxLength: 200 }),
          contentEn: fc.string({ minLength: 1, maxLength: 5000 }),
          contentVi: fc.string({ minLength: 1, maxLength: 5000 }),
          imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
          linkUrl: fc.option(fc.webUrl(), { nil: undefined }),
          displayOrder: fc.integer({ min: 0, max: 1000 }),
          isPublished: fc.boolean(),
          createdAt: fc.date().map(d => d.toISOString()),
          updatedAt: fc.date().map(d => d.toISOString()),
        }),
        (content: Content) => {
          const mockOnSubmit = jest.fn();
          const mockOnCancel = jest.fn();

          const { container, unmount } = render(
            <ContentForm
              content={content}
              onSubmit={mockOnSubmit}
              onCancel={mockOnCancel}
            />
          );

          try {

          // Requirement 2.1: Slug field should be editable
          const slugInput = container.querySelector('input[name="slug"]') as HTMLInputElement;
          expect(slugInput).toBeInTheDocument();
          expect(slugInput).not.toBeDisabled();
          expect(slugInput.value).toBe(content.slug);

          // Requirement 2.2: Content type field should be editable
          const typeSelect = container.querySelector('select[name="type"]') as HTMLSelectElement;
          expect(typeSelect).toBeInTheDocument();
          expect(typeSelect).not.toBeDisabled();
          expect(typeSelect.value).toBe(content.type);

          // Requirement 2.3: English title should be editable (visible by default on English tab)
          const titleEnInput = container.querySelector('input[name="titleEn"]') as HTMLInputElement;
          expect(titleEnInput).toBeInTheDocument();
          expect(titleEnInput).not.toBeDisabled();
          expect(titleEnInput.value).toBe(content.titleEn);

          // Requirement 2.4: English content should be editable (visible by default on English tab)
          const contentEnTextarea = container.querySelector('textarea[name="contentEn"]') as HTMLTextAreaElement;
          expect(contentEnTextarea).toBeInTheDocument();
          expect(contentEnTextarea).not.toBeDisabled();
          expect(contentEnTextarea.value).toBe(content.contentEn);

          // Switch to Vietnamese tab to check Vietnamese fields
          const vietnameseTabButton = screen.getByText('Vietnamese Content');
          fireEvent.click(vietnameseTabButton);

          // Requirement 2.3: Vietnamese title should be editable (visible on Vietnamese tab)
          const titleViInput = container.querySelector('input[name="titleVi"]') as HTMLInputElement;
          expect(titleViInput).toBeInTheDocument();
          expect(titleViInput).not.toBeDisabled();
          expect(titleViInput.value).toBe(content.titleVi);

          // Requirement 2.4: Vietnamese content should be editable (visible on Vietnamese tab)
          const contentViTextarea = container.querySelector('textarea[name="contentVi"]') as HTMLTextAreaElement;
          expect(contentViTextarea).toBeInTheDocument();
          expect(contentViTextarea).not.toBeDisabled();
          expect(contentViTextarea.value).toBe(content.contentVi);

          // Requirement 2.6: Display order should be editable (visible on both tabs)
          const displayOrderInput = container.querySelector('input[name="displayOrder"]') as HTMLInputElement;
          expect(displayOrderInput).toBeInTheDocument();
          expect(displayOrderInput).not.toBeDisabled();
          expect(parseInt(displayOrderInput.value)).toBe(content.displayOrder);

          // Requirement 2.7: isPublished status should be toggleable (visible on both tabs)
          const isPublishedCheckbox = container.querySelector('input[name="isPublished"]') as HTMLInputElement;
          expect(isPublishedCheckbox).toBeInTheDocument();
          expect(isPublishedCheckbox).not.toBeDisabled();
          expect(isPublishedCheckbox.checked).toBe(content.isPublished);
          } finally {
            // Clean up after each test run
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
