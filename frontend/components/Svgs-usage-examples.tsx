/**
 * SVG Components Usage Examples with Tooltips
 *
 * This file demonstrates how to use SVG components with tooltip functionality.
 * All examples use translation keys from the tooltips section in translations.json.
 */

import React from 'react';
import {
  SvgMenu,
  SvgClose,
  SvgCart,
  SvgCheck,
  SvgChevronRight,
  SvgChevronLeft,
  SvgChevronDown,
  SvgPlus,
  SvgInfo,
  SvgHome,
  SvgBoxes,
  SvgGrid,
  SvgClipboard,
  SvgUsers,
  SvgTag,
  SvgDocument,
  SvgChart,
  SvgChevronLeftSolid,
  SvgChevronRightSolid,
  SvgCurrency,
  SvgSettings,
  SvgWindow,
  SvgGlobe,
  SvgNext,
  SvgVercel,
  SvgFile,
  SvgFacebook,
  SvgTwitter,
  SvgTikTok,
  SvgZalo,
  SvgWhatsApp,
  SvgPlay,
  SvgPause,
  SvgAlertTriangle,
  SvgSpinner,
  SvgRefresh,
  SvgShoppingBag,
  SvgUser,
  SvgLogin,
  SvgLogout,
  SvgEmail,
  SvgPhone,
  SvgLocation,
  SvgMessage,
  SvgTruck,
  SvgCreditCard,
  SvgWarning,
  SvgBankCard,
  SvgQrCode,
  SvgExclamationCircle,
  SvgCheckCircleXXX,
  SvgXCircleXXX,
  SvgExclamationTriangleXXX,
  SvgInformationCircleXXX,
  SvgPrintXXX,
  SvgViewListXXX,
  SvgCalendarXXX,
  SvgClockXXX,
  SvgArrowLeftXXX,
  SvgArrowRightXXX,
  SvgXEEE,
  SvgMailEEE,
  SvgDotsEEE,
  SvgImagePlaceholderEEE,
  SvgUploadEEE,
  SvgErrorEEE,
  SvgTrashEEE,
  SvgFolderEEE,
  SvgImageUploadEEE,
  SvgGoogleEEE,
  SvgDragHandleEEE,
  SvgLockEEE,
  SvgCheckCircleLargeXXX,
  SvgExclamationCircleLargeXXX,
  SvgSearch,
  SvgLanguage,
  SvgImage
} from './Svgs';

// Translation keys for tooltips (these should match keys in translations.json)
const TOOLTIP_KEYS = {
  MENU: 'tooltips.menu',
  CLOSE: 'tooltips.close',
  CART: 'tooltips.cart',
  HOME: 'tooltips.home',
  PRODUCTS: 'tooltips.products',
  CATEGORIES: 'tooltips.categories',
  ORDERS: 'tooltips.orders',
  USERS: 'tooltips.users',
  SETTINGS: 'tooltips.settings',
  SEARCH: 'tooltips.search',
  LANGUAGE: 'tooltips.language',
  USER: 'tooltips.user',
  LOGIN: 'tooltips.login',
  LOGOUT: 'tooltips.logout',
  CHECK: 'tooltips.check',
  CHEVRON_RIGHT: 'tooltips.chevronRight',
  CHEVRON_LEFT: 'tooltips.chevronLeft',
  CHEVRON_DOWN: 'tooltips.chevronDown',
  PLUS: 'tooltips.plus',
  INFO: 'tooltips.info',
  BOXES: 'tooltips.boxes',
  GRID: 'tooltips.grid',
  CLIPBOARD: 'tooltips.clipboard',
  TAG: 'tooltips.tag',
  DOCUMENT: 'tooltips.document',
  CHART: 'tooltips.chart',
  CURRENCY: 'tooltips.currency',
  WINDOW: 'tooltips.window',
  GLOBE: 'tooltips.globe',
  FILE: 'tooltips.file',
  FACEBOOK: 'tooltips.facebook',
  TWITTER: 'tooltips.twitter',
  TIKTOK: 'tooltips.tiktok',
  WHATSAPP: 'tooltips.whatsapp',
  ZALO: 'tooltips.zalo',
  PLAY: 'tooltips.play',
  PAUSE: 'tooltips.pause',
  ALERT_TRIANGLE: 'tooltips.alertTriangle',
  SPINNER: 'tooltips.spinner',
  REFRESH: 'tooltips.refresh',
  SHOPPING_BAG: 'tooltips.shoppingBag',
  IMAGE: 'tooltips.image',
  EMAIL: 'tooltips.email',
  PHONE: 'tooltips.phone',
  LOCATION: 'tooltips.location',
  MESSAGE: 'tooltips.message',
  TRUCK: 'tooltips.truck',
  CREDIT_CARD: 'tooltips.creditCard',
  WARNING: 'tooltips.warning',
  BANK_CARD: 'tooltips.bankCard',
  QR_CODE: 'tooltips.qrCode',
  EXCLAMATION_CIRCLE: 'tooltips.exclamationCircle',
  CHECK_CIRCLE: 'tooltips.checkCircle',
  X_CIRCLE: 'tooltips.xCircle',
  EXCLAMATION_TRIANGLE: 'tooltips.exclamationTriangle',
  INFORMATION_CIRCLE: 'tooltips.informationCircle',
  PRINT: 'tooltips.print',
  VIEW_LIST: 'tooltips.viewList',
  CALENDAR: 'tooltips.calendar',
  CLOCK: 'tooltips.clock',
  ARROW_LEFT: 'tooltips.arrowLeft',
  ARROW_RIGHT: 'tooltips.arrowRight',
  X: 'tooltips.x',
  MAIL: 'tooltips.mail',
  DOTS: 'tooltips.dots',
  IMAGE_PLACEHOLDER: 'tooltips.imagePlaceholder',
  UPLOAD: 'tooltips.upload',
  ERROR: 'tooltips.error',
  TRASH: 'tooltips.trash',
  FOLDER: 'tooltips.folder',
  IMAGE_UPLOAD: 'tooltips.imageUpload',
  GOOGLE: 'tooltips.google',
  DRAG_HANDLE: 'tooltips.dragHandle',
  LOCK: 'tooltips.lock',
  NEXT: 'tooltips.next',
  VERCEL: 'tooltips.vercel',
  CHECK_CIRCLE_LARGE: 'tooltips.checkCircleLarge',
  EXCLAMATION_CIRCLE_LARGE: 'tooltips.exclamationCircleLarge'
};

/**
 * Basic Usage Examples
 * Shows how to use SVG components with tooltip translation keys
 */
export const BasicUsageExamples: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Basic SVG Components with Tooltips</h2>

      {/* Navigation Icons */}
      <div className="flex space-x-4">
        <SvgMenu tooltip={TOOLTIP_KEYS.MENU} className="w-6 h-6" />
        <SvgClose tooltip={TOOLTIP_KEYS.CLOSE} className="w-6 h-6" />
        <SvgHome tooltip={TOOLTIP_KEYS.HOME} className="w-6 h-6" />
        <SvgSearch tooltip={TOOLTIP_KEYS.SEARCH} className="w-6 h-6" />
      </div>

      {/* Action Icons */}
      <div className="flex space-x-4">
        <SvgCart tooltip={TOOLTIP_KEYS.CART} className="w-6 h-6" />
        <SvgPlus tooltip={TOOLTIP_KEYS.PLUS} className="w-6 h-6" />
        <SvgTrashEEE tooltip={TOOLTIP_KEYS.TRASH} className="w-6 h-6" />
        <SvgSettings tooltip={TOOLTIP_KEYS.SETTINGS} className="w-6 h-6" />
      </div>

      {/* User & Auth Icons */}
      <div className="flex space-x-4">
        <SvgUser tooltip={TOOLTIP_KEYS.USER} className="w-6 h-6" />
        <SvgLogin tooltip={TOOLTIP_KEYS.LOGIN} className="w-6 h-6" />
        <SvgLogout tooltip={TOOLTIP_KEYS.LOGOUT} className="w-6 h-6" />
      </div>
    </div>
  );
};

/**
 * Advanced Usage Examples
 * Shows tooltip placement options and custom configurations
 */
export const AdvancedUsageExamples: React.FC = () => {
  return (
    <div className="p-4 space-y-8">
      <h2 className="text-xl font-bold">Advanced Tooltip Configurations</h2>

      {/* Different Tooltip Placements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tooltip Placement Options</h3>
        <div className="grid grid-cols-2 gap-4 p-8">
          <SvgInfo tooltip={TOOLTIP_KEYS.INFO} tooltipPlacement="top" className="w-8 h-8" />
          <SvgInfo tooltip={TOOLTIP_KEYS.INFO} tooltipPlacement="bottom" className="w-8 h-8" />
          <SvgInfo tooltip={TOOLTIP_KEYS.INFO} tooltipPlacement="left" className="w-8 h-8" />
          <SvgInfo tooltip={TOOLTIP_KEYS.INFO} tooltipPlacement="right" className="w-8 h-8" />
        </div>
      </div>

      {/* Custom Tooltip Delays */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Custom Tooltip Delays</h3>
        <div className="flex space-x-4">
          <SvgRefresh tooltip={TOOLTIP_KEYS.REFRESH} tooltipDelay={100} className="w-6 h-6" />
          <SvgRefresh tooltip={TOOLTIP_KEYS.REFRESH} tooltipDelay={500} className="w-6 h-6" />
          <SvgRefresh tooltip={TOOLTIP_KEYS.REFRESH} tooltipDelay={1000} className="w-6 h-6" />
        </div>
      </div>

      {/* Auto Placement (Intelligent Positioning) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Auto Placement (Recommended)</h3>
        <div className="flex space-x-4">
          <SvgChart tooltip={TOOLTIP_KEYS.CHART} tooltipPlacement="auto" className="w-6 h-6" />
          <SvgDocument tooltip={TOOLTIP_KEYS.DOCUMENT} tooltipPlacement="auto" className="w-6 h-6" />
          <SvgGrid tooltip={TOOLTIP_KEYS.GRID} tooltipPlacement="auto" className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

/**
 * Social Media Icons with Tooltips
 */
export const SocialMediaExamples: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Social Media Icons</h2>
      <div className="flex space-x-4">
        <SvgFacebook tooltip={TOOLTIP_KEYS.FACEBOOK} className="w-6 h-6 text-blue-600" />
        <SvgTwitter tooltip={TOOLTIP_KEYS.TWITTER} className="w-6 h-6 text-blue-400" />
        <SvgTikTok tooltip={TOOLTIP_KEYS.TIKTOK} className="w-6 h-6 text-black" />
        <SvgWhatsApp tooltip={TOOLTIP_KEYS.WHATSAPP} className="w-6 h-6 text-green-500" />
        <SvgZalo tooltip={TOOLTIP_KEYS.ZALO} width={24} height={24} />
      </div>
    </div>
  );
};

/**
 * Status and Feedback Icons
 */
export const StatusIconsExamples: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Status & Feedback Icons</h2>
      <div className="flex space-x-4">
        <SvgCheckCircleXXX tooltip={TOOLTIP_KEYS.CHECK_CIRCLE} className="w-6 h-6 text-green-500" />
        <SvgXCircleXXX tooltip={TOOLTIP_KEYS.X_CIRCLE} className="w-6 h-6 text-red-500" />
        <SvgExclamationCircle tooltip={TOOLTIP_KEYS.EXCLAMATION_CIRCLE} className="w-6 h-6 text-yellow-500" />
        <SvgInformationCircleXXX tooltip={TOOLTIP_KEYS.INFORMATION_CIRCLE} className="w-6 h-6 text-blue-500" />
        <SvgCheckCircleLargeXXX tooltip={TOOLTIP_KEYS.CHECK_CIRCLE_LARGE} className="w-8 h-8 text-green-500" />
        <SvgExclamationCircleLargeXXX tooltip={TOOLTIP_KEYS.EXCLAMATION_CIRCLE_LARGE} className="w-8 h-8 text-yellow-500" />
        <SvgSpinner tooltip={TOOLTIP_KEYS.SPINNER} className="w-6 h-6 animate-spin" />
      </div>
    </div>
  );
};

/**
 * E-commerce Related Icons
 */
export const EcommerceIconsExamples: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">E-commerce Icons</h2>
      <div className="flex space-x-4">
        <SvgShoppingBag tooltip={TOOLTIP_KEYS.SHOPPING_BAG} className="w-6 h-6" />
        <SvgCreditCard tooltip={TOOLTIP_KEYS.CREDIT_CARD} className="w-6 h-6" />
        <SvgBankCard tooltip={TOOLTIP_KEYS.BANK_CARD} className="w-6 h-6" />
        <SvgTruck tooltip={TOOLTIP_KEYS.TRUCK} className="w-6 h-6" />
        <SvgQrCode tooltip={TOOLTIP_KEYS.QR_CODE} className="w-6 h-6" />
      </div>
    </div>
  );
};

/**
 * Contact and Communication Icons
 */
export const ContactIconsExamples: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Contact & Communication Icons</h2>
      <div className="flex space-x-4">
        <SvgEmail tooltip={TOOLTIP_KEYS.EMAIL} className="w-6 h-6" />
        <SvgPhone tooltip={TOOLTIP_KEYS.PHONE} className="w-6 h-6" />
        <SvgLocation tooltip={TOOLTIP_KEYS.LOCATION} className="w-6 h-6" />
        <SvgMessage tooltip={TOOLTIP_KEYS.MESSAGE} className="w-6 h-6" />
        <SvgMailEEE tooltip={TOOLTIP_KEYS.MAIL} className="w-6 h-6" />
      </div>
    </div>
  );
};

/**
 * Complete Usage Example Component
 * Combines all examples in a single component
 */
export const CompleteUsageExample: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center">SVG Components with Tooltips - Usage Examples</h1>

      <BasicUsageExamples />
      <AdvancedUsageExamples />
      <SocialMediaExamples />
      <StatusIconsExamples />
      <EcommerceIconsExamples />
      <ContactIconsExamples />

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Usage Notes:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>All tooltip text is automatically translated based on the current locale</li>
          <li>Use <code>tooltipPlacement="auto"</code> for intelligent positioning (recommended)</li>
          <li>Tooltip delays can be customized with the <code>tooltipDelay</code> prop</li>
          <li>Tooltips are accessible and work with keyboard navigation</li>
          <li>All SVG components maintain backward compatibility when used without tooltip props</li>
        </ul>
      </div>
    </div>
  );
};

export default CompleteUsageExample;