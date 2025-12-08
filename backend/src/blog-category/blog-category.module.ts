import { Module } from '@nestjs/common';
import { BlogCategoryService } from './blog-category.service';
import { BlogCategoryController } from './blog-category.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BlogCategoryController],
  providers: [BlogCategoryService],
  exports: [BlogCategoryService],
})
export class BlogCategoryModule {}
