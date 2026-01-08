import { redirect } from 'next/navigation';

interface ShippingPolicyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ShippingPolicyPage({ params }: ShippingPolicyPageProps) {
  const { locale } = await params;
  redirect(`/${locale || 'vi'}/pages/shipping-policy`);
}