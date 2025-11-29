/**
 * Rendering Helper Utilities
 *
 * Helper functions for rendering components with common providers
 * and test setup.
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

/**
 * Default messages for testing
 */
const defaultMessages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'An error occurred',
  },
};

/**
 * Wrapper component that provides common test context
 */
interface TestProvidersProps {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, any>;
}

function TestProviders({
  children,
  locale = 'en',
  messages = defaultMessages
}: TestProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Custom render function that wraps components with test providers
 *
 * @param ui - The component to render
 * @param options - Render options including custom locale and messages
 * @returns RenderResult from @testing-library/react
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
  messages?: Record<string, any>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { locale, messages: customMessages, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <TestProviders locale={locale} messages={customMessages}>
        {children}
      </TestProviders>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Renders a component and waits for it to be fully loaded
 *
 * @param ui - The component to render
 * @param options - Render options
 * @returns RenderResult after component is loaded
 */
export async function renderAndWaitForLoad(
  ui: ReactElement,
  options?: CustomRenderOptions
): Promise<RenderResult> {
  const result = renderWithProviders(ui, options);

  // Wait for any loading states to complete
  await new Promise((resolve) => setTimeout(resolve, 0));

  return result;
}

/**
 * Creates a mock function that tracks call arguments
 *
 * @returns Mock function with call tracking
 */
export function createMockCallback<T extends (...args: any[]) => any>(): jest.Mock<
  ReturnType<T>,
  Parameters<T>
> {
  return jest.fn();
}

/**
 * Simulates a viewport resize for responsive testing
 *
 * @param width - Viewport width in pixels
 * @param height - Viewport height in pixels
 */
export function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  window.dispatchEvent(new Event('resize'));
}

/**
 * Viewport presets for common device sizes
 */
export const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
} as const;

/**
 * Sets viewport to a preset size
 *
 * @param preset - Viewport preset name
 */
export function setViewportPreset(preset: keyof typeof VIEWPORT_SIZES): void {
  const { width, height } = VIEWPORT_SIZES[preset];
  setViewport(width, height);
}

/**
 * Waits for an element to be removed from the DOM
 *
 * @param element - The element to wait for removal
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForRemoval(
  element: HTMLElement,
  timeout: number = 1000
): Promise<void> {
  const startTime = Date.now();

  while (document.contains(element)) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Element was not removed within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Gets all text content from an element, including nested elements
 *
 * @param element - The element to extract text from
 * @returns Combined text content
 */
export function getAllTextContent(element: HTMLElement): string {
  return element.textContent || '';
}

/**
 * Checks if an element has a specific CSS class
 *
 * @param element - The element to check
 * @param className - The class name to look for
 * @returns true if element has the class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Gets computed styles for an element
 *
 * @param element - The element to get styles for
 * @returns CSSStyleDeclaration object
 */
export function getComputedStyles(element: HTMLElement): CSSStyleDeclaration {
  return window.getComputedStyle(element);
}
