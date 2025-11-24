import {
  Injectable,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFooterSettingsDto } from './dto/update-footer-settings.dto';

export interface FooterSettings {
  id: string;
  copyrightText: string;
  contactEmail: string | null;
  contactPhone: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FooterSettingsService {
  private readonly FOOTER_SETTINGS_CACHE_KEY = 'footer:settings';
  private readonly FOOTER_SETTINGS_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get footer settings
   * Returns the latest footer settings from database
   * Returns default settings when none configured
   */
  async getFooterSettings(): Promise<FooterSettings> {
    try {
      // Try to get from cache first
      const cached = await this.cacheManager.get<FooterSettings>(
        this.FOOTER_SETTINGS_CACHE_KEY,
      );

      if (cached) {
        return cached;
      }

      // If not in cache, fetch from database
      const settings = await this.prisma.footerSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      let result: FooterSettings;

      if (!settings) {
        // Return default empty settings when none configured
        result = {
          id: '',
          copyrightText: '',
          contactEmail: null,
          contactPhone: null,
          facebookUrl: null,
          twitterUrl: null,
          tiktokUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        result = settings;
      }

      // Store in cache with 1-hour TTL
      await this.cacheManager.set(
        this.FOOTER_SETTINGS_CACHE_KEY,
        result,
        this.FOOTER_SETTINGS_CACHE_TTL,
      );

      return result;
    } catch (error) {
      // Handle database errors gracefully
      console.error('Error fetching footer settings:', error);
      throw new InternalServerErrorException('Failed to fetch footer settings');
    }
  }

  /**
   * Update footer settings
   * Implements upsert logic to create or update footer settings
   * Returns updated settings after save
   */
  async updateFooterSettings(
    data: UpdateFooterSettingsDto,
  ): Promise<FooterSettings> {
    try {
      // Get the existing settings to determine if we need to create or update
      const existingSettings = await this.prisma.footerSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await this.prisma.footerSettings.update({
          where: { id: existingSettings.id },
          data: {
            copyrightText: data.copyrightText,
            contactEmail: data.contactEmail || null,
            contactPhone: data.contactPhone || null,
            facebookUrl: data.facebookUrl || null,
            twitterUrl: data.twitterUrl || null,
            tiktokUrl: data.tiktokUrl || null,
          },
        });
      } else {
        // Create new settings
        settings = await this.prisma.footerSettings.create({
          data: {
            copyrightText: data.copyrightText,
            contactEmail: data.contactEmail || null,
            contactPhone: data.contactPhone || null,
            facebookUrl: data.facebookUrl || null,
            twitterUrl: data.twitterUrl || null,
            tiktokUrl: data.tiktokUrl || null,
          },
        });
      }

      // Invalidate cache on update
      await this.invalidateFooterSettingsCache();

      return settings;
    } catch (error) {
      console.error('Error updating footer settings:', error);
      throw new InternalServerErrorException('Failed to update footer settings');
    }
  }

  /**
   * Invalidate footer settings cache
   * Called when footer settings are updated
   */
  private async invalidateFooterSettingsCache(): Promise<void> {
    await this.cacheManager.del(this.FOOTER_SETTINGS_CACHE_KEY);
  }
}
