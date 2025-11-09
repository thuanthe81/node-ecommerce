import { Metadata } from 'next';
import EditPromotionContent from './EditPromotionContent';

export const metadata: Metadata = {
  title: 'Edit Promotion - Admin',
  description: 'Edit promotion details',
};

export default function EditPromotionPage({ 
  params 
}: { 
  params: { locale: string; id: string } 
}) {
  return <EditPromotionContent locale={params.locale} promotionId={params.id} />;
}
