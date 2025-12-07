import { Module } from '@nestjs/common';
import { ContentMediaService } from './content-media.service';
import { ContentMediaController } from './content-media.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentMediaController],
  providers: [ContentMediaService],
  exports: [ContentMediaService],
})
export class ContentMediaModule {}
