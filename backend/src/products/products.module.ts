import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsImageService } from './products-image.service';
import { ImageMigrationService } from './image-migration.service';
import { ImageCleanupService } from './image-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsImageService, ImageMigrationService, ImageCleanupService],
  exports: [ProductsService, ProductsImageService, ImageMigrationService, ImageCleanupService],
})
export class ProductsModule {}
