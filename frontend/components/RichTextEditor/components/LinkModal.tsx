'use client';

import { useState, useEffect } from 'react';
import { Portal } from '@/components/Portal';
import { SvgClose } from '@/components/Svgs';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLink: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
  locale: string;
}

export function LinkModal({
  isOpen,
  onClose,
  onInsertLink,
  initialUrl = '',
  initialText = '',
  locale,
}: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
      setError('');
    }
  }, [isOpen, initialUrl, initialText]);

  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
      return false;
    }

    // Allow relative URLs (starting with /)
    if (urlString.startsWith('/')) {
      return true;
    }

    // Allow mailto: and tel: links
    if (urlString.startsWith('mailto:') || urlString.startsWith('tel:')) {
      return true;
    }

    // For absolute URLs, check if they have a protocol
    try {
      // If no protocol, add https://
      const urlToTest = urlString.includes('://') ? urlString : `https://${urlString}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeUrl = (urlString: string): string => {
    const trimmed = urlString.trim();

    // Don't modify relative URLs, mailto:, or tel: links
    if (trimmed.startsWith('/') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
      return trimmed;
    }

    // Add https:// if no protocol is present
    if (!trimmed.includes('://')) {
      return `https://${trimmed}`;
    }

    return trimmed;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateUrl(url)) {
      setError(locale === 'vi' ? 'Vui lòng nhập URL hợp lệ' : 'Please enter a valid URL');
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    onInsertLink(normalizedUrl, text.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setUrl('');
    setText('');
    setError('');
    onClose();
  };

  const handleRemoveLink = () => {
    onInsertLink(''); // Empty URL signals link removal
    handleClose();
  };

  if (!isOpen) return null;

  const translations = {
    title: locale === 'vi' ? 'Chèn liên kết' : 'Insert Link',
    editTitle: locale === 'vi' ? 'Chỉnh sửa liên kết' : 'Edit Link',
    urlLabel: locale === 'vi' ? 'URL' : 'URL',
    urlPlaceholder: locale === 'vi' ? 'https://example.com hoặc /page' : 'https://example.com or /page',
    textLabel: locale === 'vi' ? 'Văn bản hiển thị (tùy chọn)' : 'Display Text (optional)',
    textPlaceholder: locale === 'vi' ? 'Nhập văn bản liên kết' : 'Enter link text',
    insertButton: locale === 'vi' ? 'Chèn' : 'Insert',
    updateButton: locale === 'vi' ? 'Cập nhật' : 'Update',
    removeButton: locale === 'vi' ? 'Xóa liên kết' : 'Remove Link',
    cancelButton: locale === 'vi' ? 'Hủy' : 'Cancel',
  };

  const isEditing = !!initialUrl;

  return (
    <Portal>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? translations.editTitle : translations.title}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <SvgClose className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* URL Input */}
              <div>
                <label htmlFor="link-url" className="block text-sm font-medium text-gray-700 mb-1">
                  {translations.urlLabel}
                </label>
                <input
                  id="link-url"
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  placeholder={translations.urlPlaceholder}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    error ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoFocus
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </div>

              {/* Text Input (only show if no text is selected) */}
              {!initialText && (
                <div>
                  <label htmlFor="link-text" className="block text-sm font-medium text-gray-700 mb-1">
                    {translations.textLabel}
                  </label>
                  <input
                    id="link-text"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={translations.textPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
              <div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {translations.removeButton}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                  {translations.cancelButton}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? translations.updateButton : translations.insertButton}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}