import { redirect } from 'next/navigation';

interface PrivacyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  redirect(`/${locale || 'vi'}/pages/privacy-policy`);
}