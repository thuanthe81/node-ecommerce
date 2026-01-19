'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { orderApi, Order } from '@/lib/order-api';
import { compareDates } from '@/app/utils';
import OrderCard from '@/components/OrderCard';
import { SvgErrorEEE, SvgShoppingBag } from '@/components/Svgs';

export default function OrdersPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('account');
  const tCommon = useTranslations('common');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setIsLoadingOrders(true);
        setError(null);
        const fetchedOrders = await orderApi.getOrders();
        // Sort orders by createdAt in descending order (newest first)
        const sortedOrders = fetchedOrders.sort((a, b) => compareDates(a.createdAt, b.createdAt));
        setOrders(sortedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(t('unableToLoadOrders'));
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleRetry = () => {
    if (user) {
      setIsLoadingOrders(true);
      setError(null);
      orderApi.getOrders()
        .then(fetchedOrders => {
          const sortedOrders = fetchedOrders.sort((a, b) => compareDates(a.createdAt, b.createdAt));
          setOrders(sortedOrders);
        })
        .catch(err => {
          console.error('Error fetching orders:', err);
          setError(t('unableToLoadOrders'));
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
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
        <div className="mb-6">
          <Link href={`/${locale}/account`} className="text-blue-600 hover:text-blue-800">
            {t('backToAccount')}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('orderHistory')}</h1>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Loading State */}
          {isLoadingOrders && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('loadingYourOrders')}</p>
            </div>
          )}

          {/* Error State */}
          {!isLoadingOrders && error && (
            <div className="text-center py-12">
              <SvgErrorEEE
                className="mx-auto h-12 w-12 text-red-400"
              />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('errorLoadingOrders')}</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {tCommon('retry')}
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingOrders && !error && orders.length === 0 && (
            <div className="text-center py-12">
              <SvgShoppingBag
                className="mx-auto h-12 w-12 text-gray-400"
              />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noOrders')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('startShoppingToSeeOrders')}
              </p>
              <div className="mt-6">
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('startShopping')}
                </Link>
              </div>
            </div>
          )}

          {/* Orders List */}
          {!isLoadingOrders && !error && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}