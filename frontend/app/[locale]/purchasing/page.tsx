import { redirect } from 'next/navigation';

interface PurchasingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PurchasingPage({ params }: PurchasingPageProps) {
  const { locale } = await params;
  redirect(`/${locale || 'vi'}/pages/purchasing-guide`);
}