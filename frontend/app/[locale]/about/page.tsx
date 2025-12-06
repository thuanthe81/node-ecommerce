import { redirect } from 'next/navigation';

interface AboutPageProps {
  params: {
    locale: string;
  };
}

export default function AboutPage({ params }: AboutPageProps) {
  // Redirect to the dynamic CMS page
  redirect(`/${params.locale || 'vi'}/pages/about-us`);
}