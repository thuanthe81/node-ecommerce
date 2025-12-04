import { redirect } from 'next/navigation';

interface PrivacyPageProps {
  params: {
    locale: string;
  };
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  redirect(`/${params.locale || 'vi'}/pages/privacy-policy`);
}