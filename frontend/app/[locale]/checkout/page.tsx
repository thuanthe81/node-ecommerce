import { getTranslations } from 'next-intl/server';
import CheckoutContent from './CheckoutContent';
import { generateSEOMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata>  {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return generateSEOMetadata({
    title: t('seo.checkout.title'),
    description: t('seo.checkout.description'),
    locale,
    path: '/checkout',
    type: 'website',
    noindex: true, // Checkout pages should not be indexed
  });
}

export default function CheckoutPage() {
  return <CheckoutContent />;
}