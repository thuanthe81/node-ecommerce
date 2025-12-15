import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LogoProps } from '../types';
import logoImage from '@/app/logo.jpg';

/**
 * Logo component
 *
 * Displays the site logo as a clickable link to the home page.
 *
 * @param props - Component props
 * @param props.locale - Current locale for routing
 *
 * @example
 * ```tsx
 * <Logo locale="en" />
 * ```
 */
export function Logo({ locale }: LogoProps) {
  const t = useTranslations();

  return (
    <Link
      href={`/${locale}`}
      className="flex items-center border-b-transparent touch-manipulation"
      aria-label={t('nav.home') || 'Home'}
    >
      <Image
        src={logoImage}
        alt="Handmade"
        width={60}
        height={60}
        priority
        className="h-auto w-auto rounded-full"
      />
    </Link>
  );
}