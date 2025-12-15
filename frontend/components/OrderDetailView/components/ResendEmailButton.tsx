/**
 * ResendEmailButton Component
 *
 * Provides functionality to resend order confirmation emails with PDF attachments.
 * Includes loading states, success/error feedback, and rate limiting handling.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { orderApi, ResendEmailResponse } from '@/lib/order-api';

interface ResendEmailButtonProps {
  orderNumber: string;
  customerEmail: string;
  locale: 'en' | 'vi';
  className?: string;
}



export function ResendEmailButton({
  orderNumber,
  customerEmail,
  locale,
  className = '',
}: ResendEmailButtonProps) {
  // const t = useTranslations('orders');
  const tEmail = useTranslations('email.pdfAttachment')
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendEmail = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const data: ResendEmailResponse = await orderApi.resendOrderEmail(orderNumber, {
        email: customerEmail,
        locale,
      });

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || tEmail('resendSuccess'),
        });
      } else {
        // Handle different error types
        let errorMessage = data.message || tEmail('resendError');

        if (data.rateLimited) {
          errorMessage = data.message || tEmail('resendRateLimit');
        }

        setMessage({
          type: 'error',
          text: errorMessage,
        });
      }
    } catch (error: any) {
      console.error('Error resending email:', error);

      // Handle API client errors
      let errorMessage = tEmail('resendError');

      if (error.response?.status === 429) {
        errorMessage = error.response?.data?.message || tEmail('resendRateLimit');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleResendEmail}
        disabled={isLoading}
        className={`flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:bg-orange-700 active:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md ${className}`}
        aria-label={tEmail('resendEmailDescription')}
        title={tEmail('resendEmailDescription')}
      >
        {isLoading ? (
          <>
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {tEmail('resendingEmail')}
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {tEmail('resendEmail')}
          </>
        )}
      </button>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`max-w-md text-center p-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-2">
            {message.type === 'success' ? (
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}