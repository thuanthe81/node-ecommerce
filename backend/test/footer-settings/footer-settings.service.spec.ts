import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { FooterSettingsService } from '../../src/footer-settings/footer-settings.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('FooterSettingsService', () => {
  let service: FooterSettingsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    footerSettings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FooterSettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<FooterSettingsService>(FooterSettingsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFooterSettings', () => {
    it('should return footer settings when they exist', async () => {
      const mockSettings = {
        id: '1',
        copyrightText: '© 2024 ALA Craft',
        contactEmail: 'contact@alacraft.com',
        contactPhone: '+1234567890',
        facebookUrl: 'https://facebook.com/alacraft',
        twitterUrl: 'https://twitter.com/alacraft',
        tiktokUrl: 'https://tiktok.com/@alacraft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.footerSettings.findFirst.mockResolvedValue(
        mockSettings,
      );

      const result = await service.getFooterSettings();

      expect(result).toEqual(mockSettings);
      expect(mockPrismaService.footerSettings.findFirst).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should return default settings when none exist', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.footerSettings.findFirst.mockResolvedValue(null);

      const result = await service.getFooterSettings();

      expect(result.copyrightText).toBe('');
      expect(result.contactEmail).toBeNull();
      expect(result.contactPhone).toBeNull();
      expect(result.facebookUrl).toBeNull();
      expect(result.twitterUrl).toBeNull();
      expect(result.tiktokUrl).toBeNull();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('updateFooterSettings', () => {
    it('should create new settings when none exist', async () => {
      const updateDto = {
        copyrightText: '© 2024 ALA Craft',
        contactEmail: 'contact@alacraft.com',
        contactPhone: '+1234567890',
        facebookUrl: 'https://facebook.com/alacraft',
        twitterUrl: 'https://twitter.com/alacraft',
        tiktokUrl: 'https://tiktok.com/@alacraft',
      };

      const mockCreatedSettings = {
        id: '1',
        ...updateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.footerSettings.findFirst.mockResolvedValue(null);
      mockPrismaService.footerSettings.create.mockResolvedValue(
        mockCreatedSettings,
      );

      const result = await service.updateFooterSettings(updateDto);

      expect(result).toEqual(mockCreatedSettings);
      expect(mockPrismaService.footerSettings.create).toHaveBeenCalledWith({
        data: {
          copyrightText: updateDto.copyrightText,
          contactEmail: updateDto.contactEmail,
          contactPhone: updateDto.contactPhone,
          address: null,
          googleMapsUrl: null,
          facebookUrl: updateDto.facebookUrl,
          twitterUrl: updateDto.twitterUrl,
          tiktokUrl: updateDto.tiktokUrl,
          whatsappUrl: null,
          zaloUrl: null,
        },
      });
    });

    it('should update existing settings', async () => {
      const existingSettings = {
        id: '1',
        copyrightText: '© 2023 ALA Craft',
        contactEmail: 'old@alacraft.com',
        contactPhone: '+0987654321',
        facebookUrl: null,
        twitterUrl: null,
        tiktokUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto = {
        copyrightText: '© 2024 ALA Craft',
        contactEmail: 'contact@alacraft.com',
        contactPhone: '+1234567890',
        facebookUrl: 'https://facebook.com/alacraft',
      };

      const mockUpdatedSettings = {
        ...existingSettings,
        ...updateDto,
        twitterUrl: null,
        tiktokUrl: null,
        updatedAt: new Date(),
      };

      mockPrismaService.footerSettings.findFirst.mockResolvedValue(
        existingSettings,
      );
      mockPrismaService.footerSettings.update.mockResolvedValue(
        mockUpdatedSettings,
      );

      const result = await service.updateFooterSettings(updateDto);

      expect(result).toEqual(mockUpdatedSettings);
      expect(mockPrismaService.footerSettings.update).toHaveBeenCalledWith({
        where: { id: existingSettings.id },
        data: {
          copyrightText: updateDto.copyrightText,
          contactEmail: updateDto.contactEmail,
          contactPhone: updateDto.contactPhone,
          address: null,
          googleMapsUrl: null,
          facebookUrl: updateDto.facebookUrl,
          twitterUrl: null,
          tiktokUrl: null,
          whatsappUrl: null,
          zaloUrl: null,
        },
      });
    });

    it('should handle empty optional fields by setting them to null', async () => {
      const updateDto = {
        copyrightText: '© 2024 ALA Craft',
        contactEmail: '',
        contactPhone: '',
      };

      const mockCreatedSettings = {
        id: '1',
        copyrightText: updateDto.copyrightText,
        contactEmail: null,
        contactPhone: null,
        facebookUrl: null,
        twitterUrl: null,
        tiktokUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.footerSettings.findFirst.mockResolvedValue(null);
      mockPrismaService.footerSettings.create.mockResolvedValue(
        mockCreatedSettings,
      );

      const result = await service.updateFooterSettings(updateDto);

      expect(result.contactEmail).toBeNull();
      expect(result.contactPhone).toBeNull();
    });
  });
});
