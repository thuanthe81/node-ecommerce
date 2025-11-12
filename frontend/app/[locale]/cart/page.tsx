import { getTranslations } from 'next-intl/server';
import CartPageContent from './CartPageContent';
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
    title: t('seo.cart.title'),
    description: t('seo.cart.description'),
    locale,
    path: '/cart',
    type: 'website',
    noindex: true, // Cart pages should not be indexed
  });
}

export default function CartPage() {
  return <CartPageContent />;
}