import { redirect } from 'next/navigation';

interface ShippingPolicyPageProps {
  params: {
    locale: string;
  };
}

export default function ShippingPolicyPage({ params }: ShippingPolicyPageProps) {
  redirect(`/${params.locale}/pages/shipping-policy`);
}
