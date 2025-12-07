import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentMedia } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ContentMediaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Upload and store media file
   */
  async uploadMedia(file: Express.Multer.File): Promise<ContentMedia> {
    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Determine upload directory
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = path.isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);

    const contentMediaDir = path.join(baseUploadPath, 'content-media');

    // Ensure content-media upload directory exists
    await fs.mkdir(contentMediaDir, { recursive: true });

    // Generate unique filename
    const filename = this.generateFilename(file.originalname);
    const filepath = path.join(contentMediaDir, filename);

    try {
      // Save file to disk
      await fs.writeFile(filepath, file.buffer);

      // Create database record
      const url = `/uploads/content-media/${filename}`;
      const media = await this.prisma.contentMedia.create({
        data: {
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url,
        },
      });

      return media;
    } catch (error) {
      // Clean up file if database operation fails
      try {
        await fs.unlink(filepath);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
      throw new BadRequestException('Failed to save media file');
    }
  }

  /**
   * Get all media items with optional search and pagination
   */
  async findAll(
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    items: ContentMedia[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { filename: { contains: search, mode: 'insensitive' as const } },
            {
              originalName: { contains: search, mode: 'insensitive' as const },
            },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.contentMedia.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contentMedia.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get single media item by ID
   */
  async findOne(id: string): Promise<ContentMedia> {
    const media = await this.prisma.contentMedia.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media item not found');
    }

    return media;
  }

  /**
   * Delete media item and file
   * Implements proper error handling with rollback:
   * - Deletes physical file first
   * - If file deletion succeeds, deletes database record
   * - If database deletion fails, attempts to restore the file (rollback)
   */
  async remove(id: string): Promise<void> {
    const media = await this.prisma.contentMedia.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundException('Media item not found');
    }

    // Determine file path
    const uploadDirEnv = process.env.UPLOAD_DIR || 'uploads';
    const baseUploadPath = path.isAbsolute(uploadDirEnv)
      ? uploadDirEnv
      : path.join(process.cwd(), uploadDirEnv);

    const filepath = path.join(baseUploadPath, 'content-media', media.filename);

    let fileBuffer: Buffer | null = null;

    try {
      // Read file content before deletion for potential rollback
      try {
        fileBuffer = await fs.readFile(filepath);
      } catch (readError) {
        // If file doesn't exist, we can still delete the database record
        console.warn('File not found on disk, will delete database record only:', readError);
      }

      // Delete physical file first (if it exists)
      if (fileBuffer) {
        await fs.unlink(filepath);
      }

      // Then delete database record
      try {
        await this.prisma.contentMedia.delete({
          where: { id },
        });
      } catch (dbError) {
        // Rollback: restore the file if database deletion fails
        if (fileBuffer) {
          try {
            await fs.writeFile(filepath, fileBuffer);
            console.error('Database deletion failed, file restored:', dbError);
          } catch (restoreError) {
            console.error('Failed to restore file after database error:', restoreError);
          }
        }
        throw new BadRequestException('Failed to delete media item from database');
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete media item');
    }
  }

  /**
   * Generate unique filename with timestamp and random string
   */
  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    return `media-${timestamp}-${randomSuffix}${ext}`;
  }
}
