import { redirect } from 'next/navigation';

interface TermsPageProps {
  params: {
    locale: string;
  };
}

export default function TermsPage({ params }: TermsPageProps) {
  redirect(`/${params.locale || 'vi'}/pages/terms-of-service`);
}