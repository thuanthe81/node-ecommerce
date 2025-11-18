'use client';

import { useTranslations } from 'next-intl';
import { SvgCheck } from '@/components/Svgs';

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = ['shipping', 'shippingMethod', 'review'] as const;

export default function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const t = useTranslations('checkout');

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <SvgCheck className="w-6 h-6" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div
                  className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {t(`steps.${step}`)}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ marginTop: '-2rem' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
