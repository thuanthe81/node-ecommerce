'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatMoney } from '@/app/utils';

interface ShippingMethod {
  id: string;
  nameEn: string;
  nameVi: string;
  descriptionEn: string;
  descriptionVi: string;
  cost: number;
  estimatedDaysEn: string;
  estimatedDaysVi: string;
}

interface ShippingMethodSelectorProps {
  selectedMethod: string;
  onMethodSelect: (methodId: string) => void;
}

const shippingMethods: ShippingMethod[] = [
  {
    id: 'standard',
    nameEn: 'Standard Shipping',
    nameVi: 'Tiêu Chuẩn',
    descriptionEn: 'Delivery in 5-7 business days after all products of this order are finished',
    descriptionVi: 'Giao hàng trong 5-7 ngày làm việc kể từ ngày tất cả sản phẩm của đơn hàng đã hoàn thành',
    cost: 30000,
    estimatedDaysEn: '5-7 days',
    estimatedDaysVi: '5-7 ngày'
  },
  // {
  //   id: 'express',
  //   name: 'Express Shipping',
  //   description: 'Delivery in 2-3 business days',
  //   cost: 15.0,
  //   estimatedDays: '2-3 days',
  // },
  // {
  //   id: 'overnight',
  //   name: 'Overnight Shipping',
  //   description: 'Next business day delivery',
  //   cost: 25.0,
  //   estimatedDays: '1 day',
  // },
];

export default function ShippingMethodSelector({
  selectedMethod,
  onMethodSelect,
}: ShippingMethodSelectorProps) {
  const locale = useLocale();
  const t = useTranslations('checkout');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        {t('shippingMethod')}
      </h3>

      <div className="space-y-3">
        {shippingMethods.map((method) => (
          <label
            key={method.id}
            className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMethod === method.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  onChange={() => onMethodSelect(method.id)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">{locale == 'vi'? method.nameVi : method.nameEn}</div>
                  <div className="text-sm text-gray-600">
                    {locale == 'vi'? method.descriptionVi : method.descriptionEn}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatMoney(method.cost)}</div>
                <div className="text-sm text-gray-600">
                  {locale == 'vi'? method.estimatedDaysVi : method.estimatedDaysEn}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}