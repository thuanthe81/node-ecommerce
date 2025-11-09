import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import CartPageContent from './CartPageContent';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'cart' });
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default function CartPage() {
  return <CartPageContent />;
}
