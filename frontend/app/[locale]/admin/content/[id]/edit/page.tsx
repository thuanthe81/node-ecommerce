import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import EditContentContent from './EditContentContent';

export default function EditContentPage() {
  const t = useTranslations();

  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <EditContentContent />
    </Suspense>
  );
}
