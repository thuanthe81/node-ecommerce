import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, productApi, ProductImage } from '@/lib/product-api';
import { Category, categoryApi } from '@/lib/category-api';
import { ProductFormData, LanguageTab, UseProductFormReturn } from '../types';
import { ImageManagerHandle } from '@/components/ImageManager';

/**
 * Custom hook for managing ProductForm state and logic
 *
 * @param locale - Current locale for translations
 * @param product - Product to edit (undefined for create mode)
 * @param isEdit - Whether the form is in edit mode
 *
 * @returns Form state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   images,
 *   categories,
 *   handleSubmit,
 *   handleInputChange
 * } = useProductForm('en', product, true);
 * ```
 */
export function useProductForm(
  locale: string,
  product?: Product,
  isEdit: boolean = false
): UseProductFormReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const imageManagerRef = useRef<ImageManagerHandle>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    slug: product?.slug || '',
    sku: product?.sku || '',
    nameEn: product?.nameEn || '',
    nameVi: product?.nameVi || '',
    descriptionEn: product?.descriptionEn || '',
    descriptionVi: product?.descriptionVi || '',
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || 0,
    stockQuantity: product?.stockQuantity || 0,
    categoryId: product?.category?.id || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
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

  const flattenCategories = (cats: Category[], level = 0): Category[] => {
    let result: Category[] = [];
    cats.forEach((cat) => {
      result.push({ ...cat, displayOrder: level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
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
          ? parseFloat(value) || 0
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    });
  };

  const handleImagesChange = (updatedImages: ProductImage[]) => {
    setImages(updatedImages);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!product) return;
    await productApi.deleteProductImage(product.id, imageId);
  };

  const handleReorderImages = async (reorderedImages: ProductImage[]) => {
    if (!product) return;
    const imageOrder = reorderedImages.map((img, index) => ({
      imageId: img.id,
      displayOrder: index,
    }));
    await productApi.reorderImages(product.id, imageOrder);
  };

  const handleUpdateAltText = async (imageId: string, altTextEn: string, altTextVi: string) => {
    if (!product) return;
    await productApi.updateImageMetadata(product.id, imageId, { altTextEn, altTextVi });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedProduct: Product;

      if (isEdit && product) {
        // Update existing product
        savedProduct = await productApi.updateProduct(product.id, formData);

        // Upload new images for edit mode
        const newFiles = imageManagerRef.current?.getNewFiles() || [];
        if (newFiles.length > 0) {
          for (let i = 0; i < newFiles.length; i++) {
            await productApi.uploadProductImage(savedProduct.id, newFiles[i], {
              displayOrder: images.length + i,
            });
          }
        }
      } else {
        // Create new product - need to use FormData for file upload
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          // Convert boolean values properly for FormData
          if (typeof value === 'boolean') {
            formDataToSend.append(key, value ? 'true' : 'false');
          } else {
            formDataToSend.append(key, value.toString());
          }
        });

        // Add images from ImageManager
        const newFiles = imageManagerRef.current?.getNewFiles() || [];
        newFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });

        savedProduct = await productApi.createProduct(formDataToSend);
      }

      router.push(`/${locale}/admin/products`);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(
        locale === 'vi'
          ? 'Không thể lưu sản phẩm. Vui lòng thử lại.'
          : 'Failed to save product. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const lowStockWarning = formData.stockQuantity < 10 && formData.stockQuantity > 0;
  const outOfStock = formData.stockQuantity === 0;

  return {
    formData,
    images,
    categories,
    activeTab,
    loading,
    lowStockWarning,
    outOfStock,
    handleInputChange,
    handleImagesChange,
    handleDeleteImage,
    handleReorderImages,
    handleUpdateAltText,
    handleSubmit,
    setActiveTab,
    imageManagerRef,
  };
}
