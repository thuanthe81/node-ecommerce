import { redirect } from 'next/navigation';

interface AboutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  // Redirect to the dynamic CMS page
  redirect(`/${locale || 'vi'}/pages/about-us`);
}