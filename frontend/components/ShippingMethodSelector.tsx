'use client';

import { useTranslations } from 'next-intl';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
}

interface ShippingMethodSelectorProps {
  selectedMethod: string;
  onMethodSelect: (methodId: string) => void;
}

const shippingMethods: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivery in 5-7 business days',
    cost: 5.0,
    estimatedDays: '5-7 days',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivery in 2-3 business days',
    cost: 15.0,
    estimatedDays: '2-3 days',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day delivery',
    cost: 25.0,
    estimatedDays: '1 day',
  },
];

export default function ShippingMethodSelector({
  selectedMethod,
  onMethodSelect,
}: ShippingMethodSelectorProps) {
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
                  <div className="font-semibold">{method.name}</div>
                  <div className="text-sm text-gray-600">
                    {method.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${method.cost.toFixed(2)}</div>
                <div className="text-sm text-gray-600">
                  {method.estimatedDays}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
