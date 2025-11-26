import { Metadata } from 'next';
import EditBannerContent from './EditBannerContent';

export const metadata: Metadata = {
  title: 'Edit Banner - Admin',
  description: 'Edit banner details',
};

export default async function EditBannerPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params;

  return <EditBannerContent locale={locale} bannerId={id} />;
}
