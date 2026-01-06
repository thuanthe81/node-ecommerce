'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { SvgUser, SvgLocation, SvgShoppingBag, SvgLock } from '@/components/Svgs';

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Link
            href="/account/profile"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <SvgUser
                  className="w-6 h-6 text-blue-600"
                />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                <p className="text-sm text-gray-500">Manage your personal information</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                {user.firstName} {user.lastName}
              </p>
              <p>{user.email}</p>
            </div>
          </Link>

          {/* Addresses Card */}
          <Link
            href="/account/addresses"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <SvgLocation
                  className="w-6 h-6 text-green-600"
                />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
                <p className="text-sm text-gray-500">Manage your shipping addresses</p>
              </div>
            </div>
          </Link>

          {/* Orders Card */}
          <Link
            href="/account/orders"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <SvgShoppingBag
                  className="w-6 h-6 text-purple-600"
                />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
                <p className="text-sm text-gray-500">View your order history</p>
              </div>
            </div>
          </Link>

          {/* Password Card */}
          <Link
            href="/account/password"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <SvgLock
                  className="w-6 h-6 text-yellow-600"
                />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                <p className="text-sm text-gray-500">Change your password</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
