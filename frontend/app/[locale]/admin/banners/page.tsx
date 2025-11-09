import { Metadata } from 'next';
import BannerListContent from './BannerListContent';

export const metadata: Metadata = {
  title: 'Banner Management - Admin',
  description: 'Manage promotional banners',
};

export default function BannersPage({ params }: { params: { locale: string } }) {
  return <BannerListContent locale={params.locale} />;
}
