import { redirect } from 'next/navigation';

interface ReturnsPageProps {
  params: {
    locale: string;
  };
}

export default function ReturnsPage({ params }: ReturnsPageProps) {
  redirect(`/${params.locale}/pages/return-policy`);
}
