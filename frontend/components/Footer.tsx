'use client';

import Link from 'next/link';
import { SvgFacebook, SvgTwitter, SvgTikTok } from '@/components/Svgs';

export interface FooterProps {
  copyrightText: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
}

export default function Footer({
  copyrightText,
  contactEmail,
  contactPhone,
  facebookUrl,
  twitterUrl,
  tiktokUrl,
}: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Copyright Section */}
          <div className="flex items-center justify-center md:justify-start">
            <p className="text-sm text-gray-300">{copyrightText}</p>
          </div>

          {/* Contact Information Section */}
          {(contactEmail || contactPhone) && (
            <div className="flex flex-col items-center justify-center space-y-2">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  aria-label={`Email: ${contactEmail}`}
                >
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                  aria-label={`Phone: ${contactPhone}`}
                >
                  {contactPhone}
                </a>
              )}
            </div>
          )}

          {/* Social Media Links Section */}
          {(facebookUrl || twitterUrl || tiktokUrl) && (
            <div className="flex items-center justify-center md:justify-end space-x-6">
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <SvgFacebook className="w-6 h-6" aria-hidden="true" />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <SvgTwitter className="w-6 h-6" aria-hidden="true" />
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="TikTok"
                >
                  <SvgTikTok className="w-6 h-6" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
