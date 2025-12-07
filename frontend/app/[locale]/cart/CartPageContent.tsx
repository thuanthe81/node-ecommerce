'use client';

import { useTranslations } from 'next-intl';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/CartItem';
import GuestCartItem from '@/components/GuestCartItem';
import CartSummary from '@/components/CartSummary';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { isContactForPrice, getCartQuoteMessage } from '@/app/utils';

export default function CartPageContent() {
  const locale = useLocale();
  const t = useTranslations('cart');
  const { cart, guestCartItems, loading, error, clearCart, itemCount } = useCart();

  const handleClearCart = async () => {
    if (confirm(t('confirmClearCart'))) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <svg
            className="w-24 h-24 mx-auto mb-6 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h1 className="text-2xl font-bold mb-4">{t('emptyCart')}</h1>
          <p className="text-gray-600 mb-8">{t('emptyCartMessage')}</p>
          <Link
            href={`/${locale}/products`}
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('startShopping')}
          </Link>
        </div>
      </div>
    );
  }

  // Check if cart contains any zero-price items
  const hasZeroPriceItems =
    (cart?.items.some(item => isContactForPrice(parseFloat(item.price))) || false) ||
    guestCartItems.some(item => isContactForPrice(item.product.price));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('shoppingCart')}</h1>
        {itemCount > 0 && (
          <button
            onClick={handleClearCart}
            className="text-sm text-red-600 hover:text-red-700"
          >
            {t('clearCart')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {hasZeroPriceItems && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-blue-800">
                  {getCartQuoteMessage(locale)}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="divide-y">
              {/* Display authenticated user cart items */}
              {cart?.items.map((item) => (
                <div key={item.id} className="px-6">
                  <CartItem item={item} />
                </div>
              ))}

              {/* Display guest cart items */}
              {guestCartItems.map((item) => (
                <div key={item.productId} className="px-6">
                  <GuestCartItem
                    productId={item.productId}
                    quantity={item.quantity}
                    product={item.product}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
