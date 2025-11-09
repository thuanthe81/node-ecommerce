import { Metadata } from 'next';
import PromotionListContent from './PromotionListContent';

export const metadata: Metadata = {
  title: 'Promotion Management - Admin',
  description: 'Manage discount codes and promotions',
};

export default function PromotionsPage({ params }: { params: { locale: string } }) {
  return <PromotionListContent locale={params.locale} />;
}
