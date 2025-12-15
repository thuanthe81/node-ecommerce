import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentMediaService } from './content-media.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ContentMediaResponseDto } from './dto/content-media-response.dto';
import { PaginatedMediaResponseDto } from './dto/paginated-media-response.dto';
import { STATUS } from '../common/constants';

@Controller('content-media')
export class ContentMediaController {
  constructor(private readonly contentMediaService: ContentMediaService) {}

  @Post('upload')
  @Roles(STATUS.USER_ROLES.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ContentMediaResponseDto> {
    return this.contentMediaService.uploadMedia(file);
  }

  @Get()
  @Roles(STATUS.USER_ROLES.ADMIN)
  async findAll(
    @Query('search') search?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PaginatedMediaResponseDto> {
    return this.contentMediaService.findAll(search, page, limit);
  }

  @Get(':id')
  @Roles(STATUS.USER_ROLES.ADMIN)
  async findOne(@Param('id') id: string): Promise<ContentMediaResponseDto> {
    return this.contentMediaService.findOne(id);
  }

  @Delete(':id')
  @Roles(STATUS.USER_ROLES.ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.contentMediaService.remove(id);
  }
}
