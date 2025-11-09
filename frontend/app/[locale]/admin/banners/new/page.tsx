import { Metadata } from 'next';
import NewBannerContent from './NewBannerContent';

export const metadata: Metadata = {
  title: 'Create Banner - Admin',
  description: 'Create a new promotional banner',
};

export default function NewBannerPage({ params }: { params: { locale: string } }) {
  return <NewBannerContent locale={params.locale} />;
}
