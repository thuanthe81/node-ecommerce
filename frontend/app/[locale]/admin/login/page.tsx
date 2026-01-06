'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
}

export default function AdminLoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'ADMIN') {
        const redirectUrl = searchParams.get('redirect') || '/admin';
        router.push(redirectUrl);
      } else {
        // Non-admin users should be redirected to homepage
        router.push('/');
      }
    }
  }, [user, authLoading, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData);

      // The useEffect above will handle the redirect based on user role
    } catch (err: any) {
      console.error('Admin login failed:', err);

      // Handle different error types
      if (err.response?.status === 401) {
        setError(t('adminLoginError'));
      } else if (err.response?.status === 403) {
        setError(t('accessDenied'));
      } else {
        setError(t('loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render form if user is already authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('adminLoginTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('adminLoginSubtitle')}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('email')}
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('password')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('signingIn') : t('login')}
            </button>
          </div>

          {/* Back to Customer Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500 underline"
            >
              {t('backToCustomerLogin')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}