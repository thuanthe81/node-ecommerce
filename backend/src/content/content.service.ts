import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { Content, ContentType } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async create(createContentDto: CreateContentDto): Promise<Content> {
    // Check if slug already exists
    const existing = await this.prisma.content.findUnique({
      where: { slug: createContentDto.slug },
    });

    if (existing) {
      throw new BadRequestException('Content with this slug already exists');
    }

    return this.prisma.content.create({
      data: {
        ...createContentDto,
        publishedAt: createContentDto.isPublished ? new Date() : null,
      },
    });
  }

  async findAll(type?: ContentType): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: type ? { type } : undefined,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findPublished(type?: ContentType): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: {
        isPublished: true,
        type: type || undefined,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
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

  async update(id: string, updateContentDto: UpdateContentDto): Promise<Content> {
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

    const updateData: any = { ...updateContentDto };

    // Update publishedAt if isPublished is being set to true
    if (updateContentDto.isPublished === true && !content.isPublished) {
      updateData.publishedAt = new Date();
    } else if (updateContentDto.isPublished === false) {
      updateData.publishedAt = null;
    }

    return this.prisma.content.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<Content> {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.prisma.content.delete({
      where: { id },
    });
  }

  async getBanners(): Promise<Content[]> {
    return this.findPublished(ContentType.BANNER);
  }
}
