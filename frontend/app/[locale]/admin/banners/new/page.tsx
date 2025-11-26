import { Metadata } from 'next';
import NewBannerContent from './NewBannerContent';

export const metadata: Metadata = {
  title: 'Create Banner - Admin',
  description: 'Create a new promotional banner',
};

export default async function NewBannerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return <NewBannerContent locale={locale} />;
}
