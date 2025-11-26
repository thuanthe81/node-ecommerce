import { Metadata } from 'next';
import EditPromotionContent from './EditPromotionContent';

export const metadata: Metadata = {
  title: 'Edit Promotion - Admin',
  description: 'Edit promotion details',
};

export default async function EditPromotionPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params;

  return <EditPromotionContent locale={locale} promotionId={id} />;
}
