import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useTooltip } from '../../components/Tooltip/hooks/useTooltip';

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en'
}));

// Mock getBoundingClientRect
const mockGetBoundingClientRect = jest.fn();
Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;

describe('useTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default getBoundingClientRect mock
    mockGetBoundingClientRect.mockReturnValue({
      left: 100,
      top: 100,
      right: 200,
      bottom: 150,
      width: 100,
      height: 50,
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useTooltip('Test content'));

    expect(result.current.isVisible).toBe(false);
    expect(result.current.position).toEqual({ x: 0, y: 0 });
    expect(typeof result.current.showTooltip).toBe('function');
    expect(typeof result.current.hideTooltip).toBe('function');
    expect(result.current.tooltipProps).toHaveProperty('onMouseEnter');
    expect(result.current.tooltipProps).toHaveProperty('onMouseLeave');
    expect(result.current.tooltipProps).toHaveProperty('onFocus');
    expect(result.current.tooltipProps).toHaveProperty('onBlur');
    expect(result.current.tooltipProps['aria-describedby']).toBeDefined();
  });

  it('should not provide aria-describedby when no content', () => {
    const { result } = renderHook(() => useTooltip());

    expect(result.current.tooltipProps['aria-describedby']).toBeUndefined();
  });

  it('should show tooltip after delay on mouse enter', () => {
    const { result } = renderHook(() => useTooltip('Test content', 200));

    const mockEvent = {
      currentTarget: document.createElement('div'),
    } as React.MouseEvent;

    act(() => {
      result.current.tooltipProps.onMouseEnter(mockEvent);
    });

    // Should not be visible immediately
    expect(result.current.isVisible).toBe(false);

    // Fast-forward time by 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('should hide tooltip after delay on mouse leave', () => {
    const { result } = renderHook(() => useTooltip('Test content'));

    const mockEvent = {
      currentTarget: document.createElement('div'),
    } as React.MouseEvent;

    // First show the tooltip
    act(() => {
      result.current.tooltipProps.onMouseEnter(mockEvent);
      jest.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(true);

    // Then hide it
    act(() => {
      result.current.tooltipProps.onMouseLeave();
    });

    // Should still be visible immediately
    expect(result.current.isVisible).toBe(true);

    // Fast-forward time by 100ms (hide delay)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should show tooltip on focus event', () => {
    const { result } = renderHook(() => useTooltip('Test content'));

    const mockEvent = {
      currentTarget: document.createElement('div'),
    } as React.FocusEvent;

    act(() => {
      result.current.tooltipProps.onFocus(mockEvent);
      jest.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(true);
  });

  it('should hide tooltip on blur event', () => {
    const { result } = renderHook(() => useTooltip('Test content'));

    const mockEvent = {
      currentTarget: document.createElement('div'),
    } as React.FocusEvent;

    // First show the tooltip
    act(() => {
      result.current.tooltipProps.onFocus(mockEvent);
      jest.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(true);

    // Then blur
    act(() => {
      result.current.tooltipProps.onBlur();
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should not show tooltip when content is empty', () => {
    const { result } = renderHook(() => useTooltip(''));

    const mockEvent = {
      currentTarget: document.createElement('div'),
    } as React.MouseEvent;

    act(() => {
      result.current.tooltipProps.onMouseEnter(mockEvent);
      jest.advanceTimersByTime(200);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('should cleanup timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useTooltip('Test content'));

    const mockEvent = {
      currentTarget: document.createElement('div'),
    } as React.MouseEvent;

    act(() => {
      result.current.tooltipProps.onMouseEnter(mockEvent);
    });

    // Unmount before timeout completes
    unmount();

    // Advance time - should not throw or cause issues
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // No assertions needed - just ensuring no errors occur
  });

  it('should respect reduced motion preference for timing', () => {
    // Mock reduced motion preference
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useTooltip('Test content', 200));

    const mockEvent = {
      currentTarget: document.createElement('div'),
    } as React.MouseEvent;

    act(() => {
      result.current.tooltipProps.onMouseEnter(mockEvent);
    });

    // Should show faster with reduced motion (50ms max instead of 200ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(result.current.isVisible).toBe(true);

    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });
});