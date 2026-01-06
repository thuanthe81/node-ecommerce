'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  locale: string;
}

export default function AdminProtectedRoute({ children, locale }: AdminProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to admin login with current path as redirect parameter
        router.push(`/${locale}/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user?.role !== 'ADMIN') {
        router.push(`/${locale}`);
      }
    }
  }, [isAuthenticated, isLoading, user, locale, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
