/**
 * useVisibilityDetection Hook Tests
 * Tests for viewport and tab visibility detection
 */

import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useVisibilityDetection } from '../hooks/useVisibilityDetection';

describe('useVisibilityDetection', () => {
  let mockIntersectionObserver: jest.Mock;
  let intersectionObserverCallback: IntersectionObserverCallback;

  beforeEach(() => {
    // Mock IntersectionObserver
    mockIntersectionObserver = jest.fn();
    intersectionObserverCallback = jest.fn();

    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      intersectionObserverCallback = callback;
      return {
        observe: mockIntersectionObserver,
        disconnect: jest.fn(),
        unobserve: jest.fn(),
        takeRecords: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      };
    }) as any;

    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call onVisibilityChange with true when element is in viewport and tab is active', () => {
    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };

    renderHook(() =>
      useVisibilityDetection({
        elementRef,
        onVisibilityChange,
      })
    );

    // Simulate element entering viewport
    intersectionObserverCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );

    expect(onVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('should call onVisibilityChange with false when element is not in viewport', () => {
    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };

    renderHook(() =>
      useVisibilityDetection({
        elementRef,
        onVisibilityChange,
      })
    );

    // Simulate element leaving viewport
    intersectionObserverCallback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );

    expect(onVisibilityChange).toHaveBeenCalledWith(false);
  });

  it('should call onVisibilityChange with false when tab becomes hidden', () => {
    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };

    renderHook(() =>
      useVisibilityDetection({
        elementRef,
        onVisibilityChange,
      })
    );

    // Element is in viewport
    intersectionObserverCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );

    // Clear previous calls
    onVisibilityChange.mockClear();

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => true,
    });

    // Trigger visibilitychange event
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);

    expect(onVisibilityChange).toHaveBeenCalledWith(false);
  });

  it('should observe the element when mounted', () => {
    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };

    renderHook(() =>
      useVisibilityDetection({
        elementRef,
        onVisibilityChange,
      })
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(elementRef.current);
  });

  it('should use custom threshold when provided', () => {
    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };
    const customThreshold = 0.75;

    renderHook(() =>
      useVisibilityDetection({
        elementRef,
        onVisibilityChange,
        threshold: customThreshold,
      })
    );

    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: customThreshold }
    );
  });

  it('should cleanup observer on unmount', () => {
    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };
    const disconnectMock = jest.fn();

    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: disconnectMock,
      unobserve: jest.fn(),
      takeRecords: jest.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    })) as any;

    const { unmount } = renderHook(() =>
      useVisibilityDetection({
        elementRef,
        onVisibilityChange,
      })
    );

    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });

  it('should handle graceful degradation when IntersectionObserver is not available', () => {
    // Remove IntersectionObserver
    const originalIO = global.IntersectionObserver;
    (global as any).IntersectionObserver = undefined;

    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };

    // Should not throw
    expect(() => {
      renderHook(() =>
        useVisibilityDetection({
          elementRef,
          onVisibilityChange,
        })
      );
    }).not.toThrow();

    // Should still call onVisibilityChange with true (assumes visible)
    expect(onVisibilityChange).toHaveBeenCalledWith(true);

    // Restore
    global.IntersectionObserver = originalIO;
  });

  it('should handle graceful degradation when Page Visibility API is not available', () => {
    // Remove hidden property
    const descriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    delete (document as any).hidden;

    const onVisibilityChange = jest.fn();
    const elementRef = { current: document.createElement('div') };

    // Should not throw
    expect(() => {
      renderHook(() =>
        useVisibilityDetection({
          elementRef,
          onVisibilityChange,
        })
      );
    }).not.toThrow();

    // Restore
    if (descriptor) {
      Object.defineProperty(document, 'hidden', descriptor);
    }
  });
});
