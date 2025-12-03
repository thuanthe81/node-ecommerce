'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { submitContactForm } from '@/lib/contact-api';
import { FooterSettings } from '@/lib/footer-settings-api';
import { SvgEmail, SvgPhone, SvgLocation } from '@/components/Svgs';

interface ContactContentProps {
  footerSettings: FooterSettings | null;
}

export default function ContactContent({ footerSettings }: ContactContentProps) {
  const t = useTranslations();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await submitContactForm(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('footer.contactUs')}
        </h1>
        <p className="text-gray-600 mb-12">
          {t('common.contactPageDescription')}
        </p>

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
                      <h3 className="font-medium text-gray-900">
                        {t('footer.contactEmail')}
                      </h3>
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
                      <h3 className="font-medium text-gray-900">
                        {t('footer.contactPhone')}
                      </h3>
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
                      <h3 className="font-medium text-gray-900">
                        {t('footer.address')}
                      </h3>
                      <p className="text-gray-600 whitespace-pre-line">
                        {footerSettings.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {t('common.sendMessage')}
            </h2>

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {t('common.contactFormSuccess')}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.subject')} *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.message')} *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? t('common.sending') : t('common.sendMessage')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}