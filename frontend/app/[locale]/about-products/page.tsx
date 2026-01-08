import { redirect } from 'next/navigation';

interface AboutProductsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AboutProductsPage({ params }: AboutProductsPageProps) {
  const { locale } = await params;
  // Redirect to the dynamic CMS page
  redirect(`/${locale || 'vi'}/pages/about-products`);
}