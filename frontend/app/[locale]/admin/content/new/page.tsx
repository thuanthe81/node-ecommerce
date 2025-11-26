import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import NewContentContent from './NewContentContent';

export default function NewContentPage() {
  const t = useTranslations();

  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <NewContentContent />
    </Suspense>
  );
}
