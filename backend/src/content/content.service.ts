import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { Content, ContentType } from '@prisma/client';

@Injectable()
export class ContentService {
  private readonly HOMEPAGE_SECTIONS_CACHE_KEY = 'homepage:sections';
  private readonly HOMEPAGE_SECTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getContentTypes(): Promise<string[]> {
    // Return all available content types from the ContentType enum
    return Object.values(ContentType);
  }

  async create(createContentDto: CreateContentDto): Promise<Content> {
    // Check if slug already exists
    const existing = await this.prisma.content.findUnique({
      where: { slug: createContentDto.slug },
    });

    if (existing) {
      throw new BadRequestException('Content with this slug already exists');
    }

    // Validate homepage section specific requirements
    if (createContentDto.type === ContentType.HOMEPAGE_SECTION) {
      this.validateHomepageSection(createContentDto);
    }

    const content = await this.prisma.content.create({
      data: {
        ...createContentDto,
        publishedAt: createContentDto.isPublished ? new Date() : null,
      },
    });

    // Invalidate homepage sections cache if creating a homepage section
    if (createContentDto.type === ContentType.HOMEPAGE_SECTION) {
      await this.invalidateHomepageSectionsCache();
    }

    return content;
  }

  private validateHomepageSection(contentDto: any): void {
    // Validate required fields
    if (!contentDto.titleEn || !contentDto.titleVi) {
      throw new BadRequestException(
        'Homepage section requires title in both languages',
      );
    }

    if (!contentDto.contentEn || !contentDto.contentVi) {
      throw new BadRequestException(
        'Homepage section requires description in both languages',
      );
    }

    if (!contentDto.buttonTextEn || !contentDto.buttonTextVi) {
      throw new BadRequestException(
        'Homepage section requires button text in both languages',
      );
    }

    if (!contentDto.linkUrl) {
      throw new BadRequestException(
        'Homepage section requires button URL (linkUrl)',
      );
    }

    if (!contentDto.layout) {
      throw new BadRequestException('Homepage section requires layout type');
    }

    // Validate conditional image requirement based on layout
    if (
      (contentDto.layout === 'image-left' ||
        contentDto.layout === 'image-right') &&
      !contentDto.imageUrl
    ) {
      throw new BadRequestException(
        `Homepage section with layout '${contentDto.layout}' requires an image`,
      );
    }
  }

  async findAll(type?: ContentType): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findPublished(type?: ContentType): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: {
        isPublished: true,
        type: type || undefined,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async findBySlug(slug: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { slug },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async update(
    id: string,
    updateContentDto: UpdateContentDto,
  ): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check if slug is being changed and if it already exists
    if (updateContentDto.slug && updateContentDto.slug !== content.slug) {
      const existing = await this.prisma.content.findUnique({
        where: { slug: updateContentDto.slug },
      });

      if (existing) {
        throw new BadRequestException('Content with this slug already exists');
      }
    }

    // Validate homepage section specific requirements if updating a homepage section
    if (content.type === ContentType.HOMEPAGE_SECTION) {
      // Merge existing content with updates for validation
      const mergedData = { ...content, ...updateContentDto };
      this.validateHomepageSection(mergedData);
    }

    const updateData: any = { ...updateContentDto };

    // Update publishedAt if isPublished is being set to true
    if (updateContentDto.isPublished === true && !content.isPublished) {
      updateData.publishedAt = new Date();
    } else if (updateContentDto.isPublished === false) {
      updateData.publishedAt = null;
    }

    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: updateData,
    });

    // Invalidate homepage sections cache if updating a homepage section
    if (content.type === ContentType.HOMEPAGE_SECTION) {
      await this.invalidateHomepageSectionsCache();
    }

    return updatedContent;
  }

  async remove(id: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const deletedContent = await this.prisma.content.delete({
      where: { id },
    });

    // Invalidate homepage sections cache if deleting a homepage section
    if (content.type === ContentType.HOMEPAGE_SECTION) {
      await this.invalidateHomepageSectionsCache();
    }

    return deletedContent;
  }

  async getBanners(): Promise<Content[]> {
    return this.findPublished(ContentType.BANNER);
  }

  async getHomepageSections(): Promise<Content[]> {
    // Try to get from cache first
    const cached = await this.cacheManager.get<Content[]>(
      this.HOMEPAGE_SECTIONS_CACHE_KEY,
    );

    if (cached) {
      return cached;
    }

    // If not in cache, fetch from database
    const sections = await this.prisma.content.findMany({
      where: {
        type: ContentType.HOMEPAGE_SECTION,
        isPublished: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Store in cache with 5-minute TTL
    await this.cacheManager.set(
      this.HOMEPAGE_SECTIONS_CACHE_KEY,
      sections,
      this.HOMEPAGE_SECTIONS_CACHE_TTL,
    );

    return sections;
  }

  /**
   * Invalidate homepage sections cache
   * Called when homepage sections are created, updated, or deleted
   */
  private async invalidateHomepageSectionsCache(): Promise<void> {
    await this.cacheManager.del(this.HOMEPAGE_SECTIONS_CACHE_KEY);
  }
}
