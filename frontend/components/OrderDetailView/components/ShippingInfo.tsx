/**
 * Shipping information component displaying delivery address and shipping method
 *
 * @param props - Component props
 * @param props.shippingAddress - The shipping address object
 * @param props.shippingMethod - The shipping method
 */

import { useTranslations } from 'next-intl';
import { getShippingMethodText } from '../utils/statusTranslations';

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface ShippingInfoProps {
  shippingAddress?: ShippingAddress;
  shippingMethod: string;
}

export function ShippingInfo({ shippingAddress, shippingMethod }: ShippingInfoProps) {
  const t = useTranslations('orders');
  const tEmail = useTranslations('email');
  return (
    <section
      className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 print:shadow-none print:border print:border-gray-300"
      aria-labelledby="shipping-info-heading"
    >
      <h2
        id="shipping-info-heading"
        className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200"
      >
        {t('shippingInfo')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 print:bg-white print:border print:border-gray-300">
          <h3
            id="delivery-address-heading"
            className="font-semibold text-base sm:text-lg mb-3 text-gray-900 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {t('deliveryAddress')}
          </h3>
          <address
            className="not-italic text-gray-700 text-sm sm:text-base leading-relaxed"
            aria-labelledby="delivery-address-heading"
          >
            {shippingAddress ? (
              <>
                <strong className="text-gray-900">{shippingAddress.fullName}</strong>
                <br />
                {shippingAddress.addressLine1}
                <br />
                {shippingAddress.addressLine2 && (
                  <>
                    {shippingAddress.addressLine2}
                    <br />
                  </>
                )}
                {shippingAddress.city}, {shippingAddress.state}{' '}
                {shippingAddress.postalCode}
                <br />
                {shippingAddress.country}
                <br />
                <span className="inline-flex items-center gap-1 mt-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {t('phone')}: <strong>{shippingAddress.phone}</strong>
            </span>
              </>
            ) : (
              <div className="text-gray-500">
                {tEmail('noShippingAddress')}
              </div>
            )}
          </address>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 print:bg-white print:border print:border-gray-300">
          <h3
            id="shipping-method-heading"
            className="font-semibold text-base sm:text-lg mb-3 text-gray-900 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            {t('shippingMethod')}
          </h3>
          <p
            className="text-gray-900 text-base sm:text-lg font-semibold bg-white rounded px-4 py-3 border border-gray-200 print:border-gray-300"
            aria-labelledby="shipping-method-heading"
          >
            {getShippingMethodText(shippingMethod, tEmail)}
          </p>
        </div>
      </div>
    </section>
  );
}