'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SvgFacebook, SvgTwitter, SvgTikTok, SvgZalo, SvgWhatsApp, SvgEmail, SvgPhone, SvgLocation } from '@/components/Svgs';
import { ShopInfo } from '@/app/constants';

export interface FooterProps {
  copyrightText: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  googleMapsUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  zaloUrl?: string;
  whatsappUrl?: string;
}

export default function Footer({
  copyrightText,
  contactEmail,
  contactPhone,
  address,
  googleMapsUrl,
  facebookUrl,
  twitterUrl,
  tiktokUrl,
  zaloUrl,
  whatsappUrl,
}: FooterProps) {
  const t = useTranslations('footer');
  const tNav =  useTranslations('nav')

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Information Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 pb-8 border-b border-gray-700">
          {/* Customer Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('customer')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('faqs')}
                </Link>
              </li>
              <li>
                <Link
                  href="/purchasing"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('purchasing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* About Us Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('aboutUs')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('aboutAlaCraft')}
                </Link>
              </li>
              <li>
                <Link
                  href="/about-products"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('aboutProducts')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {tNav('contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('termsOfUse')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('returnPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {t('shippingPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('socials')}</h3>
            <ul className="space-y-2">
              {facebookUrl && (
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <SvgFacebook className="w-5 h-5" aria-hidden="true" />
                    {t('facebook')}
                  </a>
                </li>
              )}
              {tiktokUrl && (
                <li>
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <SvgTikTok className="w-5 h-5" aria-hidden="true" />
                    {t('tiktok')}
                  </a>
                </li>
              )}
              {/*{whatsappUrl && (*/}
              {/*  <li>*/}
              {/*    <a*/}
              {/*      href={whatsappUrl}*/}
              {/*      target="_blank"*/}
              {/*      rel="noopener noreferrer"*/}
              {/*      className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"*/}
              {/*    >*/}
              {/*      <SvgWhatsApp className="w-5 h-5" aria-hidden="true" />*/}
              {/*      {t('whatsapp')}*/}
              {/*    </a>*/}
              {/*  </li>*/}
              {/*)}*/}
              {/*{zaloUrl && (*/}
              {/*  <li>*/}
              {/*    <a*/}
              {/*      href={zaloUrl}*/}
              {/*      target="_blank"*/}
              {/*      rel="noopener noreferrer"*/}
              {/*      className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"*/}
              {/*    >*/}
              {/*      <SvgZalo className="w-5 h-5" aria-hidden="true" />*/}
              {/*      {t('zalo')}*/}
              {/*    </a>*/}
              {/*  </li>*/}
              {/*)}*/}
            </ul>
          </div>
        </div>

        {/* Bottom Section - Copyright and Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Copyright Section */}
          <div className="flex flex-col items-start justify-center md:justify-start">
            <p className="text-sm text-gray-300">{copyrightText}</p>
            <p className="text-sm text-gray-300">POWERED BY DEVELOPER thuanthe81@gmail.com</p>
          </div>

          <div className="flex flex-col items-center justify-center md:justify-start">
            <p className="text-4xl font-bold text-gray-300">{ShopInfo.name}</p>
          </div>

          {/* Contact Information Section */}
          {(contactEmail || contactPhone || address) && (
            <div className="m-auto">
              <div className="flex flex-col">
                {contactEmail && (
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
                    aria-label={`Email: ${contactEmail}`}
                  >
                    <SvgEmail className="w-5 h-5" aria-hidden="true" />
                    {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
                    aria-label={`Phone: ${contactPhone}`}
                  >
                    <SvgPhone className="w-5 h-5" aria-hidden="true" />
                    {contactPhone}
                  </a>
                )}
                {address && (
                  googleMapsUrl ? (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2"
                      aria-label={`Address: ${address}`}
                    >
                      <SvgLocation className="w-5 h-5" aria-hidden="true" />
                      {address}
                    </a>
                  ) : (
                    <div className="text-sm text-gray-300 inline-flex items-center gap-2">
                      <SvgLocation className="w-5 h-5" aria-hidden="true" />
                      {address}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Social Media Links Section */}
          {/*{(facebookUrl || twitterUrl || tiktokUrl) && (*/}
          {/*  <div className="flex items-center justify-center md:justify-end space-x-6">*/}
          {/*    {facebookUrl && (*/}
          {/*      <a*/}
          {/*        href={facebookUrl}*/}
          {/*        target="_blank"*/}
          {/*        rel="noopener noreferrer"*/}
          {/*        className="text-gray-300 hover:text-white transition-colors"*/}
          {/*        aria-label="Facebook"*/}
          {/*      >*/}
          {/*        <SvgFacebook className="w-6 h-6" aria-hidden="true" />*/}
          {/*      </a>*/}
          {/*    )}*/}
          {/*    {twitterUrl && (*/}
          {/*      <a*/}
          {/*        href={twitterUrl}*/}
          {/*        target="_blank"*/}
          {/*        rel="noopener noreferrer"*/}
          {/*        className="text-gray-300 hover:text-white transition-colors"*/}
          {/*        aria-label="Twitter"*/}
          {/*      >*/}
          {/*        <SvgTwitter className="w-6 h-6" aria-hidden="true" />*/}
          {/*      </a>*/}
          {/*    )}*/}
          {/*    {tiktokUrl && (*/}
          {/*      <a*/}
          {/*        href={tiktokUrl}*/}
          {/*        target="_blank"*/}
          {/*        rel="noopener noreferrer"*/}
          {/*        className="text-gray-300 hover:text-white transition-colors"*/}
          {/*        aria-label="TikTok"*/}
          {/*      >*/}
          {/*        <SvgTikTok className="w-6 h-6" aria-hidden="true" />*/}
          {/*      </a>*/}
          {/*    )}*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      </div>
    </footer>
  );
}