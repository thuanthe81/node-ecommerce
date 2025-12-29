'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { useLocale } from 'next-intl';
import { BUSINESS } from '@alacraft/shared';
import {
  footerSettingsApi,
  FooterSettings,
  UpdateFooterSettingsDto,
} from '@/lib/footer-settings-api';
import Footer from '@/components/Footer';

export default function FooterSettingsPage() {
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [copyrightText, setCopyrightText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [zaloUrl, setZaloUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load current footer settings
  useEffect(() => {
    const loadFooterSettings = async () => {
      try {
        setLoading(true);
        const settings = await footerSettingsApi.getFooterSettings();
        setCopyrightText(settings.copyrightText);
        setContactEmail(settings.contactEmail || '');
        setContactPhone(settings.contactPhone || '');
        setAddress(settings.address || '');
        setGoogleMapsUrl(settings.googleMapsUrl || '');
        setFacebookUrl(settings.facebookUrl || '');
        setTwitterUrl(settings.twitterUrl || '');
        setTiktokUrl(settings.tiktokUrl || '');
        setZaloUrl(settings.zaloUrl || '');
        setWhatsappUrl(settings.whatsappUrl || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load footer settings');
      } finally {
        setLoading(false);
      }
    };

    loadFooterSettings();
  }, []);

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!copyrightText.trim()) {
      newErrors.copyrightText = 'Copyright text is required';
    }

    if (facebookUrl && !isValidUrl(facebookUrl)) {
      newErrors.facebookUrl = 'Invalid URL format';
    }

    if (twitterUrl && !isValidUrl(twitterUrl)) {
      newErrors.twitterUrl = 'Invalid URL format';
    }

    if (tiktokUrl && !isValidUrl(tiktokUrl)) {
      newErrors.tiktokUrl = 'Invalid URL format';
    }

    if (zaloUrl && !isValidUrl(zaloUrl)) {
      newErrors.zaloUrl = 'Invalid URL format';
    }

    if (whatsappUrl && !isValidUrl(whatsappUrl)) {
      newErrors.whatsappUrl = 'Invalid URL format';
    }

    if (googleMapsUrl && !isValidUrl(googleMapsUrl)) {
      newErrors.googleMapsUrl = 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const data: UpdateFooterSettingsDto = {
        copyrightText,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        address: address || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        facebookUrl: facebookUrl || undefined,
        twitterUrl: twitterUrl || undefined,
        tiktokUrl: tiktokUrl || undefined,
        zaloUrl: zaloUrl || undefined,
        whatsappUrl: whatsappUrl || undefined,
      };

      await footerSettingsApi.updateFooterSettings(data);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update footer settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminProtectedRoute locale={locale}>
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading footer settings...</div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Footer Settings</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6">Edit Footer Content</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                  Footer settings updated successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Copyright Text */}
                <div>
                  <label
                    htmlFor="copyrightText"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Copyright Text <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="copyrightText"
                    value={copyrightText}
                    onChange={(e) => setCopyrightText(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.copyrightText ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="© 2024 ALA Craft. All rights reserved."
                  />
                  {errors.copyrightText && (
                    <p className="mt-1 text-sm text-red-600">{errors.copyrightText}</p>
                  )}
                </div>

                {/* Contact Email */}
                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={BUSINESS.CONTACT.EMAIL.PRIMARY}
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main Street, City, State, ZIP"
                  />
                </div>

                {/* Google Maps URL */}
                <div>
                  <label
                    htmlFor="googleMapsUrl"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    id="googleMapsUrl"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.googleMapsUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://maps.google.com/?q=..."
                  />
                  {errors.googleMapsUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.googleMapsUrl}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Add a Google Maps link for the address
                  </p>
                </div>

                {/* Social Media Links */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Social Media Links</h3>

                  {/* Facebook URL */}
                  <div className="mb-4">
                    <label
                      htmlFor="facebookUrl"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      id="facebookUrl"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.facebookUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://facebook.com/alacraft"
                    />
                    {errors.facebookUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.facebookUrl}</p>
                    )}
                  </div>

                  {/* Twitter URL */}
                  <div className="mb-4">
                    <label
                      htmlFor="twitterUrl"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Twitter URL
                    </label>
                    <input
                      type="url"
                      id="twitterUrl"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.twitterUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://twitter.com/alacraft"
                    />
                    {errors.twitterUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.twitterUrl}</p>
                    )}
                  </div>

                  {/* TikTok URL */}
                  <div className="mb-4">
                    <label
                      htmlFor="tiktokUrl"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      TikTok URL
                    </label>
                    <input
                      type="url"
                      id="tiktokUrl"
                      value={tiktokUrl}
                      onChange={(e) => setTiktokUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.tiktokUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://tiktok.com/@alacraft"
                    />
                    {errors.tiktokUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.tiktokUrl}</p>
                    )}
                  </div>

                  {/* Zalo URL */}
                  <div className="mb-4">
                    <label
                      htmlFor="zaloUrl"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Zalo URL
                    </label>
                    <input
                      type="url"
                      id="zaloUrl"
                      value={zaloUrl}
                      onChange={(e) => setZaloUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.zaloUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://zalo.me/alacraft"
                    />
                    {errors.zaloUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.zaloUrl}</p>
                    )}
                  </div>

                  {/* WhatsApp URL */}
                  <div>
                    <label
                      htmlFor="whatsappUrl"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      WhatsApp URL
                    </label>
                    <input
                      type="url"
                      id="whatsappUrl"
                      value={whatsappUrl}
                      onChange={(e) => setWhatsappUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.whatsappUrl ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://wa.me/1234567890"
                    />
                    {errors.whatsappUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.whatsappUrl}</p>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/admin`)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Section */}
            <div className="bg-white p-6 rounded-lg shadow-md lg:sticky lg:top-6 lg:self-start">
              <h2 className="text-2xl font-bold mb-6">Live Preview</h2>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Footer
                  copyrightText={copyrightText || 'Copyright text will appear here'}
                  contactEmail={contactEmail || undefined}
                  contactPhone={contactPhone || undefined}
                  address={address || undefined}
                  googleMapsUrl={googleMapsUrl || undefined}
                  facebookUrl={facebookUrl || undefined}
                  twitterUrl={twitterUrl || undefined}
                  tiktokUrl={tiktokUrl || undefined}
                  zaloUrl={zaloUrl || undefined}
                  whatsappUrl={whatsappUrl || undefined}
                />
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>Note:</strong> This preview shows how the footer will appear across all
                  pages. Empty fields will not be displayed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
