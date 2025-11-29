/**
 * Component Comparison Utilities
 *
 * Utilities for comparing components before and after refactoring
 * to ensure functional equivalence.
 */

import { ReactElement } from 'react';
import { render, RenderResult } from '@testing-library/react';

/**
 * Compares the DOM structure of two rendered components
 *
 * @param original - The original component element
 * @param refactored - The refactored component element
 * @returns true if DOM structures are equivalent
 */
export function compareDOMStructure(
  original: ReactElement,
  refactored: ReactElement
): boolean {
  const originalRender = render(original);
  const refactoredRender = render(refactored);

  try {
    const originalHTML = originalRender.container.innerHTML;
    const refactoredHTML = refactoredRender.container.innerHTML;

    // Normalize whitespace for comparison
    const normalizedOriginal = normalizeHTML(originalHTML);
    const normalizedRefactored = normalizeHTML(refactoredHTML);

    return normalizedOriginal === normalizedRefactored;
  } finally {
    originalRender.unmount();
    refactoredRender.unmount();
  }
}

/**
 * Normalizes HTML string for comparison by removing extra whitespace
 * and standardizing formatting
 */
function normalizeHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/>\s+</g, '><') // Remove spaces between tags
    .trim();
}

/**
 * Extracts all data attributes from a rendered component
 *
 * @param element - The rendered component
 * @returns Object containing all data attributes
 */
export function extractDataAttributes(element: RenderResult): Record<string, string> {
  const dataAttrs: Record<string, string> = {};
  const allElements = element.container.querySelectorAll('[data-*]');

  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    });
  });

  return dataAttrs;
}

/**
 * Compares props interfaces between original and refactored components
 *
 * @param originalProps - Props object from original component
 * @param refactoredProps - Props object from refactored component
 * @returns true if props interfaces are compatible
 */
export function comparePropsInterface<T extends Record<string, any>>(
  originalProps: T,
  refactoredProps: T
): boolean {
  const originalKeys = Object.keys(originalProps).sort();
  const refactoredKeys = Object.keys(refactoredProps).sort();

  // Check if all original keys exist in refactored
  return originalKeys.every((key) => refactoredKeys.includes(key));
}

/**
 * Extracts all event handlers from a component's props
 *
 * @param props - Component props object
 * @returns Array of event handler names
 */
export function extractEventHandlers(props: Record<string, any>): string[] {
  return Object.keys(props).filter(
    (key) => key.startsWith('on') && typeof props[key] === 'function'
  );
}

/**
 * Compares callback signatures between original and refactored components
 *
 * @param originalHandlers - Event handlers from original component
 * @param refactoredHandlers - Event handlers from refactored component
 * @returns true if handler signatures match
 */
export function compareCallbackSignatures(
  originalHandlers: Record<string, Function>,
  refactoredHandlers: Record<string, Function>
): boolean {
  const originalNames = Object.keys(originalHandlers).sort();
  const refactoredNames = Object.keys(refactoredHandlers).sort();

  // Check if all original handlers exist in refactored
  if (originalNames.length !== refactoredNames.length) {
    return false;
  }

  return originalNames.every((name, index) => name === refactoredNames[index]);
}

/**
 * Counts the number of lines in a component file
 *
 * @param fileContent - The content of the component file
 * @returns Number of lines
 */
export function countComponentLines(fileContent: string): number {
  return fileContent.split('\n').length;
}

/**
 * Identifies if a component should be refactored based on line count
 *
 * @param fileContent - The content of the component file
 * @param threshold - Line count threshold (default: 300)
 * @returns true if component exceeds threshold
 */
export function isRefactoringCandidate(
  fileContent: string,
  threshold: number = 300
): boolean {
  return countComponentLines(fileContent) > threshold;
}
