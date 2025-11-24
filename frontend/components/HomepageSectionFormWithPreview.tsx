'use client';

import { useState } from 'react';
import HomepageSectionForm, { PreviewData } from './HomepageSectionForm';
import ContentSection from './ContentSection';
import { Content, CreateContentData } from '@/lib/content-api';

interface HomepageSectionFormWithPreviewProps {
  section?: Content;
  onSubmit: (data: CreateContentData) => Promise<void>;
  onCancel: () => void;
}

export default function HomepageSectionFormWithPreview({
  section,
  onSubmit,
  onCancel,
}: HomepageSectionFormWithPreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewData>({
    layout: section?.layout || 'centered',
    titleEn: section?.titleEn || '',
    titleVi: section?.titleVi || '',
    contentEn: section?.contentEn || '',
    contentVi: section?.contentVi || '',
    buttonTextEn: section?.buttonTextEn || '',
    buttonTextVi: section?.buttonTextVi || '',
    buttonUrl: section?.linkUrl || '',
    imageUrl: section?.imageUrl || '',
  });

  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'vi'>('en');

  const handlePreviewDataChange = (data: PreviewData) => {
    setPreviewData(data);
  };

  // Determine if we have enough data to show a meaningful preview
  const hasPreviewData =
    previewData.titleEn || previewData.titleVi || previewData.contentEn || previewData.contentVi;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Section Details</h2>
        <HomepageSectionForm
          section={section}
          onSubmit={onSubmit}
          onCancel={onCancel}
          showPreview={true}
          onPreviewDataChange={handlePreviewDataChange}
        />
      </div>

      {/* Preview Section */}
      <div className="bg-white p-6 rounded-lg shadow-md lg:sticky lg:top-6 lg:self-start">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Live Preview</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreviewLanguage('en')}
              className={`px-3 py-1 text-sm rounded ${
                previewLanguage === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setPreviewLanguage('vi')}
              className={`px-3 py-1 text-sm rounded ${
                previewLanguage === 'vi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              VI
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {hasPreviewData ? (
            <div className="transform scale-75 origin-top-left w-[133.33%]">
              <ContentSection
                layout={previewData.layout}
                title={previewLanguage === 'en' ? previewData.titleEn : previewData.titleVi}
                description={previewLanguage === 'en' ? previewData.contentEn : previewData.contentVi}
                buttonText={
                  previewLanguage === 'en' ? previewData.buttonTextEn : previewData.buttonTextVi
                }
                buttonUrl={previewData.buttonUrl || '#'}
                imageUrl={previewData.imageUrl}
                imageAlt={previewLanguage === 'en' ? previewData.titleEn : previewData.titleVi}
              />
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">Preview will appear here</p>
              <p className="text-sm mt-2">Start filling out the form to see a live preview</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> This preview shows how the section will appear on the homepage.
            The preview is scaled down to fit this panel.
          </p>
        </div>
      </div>
    </div>
  );
}
