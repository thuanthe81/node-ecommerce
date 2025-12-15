import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProductsImageService } from './products-image.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SYSTEM } from '../common/constants';

/**
 * Middleware to handle image retrieval with backward compatibility
 * Checks hierarchical location first, then falls back to legacy flat directory
 */
@Injectable()
export class ImageRetrievalMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ImageRetrievalMiddleware.name);

  constructor(private readonly imageService: ProductsImageService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only handle requests for product images
    if (!req.path.startsWith('/uploads/products/')) {
      return next();
    }

    // Skip if it's a directory request
    if (req.path.endsWith('/')) {
      return next();
    }

    const imageUrl = req.path;
    const isThumbnail = imageUrl.includes('/thumbnails/');

    try {
      // Use the image service to resolve the file path with backward compatibility
      const resolved = await this.imageService.resolveImagePath(
        imageUrl,
        isThumbnail,
      );

      if (!resolved) {
        // Image not found in either location
        return res.status(404).json({
          statusCode: 404,
          message: 'Image not found',
          error: 'Not Found',
        });
      }

      const { filePath, isLegacy } = resolved;

      // Determine MIME type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': SYSTEM.MIME_TYPES.JPEG,
        '.jpeg': SYSTEM.MIME_TYPES.JPEG,
        '.png': SYSTEM.MIME_TYPES.PNG,
        '.webp': SYSTEM.MIME_TYPES.WEBP,
        '.gif': 'image/gif',
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      // Set appropriate headers
      res.setHeader('Content-Type', mimeType);

      // Set caching headers (cache for 1 year for immutable images)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      // Add custom header to indicate if served from legacy location (for monitoring)
      if (isLegacy) {
        res.setHeader('X-Image-Source', 'legacy');
      } else {
        res.setHeader('X-Image-Source', 'hierarchical');
      }

      // Stream the file to the response
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    } catch (error) {
      this.logger.error(`Error serving image ${imageUrl}:`, error);
      return res.status(500).json({
        statusCode: 500,
        message: 'Error serving image',
        error: 'Internal Server Error',
      });
    }
  }
}
