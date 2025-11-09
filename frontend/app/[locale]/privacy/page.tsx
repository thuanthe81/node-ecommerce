import { redirect } from 'next/navigation';

interface PrivacyPageProps {
  params: {
    locale: string;
  };
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  redirect(`/${params.locale}/pages/privacy-policy`);
}
