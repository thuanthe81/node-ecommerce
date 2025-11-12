import { getTranslations } from 'next-intl/server';
import HomeContent from './HomeContent';
import StructuredData from '@/components/StructuredData';
import { generateSEOMetadata, generateOrganizationSchema } from '@/lib/seo';
import { Metadata } from 'next';
import { useLocale } from 'next-intl';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return generateSEOMetadata({
    title: t('seo.home.title'),
    description: t('seo.home.description'),
    locale,
    path: '',
    type: 'website',
  });
}
//
// export default async function Home({
//   params,
// }: {
//   params: Promise<{ locale: string }>;
// }) {
//   const { locale } = await params;
//   const organizationSchema = generateOrganizationSchema();
//   return (
//     <>
//       <StructuredData data={organizationSchema} />
//       <HomeContent locale={locale} />
//     </>
//   );
// }

export default function Home() {
  // const locale = useLocale();
  const organizationSchema = generateOrganizationSchema();
  return (
    <>
      <StructuredData data={organizationSchema} />
      <HomeContent />
    </>
  );
}