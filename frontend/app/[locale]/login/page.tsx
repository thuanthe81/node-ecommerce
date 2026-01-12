'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SvgGoogleEEE, SvgFacebook } from '@/components/Svgs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();

  const tAuth = useTranslations('auth');
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  // Extract error from URL parameters
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      // Map error codes to translation keys
      const errorMessages: Record<string, string> = {
        'cancelled': t('authenticationCancelled'),
        'provider_error': t('providerError'),
        'network_error': t('connectionError'),
        'invalid_credentials': t('invalidCredentials'),
        'failed': t('authenticationFailed'),
      };

      setError(errorMessages[errorParam] || t('authenticationFailed'));
    }
  }, [searchParams, t]);

  const handleGoogleLogin = () => {
    const redirect = searchParams.get('redirect') || '/';
    const encodedRedirect = encodeURIComponent(redirect);
    window.location.href = `${API_URL}/auth/google?redirect=${encodedRedirect}`;
  };

  const handleFacebookLogin = () => {
    const redirect = searchParams.get('redirect') || '/';
    const encodedRedirect = encodeURIComponent(redirect);
    window.location.href = `${API_URL}/auth/facebook?redirect=${encodedRedirect}`;
  };

  const handleRetry = () => {
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {tAuth('signInToAccount')}
        </h2>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              {tAuth('retryAuthentication')}
            </button>
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <SvgGoogleEEE className="w-5 h-5" />
          <span className="text-sm font-medium">{tAuth('signInWithGoogle')}</span>
        </button>

        {/* Facebook Sign-in Button */}
        <button
          onClick={handleFacebookLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent rounded-md shadow-sm bg-[#1877F2] text-white hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] transition-colors"
        >
          <SvgFacebook className="w-5 h-5" />
          <span className="text-sm font-medium">{tAuth('signInWithFacebook')}</span>
        </button>

        {/* Admin Login Link */}
        <div className="text-center">
          <a
            href="/admin/login"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            {tAuth('adminLogin')}
          </a>
        </div>
      </div>
    </div>
  );
}