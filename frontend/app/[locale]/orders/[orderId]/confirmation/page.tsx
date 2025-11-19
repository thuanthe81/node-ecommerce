import { Suspense } from 'react';
import { Metadata } from 'next';
import OrderConfirmationContent from './OrderConfirmationContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const title = locale === 'vi' ? 'Xác nhận đơn hàng' : 'Order Confirmation';
  const description =
    locale === 'vi'
      ? 'Chi tiết đơn hàng và hướng dẫn thanh toán'
      : 'Order details and payment instructions';

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
