import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import '../globals.css';
import { ShopInfo } from '@/app/constants';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

// Metadata is now generated per page
export const metadata: Metadata = {
  title: ShopInfo.name,
  description: ShopInfo.desc,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Fetch footer settings on the server
async function getFooterSettings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/footer-settings`, {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (!response.ok) {
      console.error('Failed to fetch footer settings:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching footer settings:', error);
    return null;
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Fetch footer settings
  const footerSettings = await getFooterSettings();

  return (
    <html lang={locale}>
      <head>
        {/* hreflang tags for SEO */}
        <link
          rel="alternate"
          hrefLang="vi"
          href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/`}
        />
        <link
          rel="alternate"
          hrefLang="en"
          href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/en`}
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/`}
        />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
        >
          {locale === 'vi' ? 'Bỏ qua điều hướng' : 'Skip to main content'}
        </a>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <CartProvider>
              <div className="relative flex flex-col min-h-screen">
                <div className="absolute z-10 w-full">
                  <Header />
                </div>
                <div className="border-b h-[69px]"/>
                <main id="main-content" role="main" className="flex-grow">{children}</main>
                {footerSettings && (
                  <Footer
                    copyrightText={footerSettings.copyrightText}
                    contactEmail={footerSettings.contactEmail || undefined}
                    contactPhone={footerSettings.contactPhone || undefined}
                    address={footerSettings.address || undefined}
                    googleMapsUrl={footerSettings.googleMapsUrl || undefined}
                    facebookUrl={footerSettings.facebookUrl || undefined}
                    twitterUrl={footerSettings.twitterUrl || undefined}
                    tiktokUrl={footerSettings.tiktokUrl || undefined}
                  />
                )}
              </div>
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}