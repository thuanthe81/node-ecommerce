import { Metadata } from 'next';
import NewPromotionContent from './NewPromotionContent';

export const metadata: Metadata = {
  title: 'Create Promotion - Admin',
  description: 'Create a new discount code',
};

export default function NewPromotionPage({ params }: { params: { locale: string } }) {
  return <NewPromotionContent locale={params.locale} />;
}
