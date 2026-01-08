import { redirect } from 'next/navigation';

interface TermsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  redirect(`/${locale || 'vi'}/pages/terms-of-service`);
}