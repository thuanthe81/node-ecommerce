import { redirect } from 'next/navigation';

interface PurchasingPageProps {
  params: {
    locale: string;
  };
}

export default function PurchasingPage({ params }: PurchasingPageProps) {
  redirect(`/${params.locale || 'vi'}/pages/purchasing`);
}