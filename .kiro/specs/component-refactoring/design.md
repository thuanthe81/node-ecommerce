# Design Document

## Overview

This design outlines a systematic approach to refactoring large, monolithic frontend components into smaller, more maintainable pieces. The refactoring will focus on the largest components first (Carousel.tsx at 1230 lines, OrderDetailView.tsx at 987 lines, ShippingAddressForm.tsx at 625 lines, etc.) and apply consistent patterns across all refactored components.

The refactoring will maintain backward compatibility while improving code organization, testability, and developer experience. Each component will be broken down based on the Single Responsibility Principle, with clear separation between presentation, business logic, and utilities.

## Architecture

### Component Organization Pattern

The refactored components will follow a consistent directory structure:

```
components/
├── ComponentName/
│   ├── index.tsx                 # Main component (barrel export)
│   ├── ComponentName.tsx         # Primary component logic
│   ├── types.ts                  # TypeScript interfaces and types
│   ├── constants.ts              # Component-specific constants
│   ├── utils/                    # Component-specific utilities
│   │   ├── calculations.ts
│   │   ├── validation.ts
│   │   └── formatting.ts
│   ├── hooks/                    # Component-specific custom hooks
│   │   ├── useComponentState.ts
│   │   └── useComponentLogic.ts
│   └── components/               # Sub-components
│       ├── SubComponent1.tsx
│       ├── SubComponent2.tsx
│       └── SubComponent3.tsx
```

### Shared Resources

Reusable sub-components, hooks, and utilities that serve multiple components will be placed in shared directories:

```
components/
├── shared/                       # Shared sub-components
│   ├── FormField.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
hooks/
├── useFormValidation.ts          # Shared hooks
└── useApiRequest.ts
lib/
└── utils/                        # Shared utilities
    ├── validation.ts
    └── formatting.ts
```

### Refactoring Strategy

Each component will be refactored following these steps:

1. **Analysis Phase**: Identify logical sections, utility functions, and reusable state logic
2. **Extraction Phase**: Extract utilities, types, and constants first
3. **Sub-component Creation**: Break down UI into focused sub-components
4. **Hook Extraction**: Extract reusable stateful logic into custom hooks
5. **Integration Phase**: Wire sub-components together in the main component
6. **Validation Phase**: Ensure all tests pass and functionality is preserved

## Components and Interfaces

### Priority 1: Carousel Component (1230 lines)

**Current Structure:**
- Single file with 3D carousel logic, 2D fallback, utility functions, and multiple sub-components

**Refactored Structure:**

```typescript
// components/Carousel/types.ts
export interface CarouselItem {
  id: string;
  imageUrl: string;
  alt: string;
  linkUrl?: string;
  title?: string;
}

export interface Carousel3DProps {
  items: CarouselItem[];
  autoRotate?: boolean;
  autoRotateInterval?: number;
  rotationSpeed?: number;
  ringRadius?: number;
  itemWidth?: number;
  itemHeight?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
}

export interface CarouselState {
  rotation: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartRotation: number;
  isAnimating: boolean;
  focusedIndex: number;
}

export interface ResponsiveConfig {
  ringRadius: number;
  itemWidth: number;
  itemHeight: number;
  dragSensitivity: number;
  perspective: number;
}
```

```typescript
// components/Carousel/constants.ts
export const RESPONSIVE_CONFIG = {
  mobile: { ringRadius: 180, itemWidth: 140, itemHeight: 200, dragSensitivity: 0.6, perspective: 800 },
  tablet: { ringRadius: 240, itemWidth: 170, itemHeight: 250, dragSensitivity: 0.55, perspective: 1000 },
  desktop: { ringRadius: 300, itemWidth: 200, itemHeight: 600, dragSensitivity: 0.5, perspective: 1200 },
};

export const DEFAULT_CONFIG = {
  autoRotate: false,
  autoRotateInterval: 5000,
  rotationSpeed: 0,
  ringRadius: 300,
  itemWidth: 200,
  itemHeight: 400,
  showControls: true,
  showIndicators: true,
  animationDuration: 600,
  dragSensitivity: 0.5,
};
```

```typescript
// components/Carousel/utils/calculations.ts
export function easeInOutCubic(t: number): number;
export function easeOutCubic(t: number): number;
export function normalizeAngle(angle: number): number;
export function calculateItemTransform(index: number, totalItems: number, rotation: number, ringRadius: number): string;
export function calculateItemStyle(z: number, ringRadius: number): { scale: number; opacity: number };
export function calculateZPosition(index: number, totalItems: number, rotation: number, ringRadius: number): number;
export function calculateFocusedIndex(rotation: number, totalItems: number): number;
```

```typescript
// components/Carousel/utils/performance.ts
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
```

```typescript
// components/Carousel/hooks/useCarouselState.ts
export function useCarouselState(items: CarouselItem[], config: CarouselConfig) {
  // Manages rotation, dragging, animation state
  return {
    state,
    rotate,
    startDrag,
    endDrag,
    handleDrag,
    goToIndex,
  };
}
```

```typescript
// components/Carousel/hooks/useAutoRotation.ts
export function useAutoRotation(enabled: boolean, interval: number, onRotate: () => void) {
  // Manages auto-rotation timer and pause/resume logic
}
```

```typescript
// components/Carousel/hooks/useResponsiveConfig.ts
export function useResponsiveConfig(defaultConfig: CarouselConfig): ResponsiveConfig {
  // Returns responsive configuration based on viewport size
}
```

```typescript
// components/Carousel/hooks/use3DTransformSupport.ts
export function use3DTransformSupport(): boolean {
  // Detects browser 3D transform support
}
```

```typescript
// components/Carousel/components/Carousel3D.tsx
export function Carousel3D(props: Carousel3DProps) {
  // Main 3D carousel component using extracted hooks and utilities
}
```

```typescript
// components/Carousel/components/Carousel2D.tsx
export function Carousel2D(props: Carousel3DProps) {
  // Fallback 2D carousel component
}
```

```typescript
// components/Carousel/index.tsx
export { Carousel3D as default } from './components/Carousel3D';
export { Carousel2D } from './components/Carousel2D';
export type { CarouselItem, Carousel3DProps } from './types';
```

### Priority 2: OrderDetailView Component (987 lines)

**Refactored Structure:**

```typescript
// components/OrderDetailView/types.ts
export interface OrderDetailViewProps {
  orderId: string;
  locale: string;
  showSuccessBanner?: boolean;
  showBankTransferForPaidOrders?: boolean;
}

export interface OrderState {
  order: Order | null;
  bankSettings: BankTransferSettings | null;
  isLoadingOrder: boolean;
  isLoadingSettings: boolean;
  orderError: string | null;
  settingsError: string | null;
}
```

```typescript
// components/OrderDetailView/hooks/useOrderData.ts
export function useOrderData(orderId: string) {
  // Fetches and manages order data
  return { order, isLoading, error, refetch };
}
```

```typescript
// components/OrderDetailView/hooks/useBankSettings.ts
export function useBankSettings(order: Order | null, showForPaidOrders: boolean) {
  // Fetches and manages bank transfer settings
  return { bankSettings, isLoading, error };
}
```

```typescript
// components/OrderDetailView/components/OrderHeader.tsx
export function OrderHeader({ order, locale }: { order: Order; locale: string }) {
  // Displays order number, date, status
}
```

```typescript
// components/OrderDetailView/components/OrderItems.tsx
export function OrderItems({ items, locale }: { items: OrderItem[]; locale: string }) {
  // Displays order items list
}
```

```typescript
// components/OrderDetailView/components/OrderSummary.tsx
export function OrderSummary({ order, locale }: { order: Order; locale: string }) {
  // Displays pricing summary
}
```

```typescript
// components/OrderDetailView/components/ShippingInfo.tsx
export function ShippingInfo({ address, locale }: { address: Address; locale: string }) {
  // Displays shipping address
}
```

```typescript
// components/OrderDetailView/components/BankTransferInfo.tsx
export function BankTransferInfo({ settings, order, locale }: BankTransferInfoProps) {
  // Displays bank transfer payment instructions
}
```

```typescript
// components/OrderDetailView/components/SuccessBanner.tsx
export function SuccessBanner({ locale }: { locale: string }) {
  // Displays success message after order placement
}
```

```typescript
// components/OrderDetailView/components/LoadingState.tsx
export function LoadingState({ locale }: { locale: string }) {
  // Displays loading skeleton
}
```

```typescript
// components/OrderDetailView/components/ErrorState.tsx
export function ErrorState({ error, locale, onRetry }: ErrorStateProps) {
  // Displays error message with retry option
}
```

### Priority 3: ShippingAddressForm Component (625 lines)

**Refactored Structure:**

```typescript
// components/ShippingAddressForm/types.ts
export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface FieldErrors {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}
```

```typescript
// components/ShippingAddressForm/utils/validation.ts
export function validateFullName(name: string, locale: string): string | null;
export function validatePhone(phone: string, locale: string): string | null;
export function validateAddressLine(address: string, locale: string): string | null;
export function validateCity(city: string, locale: string): string | null;
export function validateState(state: string, locale: string): string | null;
export function validatePostalCode(postalCode: string, country: string, locale: string): string | null;
export function validateForm(formData: Partial<Address>, locale: string): FieldErrors;
```

```typescript
// components/ShippingAddressForm/hooks/useAddressForm.ts
export function useAddressForm(initialData?: Partial<Address>) {
  // Manages form state, validation, and submission
  return {
    formData,
    fieldErrors,
    touchedFields,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    resetForm,
  };
}
```

```typescript
// components/ShippingAddressForm/hooks/useSavedAddresses.ts
export function useSavedAddresses(userId?: string) {
  // Fetches and manages saved addresses
  return {
    addresses,
    isLoading,
    error,
    refetch,
  };
}
```

```typescript
// components/ShippingAddressForm/components/SavedAddressList.tsx
export function SavedAddressList({ addresses, selectedId, onSelect, locale }: SavedAddressListProps) {
  // Displays list of saved addresses with selection
}
```

```typescript
// components/ShippingAddressForm/components/AddressCard.tsx
export function AddressCard({ address, isSelected, onSelect, locale }: AddressCardProps) {
  // Displays a single address card
}
```

```typescript
// components/ShippingAddressForm/components/NewAddressForm.tsx
export function NewAddressForm({ formData, errors, touched, onChange, onBlur, locale }: NewAddressFormProps) {
  // Form fields for creating new address
}
```

```typescript
// components/ShippingAddressForm/components/FormField.tsx
export function FormField({ label, name, value, error, touched, required, type, onChange, onBlur }: FormFieldProps) {
  // Reusable form field with validation display
}
```

### Priority 4: ContentForm Component (544 lines)

**Refactored Structure:**

```typescript
// components/ContentForm/types.ts
export interface ContentFormProps {
  content?: Content;
  onSubmit: (data: CreateContentData) => Promise<void>;
  onCancel: () => void;
}

export interface ContentFormData {
  slug: string;
  type: string;
  titleEn: string;
  titleVi: string;
  contentEn: string;
  contentVi: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isPublished: boolean;
}
```

```typescript
// components/ContentForm/utils/validation.ts
export function validateSlug(slug: string, t: (key: string) => string): string | null;
export function validateUrl(url: string, fieldName: string, t: (key: string) => string): string | null;
export function validateContentForm(data: ContentFormData, t: (key: string) => string): Record<string, string>;
```

```typescript
// components/ContentForm/hooks/useContentForm.ts
export function useContentForm(initialContent?: Content) {
  // Manages form state and validation
  return {
    formData,
    validationErrors,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
    isValid,
  };
}
```

```typescript
// components/ContentForm/components/ContentTypeSelector.tsx
export function ContentTypeSelector({ value, types, onChange }: ContentTypeSelectorProps) {
  // Dropdown for selecting content type
}
```

```typescript
// components/ContentForm/components/LanguageTabs.tsx
export function LanguageTabs({ activeTab, onTabChange }: LanguageTabsProps) {
  // Tab switcher for English/Vietnamese
}
```

```typescript
// components/ContentForm/components/ContentFields.tsx
export function ContentFields({ formData, errors, activeTab, onChange }: ContentFieldsProps) {
  // Title and content fields for active language
}
```

```typescript
// components/ContentForm/components/MediaSection.tsx
export function MediaSection({ imageUrl, linkUrl, errors, onChange, onImageSelect }: MediaSectionProps) {
  // Image and link URL fields
}
```

```typescript
// components/ContentForm/components/PreviewPanel.tsx
export function PreviewPanel({ formData, activeTab }: PreviewPanelProps) {
  // Live preview of content
}
```

### Priority 5: ImageManager Component (497 lines)

**Refactored Structure:**

```typescript
// components/ImageManager/types.ts
export interface ImageManagerProps {
  productId?: string;
  existingImages: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  locale: string;
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (imageId: string) => Promise<void>;
  onReorder?: (images: ProductImage[]) => Promise<void>;
  onUpdateAltText?: (imageId: string, altTextEn: string, altTextVi: string) => Promise<void>;
}

export interface ImageItem {
  id: string;
  url: string;
  altTextEn?: string;
  altTextVi?: string;
  displayOrder: number;
  isNew?: boolean;
  file?: File;
  uploading?: boolean;
}
```

```typescript
// components/ImageManager/hooks/useImageManager.ts
export function useImageManager(existingImages: ProductImage[]) {
  // Manages image state, upload, delete, reorder
  return {
    images,
    addImages,
    removeImage,
    reorderImages,
    updateAltText,
    getNewFiles,
  };
}
```

```typescript
// components/ImageManager/hooks/useDragAndDrop.ts
export function useDragAndDrop(images: ImageItem[], onReorder: (images: ImageItem[]) => void) {
  // Manages drag-and-drop functionality
  return {
    sensors,
    handleDragEnd,
  };
}
```

```typescript
// components/ImageManager/components/ImageUploadZone.tsx
export function ImageUploadZone({ onFilesSelected, locale }: ImageUploadZoneProps) {
  // Drag-and-drop upload zone
}
```

```typescript
// components/ImageManager/components/ImageGrid.tsx
export function ImageGrid({ images, locale, onDelete, onEditAltText, editingId }: ImageGridProps) {
  // Grid of sortable images
}
```

```typescript
// components/ImageManager/components/SortableImageItem.tsx
export function SortableImageItem({ image, index, locale, onDelete, onEditAltText, isEditing }: SortableImageItemProps) {
  // Individual sortable image item
}
```

```typescript
// components/ImageManager/components/AltTextEditor.tsx
export function AltTextEditor({ image, locale, onSave, onCancel }: AltTextEditorProps) {
  // Modal for editing alt text
}
```

### Priority 6: ProductForm Component (477 lines)

**Refactored Structure:**

```typescript
// components/ProductForm/hooks/useProductForm.ts
export function useProductForm(product?: Product, isEdit?: boolean) {
  // Manages product form state and submission
  return {
    formData,
    images,
    categories,
    activeTab,
    loading,
    handleChange,
    handleImagesChange,
    handleSubmit,
    setActiveTab,
  };
}
```

```typescript
// components/ProductForm/components/BasicInfoFields.tsx
export function BasicInfoFields({ formData, categories, activeTab, onChange, locale }: BasicInfoFieldsProps) {
  // SKU, name, description fields
}
```

```typescript
// components/ProductForm/components/PricingFields.tsx
export function PricingFields({ formData, onChange, locale }: PricingFieldsProps) {
  // Price, compare at price, stock quantity
}
```

```typescript
// components/ProductForm/components/ProductOptions.tsx
export function ProductOptions({ formData, onChange, locale }: ProductOptionsProps) {
  // Active, featured checkboxes
}
```

### Priority 7: Header Component (324 lines)

**Refactored Structure:**

```typescript
// components/Header/hooks/useHeaderState.ts
export function useHeaderState() {
  // Manages mobile menu state and active link detection
  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isActiveLink,
    getLinkClasses,
  };
}
```

```typescript
// components/Header/components/MobileMenuButton.tsx
export function MobileMenuButton({ isOpen, onClick, locale }: MobileMenuButtonProps) {
  // Hamburger menu button
}
```

```typescript
// components/Header/components/Logo.tsx
export function Logo({ locale }: LogoProps) {
  // Site logo/brand
}
```

```typescript
// components/Header/components/DesktopNav.tsx
export function DesktopNav({ locale, user, isActiveLink, getLinkClasses }: DesktopNavProps) {
  // Desktop navigation links
}
```

```typescript
// components/Header/components/MobileNav.tsx
export function MobileNav({ isOpen, locale, user, isActiveLink, onClose, onLogout }: MobileNavProps) {
  // Mobile navigation menu
}
```

```typescript
// components/Header/components/UserActions.tsx
export function UserActions({ isAuthenticated, user, locale, onLogout }: UserActionsProps) {
  // Account/login/logout links
}
```

## Data Models

### Component State Models

```typescript
// Carousel State
interface CarouselState {
  rotation: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartRotation: number;
  isAnimating: boolean;
  focusedIndex: number;
}

// Form State
interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Async Data State
interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}
```

### Props Interfaces

All refactored components will have clearly defined props interfaces with JSDoc comments:

```typescript
/**
 * Props for the Carousel3D component
 */
export interface Carousel3DProps {
  /** Array of items to display in the carousel */
  items: CarouselItem[];
  /** Enable automatic rotation */
  autoRotate?: boolean;
  /** Interval between rotations in milliseconds */
  autoRotateInterval?: number;
  // ... more props
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Component identification by line count

*For any* component file in the frontend/components directory, if the file contains more than 300 lines of code, then it should be identified as a refactoring candidate.

**Validates: Requirements 1.1**

### Property 2: Functional equivalence after refactoring

*For any* component that has been refactored, when rendered with the same props and context, the refactored component should produce the same DOM structure and behavior as the original component.

**Validates: Requirements 1.4**

### Property 3: Directory structure consistency

*For any* refactored component, the resulting file structure should follow the defined organization pattern with subdirectories for components, utils, hooks, and types as appropriate.

**Validates: Requirements 1.5**

### Property 4: Import resolution after extraction

*For any* utility function or type that is extracted from a component, all import statements in dependent files should resolve correctly without errors.

**Validates: Requirements 2.4, 6.4**

### Property 5: Utility function behavioral preservation

*For any* utility function that is extracted from a component, when called with the same inputs, it should return the same outputs as the original inline implementation.

**Validates: Requirements 2.5**

### Property 6: Hook naming convention compliance

*For any* custom hook file created during refactoring, the filename should start with "use" and follow camelCase naming convention.

**Validates: Requirements 3.2**

### Property 7: Hook directory placement

*For any* custom hook that is extracted, if it is component-specific, it should be placed in a hooks subdirectory within the component folder; if it is shared, it should be placed in the top-level hooks directory.

**Validates: Requirements 3.3**

### Property 8: State management behavioral equivalence

*For any* component that uses an extracted custom hook, the state management behavior should be equivalent to the original component's state management for the same sequence of user interactions.

**Validates: Requirements 3.5**

### Property 9: Form validation preservation

*For any* form component that has been refactored, when given the same form input data, the validation should produce the same validation results (errors and success states) as the original component.

**Validates: Requirements 4.4**

### Property 10: Component-specific subdirectory structure

*For any* sub-component that is specific to a parent component, it should be placed in a subdirectory named after the parent component.

**Validates: Requirements 5.2**

### Property 11: Utility subdirectory placement

*For any* component-specific utility function, it should be placed in a utils subdirectory within the component's folder.

**Validates: Requirements 5.4**

### Property 12: Hook subdirectory placement

*For any* component-specific hook, it should be placed in a hooks subdirectory within the component's folder.

**Validates: Requirements 5.5**

### Property 13: Type file directory placement

*For any* type file that is extracted, it should be placed either in a types subdirectory or co-located with the related component.

**Validates: Requirements 6.3**

### Property 14: Props interface preservation

*For any* refactored component, the props interface should accept all the same properties with the same types as the original component.

**Validates: Requirements 7.1**

### Property 15: Export name preservation

*For any* refactored component, the exported component name should match the original component's exported name.

**Validates: Requirements 7.2**

### Property 16: Callback signature preservation

*For any* refactored component, all event handler callbacks should be called with the same argument types and in the same situations as the original component.

**Validates: Requirements 7.3**

### Property 17: Rendered output equivalence

*For any* refactored component, when rendered with the same props, the resulting DOM structure should be equivalent to the original component's DOM structure.

**Validates: Requirements 7.4**

### Property 18: JSDoc presence for exported components

*For any* exported component after refactoring, it should have a JSDoc comment describing its purpose.

**Validates: Requirements 8.1**

### Property 19: Props interface documentation

*For any* sub-component created during refactoring, its props interface should have descriptive comments for each property.

**Validates: Requirements 8.2**

### Property 20: Utility function documentation

*For any* extracted utility function, it should have a JSDoc comment describing its parameters and return value.

**Validates: Requirements 8.3**

### Property 21: Hook documentation

*For any* custom hook created during refactoring, it should have a JSDoc comment describing its parameters and return values.

**Validates: Requirements 8.4**

### Property 22: Component prioritization by line count

*For any* list of components to be refactored, they should be ordered by line count in descending order.

**Validates: Requirements 9.1**

### Property 23: React.memo usage for stable props

*For any* sub-component that receives props that don't change frequently, it should be wrapped with React.memo to prevent unnecessary re-renders.

**Validates: Requirements 10.1**

### Property 24: useCallback for passed callbacks

*For any* callback function passed as a prop to a sub-component, it should be wrapped with useCallback with appropriate dependencies.

**Validates: Requirements 10.2**

## Error Handling

### Refactoring Errors

1. **Import Resolution Failures**: If imports cannot be resolved after extraction, the refactoring should be rolled back and the error logged
2. **Type Errors**: TypeScript compilation errors should halt the refactoring process
3. **Test Failures**: If existing tests fail after refactoring, changes should be reviewed and corrected
4. **Runtime Errors**: Any runtime errors in refactored components should be caught and reported

### Validation Errors

1. **Missing Documentation**: Warn if JSDoc comments are missing from exported components
2. **Naming Convention Violations**: Error if hooks don't follow "use" prefix convention
3. **Directory Structure Violations**: Error if files are not placed in the correct directories
4. **Circular Dependencies**: Error if refactoring creates circular import dependencies

### Rollback Strategy

If refactoring introduces breaking changes:
1. Revert file changes using version control
2. Document the issue encountered
3. Analyze the root cause
4. Adjust the refactoring approach
5. Retry with corrected strategy

## Testing Strategy

### Unit Testing

Unit tests will verify specific aspects of the refactoring:

1. **Utility Function Tests**: Test that extracted utility functions produce correct outputs for various inputs
2. **Hook Tests**: Test custom hooks using React Testing Library's `renderHook`
3. **Component Tests**: Test that sub-components render correctly with various props
4. **Validation Tests**: Test that validation functions return correct error messages

Example unit test for extracted utility:

```typescript
// components/Carousel/utils/__tests__/calculations.test.ts
describe('calculateItemTransform', () => {
  it('should calculate correct transform for first item', () => {
    const transform = calculateItemTransform(0, 5, 0, 300);
    expect(transform).toContain('rotateY(0deg)');
    expect(transform).toContain('translateZ(300px)');
  });

  it('should handle negative rotation angles', () => {
    const transform = calculateItemTransform(0, 5, -72, 300);
    expect(transform).toBeDefined();
  });
});
```

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using the `fast-check` library for TypeScript/JavaScript.

**Library**: fast-check (https://github.com/dubzzz/fast-check)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage.

**Tagging**: Each property-based test must include a comment explicitly referencing the correctness property from this design document using the format: `**Feature: component-refactoring, Property {number}: {property_text}**`

Example property-based test:

```typescript
// components/Carousel/utils/__tests__/calculations.property.test.ts
import fc from 'fast-check';

describe('Carousel calculations properties', () => {
  /**
   * Feature: component-refactoring, Property 5: Utility function behavioral preservation
   * For any utility function that is extracted from a component, when called with the same inputs,
   * it should return the same outputs as the original inline implementation.
   */
  it('normalizeAngle should always return value between 0 and 360', () => {
    fc.assert(
      fc.property(fc.integer(), (angle) => {
        const normalized = normalizeAngle(angle);
        return normalized >= 0 && normalized < 360;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: component-refactoring, Property 5: Utility function behavioral preservation
   */
  it('easeInOutCubic should return values between 0 and 1 for inputs between 0 and 1', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1 }), (t) => {
        const result = easeInOutCubic(t);
        return result >= 0 && result <= 1;
      }),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify that refactored components work correctly together:

1. **Component Composition Tests**: Test that parent components correctly integrate sub-components
2. **Hook Integration Tests**: Test that components using extracted hooks maintain correct behavior
3. **Form Flow Tests**: Test complete form submission flows with validation
4. **User Interaction Tests**: Test that user interactions (clicks, drags, inputs) work correctly

Example integration test:

```typescript
// components/Carousel/__tests__/Carousel.integration.test.tsx
describe('Carousel integration', () => {
  it('should rotate when next button is clicked', async () => {
    const items = [/* test items */];
    render(<Carousel3D items={items} showControls={true} />);

    const nextButton = screen.getByLabelText(/next/i);
    await userEvent.click(nextButton);

    // Verify rotation occurred
    expect(/* rotation state */).toBe(/* expected value */);
  });
});
```

### Regression Testing

All existing tests must continue to pass after refactoring:

1. Run the full test suite before refactoring (baseline)
2. Run the full test suite after each component refactoring
3. Compare results to ensure no regressions
4. Fix any failing tests or revert changes if tests cannot be fixed

### Visual Regression Testing

For components with complex visual output:

1. Capture screenshots of original components
2. Capture screenshots of refactored components
3. Compare screenshots to ensure visual equivalence
4. Flag any visual differences for manual review

### Performance Testing

Verify that refactoring doesn't negatively impact performance:

1. Measure render times before and after refactoring
2. Measure re-render counts with React DevTools Profiler
3. Verify that React.memo and useCallback optimizations are effective
4. Ensure bundle size doesn't increase significantly

## Implementation Notes

### Refactoring Workflow

For each component:

1. **Analyze**: Review the component and identify sections to extract
2. **Create Structure**: Set up the directory structure (utils, hooks, components subdirectories)
3. **Extract Types**: Move TypeScript interfaces to types.ts
4. **Extract Constants**: Move constants to constants.ts
5. **Extract Utilities**: Move pure functions to utils/
6. **Extract Hooks**: Move stateful logic to hooks/
7. **Create Sub-components**: Break down JSX into focused sub-components
8. **Update Main Component**: Refactor main component to use extracted pieces
9. **Update Imports**: Ensure all imports are correct
10. **Add Documentation**: Add JSDoc comments
11. **Test**: Run tests and verify functionality
12. **Review**: Code review for quality and consistency

### Code Style Guidelines

- Use TypeScript strict mode
- Follow existing ESLint and Prettier configurations
- Use functional components with hooks (no class components)
- Prefer named exports for utilities and types, default export for main component
- Use descriptive variable and function names
- Keep functions small and focused (ideally under 50 lines)
- Add JSDoc comments for all exported functions and components

### Performance Considerations

- Use React.memo for components that receive stable props
- Use useCallback for event handlers passed to child components
- Use useMemo for expensive calculations
- Avoid creating new objects/arrays in render (use useMemo or move outside component)
- Consider code splitting for large components using React.lazy

### Backward Compatibility

- Maintain all existing prop interfaces
- Keep the same component export names
- Preserve all event handler signatures
- Ensure the same DOM structure is rendered
- Don't change CSS class names that might be used externally

### Documentation Requirements

Each refactored component should include:

1. **README.md** (if complex): Overview of component structure and usage
2. **JSDoc comments**: On all exported functions, components, and hooks
3. **Inline comments**: For complex logic that isn't self-explanatory
4. **Type definitions**: With descriptive comments on each property
5. **Usage examples**: In JSDoc comments for hooks and utilities

Example documentation:

```typescript
/**
 * Custom hook for managing carousel rotation state and interactions
 *
 * @param items - Array of carousel items to display
 * @param config - Configuration options for the carousel
 * @returns Object containing state and control functions
 *
 * @example
 * ```tsx
 * const { rotation, rotate, startDrag } = useCarouselState(items, config);
 * ```
 */
export function useCarouselState(items: CarouselItem[], config: CarouselConfig) {
  // Implementation
}
```

## Dependencies

### Required Libraries

- **React**: ^18.0.0 (already installed)
- **TypeScript**: ^5.0.0 (already installed)
- **@dnd-kit/core**: For drag-and-drop functionality (already installed)
- **fast-check**: For property-based testing (needs installation)

### Development Dependencies

- **@testing-library/react**: For component testing (already installed)
- **@testing-library/react-hooks**: For hook testing (may need installation)
- **jest**: Test runner (already installed)
- **@types/jest**: TypeScript types for Jest (already installed)

## Migration Path

### Phase 1: High-Priority Components (Weeks 1-2)
- Carousel.tsx (1230 lines)
- OrderDetailView.tsx (987 lines)

### Phase 2: Medium-Priority Components (Weeks 3-4)
- ShippingAddressForm.tsx (625 lines)
- ContentForm.tsx (544 lines)
- ImageManager.tsx (497 lines)

### Phase 3: Lower-Priority Components (Weeks 5-6)
- ProductForm.tsx (477 lines)
- HomepageSectionForm.tsx (443 lines)
- CategoryForm.tsx (387 lines)
- Header.tsx (324 lines)

### Phase 4: Remaining Components (Week 7)
- All remaining components over 250 lines

Each phase should include:
1. Refactoring implementation
2. Test updates and additions
3. Documentation
4. Code review
5. Deployment to staging
6. Validation and bug fixes

## Success Criteria

The refactoring will be considered successful when:

1. All components over 300 lines have been refactored into smaller pieces
2. All existing tests pass without modification (or with minimal updates)
3. No functional regressions are introduced
4. Code coverage remains at or above current levels
5. All refactored code has appropriate documentation
6. All property-based tests pass with 100+ iterations
7. Bundle size does not increase by more than 5%
8. Performance metrics (render time, re-render count) remain stable or improve
9. Code review approval from at least two team members
10. Successful deployment to production without incidents
