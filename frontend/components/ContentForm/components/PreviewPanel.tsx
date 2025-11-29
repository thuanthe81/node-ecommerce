import { ContentFormData, LanguageTab } from '../types';

/**
 * Props for the PreviewPanel component
 */
interface PreviewPanelProps {
  /** Form data to preview */
  formData: ContentFormData;
  /** Active language tab */
  activeTab: LanguageTab;
}

/**
 * Live preview panel for content (currently not used in the form, but available for future use)
 *
 * @example
 * ```tsx
 * <PreviewPanel
 *   formData={formData}
 *   activeTab={activeTab}
 * />
 * ```
 */
export function PreviewPanel({ formData, activeTab }: PreviewPanelProps) {
  const title = activeTab === 'en' ? formData.titleEn : formData.titleVi;
  const content = activeTab === 'en' ? formData.contentEn : formData.contentVi;

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Preview</h3>
      <div className="bg-white rounded-lg p-6">
        {formData.imageUrl && (
          <img
            src={formData.imageUrl}
            alt={title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        <h2 className="text-2xl font-bold mb-4">{title || 'Untitled'}</h2>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content || '<p>No content</p>' }}
        />
      </div>
    </div>
  );
}
