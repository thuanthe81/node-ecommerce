# Email Styling Translations Summary

## Overview
This document summarizes the new translations added to support the modern email styling enhancements in the AlaCraft e-commerce application.

## New Translation Sections Added

### 1. Email Buttons (`email.buttons`)
Modern button text for enhanced email templates:
- `viewOrder` - View Order / Xem đơn hàng
- `trackOrder` - Track Order / Theo dõi đơn hàng
- `contactUs` - Contact Us / Liên hệ chúng tôi
- `viewDetails` - View Details / Xem chi tiết
- `continueShopping` - Continue Shopping / Tiếp tục mua sắm
- `getStarted` - Get Started / Bắt đầu
- `learnMore` - Learn More / Tìm hiểu thêm
- `shopNow` - Shop Now / Mua ngay
- `visitWebsite` - Visit Website / Truy cập website
- `manageAccount` - Manage Account / Quản lý tài khoản
- `updateProfile` - Update Profile / Cập nhật hồ sơ
- `resetPassword` - Reset Password / Đặt lại mật khẩu
- `verifyEmail` - Verify Email / Xác thực email
- `downloadInvoice` - Download Invoice / Tải hóa đơn
- `printReceipt` - Print Receipt / In biên lai

### 2. Email Styling (`email.styling`)
Modern design terminology:
- `modernLayout` - Modern Email Layout / Bố cục email hiện đại
- `premiumDesign` - Premium Design / Thiết kế cao cấp
- `professionalBranding` - Professional Branding / Thương hiệu chuyên nghiệp
- `responsiveDesign` - Responsive Design / Thiết kế đáp ứng
- `accessibleContent` - Accessible Content / Nội dung dễ tiếp cận
- `modernTypography` - Modern Typography / Kiểu chữ hiện đại
- `visualHierarchy` - Visual Hierarchy / Thứ bậc thị giác
- `brandConsistency` - Brand Consistency / Nhất quán thương hiệu
- `cardLayout` - Card Layout / Bố cục thẻ
- `modernButtons` - Modern Buttons / Nút hiện đại
- `statusBadges` - Status Badges / Huy hiệu trạng thái
- `visualElements` - Visual Elements / Yếu tố thị giác

### 3. Enhanced Status Badges (`email.statusBadges`)
Comprehensive status badge translations with accessibility support:

#### Order Status Badges
- `pending` - Pending / Chờ xử lý
- `processing` - Processing / Đang xử lý
- `shipped` - Shipped / Đã giao vận
- `delivered` - Delivered / Đã giao hàng
- `cancelled` - Cancelled / Đã hủy
- `refunded` - Refunded / Đã hoàn tiền

#### Payment Status Badges
- `pending` - Pending / Chờ thanh toán
- `paid` - Paid / Đã thanh toán
- `failed` - Failed / Thất bại
- `refunded` - Refunded / Đã hoàn tiền

Each status badge includes:
- `text` - Display text
- `description` - Detailed description
- `ariaLabel` - Accessibility label

#### Progress Badges
- `step` - Step {current}/{total} / Bước {current}/{total}
- `ariaLabel` - Progress: Step {current} of {total} / Tiến độ: Bước {current} trong số {total}

### 4. Accessibility (`email.accessibility`)
WCAG 2.1 AA compliant accessibility translations:
- `altText` - Alternative text for image / Văn bản thay thế cho hình ảnh
- `skipToContent` - Skip to main content / Bỏ qua đến nội dung chính
- `screenReaderOnly` - Screen reader only content / Nội dung chỉ dành cho trình đọc màn hình
- `keyboardNavigation` - Keyboard navigation available / Có thể điều hướng bằng bàn phím
- `highContrast` - High contrast mode / Chế độ tương phản cao
- `focusIndicator` - Focus indicator / Chỉ báo tiêu điểm

#### ARIA Labels
- `orderStatus` - Order status: {status} / Trạng thái đơn hàng: {status}
- `paymentStatus` - Payment status: {status} / Trạng thái thanh toán: {status}
- `button` - Button: {text} / Nút: {text}
- `link` - Link: {text} / Liên kết: {text}

### 5. Email Layout (`email.layout`)
Modern email layout components:

#### Header
- `companyName` - AlaCraft / AlaCraft
- `tagline` - Handmade with Love / Làm thủ công với tình yêu
- `modernBranding` - Premium Handmade Crafts / Thủ công cao cấp

#### Footer
- `copyright` - © 2024 AlaCraft. All rights reserved. / © 2024 AlaCraft. Tất cả quyền được bảo lưu.
- `followUs` - Follow us on social media / Theo dõi chúng tôi trên mạng xã hội
- `unsubscribe` - Unsubscribe from emails / Hủy đăng ký email
- `privacyPolicy` - Privacy Policy / Chính sách bảo mật
- `termsOfService` - Terms of Service / Điều khoản dịch vụ

#### Cards
- `orderSummary` - Order Summary / Tóm tắt đơn hàng
- `customerInfo` - Customer Information / Thông tin khách hàng
- `shippingInfo` - Shipping Information / Thông tin giao hàng
- `paymentInfo` - Payment Information / Thông tin thanh toán
- `orderItems` - Order Items / Sản phẩm đặt hàng
- `contactCard` - Contact Information / Thông tin liên hệ
- `addressCard` - Address Details / Chi tiết địa chỉ
- `productCard` - Product Details / Chi tiết sản phẩm

### 6. Shipping Notification (`email.shippingNotification`)
Enhanced shipping notification email:
- `subject` - 🚚 Order #{orderNumber} has been shipped / 🚚 Đơn hàng #{orderNumber} đã được gửi đi
- `title` - Your order is on the way! / Đơn hàng của bạn đang trên đường!
- `intro` - Great news! Your order has been shipped and is on its way to you. / Tin tuyệt vời! Đơn hàng của bạn đã được gửi đi và đang trên đường đến bạn.
- `trackingNumber` - Tracking Number / Mã vận đơn
- `estimatedDelivery` - Estimated Delivery / Thời gian giao hàng dự kiến
- `trackingInstructions` - You can track your package using the tracking number above. / Bạn có thể theo dõi gói hàng bằng mã vận đơn ở trên.

### 7. Welcome Email (`email.welcomeEmail`)
Modern welcome email template:
- `subject` - Welcome to AlaCraft - Your Handmade Journey Begins! / Chào mừng đến với AlaCraft - Hành trình thủ công của bạn bắt đầu!
- `title` - Welcome to AlaCraft! / Chào mừng đến với AlaCraft!
- `intro` - Thank you for joining our community of handmade craft enthusiasts! / Cảm ơn bạn đã tham gia cộng đồng những người đam mê thủ công của chúng tôi!
- `getStarted` - Get started by exploring our unique collection of handmade products. / Bắt đầu bằng cách khám phá bộ sưu tập sản phẩm thủ công độc đáo của chúng tôi.

### 8. Password Reset (`email.passwordReset`)
Enhanced password reset email:
- `subject` - Reset Your AlaCraft Password / Đặt lại mật khẩu AlaCraft của bạn
- `title` - Password Reset Request / Yêu cầu đặt lại mật khẩu
- `intro` - We received a request to reset your password. Click the button below to create a new password. / Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấp vào nút bên dưới để tạo mật khẩu mới.
- `expiry` - This link will expire in 24 hours for security reasons. / Liên kết này sẽ hết hạn sau 24 giờ vì lý do bảo mật.
- `noRequest` - If you didn't request this password reset, please ignore this email. / Nếu bạn không yêu cầu đặt lại mật khẩu này, vui lòng bỏ qua email này.

### 9. Modern Features (`email.modernFeatures`)
Feature descriptions for modern email styling:
- `responsiveDesign` - Optimized for all devices and screen sizes / Tối ưu hóa cho tất cả thiết bị và kích thước màn hình
- `accessibilityCompliant` - WCAG 2.1 AA compliant for all users / Tuân thủ WCAG 2.1 AA cho tất cả người dùng
- `crossClientCompatible` - Works perfectly across all email clients / Hoạt động hoàn hảo trên tất cả ứng dụng email
- `modernStyling` - Contemporary design with premium aesthetics / Thiết kế đương đại với thẩm mỹ cao cấp
- `darkModeSupport` - Optimized for both light and dark themes / Tối ưu hóa cho cả chủ đề sáng và tối
- `printFriendly` - Optimized layout for printing / Bố cục tối ưu hóa cho in ấn

## Usage in Email Templates

These translations are designed to be used with the enhanced EmailTemplateService that includes:

1. **Modern Button Generators** - Use `email.buttons.*` translations
2. **Status Badge Generators** - Use `email.statusBadges.*` translations
3. **Layout Components** - Use `email.layout.*` translations
4. **Accessibility Features** - Use `email.accessibility.*` translations
5. **Modern Email Templates** - Use all sections for comprehensive styling

## Implementation Notes

- All translations follow the existing pattern with `en` and `vi` keys
- Status badges include comprehensive accessibility support with ARIA labels
- Button translations cover all common email actions
- Layout translations support modern card-based email designs
- All text is optimized for email client compatibility
- Translations maintain brand consistency with AlaCraft identity

## File Location

All translations are added to: `frontend/locales/translations.json` under the `email` section.

## Validation

The translations have been validated for:
- ✅ JSON syntax correctness
- ✅ Proper nesting structure
- ✅ Consistent key naming
- ✅ Complete English and Vietnamese translations
- ✅ Accessibility compliance
- ✅ Brand consistency