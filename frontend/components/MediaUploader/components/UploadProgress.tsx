import { useTranslations } from 'next-intl';
import { UploadProgressProps } from '../types';

/**
 * UploadProgress component for displaying upload progress
 *
 * Shows a loading indicator while a file is being uploaded
 *
 * @param props - Component props
 * @returns JSX element
 */
export function UploadProgress({ locale }: UploadProgressProps) {
  const t = useTranslations('admin.contentMedia');

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-600">{t('uploadingImage')}</span>
    </div>
  );
}
