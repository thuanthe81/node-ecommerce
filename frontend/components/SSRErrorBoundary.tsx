'use client';

import React, { Component, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SSRError, logSSRError } from '@/lib/ssr-error-handling';

interface SSRErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableClientSideRecovery?: boolean;
  locale?: string;
}

interface SSRErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

/**
 * Enhanced error boundary for SSR components with client-side recovery
 */
export class SSRErrorBoundary extends Component<SSRErrorBoundaryProps, SSRErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(props: SSRErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<SSRErrorBoundaryState> {
    const errorId = `ssr-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError } = this.props;

    // Log error for monitoring
    if (error instanceof SSRError) {
      logSSRError(error, 'SSRErrorBoundary');
    } else {
      // Convert regular error to SSR error for consistent logging
      const ssrError = new SSRError({
        code: 'SSR_COMPONENT_ERROR',
        message: `Component error: ${error.message}`,
        isRetryable: true,
        shouldFallbackToCSR: true,
        userMessage: 'A component failed to render. Attempting recovery.',
        technicalDetails: { errorInfo, stack: error.stack },
        timestamp: new Date().toISOString(),
      });
      logSSRError(ssrError, 'SSRErrorBoundary');
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Attempt automatic recovery for retryable errors
    if (this.props.enableClientSideRecovery && this.state.retryCount < this.maxRetries) {
      this.attemptRecovery();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private attemptRecovery = () => {
    const { error } = this.state;

    // Check if error is retryable
    const isRetryable = error instanceof SSRError ? error.isRetryable : true;

    if (!isRetryable || this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRecovering: true });

    // Exponential backoff for retry
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));
    }, delay);
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    });
  };

  private handleReportError = () => {
    const { error, errorId } = this.state;

    // Send error report to monitoring service
    if (error && errorId) {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };

      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // TODO: Integrate with error reporting service
        console.log('Error report:', errorReport);
      } else {
        console.error('Error report:', errorReport);
      }
    }
  };

  render() {
    const { hasError, error, isRecovering, retryCount } = this.state;
    const { children, fallback, enableClientSideRecovery = true, locale = 'en' } = this.props;

    if (hasError && error) {
      // Show recovery indicator
      if (isRecovering) {
        return <SSRRecoveryIndicator locale={locale} />;
      }

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error fallback with recovery options
      return (
        <SSRErrorFallback
          error={error}
          onRetry={enableClientSideRecovery ? this.handleManualRetry : undefined}
          onReport={this.handleReportError}
          retryCount={retryCount}
          maxRetries={this.maxRetries}
          locale={locale}
        />
      );
    }

    return children;
  }
}

/**
 * Recovery indicator component
 */
function SSRRecoveryIndicator({ locale }: { locale: string }) {
  return (
    <div className="flex items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-blue-800 font-medium">
          {locale === 'vi' ? 'Đang khôi phục...' : 'Recovering...'}
        </p>
        <p className="text-blue-600 text-sm mt-1">
          {locale === 'vi'
            ? 'Vui lòng đợi trong giây lát'
            : 'Please wait a moment'
          }
        </p>
      </div>
    </div>
  );
}

/**
 * Error fallback component with recovery options
 */
function SSRErrorFallback({
  error,
  onRetry,
  onReport,
  retryCount,
  maxRetries,
  locale,
}: {
  error: Error;
  onRetry?: () => void;
  onReport: () => void;
  retryCount: number;
  maxRetries: number;
  locale: string;
}) {
  const isSSRError = error instanceof SSRError;
  const userMessage = isSSRError ? error.userMessage : (
    locale === 'vi'
      ? 'Đã xảy ra lỗi khi tải nội dung. Vui lòng thử lại.'
      : 'An error occurred while loading content. Please try again.'
  );

  const canRetry = onRetry && retryCount < maxRetries;
  const shouldShowTechnicalDetails = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-medium text-red-800 mb-2">
          {locale === 'vi' ? 'Đã xảy ra lỗi' : 'Something went wrong'}
        </h3>

        <p className="text-red-700 mb-4">{userMessage}</p>

        {shouldShowTechnicalDetails && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
              {locale === 'vi' ? 'Chi tiết kỹ thuật' : 'Technical Details'}
            </summary>
            <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 font-mono">
              <div><strong>Error:</strong> {error.message}</div>
              {isSSRError && (
                <>
                  <div><strong>Code:</strong> {error.code}</div>
                  <div><strong>Retryable:</strong> {error.isRetryable ? 'Yes' : 'No'}</div>
                </>
              )}
              <div><strong>Retry Count:</strong> {retryCount}/{maxRetries}</div>
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {canRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              {locale === 'vi' ? 'Thử lại' : 'Try Again'}
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {locale === 'vi' ? 'Tải lại trang' : 'Reload Page'}
          </button>

          <button
            onClick={onReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {locale === 'vi' ? 'Báo lỗi' : 'Report Error'}
          </button>
        </div>

        <p className="text-xs text-red-600 mt-4">
          {locale === 'vi'
            ? 'Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ hỗ trợ.'
            : 'If the problem persists, please contact support.'
          }
        </p>
      </div>
    </div>
  );
}

/**
 * Hook for using SSR error boundary in functional components
 */
export function useSSRErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, clearError };
}

/**
 * Higher-order component for wrapping components with SSR error boundary
 */
export function withSSRErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<SSRErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <SSRErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </SSRErrorBoundary>
  );

  WrappedComponent.displayName = `withSSRErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default SSRErrorBoundary;