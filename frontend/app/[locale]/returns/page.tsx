import { redirect } from 'next/navigation';

interface ReturnsPageProps {
  params: {
    locale: string;
  };
}

export default function ReturnsPage({ params }: ReturnsPageProps) {
  redirect(`/${params.locale || 'vi'}/pages/return-policy`);
}