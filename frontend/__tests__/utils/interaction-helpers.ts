/**
 * Interaction Helper Utilities
 *
 * Helper functions for simulating user interactions in tests.
 */

import { fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Simulates a click event on an element
 *
 * @param element - The element to click
 */
export async function clickElement(element: HTMLElement): Promise<void> {
  const user = userEvent.setup();
  await user.click(element);
}

/**
 * Simulates typing text into an input field
 *
 * @param element - The input element
 * @param text - The text to type
 */
export async function typeIntoInput(
  element: HTMLElement,
  text: string
): Promise<void> {
  const user = userEvent.setup();
  await user.clear(element);
  await user.type(element, text);
}

/**
 * Simulates a form submission
 *
 * @param form - The form element
 */
export function submitForm(form: HTMLFormElement): void {
  fireEvent.submit(form);
}

/**
 * Simulates a keyboard event
 *
 * @param element - The target element
 * @param key - The key to press (e.g., 'Enter', 'Escape')
 */
export async function pressKey(
  element: HTMLElement,
  key: string
): Promise<void> {
  const user = userEvent.setup();
  await user.type(element, `{${key}}`);
}

/**
 * Simulates a drag and drop operation
 *
 * @param source - The element to drag
 * @param target - The element to drop onto
 */
export function dragAndDrop(source: HTMLElement, target: HTMLElement): void {
  fireEvent.dragStart(source);
  fireEvent.dragEnter(target);
  fireEvent.dragOver(target);
  fireEvent.drop(target);
  fireEvent.dragEnd(source);
}

/**
 * Simulates a mouse drag operation
 *
 * @param element - The element to drag
 * @param startX - Starting X coordinate
 * @param startY - Starting Y coordinate
 * @param endX - Ending X coordinate
 * @param endY - Ending Y coordinate
 */
export function simulateMouseDrag(
  element: HTMLElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): void {
  fireEvent.mouseDown(element, { clientX: startX, clientY: startY });
  fireEvent.mouseMove(element, { clientX: endX, clientY: endY });
  fireEvent.mouseUp(element, { clientX: endX, clientY: endY });
}

/**
 * Simulates a touch swipe gesture
 *
 * @param element - The element to swipe on
 * @param startX - Starting X coordinate
 * @param endX - Ending X coordinate
 */
export function simulateTouchSwipe(
  element: HTMLElement,
  startX: number,
  endX: number
): void {
  const startY = 0;
  const endY = 0;

  fireEvent.touchStart(element, {
    touches: [{ clientX: startX, clientY: startY }],
  });

  fireEvent.touchMove(element, {
    touches: [{ clientX: endX, clientY: endY }],
  });

  fireEvent.touchEnd(element, {
    changedTouches: [{ clientX: endX, clientY: endY }],
  });
}

/**
 * Simulates hovering over an element
 *
 * @param element - The element to hover over
 */
export async function hoverElement(element: HTMLElement): Promise<void> {
  const user = userEvent.setup();
  await user.hover(element);
}

/**
 * Simulates unhovering (mouse leave) from an element
 *
 * @param element - The element to unhover from
 */
export async function unhoverElement(element: HTMLElement): Promise<void> {
  const user = userEvent.setup();
  await user.unhover(element);
}

/**
 * Simulates focusing an element
 *
 * @param element - The element to focus
 */
export function focusElement(element: HTMLElement): void {
  element.focus();
}

/**
 * Simulates blurring an element
 *
 * @param element - The element to blur
 */
export function blurElement(element: HTMLElement): void {
  element.blur();
}

/**
 * Simulates selecting an option from a select element
 *
 * @param select - The select element
 * @param value - The value to select
 */
export async function selectOption(
  select: HTMLElement,
  value: string
): Promise<void> {
  const user = userEvent.setup();
  await user.selectOptions(select, value);
}

/**
 * Simulates checking/unchecking a checkbox
 *
 * @param checkbox - The checkbox element
 * @param checked - Whether to check or uncheck
 */
export async function toggleCheckbox(
  checkbox: HTMLElement,
  checked: boolean
): Promise<void> {
  const user = userEvent.setup();

  if (checked && !(checkbox as HTMLInputElement).checked) {
    await user.click(checkbox);
  } else if (!checked && (checkbox as HTMLInputElement).checked) {
    await user.click(checkbox);
  }
}

/**
 * Waits for an element to receive focus
 *
 * @param element - The element to wait for focus
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForFocus(
  element: HTMLElement,
  timeout: number = 1000
): Promise<void> {
  await waitFor(
    () => {
      expect(document.activeElement).toBe(element);
    },
    { timeout }
  );
}

/**
 * Simulates a double click on an element
 *
 * @param element - The element to double click
 */
export async function doubleClickElement(element: HTMLElement): Promise<void> {
  const user = userEvent.setup();
  await user.dblClick(element);
}

/**
 * Simulates a right click (context menu) on an element
 *
 * @param element - The element to right click
 */
export function rightClickElement(element: HTMLElement): void {
  fireEvent.contextMenu(element);
}

/**
 * Simulates scrolling an element
 *
 * @param element - The element to scroll
 * @param scrollTop - The scroll position
 */
export function scrollElement(element: HTMLElement, scrollTop: number): void {
  Object.defineProperty(element, 'scrollTop', {
    writable: true,
    configurable: true,
    value: scrollTop,
  });
  fireEvent.scroll(element);
}

/**
 * Waits for an animation to complete
 *
 * @param duration - Animation duration in milliseconds
 */
export async function waitForAnimation(duration: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Simulates a file upload
 *
 * @param input - The file input element
 * @param files - Array of files to upload
 */
export async function uploadFiles(
  input: HTMLElement,
  files: File[]
): Promise<void> {
  const user = userEvent.setup();
  await user.upload(input, files);
}

/**
 * Creates a mock File object for testing
 *
 * @param name - File name
 * @param content - File content
 * @param type - MIME type
 * @returns Mock File object
 */
export function createMockFile(
  name: string,
  content: string = 'test content',
  type: string = 'text/plain'
): File {
  return new File([content], name, { type });
}

/**
 * Creates a mock image File object for testing
 *
 * @param name - File name
 * @returns Mock image File object
 */
export function createMockImageFile(name: string = 'test-image.jpg'): File {
  return new File([''], name, { type: 'image/jpeg' });
}
