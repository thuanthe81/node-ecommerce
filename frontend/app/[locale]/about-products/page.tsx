import { redirect } from 'next/navigation';

interface AboutProductsPageProps {
  params: {
    locale: string;
  };
}

export default function AboutProductsPage({ params }: AboutProductsPageProps) {
  // Redirect to the dynamic CMS page
  redirect(`/${params.locale || 'vi'}/pages/about-products`);
}