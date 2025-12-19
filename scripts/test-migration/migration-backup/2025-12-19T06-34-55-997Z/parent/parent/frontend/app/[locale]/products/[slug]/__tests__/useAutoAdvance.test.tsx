/**
 * useAutoAdvance Hook Tests
 * Tests for automatic image advancement timer management
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoAdvance } from '../hooks/useAutoAdvance';

describe('useAutoAdvance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should start timer and call onAdvance after interval when enabled', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: false,
        isVisible: true,
        isZoomed: false,
        isAnimating: false,
        onAdvance,
      })
    );

    // Timer should not have fired yet
    expect(onAdvance).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(interval);
    });

    // onAdvance should have been called
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('should not start timer when enabled is false', () => {
    const onAdvance = jest.fn();

    renderHook(() =>
      useAutoAdvance({
        enabled: false,
        interval: 5000,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: false,
        isVisible: true,
        isZoomed: false,
        isAnimating: false,
        onAdvance,
      })
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should not start timer when there is only one image', () => {
    const onAdvance = jest.fn();

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval: 5000,
        transitionDuration: 1000,
        imagesCount: 1,
        isPaused: false,
        isVisible: true,
        isZoomed: false,
        isAnimating: false,
        onAdvance,
      })
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should pause timer when isPaused is true', () => {
    const onAdvance = jest.fn();

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval: 5000,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: true,
        isVisible: true,
        isZoomed: false,
        isAnimating: false,
        onAdvance,
      })
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should pause timer when isZoomed is true', () => {
    const onAdvance = jest.fn();

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval: 5000,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: false,
        isVisible: true,
        isZoomed: true,
        isAnimating: false,
        onAdvance,
      })
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should pause timer when isAnimating is true', () => {
    const onAdvance = jest.fn();

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval: 5000,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: false,
        isVisible: true,
        isZoomed: false,
        isAnimating: true,
        onAdvance,
      })
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should pause timer when isVisible is false', () => {
    const onAdvance = jest.fn();

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval: 5000,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: false,
        isVisible: false,
        isZoomed: false,
        isAnimating: false,
        onAdvance,
      })
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should restart timer when isPaused changes from true to false', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ isPaused }) =>
        useAutoAdvance({
          enabled: true,
          interval,
          transitionDuration: 1000,
          imagesCount: 3,
          isPaused,
          isVisible: true,
          isZoomed: false,
          isAnimating: false,
          onAdvance,
        }),
      { initialProps: { isPaused: true } }
    );

    // Timer should not fire while paused
    act(() => {
      jest.advanceTimersByTime(interval);
    });
    expect(onAdvance).not.toHaveBeenCalled();

    // Unpause
    rerender({ isPaused: false });

    // Timer should now fire
    act(() => {
      jest.advanceTimersByTime(interval);
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('should stop timer when isPaused changes from false to true', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ isPaused }) =>
        useAutoAdvance({
          enabled: true,
          interval,
          transitionDuration: 1000,
          imagesCount: 3,
          isPaused,
          isVisible: true,
          isZoomed: false,
          isAnimating: false,
          onAdvance,
        }),
      { initialProps: { isPaused: false } }
    );

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(interval / 2);
    });

    // Pause
    rerender({ isPaused: true });

    // Advance time past original interval
    act(() => {
      jest.advanceTimersByTime(interval);
    });

    // Should not have fired
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should restart timer when isZoomed changes from true to false', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ isZoomed }) =>
        useAutoAdvance({
          enabled: true,
          interval,
          transitionDuration: 1000,
          imagesCount: 3,
          isPaused: false,
          isVisible: true,
          isZoomed,
          isAnimating: false,
          onAdvance,
        }),
      { initialProps: { isZoomed: true } }
    );

    // Timer should not fire while zoomed
    act(() => {
      jest.advanceTimersByTime(interval);
    });
    expect(onAdvance).not.toHaveBeenCalled();

    // Unzoom
    rerender({ isZoomed: false });

    // Timer should now fire
    act(() => {
      jest.advanceTimersByTime(interval);
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('should restart timer when isVisible changes from false to true', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ isVisible }) =>
        useAutoAdvance({
          enabled: true,
          interval,
          transitionDuration: 1000,
          imagesCount: 3,
          isPaused: false,
          isVisible,
          isZoomed: false,
          isAnimating: false,
          onAdvance,
        }),
      { initialProps: { isVisible: false } }
    );

    // Timer should not fire while not visible
    act(() => {
      jest.advanceTimersByTime(interval);
    });
    expect(onAdvance).not.toHaveBeenCalled();

    // Become visible
    rerender({ isVisible: true });

    // Timer should now fire
    act(() => {
      jest.advanceTimersByTime(interval);
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('should clean up timer on unmount', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    const { unmount } = renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: false,
        isVisible: true,
        isZoomed: false,
        isAnimating: false,
        onAdvance,
      })
    );

    // Unmount before timer fires
    unmount();

    // Advance time
    act(() => {
      jest.advanceTimersByTime(interval);
    });

    // Should not have fired after unmount
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should use custom interval value', () => {
    const onAdvance = jest.fn();
    const customInterval = 3000;

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval: customInterval,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: false,
        isVisible: true,
        isZoomed: false,
        isAnimating: false,
        onAdvance,
      })
    );

    // Should not fire before custom interval
    act(() => {
      jest.advanceTimersByTime(customInterval - 100);
    });
    expect(onAdvance).not.toHaveBeenCalled();

    // Should fire at custom interval
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('should reset timer when onAdvance callback changes', () => {
    const onAdvance1 = jest.fn();
    const onAdvance2 = jest.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ onAdvance }) =>
        useAutoAdvance({
          enabled: true,
          interval,
          transitionDuration: 1000,
          imagesCount: 3,
          isPaused: false,
          isVisible: true,
          isZoomed: false,
          isAnimating: false,
          onAdvance,
        }),
      { initialProps: { onAdvance: onAdvance1 } }
    );

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(interval / 2);
    });

    // Change callback
    rerender({ onAdvance: onAdvance2 });

    // Complete the interval from the restart point
    act(() => {
      jest.advanceTimersByTime(interval);
    });

    // New callback should have been called
    expect(onAdvance1).not.toHaveBeenCalled();
    expect(onAdvance2).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple pause conditions simultaneously', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    renderHook(() =>
      useAutoAdvance({
        enabled: true,
        interval,
        transitionDuration: 1000,
        imagesCount: 3,
        isPaused: true,
        isVisible: false,
        isZoomed: true,
        isAnimating: true,
        onAdvance,
      })
    );

    act(() => {
      jest.advanceTimersByTime(interval * 2);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('should resume when all pause conditions are cleared', () => {
    const onAdvance = jest.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ isPaused, isZoomed, isAnimating, isVisible }) =>
        useAutoAdvance({
          enabled: true,
          interval,
          transitionDuration: 1000,
          imagesCount: 3,
          isPaused,
          isVisible,
          isZoomed,
          isAnimating,
          onAdvance,
        }),
      {
        initialProps: {
          isPaused: true,
          isZoomed: true,
          isAnimating: true,
          isVisible: false,
        },
      }
    );

    // Clear all pause conditions
    rerender({
      isPaused: false,
      isZoomed: false,
      isAnimating: false,
      isVisible: true,
    });

    // Timer should fire
    act(() => {
      jest.advanceTimersByTime(interval);
    });

    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
