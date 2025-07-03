// filepath: /Users/sumihiro/projects/TechPostCast/tech-post-cast/apps/api-backend/src/controllers/personalized-feeds/dto/update-personalized-feed.response.dto.ts
import { PersonalizedFeed } from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * パーソナライズフィード更新レスポンスDTO
 */
export class UpdatePersonalizedFeedResponseDto {
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

  /**
   * エンティティからDTOを生成する
   * @param entity パーソナライズフィードエンティティ
   * @returns パーソナライズフィード更新レスポンスDTO
   */
  static fromEntity(
    entity: PersonalizedFeed,
  ): UpdatePersonalizedFeedResponseDto {
    const dto = new UpdatePersonalizedFeedResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.name = entity.name;
    dto.dataSource = entity.dataSource;
    dto.filterConfig = entity.filterConfig;
    dto.deliveryConfig = entity.deliveryConfig;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
