import { Test, TestingModule } from '@nestjs/testing';
import { PDFLocalizationService } from '../../../src/pdf-generator/services/pdf-localization.service';

describe('PDFLocalizationService', () => {
  let service: PDFLocalizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFLocalizationService],
    }).compile();

    service = module.get<PDFLocalizationService>(PDFLocalizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('translate', () => {
    it('should translate basic keys in English', () => {
      expect(service.translate('orderConfirmation', 'en')).toBe('ORDER CONFIRMATION');
      expect(service.translate('customerInformation', 'en')).toBe('Customer Information');
      expect(service.translate('orderItems', 'en')).toBe('Order Items');
    });

    it('should translate basic keys in Vietnamese', () => {
      expect(service.translate('orderConfirmation', 'vi')).toBe('XÁC NHẬN ĐƠN HÀNG');
      expect(service.translate('customerInformation', 'vi')).toBe('Thông tin khách hàng');
      expect(service.translate('orderItems', 'vi')).toBe('Chi tiết đơn hàng');
    });

    it('should handle string interpolation', () => {
      const result = service.translate('thankYouMessage', 'en', { companyName: 'AlaCraft' });
      expect(result).toBe('Thank you for your purchase from AlaCraft!');
    });

    it('should return key if translation not found', () => {
      expect(service.translate('nonExistentKey', 'en')).toBe('nonExistentKey');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in English using Vietnamese formatting', () => {
      expect(service.formatCurrency(123.45, 'en')).toBe('123,45 ₫');
    });

    it('should format currency in Vietnamese using Vietnamese formatting', () => {
      expect(service.formatCurrency(123.45, 'vi')).toBe('123,45 ₫');
    });

    it('should format large numbers with Vietnamese comma separators', () => {
      expect(service.formatCurrency(1234567.89, 'en')).toBe('1.234.567,89 ₫');
      expect(service.formatCurrency(1234567.89, 'vi')).toBe('1.234.567,89 ₫');
    });

    it('should format zero amounts consistently', () => {
      expect(service.formatCurrency(0, 'en')).toBe('0 ₫');
      expect(service.formatCurrency(0, 'vi')).toBe('0 ₫');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-03-15');

    it('should format date in English (MM/DD/YYYY)', () => {
      const result = service.formatDate(testDate, 'en');
      expect(result).toBe('03/15/2024');
    });

    it('should format date in Vietnamese (DD/MM/YYYY)', () => {
      const result = service.formatDate(testDate, 'vi');
      expect(result).toBe('15/03/2024');
    });
  });

  describe('formatAddress', () => {
    const testAddress = {
      fullName: 'John Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'Ho Chi Minh City',
      state: 'Ho Chi Minh',
      postalCode: '70000',
      country: 'Vietnam',
      phone: '+84123456789',
    };

    it('should format address with phone number', () => {
      const result = service.formatAddress(testAddress, 'en');
      expect(result).toContain('John Doe');
      expect(result).toContain('123 Main St');
      expect(result).toContain('Apt 4B');
      expect(result).toContain('Ho Chi Minh City, Ho Chi Minh 70000');
      expect(result).toContain('Vietnam');
      expect(result).toContain('Phone: +84123456789');
    });

    it('should format address without phone number', () => {
      const addressWithoutPhone = { ...testAddress };
      delete addressWithoutPhone.phone;

      const result = service.formatAddress(addressWithoutPhone, 'vi');
      expect(result).toContain('John Doe');
      expect(result).not.toContain('ĐT:');
    });
  });

  describe('getPaymentStatusText', () => {
    it('should return localized payment status in English', () => {
      expect(service.getPaymentStatusText('pending', 'en')).toBe('Pending');
      expect(service.getPaymentStatusText('completed', 'en')).toBe('Completed');
      expect(service.getPaymentStatusText('failed', 'en')).toBe('Failed');
    });

    it('should return localized payment status in Vietnamese', () => {
      expect(service.getPaymentStatusText('pending', 'vi')).toBe('Đang chờ');
      expect(service.getPaymentStatusText('completed', 'vi')).toBe('Hoàn thành');
      expect(service.getPaymentStatusText('failed', 'vi')).toBe('Thất bại');
    });
  });

  describe('generateBankTransferInstructions', () => {
    const bankSettings = {
      accountName: 'AlaCraft Company',
      accountNumber: '1234567890',
      bankName: 'Vietcombank',
    };

    it('should generate instructions in English', () => {
      const result = service.generateBankTransferInstructions(bankSettings, 'en');
      expect(result).toContain('AlaCraft Company');
      expect(result).toContain('Vietcombank');
      expect(result).toContain('1234567890');
      expect(result).toContain('order number');
    });

    it('should generate instructions in Vietnamese', () => {
      const result = service.generateBankTransferInstructions(bankSettings, 'vi');
      expect(result).toContain('AlaCraft Company');
      expect(result).toContain('Vietcombank');
      expect(result).toContain('1234567890');
      expect(result).toContain('mã đơn hàng');
    });

    it('should return simple message when bank details are missing', () => {
      const incompleteBankSettings = { accountName: '', accountNumber: '' };

      const resultEn = service.generateBankTransferInstructions(incompleteBankSettings, 'en');
      expect(resultEn).toBe('Please contact us for bank transfer details.');

      const resultVi = service.generateBankTransferInstructions(incompleteBankSettings, 'vi');
      expect(resultVi).toBe('Vui lòng liên hệ với chúng tôi để biết thông tin chuyển khoản.');
    });
  });

  describe('locale utilities', () => {
    it('should check if locale is supported', () => {
      expect(service.isLocaleSupported('en')).toBe(true);
      expect(service.isLocaleSupported('vi')).toBe(true);
      expect(service.isLocaleSupported('fr')).toBe(false);
    });

    it('should return default locale', () => {
      expect(service.getDefaultLocale()).toBe('en');
    });

    it('should normalize locale strings', () => {
      expect(service.normalizeLocale('EN')).toBe('en');
      expect(service.normalizeLocale('VI')).toBe('vi');
      expect(service.normalizeLocale('en-US')).toBe('en');
      expect(service.normalizeLocale('vi-VN')).toBe('vi');
      expect(service.normalizeLocale('fr')).toBe('en'); // fallback to default
    });
  });
});