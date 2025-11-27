# Admin Promotions Translations Implementation

## Summary
Successfully added comprehensive translations for the admin promotions section and updated the components to use the translation system.

## Changes Made

### 1. Translation Keys Added (`frontend/locales/translations.json`)

Added the following translation keys under the `admin` section:

#### Page Titles
- `editPromotion` - "Edit Promotion" / "Chỉnh sửa khuyến mãi"
- `createPromotion` - "Create promotion" / "Tạo khuyến mãi"
- `loadingPromotion` - "Loading promotion..." / "Đang tải khuyến mãi..."
- `promotionNotFound` - "Promotion not found" / "Không tìm thấy khuyến mãi"

#### Usage Statistics
- `usageStatistics` - "Usage Statistics" / "Thống kê sử dụng"
- `promotionUsedTimes` - "This promotion has been used {count} time(s)" / "Khuyến mãi này đã được sử dụng {count} lần"
- `recentOrders` - "Recent Orders:" / "Đơn hàng gần đây:"

#### Form Fields
- `promotionCode` - "Promotion Code" / "Mã khuyến mãi"
- `promotionCodePlaceholder` - "SUMMER2024"
- `promotionCodeUppercase` - Code conversion hint
- `discountType` - "Discount Type" / "Loại giảm giá"
- `discountTypePercentage` - "Percentage (%)" / "Phần trăm (%)"
- `discountTypeFixed` - "Fixed Amount ($)" / "Số tiền cố định ($)"
- `discountValue` - "Discount Value" / "Giá trị giảm giá"
- `minOrderAmount` - "Minimum Order Amount ($)" / "Giá trị đơn hàng tối thiểu ($)"
- `maxDiscountAmount` - "Maximum Discount Amount ($)" / "Số tiền giảm tối đa ($)"
- `totalUsageLimit` - "Total Usage Limit" / "Giới hạn sử dụng tổng"
- `perCustomerLimit` - "Per Customer Limit" / "Giới hạn mỗi khách hàng"
- `startDate` - "Start Date" / "Ngày bắt đầu"
- `endDate` - "End Date" / "Ngày kết thúc"
- `activePromotion` - Active checkbox label

#### Table Headers
- `promotionCodeShort` - "Code" / "Mã"
- `promotionType` - "Type" / "Loại"
- `promotionValue` - "Value" / "Giá trị"
- `promotionUsage` - "Usage" / "Lượt sử dụng"
- `promotionValidPeriod` - "Valid Period" / "Thời gian hiệu lực"

#### Status Badges
- `promotionStatusInactive` - "Inactive" / "Không hoạt động"
- `promotionStatusScheduled` - "Scheduled" / "Đã lên lịch"
- `promotionStatusExpired` - "Expired" / "Đã hết hạn"
- `promotionStatusLimitReached` - "Limit Reached" / "Đã đạt giới hạn"
- `promotionStatusActive` - "Active" / "Đang hoạt động"

#### Actions & Messages
- `createPromotion` - "Create promotion" / "Tạo khuyến mãi"
- `updatePromotion` - "Update Promotion" / "Cập nhật khuyến mãi"
- `loadingPromotions` - "Loading promotions..." / "Đang tải khuyến mãi..."
- `noPromotionsFound` - "No promotions found" / "Không tìm thấy khuyến mãi"
- `createFirstPromotion` - "Create your first promotion" / "Tạo khuyến mãi đầu tiên của bạn"
- `confirmDeletePromotion` - Delete confirmation message
- `failedLoadPromotions` - "Failed to load promotions" / "Tải khuyến mãi thất bại"
- `failedDeletePromotion` - "Failed to delete promotion" / "Xóa khuyến mãi thất bại"
- `failedSavePromotion` - "Failed to save promotion" / "Lưu khuyến mãi thất bại"

#### Display Helpers
- `promotionMinOrder` - Min order display format
- `promotionMaxDiscount` - Max discount display format
- `promotionPerCustomer` - Per customer limit format
- `promotionUnlimited` - "Unlimited" / "Không giới hạn"
- `promotionTypePercentageShort` - "Percentage" / "Phần trăm"
- `promotionTypeFixedShort` - "Fixed" / "Cố định"

### 2. Component Updates

#### `frontend/app/[locale]/admin/promotions/PromotionListContent.tsx`
- Added `useTranslations` hook import
- Replaced all hardcoded English text with translation keys
- Updated status badges to use translations
- Updated table headers to use translations
- Updated error messages and confirmations to use translations

#### `frontend/components/PromotionForm.tsx`
- Added `useTranslations` hook import
- Replaced all form labels with translation keys
- Updated button text to use translations
- Updated placeholder text to use translations
- Updated error messages to use translations

#### `frontend/app/[locale]/admin/promotions/[id]/edit/EditPromotionContent.tsx`
- Added `useTranslations` hook import
- Replaced page title "Edit Promotion" with translation
- Updated loading message to use translations
- Updated error messages to use translations
- Updated usage statistics section to use translations
- Updated date formatting to use locale

#### `frontend/app/[locale]/admin/promotions/new/NewPromotionContent.tsx`
- Added `useTranslations` hook import
- Replaced page title "Create Promotion" with translation

## Testing
All components pass TypeScript diagnostics with no errors.

## Usage
The promotions admin pages will now automatically display in the correct language based on the user's locale setting (English or Vietnamese).

## Notes
- All translations follow the existing pattern in the codebase
- Keys are organized under the `admin` section for consistency
- Both English and Vietnamese translations are provided
- The translation system uses `next-intl` library
