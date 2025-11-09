import { Metadata } from 'next';
import EditBannerContent from './EditBannerContent';

export const metadata: Metadata = {
  title: 'Edit Banner - Admin',
  description: 'Edit banner details',
};

export default function EditBannerPage({ 
  params 
}: { 
  params: { locale: string; id: string } 
}) {
  return <EditBannerContent locale={params.locale} bannerId={params.id} />;
}
