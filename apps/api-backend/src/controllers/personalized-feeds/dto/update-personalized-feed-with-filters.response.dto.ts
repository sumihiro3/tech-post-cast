// filepath: /Users/sumihiro/projects/TechPostCast/tech-post-cast/apps/api-backend/src/controllers/personalized-feeds/dto/update-personalized-feed-with-filters.response.dto.ts
import { PersonalizedFeedWithFilters } from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';
import { LikesCountFilterDto } from './create-personalized-feed.request.dto';

/**
 * タグフィルターDTO
 */
class TagFilterDto {
  @ApiProperty({
    description: 'タグフィルターID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'タグ名',
    example: 'JavaScript',
  })
  tagName: string;
}

/**
 * 著者フィルターDTO
 */
class AuthorFilterDto {
  @ApiProperty({
    description: '著者フィルターID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '著者ID',
    example: 'author123',
  })
  authorId: string;
}

/**
 * 公開日フィルターDTO
 */
class DateRangeFilterDto {
  @ApiProperty({
    description: '公開日フィルターID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '何日以内の記事を対象とするか',
    example: 30,
  })
  daysAgo: number;
}

/**
 * フィルターグループDTO
 */
class FilterGroupDto {
  @ApiProperty({
    description: 'フィルターグループID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'フィルターグループ名',
    example: 'フロントエンド関連',
  })
  name: string;

  @ApiProperty({
    description: 'ロジック種別 (AND/OR)',
    example: 'OR',
  })
  logicType: string;

  @ApiProperty({
    description: 'タグフィルター一覧',
    type: [TagFilterDto],
  })
  tagFilters: TagFilterDto[];

  @ApiProperty({
    description: '著者フィルター一覧',
    type: [AuthorFilterDto],
  })
  authorFilters: AuthorFilterDto[];

  @ApiProperty({
    description: '公開日フィルター一覧',
    type: [DateRangeFilterDto],
  })
  dateRangeFilters: DateRangeFilterDto[];

  @ApiProperty({
    description: 'いいね数フィルター一覧',
    type: [LikesCountFilterDto],
  })
  likesCountFilters: LikesCountFilterDto[];
}

/**
 * フィルターグループ情報を持つパーソナライズフィード更新レスポンスDTO
 */
export class UpdatePersonalizedFeedWithFiltersResponseDto {
  @ApiProperty({
    description: 'パーソナライズフィードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ユーザーID',
    example: 'user_2sNc7XXXXXXXX',
  })
  userId: string;

  @ApiProperty({
    description: 'パーソナライズフィード名',
    example: '技術トレンド最新情報',
  })
  name: string;

  @ApiProperty({
    description: 'データソース',
    example: 'qiita',
  })
  dataSource: string;

  @ApiProperty({
    description: 'フィルター設定',
    example: { tags: ['JavaScript', 'TypeScript'], minLikes: 10 },
  })
  filterConfig: Record<string, any>;

  @ApiProperty({
    description: '配信設定',
    example: { frequency: 'daily', time: '08:00' },
  })
  deliveryConfig: Record<string, any>;

  @ApiProperty({
    description: '有効かどうか',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '作成日時',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新日時',
    example: '2023-01-02T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'フィルターグループ一覧',
    type: [FilterGroupDto],
  })
  filterGroups: FilterGroupDto[];

  /**
   * エンティティからDTOを生成する
   * @param entity パーソナライズフィードエンティティ（フィルター情報付き）
   * @returns フィルター情報を含むパーソナライズフィード更新レスポンスDTO
   */
  static fromEntity(
    entity: PersonalizedFeedWithFilters,
  ): UpdatePersonalizedFeedWithFiltersResponseDto {
    const dto = new UpdatePersonalizedFeedWithFiltersResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.name = entity.name;
    dto.dataSource = entity.dataSource;
    dto.filterConfig = entity.filterConfig;
    dto.deliveryConfig = entity.deliveryConfig;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    // フィルターグループ情報を変換
    dto.filterGroups = entity.filterGroups.map((group) => {
      const groupDto = new FilterGroupDto();
      groupDto.id = group.id;
      groupDto.name = group.name;
      groupDto.logicType = group.logicType;

      // タグフィルター情報を設定
      groupDto.tagFilters = (group.tagFilters || []).map((tag) => ({
        id: tag.id,
        tagName: tag.tagName,
      }));

      // 著者フィルター情報を設定
      groupDto.authorFilters = (group.authorFilters || []).map((author) => ({
        id: author.id,
        authorId: author.authorId,
      }));

      // 公開日フィルター情報を設定
      groupDto.dateRangeFilters = (group.dateRangeFilters || []).map(
        (dateRange) => ({
          id: dateRange.id,
          daysAgo: dateRange.daysAgo,
        }),
      );

      // いいね数フィルター情報を設定
      groupDto.likesCountFilters = (group.likesCountFilters || []).map(
        (likesCount) => ({
          id: likesCount.id,
          minLikes: likesCount.minLikes,
        }),
      );

      return groupDto;
    });

    return dto;
  }
}
