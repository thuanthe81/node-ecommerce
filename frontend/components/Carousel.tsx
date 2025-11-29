'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import CarouselItem from './Carousel3D/CarouselItem';
import CarouselControls from './Carousel3D/CarouselControls';
import CarouselIndicators from './Carousel3D/CarouselIndicators';
import SimpleFallbackSlider from './Carousel3D/SimpleFallbackSlider';
import CarouselErrorBoundary from './Carousel3D/CarouselErrorBoundary';
import { SvgPlay, SvgPause, SvgImage } from './Svgs';

// TypeScript Interfaces
export interface CarouselItem {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl?: string;
  title?: string;
}

export interface Carousel3DProps {
  items: CarouselItem[];
  autoRotate?: boolean;
  autoRotateInterval?: number; // milliseconds
  rotationSpeed?: number; // degrees per interaction
  ringRadius?: number; // pixels
  itemWidth?: number; // pixels
  itemHeight?: number; // pixels
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
}

interface CarouselState {
  rotation: number; // current rotation angle in degrees
  isDragging: boolean;
  dragStartX: number;
  dragStartRotation: number;
  isAnimating: boolean;
  focusedIndex: number;
}

// Responsive configuration for different breakpoints
const RESPONSIVE_CONFIG = {
  mobile: {
    ringRadius: 180,
    itemWidth: 140,
    itemHeight: 200,
    dragSensitivity: 0.6, // Slightly more sensitive for touch
    perspective: 800,
  },
  tablet: {
    ringRadius: 240,
    itemWidth: 170,
    itemHeight: 250,
    dragSensitivity: 0.55,
    perspective: 1000,
  },
  desktop: {
    ringRadius: 300,
    itemWidth: 200,
    itemHeight: 600,
    dragSensitivity: 0.5,
    perspective: 1200,
  },
};

// Default configuration constants
const DEFAULT_CONFIG = {
  autoRotate: false,
  autoRotateInterval: 5000,
  rotationSpeed: 0, // calculated based on item count
  ringRadius: 300,
  itemWidth: 200,
  itemHeight: 400,
  showControls: true,
  showIndicators: true,
  animationDuration: 600, // milliseconds
  dragSensitivity: 0.5,
};

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Throttle function to limit execution rate for performance
 * Ensures function is called at most once per specified interval
 * @param func - Function to throttle
 * @param limit - Minimum time between executions in milliseconds
 * @returns Throttled function
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
}

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Cubic easing in-out function for smooth animations
 * Starts slow, speeds up in the middle, and slows down at the end
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease out cubic function for natural deceleration
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ============================================================================
// 3D Transform Calculation Utilities
// ============================================================================

/**
 * Normalizes an angle to be within 0-360 degrees
 * @param angle - The angle in degrees to normalize
 * @returns Normalized angle between 0 and 360
 */
export function normalizeAngle(angle: number): number {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Calculates the 3D transform string for positioning an item in the carousel ring
 * @param index - The index of the item in the carousel
 * @param totalItems - Total number of items in the carousel
 * @param rotation - Current rotation angle of the carousel in degrees
 * @param ringRadius - Radius of the carousel ring in pixels
 * @returns CSS transform string for 3D positioning
 */
export function calculateItemTransform(
  index: number,
  totalItems: number,
  rotation: number,
  ringRadius: number
): string {
  // Calculate the base angle for this item's position in the ring
  const baseAngle = (360 / totalItems) * index;

  // Add the current rotation to get the actual angle
  const angle = baseAngle + rotation;

  // Convert to radians for trigonometric calculations
  const angleRad = (angle * Math.PI) / 180;

  // Calculate x and z positions using circular motion
  // x: horizontal position (left-right)
  // z: depth position (forward-backward)
  const x = Math.sin(angleRad) * ringRadius;
  const z = Math.cos(angleRad) * ringRadius;

  // Return the complete 3D transform
  // translate3d positions the item in 3D space
  // rotateY rotates the item to face the center of the ring
  return `translate3d(${x}px, 0, ${z}px) rotateY(${-angle}deg)`;
}

/**
 * Calculates scale and opacity based on z-position for depth effect
 * Items closer to the viewer (positive z) are larger and more opaque
 * Items further away (negative z) are smaller and more transparent
 * @param z - The z-position of the item in pixels
 * @param ringRadius - Radius of the carousel ring in pixels
 * @returns Object containing scale and opacity values
 */
export function calculateItemStyle(
  z: number,
  ringRadius: number
): { scale: number; opacity: number; zIndex: number } {
  // Normalize z-position to a 0-1 range
  // z ranges from -ringRadius (back) to +ringRadius (front)
  const normalizedZ = (z + ringRadius) / (ringRadius * 2);

  // Scale: items at the front (z = ringRadius) scale to 1.0
  // items at the back (z = -ringRadius) scale to 0.6
  const scale = 0.6 + normalizedZ * 0.4;

  // Opacity: items at the front are fully opaque (1.0)
  // items at the back are more transparent (0.4)
  const opacity = 0.4 + normalizedZ * 0.6;

  // Z-index: items closer to viewer should be on top
  // Convert normalized z to integer z-index (0-100)
  const zIndex = Math.round(normalizedZ * 100);

  return { scale, opacity, zIndex };
}

/**
 * Calculates the z-position for a given item
 * @param index - The index of the item in the carousel
 * @param totalItems - Total number of items in the carousel
 * @param rotation - Current rotation angle of the carousel in degrees
 * @param ringRadius - Radius of the carousel ring in pixels
 * @returns The z-position in pixels
 */
export function calculateZPosition(
  index: number,
  totalItems: number,
  rotation: number,
  ringRadius: number
): number {
  const baseAngle = (360 / totalItems) * index;
  const angle = baseAngle + rotation;
  const angleRad = (angle * Math.PI) / 180;
  return Math.cos(angleRad) * ringRadius;
}

/**
 * Determines which item is currently focused (closest to front/center)
 * @param rotation - Current rotation angle of the carousel in degrees
 * @param totalItems - Total number of items in the carousel
 * @returns Index of the focused item
 */
export function calculateFocusedIndex(
  rotation: number,
  totalItems: number
): number {
  // Normalize rotation to 0-360 range
  const normalizedRotation = normalizeAngle(-rotation);

  // Calculate which item is closest to 0 degrees (front center)
  const itemAngle = 360 / totalItems;
  const focusedIndex = Math.round(normalizedRotation / itemAngle) % totalItems;

  return focusedIndex;
}

// ============================================================================
// Browser Support Detection
// ============================================================================

/**
 * Detects if the browser supports CSS 3D transforms
 * @returns true if 3D transforms are supported, false otherwise
 */
function detect3DTransformSupport(): boolean {
  if (typeof window === 'undefined') return false;

  const el = document.createElement('div');
  const transforms = [
    'transform',
    'WebkitTransform',
    'MozTransform',
    'msTransform',
    'OTransform',
  ];

  for (const transform of transforms) {
    if (el.style[transform as any] !== undefined) {
      el.style[transform as any] = 'translate3d(1px, 1px, 1px)';
      const has3D = window.getComputedStyle(el).getPropertyValue(transform);
      return has3D !== undefined && has3D.length > 0 && has3D !== 'none';
    }
  }

  return false;
}

/**
 * Custom hook to detect 3D transform support
 * @returns true if 3D transforms are supported
 */
function use3DTransformSupport() {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(detect3DTransformSupport());
  }, []);

  return isSupported;
}

// ============================================================================
// Data Validation Utilities
// ============================================================================

/**
 * Validates a single carousel item
 * @param item - The item to validate
 * @returns true if valid, false otherwise
 */
function isValidCarouselItem(item: any): item is CarouselItem {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || !item.id.trim()) return false;
  if (typeof item.imageUrl !== 'string' || !item.imageUrl.trim()) return false;
  if (typeof item.alt !== 'string') return false;
  return true;
}

/**
 * Filters and validates carousel items
 * @param items - Array of items to validate
 * @returns Array of valid items
 */
function validateCarouselItems(items: any[]): CarouselItem[] {
  if (!Array.isArray(items)) {
    console.warn('Carousel3D: items prop must be an array');
    return [];
  }

  const validItems = items.filter((item, index) => {
    const isValid = isValidCarouselItem(item);
    if (!isValid) {
      console.warn(`Carousel3D: Invalid item at index ${index}`, item);
    }
    return isValid;
  });

  return validItems;
}

// ============================================================================
// Responsive Configuration Hook
// ============================================================================

/**
 * Custom hook that returns responsive configuration based on screen size
 * Adjusts ring radius, item dimensions, and other settings for mobile/tablet/desktop
 * @returns Responsive configuration object
 */
function useResponsiveConfig() {
  const [config, setConfig] = useState(RESPONSIVE_CONFIG.desktop);

  useEffect(() => {
    // Function to update config based on window width
    const updateConfig = () => {
      const width = window.innerWidth;

      if (width < 768) {
        // Mobile breakpoint
        setConfig(RESPONSIVE_CONFIG.mobile);
      } else if (width < 1024) {
        // Tablet breakpoint
        setConfig(RESPONSIVE_CONFIG.tablet);
      } else {
        // Desktop breakpoint
        setConfig(RESPONSIVE_CONFIG.desktop);
      }
    };

    // Set initial config
    updateConfig();

    // Add resize listener
    window.addEventListener('resize', updateConfig);

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
}

/**
 * Internal Carousel3D component (wrapped by error boundary)
 */
function Carousel3DInternal({
  items: rawItems,
  autoRotate = DEFAULT_CONFIG.autoRotate,
  autoRotateInterval = DEFAULT_CONFIG.autoRotateInterval,
  rotationSpeed,
  ringRadius: propRingRadius,
  itemWidth: propItemWidth,
  itemHeight: propItemHeight,
  showControls = DEFAULT_CONFIG.showControls,
  showIndicators = DEFAULT_CONFIG.showIndicators,
  className = '',
}: Carousel3DProps) {
  // ============================================================================
  // Validation and Error Handling
  // ============================================================================

  // Validate and filter items
  const items = useMemo(() => validateCarouselItems(rawItems), [rawItems]);

  // Check for 3D transform support
  // const supports3D = use3DTransformSupport();

  // Get responsive configuration based on screen size
  const responsiveConfig = useResponsiveConfig();

  // Use prop values if provided, otherwise use responsive config
  const ringRadius = propRingRadius ?? responsiveConfig.ringRadius;
  const itemWidth = propItemWidth ?? responsiveConfig.itemWidth;
  const itemHeight = propItemHeight ?? responsiveConfig.itemHeight;
  const dragSensitivity = responsiveConfig.dragSensitivity;
  const perspective = responsiveConfig.perspective;

  // Calculate rotation speed based on item count if not provided
  const calculatedRotationSpeed = rotationSpeed || (items.length > 0 ? 360 / items.length : 0);

  // ============================================================================
  // Early Returns for Edge Cases
  // ============================================================================

  // State management using useState hooks
  const [state, setState] = useState<CarouselState>({
    rotation: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartRotation: 0,
    isAnimating: false,
    focusedIndex: 0,
  });

  // Track drag velocity for momentum
  const [dragVelocity, setDragVelocity] = useState(0);
  const [lastDragTime, setLastDragTime] = useState(0);
  const [lastDragX, setLastDragX] = useState(0);

  // Screen reader announcement for focused item changes
  const [srAnnouncement, setSrAnnouncement] = useState('');

  // Animation frame ID for cleanup
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Auto-rotation state
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [autoRotateTimeoutId, setAutoRotateTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Configuration object combining props and defaults
  const config = useMemo(() => ({
    autoRotate,
    autoRotateInterval,
    rotationSpeed: calculatedRotationSpeed,
    ringRadius,
    itemWidth,
    itemHeight,
    showControls,
    showIndicators,
    animationDuration: DEFAULT_CONFIG.animationDuration,
    dragSensitivity,
    perspective,
  }), [
    autoRotate,
    autoRotateInterval,
    calculatedRotationSpeed,
    ringRadius,
    itemWidth,
    itemHeight,
    showControls,
    showIndicators,
    dragSensitivity,
    perspective,
  ]);

  // Update focused index when rotation changes
  useEffect(() => {
    const newFocusedIndex = calculateFocusedIndex(state.rotation, items.length);
    if (newFocusedIndex !== state.focusedIndex) {
      setState((prev) => ({ ...prev, focusedIndex: newFocusedIndex }));

      // Announce focused item change to screen readers
      const focusedItem = items[newFocusedIndex];
      if (focusedItem) {
        setSrAnnouncement(
          `Showing item ${newFocusedIndex + 1} of ${items.length}: ${focusedItem.title || focusedItem.alt}`
        );
      }
    }
  }, [state.rotation, items, state.focusedIndex]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [animationFrameId]);

  // ============================================================================
  // Animation System
  // ============================================================================

  /**
   * Animates the carousel rotation to a target angle using requestAnimationFrame
   * Provides smooth transitions with easing and respects reduced motion preferences
   * @param targetRotation - The target rotation angle in degrees
   * @param duration - Optional animation duration in milliseconds (defaults to config value)
   */
  const animateToRotation = useCallback(
    (targetRotation: number, duration?: number) => {
      // Cancel any existing animation
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        setAnimationFrameId(null);
      }

      const startRotation = state.rotation;
      const startTime = performance.now();
      const animDuration = duration ?? config.animationDuration;

      // If user prefers reduced motion, snap immediately
      if (prefersReducedMotion) {
        setState((prev) => ({
          ...prev,
          rotation: targetRotation,
          isAnimating: false,
        }));
        return;
      }

      // Mark as animating
      setState((prev) => ({ ...prev, isAnimating: true }));

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animDuration, 1);

        // Apply easing function for smooth motion
        const easedProgress = easeInOutCubic(progress);

        // Calculate current rotation based on eased progress
        const currentRotation =
          startRotation + (targetRotation - startRotation) * easedProgress;

        setState((prev) => ({ ...prev, rotation: currentRotation }));

        // Continue animation if not complete
        if (progress < 1) {
          const frameId = requestAnimationFrame(animate);
          setAnimationFrameId(frameId);
        } else {
          // Animation complete
          setState((prev) => ({
            ...prev,
            rotation: targetRotation,
            isAnimating: false,
          }));
          setAnimationFrameId(null);
        }
      };

      // Start animation
      const frameId = requestAnimationFrame(animate);
      setAnimationFrameId(frameId);
    },
    [
      state.rotation,
      config.animationDuration,
      animationFrameId,
      prefersReducedMotion,
    ]
  );

  /**
   * Snaps the carousel to the nearest item position
   * Calculates the closest item angle and animates to it
   */
  // const snapToNearestItem = useCallback(() => {
  //   const itemAngle = 360 / items.length;
  //   const nearestIndex = Math.round(state.rotation / itemAngle);
  //   const targetRotation = nearestIndex * itemAngle;
  //
  //   animateToRotation(targetRotation);
  // }, [state.rotation, items.length, animateToRotation]);

  // ============================================================================
  // Auto-Rotation System
  // ============================================================================

  /**
   * Auto-rotation effect
   * Rotates carousel automatically at specified intervals
   * Pauses during user interaction (drag, hover, focus)
   */
  useEffect(() => {
    // Don't auto-rotate if:
    // - Auto-rotate is disabled
    // - User has manually paused
    // - User is dragging
    // - User is hovering
    // - Animation is in progress
    // - User prefers reduced motion
    if (
      !isAutoRotating ||
      isPaused ||
      state.isDragging ||
      isHovered ||
      state.isAnimating ||
      prefersReducedMotion
    ) {
      return;
    }

    // Set up interval for auto-rotation
    const intervalId = setInterval(() => {
      // Rotate to next item
      const itemAngle = 360 / items.length;
      const targetRotation = state.rotation + itemAngle;
      animateToRotation(targetRotation);
    }, config.autoRotateInterval);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [
    isAutoRotating,
    isPaused,
    state.isDragging,
    isHovered,
    state.isAnimating,
    state.rotation,
    items.length,
    config.autoRotateInterval,
    animateToRotation,
    prefersReducedMotion,
  ]);

  /**
   * Resume auto-rotation after interaction timeout
   * When user stops interacting, wait a bit before resuming auto-rotation
   */
  useEffect(() => {
    // Clear any existing timeout
    if (autoRotateTimeoutId) {
      clearTimeout(autoRotateTimeoutId);
      setAutoRotateTimeoutId(null);
    }

    // If auto-rotate is enabled and user is not interacting
    // Set timeout to resume after a delay
    if (
      config.autoRotate &&
      !isPaused &&
      !state.isDragging &&
      !isHovered &&
      !state.isAnimating
    ) {
      const timeoutId = setTimeout(() => {
        setIsAutoRotating(true);
      }, 2000); // Resume after 2 seconds of inactivity

      setAutoRotateTimeoutId(timeoutId);
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoRotateTimeoutId) {
        clearTimeout(autoRotateTimeoutId);
      }
    };
  }, [
    config.autoRotate,
    isPaused,
    state.isDragging,
    isHovered,
    state.isAnimating,
  ]);

  // ============================================================================
  // Drag Interaction Handlers
  // ============================================================================

  /**
   * Handles the start of a drag interaction (mouse or touch)
   * @param clientX - The x-coordinate of the pointer
   */
  const handleDragStart = useCallback((clientX: number) => {
    // Cancel any ongoing animation
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }

    // Pause auto-rotation during drag
    setIsAutoRotating(false);

    setState((prev) => ({
      ...prev,
      isDragging: true,
      dragStartX: clientX,
      dragStartRotation: prev.rotation,
      isAnimating: false,
    }));
    setLastDragX(clientX);
    setLastDragTime(Date.now());
    setDragVelocity(0);
  }, [animationFrameId]);

  /**
   * Handles drag movement (mouse or touch)
   * @param clientX - The x-coordinate of the pointer
   */
  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!state.isDragging) return;

      const deltaX = clientX - state.dragStartX;
      const rotationDelta = deltaX * config.dragSensitivity;
      const newRotation = state.dragStartRotation + rotationDelta;

      // Calculate velocity for momentum
      const now = Date.now();
      const timeDelta = now - lastDragTime;
      if (timeDelta > 0) {
        const positionDelta = clientX - lastDragX;
        const velocity = positionDelta / timeDelta;
        setDragVelocity(velocity);
        setLastDragTime(now);
        setLastDragX(clientX);
      }

      setState((prev) => ({
        ...prev,
        rotation: newRotation,
      }));
    },
    [state.isDragging, state.dragStartX, state.dragStartRotation, config.dragSensitivity, lastDragTime, lastDragX]
  );

  // Throttled version for mouse/touch move events to maintain 60fps (16ms)
  const throttledDragMove = useCallback(
    (clientX: number) => throttle(handleDragMove, 16)(clientX),
    [handleDragMove]
  );

  /**
   * Handles the end of a drag interaction with momentum
   */
  const handleDragEnd = useCallback(() => {
    if (!state.isDragging) return;

    setState((prev) => ({ ...prev, isDragging: false }));

    // Apply momentum-based rotation
    const momentumRotation = dragVelocity * config.dragSensitivity * 100;

    // Calculate target rotation with momentum
    let targetRotation = state.rotation + momentumRotation;

    // Snap to nearest item
    const itemAngle = 360 / items.length;
    const nearestIndex = Math.round(targetRotation / itemAngle);
    targetRotation = nearestIndex * itemAngle;

    // Use animateToRotation for smooth transition
    animateToRotation(targetRotation);

    // Reset velocity
    setDragVelocity(0);
  }, [
    state.isDragging,
    state.rotation,
    dragVelocity,
    config.dragSensitivity,
    items.length,
    animateToRotation,
  ]);

  // ============================================================================
  // Mouse Event Handlers
  // ============================================================================

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      throttledDragMove(e.clientX);
    },
    [throttledDragMove]
  );

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (state.isDragging) {
      handleDragEnd();
    }
  }, [state.isDragging, handleDragEnd]);

  /**
   * Handles mouse enter - pause auto-rotation on hover
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setIsAutoRotating(false);
  }, []);

  /**
   * Handles mouse leave from container - resume auto-rotation after hover
   */
  const handleMouseLeaveContainer = useCallback(() => {
    setIsHovered(false);
    // Also handle drag end if user was dragging
    if (state.isDragging) {
      handleDragEnd();
    }
  }, [state.isDragging, handleDragEnd]);

  /**
   * Toggles auto-rotation play/pause state
   */
  const handleToggleAutoRotate = useCallback(() => {
    setIsPaused((prev) => !prev);
    setIsAutoRotating((prev) => !prev);
  }, []);

  // ============================================================================
  // Touch Event Handlers
  // ============================================================================

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Store initial touch position to determine drag direction
        const touch = e.touches[0];
        handleDragStart(touch.clientX);
      }
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && state.isDragging) {
        // Prevent default to stop page scrolling during horizontal drag
        // Only prevent if we're actively dragging
        e.preventDefault();
        throttledDragMove(e.touches[0].clientX);
      }
    },
    [throttledDragMove, state.isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // ============================================================================
  // Global Mouse Event Listeners
  // ============================================================================

  useEffect(() => {
    if (!state.isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      throttledDragMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [state.isDragging, throttledDragMove, handleDragEnd]);

  // Handle item click - rotate non-centered items to center
  // Memoized to prevent unnecessary re-renders of child components
  const handleItemClick = useCallback(
    (index: number) => {
      // Don't handle clicks during drag
      if (state.isDragging) return;

      // If item is already focused, navigate to its link
      if (index === state.focusedIndex && items[index].linkUrl) {
        window.location.href = items[index].linkUrl!;
        return;
      }

      // Pause auto-rotation on manual navigation
      setIsAutoRotating(false);

      // Calculate rotation needed to bring this item to center
      const itemAngle = 360 / items.length;
      const targetRotation = -index * itemAngle;

      // Use animateToRotation for smooth transition
      animateToRotation(targetRotation);
    },
    [state.focusedIndex, state.isDragging, items, animateToRotation]
  );

  // ============================================================================
  // Navigation Control Handlers
  // ============================================================================

  /**
   * Rotates carousel to the next item (clockwise)
   */
  const handleNext = useCallback(() => {
    if (state.isAnimating) return;

    // Pause auto-rotation on manual navigation
    setIsAutoRotating(false);

    const itemAngle = 360 / items.length;
    const targetRotation = state.rotation + itemAngle;

    // Use animateToRotation for smooth transition
    animateToRotation(targetRotation);
  }, [state.rotation, state.isAnimating, items.length, animateToRotation]);

  /**
   * Rotates carousel to the previous item (counter-clockwise)
   */
  const handlePrevious = useCallback(() => {
    if (state.isAnimating) return;

    // Pause auto-rotation on manual navigation
    setIsAutoRotating(false);

    const itemAngle = 360 / items.length;
    const targetRotation = state.rotation - itemAngle;

    // Use animateToRotation for smooth transition
    animateToRotation(targetRotation);
  }, [state.rotation, state.isAnimating, items.length, animateToRotation]);

  /**
   * Handles indicator click to jump to a specific item
   * @param index - The index of the item to navigate to
   */
  const handleIndicatorClick = useCallback(
    (index: number) => {
      if (state.isAnimating) return;

      // Pause auto-rotation on manual navigation
      setIsAutoRotating(false);

      // Calculate rotation needed to bring this item to center
      const itemAngle = 360 / items.length;
      const targetRotation = -index * itemAngle;

      // Use animateToRotation for smooth transition
      animateToRotation(targetRotation);
    },
    [state.isAnimating, items.length, animateToRotation]
  );

  // ============================================================================
  // Keyboard Navigation Handler
  // ============================================================================

  /**
   * Handles keyboard navigation for accessibility
   * Arrow Left/Right: Navigate between items
   * Enter/Space: Handled by CarouselItem component
   * Escape: Stop auto-rotation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ignore keyboard events during drag or animation
      if (state.isDragging || state.isAnimating) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Escape':
          e.preventDefault();
          // Stop auto-rotation
          setIsPaused(true);
          setIsAutoRotating(false);
          break;
        default:
          break;
      }
    },
    [state.isDragging, state.isAnimating, handlePrevious, handleNext]
  );

  // Handle empty items array
  if (items.length === 0) {
    return (
      <div className="carousel-3d-empty w-full py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
            <SvgImage
              className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4"
              aria-hidden="true"
            />
            <p className="text-gray-600 dark:text-gray-400">
              No items to display in carousel
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle insufficient items (< 3) - use simple fallback slider
  if (items.length < 3) {
    return (
      <SimpleFallbackSlider
        items={items}
        itemWidth={itemWidth}
        itemHeight={itemHeight}
      />
    );
  }

  return (
    <div
      className={`carousel-3d-container relative w-full overflow-hidden touch-manipulation bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 md:py-12 lg:py-16 ${className}`}
      role="region"
      aria-label="Featured products carousel"
      aria-roledescription="carousel"
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeaveContainer}
      tabIndex={0}
    >
      {/* Screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {srAnnouncement}
      </div>

      {/* Auto-rotation play/pause control */}
      {config.autoRotate && (
        <button
          onClick={handleToggleAutoRotate}
          className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
          aria-label={isPaused ? 'Play auto-rotation' : 'Pause auto-rotation'}
          title={isPaused ? 'Play auto-rotation' : 'Pause auto-rotation'}
        >
          {isPaused ? (
            <SvgPlay
              className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
              aria-hidden="true"
            />
          ) : (
            <SvgPause
              className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
              aria-hidden="true"
            />
          )}
        </button>
      )}

      <div
        className="carousel-3d-wrapper relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{
          perspective: `${config.perspective}px`,
          perspectiveOrigin: '50% 50%',
          height: `${itemHeight * 1.5}px`,
        }}
      >
        {/* Carousel ring with 3D transforms */}
        <div
          className="carousel-ring relative w-full h-full transition-opacity duration-300 hover:opacity-100"
          style={{
            transformStyle: 'preserve-3d',
            // No CSS transition - using requestAnimationFrame for smooth animations
            transform: `translateZ(-${ringRadius}px)`,
            cursor: state.isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            willChange: 'transform',
            opacity: state.isDragging ? 0.95 : 1,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-live="polite"
          aria-atomic="false"
        >
          {items.map((item, index) => {
            const transform = calculateItemTransform(
              index,
              items.length,
              state.rotation,
              ringRadius
            );
            const z = calculateZPosition(index, items.length, state.rotation, ringRadius);
            const { scale, opacity, zIndex } = calculateItemStyle(z, ringRadius);
            const isFocused = index === state.focusedIndex;

            return (
              <CarouselItem
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                rotation={state.rotation}
                ringRadius={ringRadius}
                itemWidth={itemWidth}
                itemHeight={itemHeight}
                isFocused={isFocused}
                onClick={() => handleItemClick(index)}
                transform={transform}
                scale={scale}
                opacity={opacity}
                zIndex={zIndex}
              />
            );
          })}
        </div>

        {/* Navigation Controls */}
        {showControls && (
          <CarouselControls
            onPrevious={handlePrevious}
            onNext={handleNext}
            disabled={state.isAnimating}
          />
        )}

        {/* Carousel Indicators */}
        {showIndicators && (
          <CarouselIndicators
            totalItems={items.length}
            activeIndex={state.focusedIndex}
            onIndicatorClick={handleIndicatorClick}
            disabled={state.isAnimating}
          />
        )}
      </div>
    </div>
  );
}

export function Carousel2D(props: Carousel3DProps){
  const {
    items: rawItems,
    itemWidth: propItemWidth,
    itemHeight: propItemHeight,
    autoRotate = true,
    autoRotateInterval = 3000,
  } = props;
  const items = useMemo(() => validateCarouselItems(rawItems), [rawItems]);
  const responsiveConfig = useResponsiveConfig();
  const itemWidth = propItemWidth ?? responsiveConfig.itemWidth;
  const itemHeight = propItemHeight ?? responsiveConfig.itemHeight;

  return (
    <SimpleFallbackSlider
      items={items}
      itemWidth={itemWidth}
      itemHeight={itemHeight}
      autoSlide={autoRotate}
      autoSlideInterval={autoRotateInterval}
      fullWidth={true}
    />
  );
}

/**
 * Carousel3D component with error boundary wrapper
 * Displays images in a 3D ring formation with rotation capabilities
 * Includes comprehensive error handling and graceful degradation
 */
export function Carousel3D(props: Carousel3DProps) {
  const supports3D = use3DTransformSupport();
  if (!supports3D) {
    return (<Carousel2D {...props}/>);
  }
  return (
    <CarouselErrorBoundary>
      <Carousel3DInternal {...props} />
    </CarouselErrorBoundary>
  );
}