'use client';

import { useTranslations } from 'next-intl';
import { FooterSettings } from '@/lib/footer-settings-api';
import { SvgEmail, SvgPhone, SvgLocation, SvgWhatsApp, SvgZalo, SvgTikTok, SvgFacebook } from '@/components/Svgs';

interface ContactContentProps {
  footerSettings: FooterSettings | null;
}

export default function ContactContent({ footerSettings }: ContactContentProps) {
  const t = useTranslations();



  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('footer.contactUs')}</h1>
        <p className="text-gray-600 mb-12">{t('common.contactPageDescription')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {t('common.contactInformation')}
            </h2>

            {!footerSettings ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                {t('contact.contactInfoUnavailable')}
              </div>
            ) : (
              <div className="space-y-4">
                {footerSettings.contactEmail && (
                  <div className="flex items-start">
                    <a
                      href={`mailto:${footerSettings.contactEmail}`}
                      className="flex-shrink-0"
                      aria-label={t('contact.emailUs')}
                    >
                      <SvgEmail className="w-6 h-6 text-blue-600 mt-1 mr-3 hover:text-blue-700 cursor-pointer transition-colors" />
                    </a>
                    <div>
                      <h3 className="font-medium text-gray-900">{t('footer.contactEmail')}</h3>
                      <a
                        href={`mailto:${footerSettings.contactEmail}`}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {footerSettings.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {footerSettings.contactPhone && (
                  <div className="flex items-start">
                    <a
                      href={`tel:${footerSettings.contactPhone}`}
                      className="flex-shrink-0"
                      aria-label={t('contact.callUs')}
                    >
                      <SvgPhone className="w-6 h-6 text-blue-600 mt-1 mr-3 hover:text-blue-700 cursor-pointer transition-colors" />
                    </a>
                    <div>
                      <h3 className="font-medium text-gray-900">{t('footer.contactPhone')}</h3>
                      <a
                        href={`tel:${footerSettings.contactPhone}`}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {footerSettings.contactPhone}
                      </a>
                    </div>
                  </div>
                )}

                {footerSettings.address && (
                  <div className="flex items-start">
                    {footerSettings.googleMapsUrl ? (
                      <a
                        href={footerSettings.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        aria-label={t('contact.viewOnGoogleMaps')}
                      >
                        <SvgLocation className="w-6 h-6 text-blue-600 mt-1 mr-3 hover:text-blue-700 cursor-pointer transition-colors" />
                      </a>
                    ) : (
                      <SvgLocation className="w-6 h-6 text-blue-600 mt-1 mr-3" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{t('footer.address')}</h3>
                      <p className="text-gray-600 whitespace-pre-line">{footerSettings.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Social Media Links */}
          {footerSettings &&
            (footerSettings.whatsappUrl ||
              footerSettings.zaloUrl ||
              footerSettings.tiktokUrl ||
              footerSettings.facebookUrl) && (
              <div className="mt-15 space-y-4">
                  {footerSettings.whatsappUrl && (
                    <div className="flex items-start">
                      <a
                        href={footerSettings.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        aria-label={t('footer.whatsapp')}
                      >
                        <SvgWhatsApp className="w-6 h-6 text-blue-600 mt-1 mr-3 hover:text-blue-700 cursor-pointer transition-colors" />
                      </a>
                      <div>
                        <h4 className="font-medium text-gray-900">{t('footer.whatsapp')}</h4>
                        <a
                          href={footerSettings.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {footerSettings.whatsappUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {footerSettings.zaloUrl && (
                    <div className="flex items-start">
                      <a
                        href={footerSettings.zaloUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        aria-label={t('footer.zalo')}
                      >
                        <SvgZalo className="w-6 h-6 text-blue-600 mt-1 mr-3 hover:text-blue-700 cursor-pointer transition-colors" />
                      </a>
                      <div>
                        <h4 className="font-medium text-gray-900">{t('footer.zalo')}</h4>
                        <a
                          href={footerSettings.zaloUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {footerSettings.zaloUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {footerSettings.tiktokUrl && (
                    <div className="flex items-start">
                      <a
                        href={footerSettings.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        aria-label={t('footer.tiktok')}
                      >
                        <SvgTikTok className="w-6 h-6 text-blue-600 mt-1 mr-3 hover:text-blue-700 cursor-pointer transition-colors" />
                      </a>
                      <div>
                        <h4 className="font-medium text-gray-900">{t('footer.tiktok')}</h4>
                        <a
                          href={footerSettings.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {footerSettings.tiktokUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {footerSettings.facebookUrl && (
                    <div className="flex items-start">
                      <a
                        href={footerSettings.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        aria-label={t('footer.facebook')}
                      >
                        <SvgFacebook className="w-6 h-6 text-blue-600 mt-1 mr-3 hover:text-blue-700 cursor-pointer transition-colors" />
                      </a>
                      <div>
                        <h4 className="font-medium text-gray-900">{t('footer.facebook')}</h4>
                        <a
                          href={footerSettings.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {footerSettings.facebookUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}