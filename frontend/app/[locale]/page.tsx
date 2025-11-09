import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import HomeContent from './HomeContent';
import StructuredData from '@/components/StructuredData';
import { generateSEOMetadata, generateOrganizationSchema } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const organizationSchema = generateOrganizationSchema();
  return (
    <>
      <StructuredData data={organizationSchema} />
      <HomeContent locale={locale} />
    </>
  );
}
