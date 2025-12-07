import { ContentMediaResponseDto } from './content-media-response.dto';

export class PaginatedMediaResponseDto {
  items: ContentMediaResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}
