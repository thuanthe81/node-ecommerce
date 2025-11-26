import { Metadata } from 'next';
import PromotionListContent from './PromotionListContent';

export const metadata: Metadata = {
  title: 'Promotion Management - Admin',
  description: 'Manage discount codes and promotions',
};

export default async function PromotionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <PromotionListContent locale={locale} />;
}
