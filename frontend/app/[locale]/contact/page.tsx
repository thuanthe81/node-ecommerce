import { Suspense } from 'react';
import ContactContent from './ContactContent';
import { FooterSettings } from '@/lib/footer-settings-api';

async function getFooterSettings(): Promise<FooterSettings | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/footer-settings`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching footer settings:', error);
    return null;
  }
}

export default async function ContactPage() {
  const footerSettings = await getFooterSettings();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactContent footerSettings={footerSettings} />
    </Suspense>
  );
}
