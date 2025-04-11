import { QiitaPostsService } from '@/domains/qiita-posts/qiita-posts.service';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchQiitaPostsRequestDto, SearchQiitaPostsResponseDto } from './dto';

@Controller('qiita-posts')
@ApiTags('Qiita Posts')
export class QiitaPostsController {
  private readonly logger = new Logger(QiitaPostsController.name);

  constructor(private readonly qiitaPostsService: QiitaPostsService) {}

  /**
   * Qiita記事を検索するAPI
   */
  @Get('search')
  @ApiOperation({
    summary: 'Qiita記事の検索',
    description: 'Qiitaから指定条件に合致する記事を検索して取得します',
    operationId: 'searchQiitaPosts',
  })
  @ApiResponse({
    status: 200,
    description: '検索成功',
    type: SearchQiitaPostsResponseDto,
  })
  async searchQiitaPosts(
    @Query() dto: SearchQiitaPostsRequestDto,
  ): Promise<SearchQiitaPostsResponseDto> {
    this.logger.verbose(`QiitaPostsController.searchQiitaPosts`, {
      authors: dto.authors,
      tags: dto.tags,
      minPublishedAt: dto.minPublishedAt,
      page: dto.page,
      perPage: dto.perPage,
    });

    const result = await this.qiitaPostsService.findQiitaPosts(
      dto.authors,
      dto.tags,
      dto.minPublishedAt
        ? dto.minPublishedAt.toISOString().split('T')[0]
        : undefined,
      dto.page,
      dto.perPage,
    );

    return SearchQiitaPostsResponseDto.fromEntity(result);
  }
}
