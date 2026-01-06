/**
 * Shipping information component displaying delivery address and shipping method
 *
 * @param props - Component props
 * @param props.shippingAddress - The shipping address object
 * @param props.shippingMethod - The shipping method
 */

import { useTranslations } from 'next-intl';
import { getShippingMethodText } from '../utils/statusTranslations';
import { SvgLocation, SvgPhone, SvgTruck } from '../../Svgs';

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
            <SvgLocation className="w-5 h-5 text-blue-600" aria-hidden="true" />
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
                  <SvgPhone className="w-4 h-4" aria-hidden="true" />
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
            <SvgTruck className="w-5 h-5 text-blue-600" aria-hidden="true" />
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