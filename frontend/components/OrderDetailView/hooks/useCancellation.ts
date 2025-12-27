/**
 * Custom hook for managing order cancellation state and logic
 * Enhanced with comprehensive error handling and retry mechanisms
 */

import { useState } from 'react';
import { orderApi, Order, CancelOrderResponse, OrderCancellationError, getCancellationErrorMessage } from '@/lib/order-api';
import { classifyError, EnhancedError, createRetryFunction, shouldShowRetry } from '@/lib/error-handling';

interface CancellationState {
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  isRetryable: boolean;
  retryCount: number;
}

interface UseCancellationReturn {
  cancellationState: CancellationState;
  openCancellationModal: () => void;
  closeCancellationModal: () => void;
  cancelOrder: (orderId: string, reason?: string, locale?: 'en' | 'vi') => Promise<CancelOrderResponse>;
  retryCancellation: (orderId: string, reason?: string, locale?: 'en' | 'vi') => Promise<CancelOrderResponse>;
  clearError: () => void;
}

export function useCancellation(): UseCancellationReturn {
  const [cancellationState, setCancellationState] = useState<CancellationState>({
    isModalOpen: false,
    isLoading: false,
    error: null,
    isRetryable: false,
    retryCount: 0,
  });

  const openCancellationModal = () => {
    setCancellationState(prev => ({
      ...prev,
      isModalOpen: true,
      error: null,
      isRetryable: false,
      retryCount: 0,
    }));
  };

  const closeCancellationModal = () => {
    setCancellationState(prev => ({
      ...prev,
      isModalOpen: false,
      error: null,
      isRetryable: false,
      retryCount: 0,
    }));
  };

  const clearError = () => {
    setCancellationState(prev => ({
      ...prev,
      error: null,
      isRetryable: false,
    }));
  };

  // Create retry-enabled cancellation function
  const cancelOrderWithRetry = createRetryFunction(
    async (orderId: string, reason?: string) => {
      return await orderApi.cancelOrder(orderId, reason ? { reason } : undefined);
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
    }
  );

  const cancelOrder = async (orderId: string, reason?: string, locale: 'en' | 'vi' = 'en'): Promise<CancelOrderResponse> => {
    setCancellationState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isRetryable: false,
    }));

    try {
      const response = await cancelOrderWithRetry(orderId, reason);

      setCancellationState(prev => ({
        ...prev,
        isLoading: false,
        isModalOpen: false,
        retryCount: 0,
      }));

      return response;
    } catch (error: any) {
      let errorMessage = 'Failed to cancel order. Please try again.';
      let isRetryable = false;

      // Handle OrderCancellationError with localized messages
      if (error instanceof OrderCancellationError) {
        errorMessage = getCancellationErrorMessage(error, locale);
        isRetryable = shouldShowRetry(error);
      } else if (error instanceof EnhancedError) {
        errorMessage = error.userMessage;
        isRetryable = shouldShowRetry(error);
      } else {
        // Classify unknown errors
        const errorDetails = classifyError(error, locale);
        errorMessage = errorDetails.userMessage;
        isRetryable = errorDetails.isRetryable;
      }

      setCancellationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isRetryable,
        retryCount: prev.retryCount + 1,
      }));

      throw error;
    }
  };

  const retryCancellation = async (orderId: string, reason?: string, locale: 'en' | 'vi' = 'en'): Promise<CancelOrderResponse> => {
    // Clear error state and retry
    setCancellationState(prev => ({
      ...prev,
      error: null,
      isRetryable: false,
    }));

    return cancelOrder(orderId, reason, locale);
  };

  return {
    cancellationState,
    openCancellationModal,
    closeCancellationModal,
    cancelOrder,
    retryCancellation,
    clearError,
  };
}