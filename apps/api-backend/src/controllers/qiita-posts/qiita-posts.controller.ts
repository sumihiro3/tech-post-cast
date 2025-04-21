import { ClerkJwtGuard } from '@/auth/guards/clerk-jwt.guard';
import { QiitaPostsService } from '@/domains/qiita-posts/qiita-posts.service';
import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/decorators/current-user-id.decorator';
import { SearchQiitaPostsRequestDto, SearchQiitaPostsResponseDto } from './dto';

@Controller('qiita-posts')
@ApiTags('Qiita Posts')
@UseGuards(ClerkJwtGuard) // クラスレベルで認証を適用
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
    @CurrentUserId() userId: string, // JWTトークンからユーザーIDを取得
  ): Promise<SearchQiitaPostsResponseDto> {
    this.logger.debug(`QiitaPostsController.searchQiitaPosts`, {
      userId,
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
