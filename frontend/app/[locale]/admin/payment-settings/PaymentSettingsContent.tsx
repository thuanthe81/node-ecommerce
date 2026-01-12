'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { SvgCheck, SvgXEEE, SvgInfo } from '@/components/Svgs';
import {
  paymentSettingsApi,
  BankTransferSettings,
  UpdateBankTransferSettingsDto,
} from '@/lib/payment-settings-api';

export default function PaymentSettingsContent() {
  const params = useParams();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateBankTransferSettingsDto>({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await paymentSettingsApi.getBankTransferSettings();

      setFormData({
        accountName: settings.accountName,
        accountNumber: settings.accountNumber,
        bankName: settings.bankName,
      });

      if (settings.qrCodeUrl) {
        setQrCodePreview(settings.qrCodeUrl);
      }
    } catch (err: any) {
      console.error('Failed to load payment settings:', err);
      setError(
        locale === 'vi'
          ? 'Không thể tải cài đặt thanh toán'
          : 'Failed to load payment settings'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleQrCodeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(
          locale === 'vi'
            ? 'Vui lòng chọn file hình ảnh'
            : 'Please select an image file'
        );
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(
          locale === 'vi'
            ? 'Kích thước file không được vượt quá 5MB'
            : 'File size must not exceed 5MB'
        );
        return;
      }

      setQrCodeFile(file);
      setQrCodePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveQrCode = () => {
    setQrCodeFile(null);
    setQrCodePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.accountName.trim()) {
      setError(
        locale === 'vi'
          ? 'Vui lòng nhập tên tài khoản'
          : 'Please enter account name'
      );
      return;
    }

    if (!formData.accountNumber.trim()) {
      setError(
        locale === 'vi'
          ? 'Vui lòng nhập số tài khoản'
          : 'Please enter account number'
      );
      return;
    }

    if (!formData.bankName.trim()) {
      setError(
        locale === 'vi'
          ? 'Vui lòng nhập tên ngân hàng'
          : 'Please enter bank name'
      );
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await paymentSettingsApi.updateBankTransferSettings(
        formData,
        qrCodeFile || undefined
      );

      setSuccessMessage(
        locale === 'vi'
          ? 'Cài đặt thanh toán đã được lưu thành công'
          : 'Payment settings saved successfully'
      );

      // Reload settings to get the updated QR code URL
      await loadSettings();

      // Clear the file input
      setQrCodeFile(null);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to save payment settings:', err);
      setError(
        err.message ||
        (locale === 'vi'
          ? 'Không thể lưu cài đặt thanh toán. Vui lòng thử lại.'
          : 'Failed to save payment settings. Please try again.')
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminProtectedRoute locale={locale}>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {locale === 'vi' ? 'Đang tải...' : 'Loading...'}
              </p>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute locale={locale}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === 'vi' ? 'Cài đặt thanh toán' : 'Payment Settings'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {locale === 'vi'
                ? 'Quản lý thông tin chuyển khoản ngân hàng cho khách hàng'
                : 'Manage bank transfer information for customers'}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <SvgCheck
                    className="h-5 w-5 text-green-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <SvgXEEE
                    className="h-5 w-5 text-red-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bank Account Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {locale === 'vi'
                  ? 'Thông tin tài khoản ngân hàng'
                  : 'Bank Account Information'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'vi' ? 'Tên tài khoản' : 'Account Name'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    required
                    placeholder={
                      locale === 'vi'
                        ? 'Ví dụ: NGUYEN VAN A'
                        : 'e.g., JOHN DOE'
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {locale === 'vi'
                      ? 'Tên chủ tài khoản như trên thẻ ngân hàng'
                      : 'Account holder name as shown on bank card'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'vi' ? 'Số tài khoản' : 'Account Number'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                    placeholder={
                      locale === 'vi' ? 'Ví dụ: 1234567890' : 'e.g., 1234567890'
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {locale === 'vi'
                      ? 'Số tài khoản ngân hàng để nhận thanh toán'
                      : 'Bank account number for receiving payments'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'vi' ? 'Tên ngân hàng' : 'Bank Name'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                    placeholder={
                      locale === 'vi'
                        ? 'Ví dụ: Vietcombank'
                        : 'e.g., Bank of America'
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {locale === 'vi'
                      ? 'Tên ngân hàng nơi mở tài khoản'
                      : 'Name of the bank where account is held'}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {locale === 'vi' ? 'Mã QR thanh toán' : 'Payment QR Code'}
              </h2>

              {qrCodePreview && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    {locale === 'vi' ? 'Mã QR hiện tại:' : 'Current QR Code:'}
                  </p>
                  <div className="relative inline-block">
                    <img
                      src={qrCodePreview}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain border border-gray-200 rounded-lg"
                    />
                    {qrCodeFile && (
                      <button
                        type="button"
                        onClick={handleRemoveQrCode}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        aria-label="Remove QR code"
                      >
                        <SvgXEEE
                          className="w-4 h-4"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'vi'
                    ? 'Tải lên mã QR mới'
                    : 'Upload New QR Code'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrCodeSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {locale === 'vi'
                    ? 'Tải lên hình ảnh mã QR để khách hàng có thể quét và thanh toán dễ dàng. Kích thước tối đa: 5MB'
                    : 'Upload QR code image for customers to scan and pay easily. Maximum size: 5MB'}
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={loadSettings}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'vi' ? 'Đặt lại' : 'Reset'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? locale === 'vi'
                    ? 'Đang lưu...'
                    : 'Saving...'
                  : locale === 'vi'
                  ? 'Lưu cài đặt'
                  : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <SvgInfo
                  className="h-5 w-5 text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {locale === 'vi' ? 'Thông tin' : 'Information'}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    {locale === 'vi'
                      ? 'Thông tin này sẽ được hiển thị cho khách hàng trên trang xác nhận đơn hàng sau khi họ đặt hàng thành công. Đảm bảo thông tin chính xác để khách hàng có thể thanh toán đúng cách.'
                      : 'This information will be displayed to customers on the order confirmation page after they successfully place an order. Ensure the information is accurate so customers can make payments correctly.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}