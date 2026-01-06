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
import { SvgRefresh, SvgMail, SvgCheck, SvgExclamationCircle } from '../../Svgs';

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
            <SvgRefresh className="w-5 h-5 animate-spin" aria-hidden="true" />
            {tEmail('resendingEmail')}
          </>
        ) : (
          <>
            <SvgMail className="w-5 h-5" aria-hidden="true" />
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
              <SvgCheck
                className="w-4 h-4 flex-shrink-0"
                aria-hidden="true"
              />
            ) : (
              <SvgExclamationCircle
                className="w-4 h-4 flex-shrink-0"
                aria-hidden="true"
              />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}