import { Metadata } from 'next';
import NewPromotionContent from './NewPromotionContent';

export const metadata: Metadata = {
  title: 'Create Promotion - Admin',
  description: 'Create a new discount code',
};

export default async function NewPromotionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <NewPromotionContent locale={locale} />;
}
