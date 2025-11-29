/**
 * Hook for managing carousel rotation and drag state
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { CarouselItem, CarouselState } from '../types';
import { calculateFocusedIndex } from '../utils/calculations';
import { easeInOutCubic } from '../utils/easing';
import { throttle } from '../utils/performance';

/**
 * Configuration for carousel state management
 */
export interface CarouselStateConfig {
  items: CarouselItem[];
  animationDuration: number;
  dragSensitivity: number;
  prefersReducedMotion: boolean;
  itemCount: number;
}

/**
 * Return value from useCarouselState hook
 */
export interface CarouselStateReturn {
  state: CarouselState;
  animateToRotation: (targetRotation: number, duration?: number) => void;
  startDrag: (clientX: number) => void;
  handleDrag: (clientX: number) => void;
  endDrag: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  handleItemClick: (index: number) => void;
  srAnnouncement: string;
}

/**
 * Custom hook for managing carousel rotation and drag state
 */
export function useCarouselState(
  config: CarouselStateConfig,
  onAutoRotationPause?: () => void
): CarouselStateReturn {
  const {
    items,
    animationDuration,
    dragSensitivity,
    prefersReducedMotion,
    itemCount,
  } = config;

  const [state, setState] = useState<CarouselState>({
    rotation: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartRotation: 0,
    isAnimating: false,
    focusedIndex: 0,
  });

  const [dragVelocity, setDragVelocity] = useState(0);
  const lastDragTimeRef = useRef(0);
  const lastDragXRef = useRef(0);
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const newFocusedIndex = calculateFocusedIndex(state.rotation, itemCount);
    if (newFocusedIndex !== state.focusedIndex) {
      setState((prev) => ({ ...prev, focusedIndex: newFocusedIndex }));

      const focusedItem = items[newFocusedIndex];
      if (focusedItem) {
        const itemNum = newFocusedIndex + 1;
        const title = focusedItem.title || focusedItem.alt;
        setSrAnnouncement('Showing item ' + itemNum + ' of ' + itemCount + ': ' + title);
      }
    }
  }, [state.rotation, items, itemCount, state.focusedIndex]);

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  const animateToRotation = useCallback(
    (targetRotation: number, duration?: number) => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      const startRotation = state.rotation;
      const startTime = performance.now();
      const animDuration = duration ?? animationDuration;

      if (prefersReducedMotion) {
        setState((prev) => ({
          ...prev,
          rotation: targetRotation,
          isAnimating: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, isAnimating: true }));

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animDuration, 1);
        const easedProgress = easeInOutCubic(progress);
        const currentRotation =
          startRotation + (targetRotation - startRotation) * easedProgress;

        setState((prev) => ({ ...prev, rotation: currentRotation }));

        if (progress < 1) {
          animationFrameIdRef.current = requestAnimationFrame(animate);
        } else {
          setState((prev) => ({
            ...prev,
            rotation: targetRotation,
            isAnimating: false,
          }));
          animationFrameIdRef.current = null;
        }
      };

      animationFrameIdRef.current = requestAnimationFrame(animate);
    },
    [state.rotation, animationDuration, prefersReducedMotion]
  );

  const startDrag = useCallback(
    (clientX: number) => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      onAutoRotationPause?.();

      setState((prev) => ({
        ...prev,
        isDragging: true,
        dragStartX: clientX,
        dragStartRotation: prev.rotation,
        isAnimating: false,
      }));
      lastDragXRef.current = clientX;
      lastDragTimeRef.current = Date.now();
      setDragVelocity(0);
    },
    [onAutoRotationPause]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!state.isDragging) return;

      const deltaX = clientX - state.dragStartX;
      const rotationDelta = deltaX * dragSensitivity;
      const newRotation = state.dragStartRotation + rotationDelta;

      const now = Date.now();
      const timeDelta = now - lastDragTimeRef.current;
      if (timeDelta > 0) {
        const positionDelta = clientX - lastDragXRef.current;
        const velocity = positionDelta / timeDelta;
        setDragVelocity(velocity);
        lastDragTimeRef.current = now;
        lastDragXRef.current = clientX;
      }

      setState((prev) => ({
        ...prev,
        rotation: newRotation,
      }));
    },
    [state.isDragging, state.dragStartX, state.dragStartRotation, dragSensitivity]
  );

  const handleDrag = useCallback(
    (clientX: number) => throttle(handleDragMove, 16)(clientX),
    [handleDragMove]
  );

  const endDrag = useCallback(() => {
    if (!state.isDragging) return;

    setState((prev) => ({ ...prev, isDragging: false }));

    const momentumRotation = dragVelocity * dragSensitivity * 100;
    let targetRotation = state.rotation + momentumRotation;

    const itemAngle = 360 / itemCount;
    const nearestIndex = Math.round(targetRotation / itemAngle);
    targetRotation = nearestIndex * itemAngle;

    animateToRotation(targetRotation);
    setDragVelocity(0);
  }, [
    state.isDragging,
    state.rotation,
    dragVelocity,
    dragSensitivity,
    itemCount,
    animateToRotation,
  ]);

  const goToNext = useCallback(() => {
    if (state.isAnimating) return;

    onAutoRotationPause?.();

    const itemAngle = 360 / itemCount;
    const targetRotation = state.rotation + itemAngle;
    animateToRotation(targetRotation);
  }, [state.rotation, state.isAnimating, itemCount, animateToRotation, onAutoRotationPause]);

  const goToPrevious = useCallback(() => {
    if (state.isAnimating) return;

    onAutoRotationPause?.();

    const itemAngle = 360 / itemCount;
    const targetRotation = state.rotation - itemAngle;
    animateToRotation(targetRotation);
  }, [state.rotation, state.isAnimating, itemCount, animateToRotation, onAutoRotationPause]);

  const goToIndex = useCallback(
    (index: number) => {
      if (state.isAnimating) return;

      onAutoRotationPause?.();

      const itemAngle = 360 / itemCount;
      const targetRotation = -index * itemAngle;
      animateToRotation(targetRotation);
    },
    [state.isAnimating, itemCount, animateToRotation, onAutoRotationPause]
  );

  const handleItemClick = useCallback(
    (index: number) => {
      if (state.isDragging) return;

      if (index === state.focusedIndex && items[index]?.linkUrl) {
        window.location.href = items[index].linkUrl!;
        return;
      }

      goToIndex(index);
    },
    [state.focusedIndex, state.isDragging, items, goToIndex]
  );

  return {
    state,
    animateToRotation,
    startDrag,
    handleDrag,
    endDrag,
    goToNext,
    goToPrevious,
    goToIndex,
    handleItemClick,
    srAnnouncement,
  };
}
