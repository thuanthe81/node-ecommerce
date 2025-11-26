import { Metadata } from 'next';
import BannerListContent from './BannerListContent';

export const metadata: Metadata = {
  title: 'Banner Management - Admin',
  description: 'Manage promotional banners',
};

export default async function BannersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <BannerListContent locale={locale} />;
}
