'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi, LoginData, User } from '@/lib/auth-api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Handle OAuth callback tokens from URL parameters
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const redirect = params.get('redirect');

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Fetch user data after storing tokens
      const fetchUser = async () => {
        try {
          const { userApi } = await import('@/lib/user-api');
          const userData = await userApi.getProfile();
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);

          // Redirect to the specified URL after successful authentication
          if (redirect) {
            router.push(redirect);
          }
        } catch (error) {
          console.error('Failed to fetch user after OAuth:', error);
        }
      };

      fetchUser();

      // Clean URL after extracting tokens (only if not redirecting)
      if (!redirect) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, [router]);

  useEffect(() => {
    // Handle authentication logout event from API client
    const handleAuthLogout = () => {
      // Clear user state
      setUser(null);

      // Extract locale from current pathname
      // Pathname format: /[locale]/... or just /...
      const pathSegments = pathname.split('/').filter(Boolean);
      const locale = pathSegments[0] || 'en';

      // Use Next.js router for client-side navigation (no page reload)
      router.push(`/${locale}/login`);
    };

    // Handle session expiration event from API client
    const handleSessionExpired = (event: CustomEvent) => {
      // Clear user state
      setUser(null);

      // Extract locale from current pathname
      const pathSegments = pathname.split('/').filter(Boolean);
      const locale = pathSegments[0] || 'en';

      // Preserve current page URL for post-login redirect
      const currentPath = event.detail?.currentPath || pathname;
      const redirectParam = encodeURIComponent(currentPath);

      // Redirect to login with session expiration message and redirect parameter
      router.push(`/${locale}/login?expired=true&redirect=${redirectParam}`);
    };

    // Add event listeners
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:session-expired', handleSessionExpired as EventListener);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:session-expired', handleSessionExpired as EventListener);
    };
  }, [router, pathname]);

  const login = async (data: LoginData) => {
    try {
      const response = await authApi.login(data);

      // Store tokens and user
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear tokens and user regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const { userApi } = await import('@/lib/user-api');
      const updatedUser = await userApi.getProfile();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}