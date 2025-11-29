import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category, categoryApi } from '@/lib/category-api';
import { adminCategoryApi } from '@/lib/admin-category-api';
import { CategoryFormData, LanguageTab, FlattenedCategory } from '../types';

/**
 * Custom hook for managing category form state and operations
 *
 * @param locale - Current locale for translations
 * @param category - Category to edit (undefined for create mode)
 * @param isEdit - Whether the form is in edit mode
 * @returns Form state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   loading,
 *   categories,
 *   activeTab,
 *   setActiveTab,
 *   handleInputChange,
 *   handleImageSelect,
 *   handleImageClear,
 *   handleSubmit
 * } = useCategoryForm(locale, category, isEdit);
 * ```
 */
export function useCategoryForm(
  locale: string,
  category?: Category,
  isEdit: boolean = false
) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<FlattenedCategory[]>([]);
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');
  const [formData, setFormData] = useState<CategoryFormData>({
    slug: category?.slug || '',
    nameEn: category?.nameEn || '',
    nameVi: category?.nameVi || '',
    descriptionEn: category?.descriptionEn || '',
    descriptionVi: category?.descriptionVi || '',
    parentId: category?.parentId || undefined,
    imageUrl: category?.imageUrl || '',
    displayOrder: category?.displayOrder || 0,
    isActive: category?.isActive ?? true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryApi.getCategories();
      setCategories(flattenCategories(data));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const flattenCategories = (cats: Category[], level = 0): FlattenedCategory[] => {
    let result: FlattenedCategory[] = [];
    cats.forEach((cat) => {
      // Don't include the current category in parent options when editing
      if (!isEdit || cat.id !== category?.id) {
        result.push({ ...cat, displayOrder: level });
        if (cat.children && cat.children.length > 0) {
          result = result.concat(flattenCategories(cat.children, level + 1));
        }
      }
    });
    return result;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'number'
          ? parseInt(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const handleImageSelect = (imageUrl: string) => {
    setFormData({
      ...formData,
      imageUrl,
    });
  };

  const handleImageClear = () => {
    setFormData({
      ...formData,
      imageUrl: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && category) {
        // In edit mode, send imageUrl if it exists
        const dataToSend = {
          ...formData,
          parentId: formData.parentId || undefined,
          imageUrl: formData.imageUrl || undefined,
        };
        await adminCategoryApi.updateCategory(category.id, dataToSend);
      } else {
        // In create mode, exclude imageUrl from the request
        const { imageUrl, ...dataWithoutImage } = formData;
        const dataToSend = {
          ...dataWithoutImage,
          parentId: formData.parentId || undefined,
        };
        await adminCategoryApi.createCategory(dataToSend);
      }

      router.push(`/${locale}/admin/categories`);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert(
        locale === 'vi'
          ? 'Không thể lưu danh mục. Vui lòng thử lại.'
          : 'Failed to save category. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    categories,
    activeTab,
    setActiveTab,
    handleInputChange,
    handleImageSelect,
    handleImageClear,
    handleSubmit,
  };
}
