import { redirect } from 'next/navigation';

interface ReturnsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ReturnsPage({ params }: ReturnsPageProps) {
  const { locale } = await params;
  redirect(`/${locale || 'vi'}/pages/return-policy`);
}