import { LanguageTab } from '../types';

/**
 * Props for the ContentFields component
 */
interface ContentFieldsProps {
  /** Currently active language tab */
  activeTab: LanguageTab;
  /** Title in English */
  titleEn: string;
  /** Title in Vietnamese */
  titleVi: string;
  /** Content in English */
  contentEn: string;
  /** Content in Vietnamese */
  contentVi: string;
  /** Button text in English */
  buttonTextEn: string;
  /** Button text in Vietnamese */
  buttonTextVi: string;
  /** Whether editing existing section */
  isEdit: boolean;
  /** Callback when field changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Callback when title changes (for slug generation) */
  onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Content fields for homepage section (title, description, button text)
 * Displays fields based on active language tab
 *
 * @param props - Component props
 */
export function ContentFields({
  activeTab,
  titleEn,
  titleVi,
  contentEn,
  contentVi,
  buttonTextEn,
  buttonTextVi,
  isEdit,
  onChange,
  onTitleChange,
}: ContentFieldsProps) {
  if (activeTab === 'en') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title (English) *
          </label>
          <input
            type="text"
            name="titleEn"
            value={titleEn}
            onChange={onTitleChange || onChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter section title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (English) *
          </label>
          <textarea
            name="contentEn"
            value={contentEn}
            onChange={onChange}
            required
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter section description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Button Text (English) *
          </label>
          <input
            type="text"
            name="buttonTextEn"
            value={buttonTextEn}
            onChange={onChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Shop Now"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (Vietnamese) *
        </label>
        <input
          type="text"
          name="titleVi"
          value={titleVi}
          onChange={onChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nhập tiêu đề phần"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Vietnamese) *
        </label>
        <textarea
          name="contentVi"
          value={contentVi}
          onChange={onChange}
          required
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nhập mô tả phần"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Button Text (Vietnamese) *
        </label>
        <input
          type="text"
          name="buttonTextVi"
          value={buttonTextVi}
          onChange={onChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="ví dụ: Mua Ngay"
        />
      </div>
    </div>
  );
}
