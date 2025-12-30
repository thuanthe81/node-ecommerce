'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SvgGoogle, SvgFacebook } from '@/components/Svgs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const tAuth = useTranslations('auth');
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(formData);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}/>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <SvgGoogle className="w-5 h-5" />
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
      </div>
    </div>
  );
}