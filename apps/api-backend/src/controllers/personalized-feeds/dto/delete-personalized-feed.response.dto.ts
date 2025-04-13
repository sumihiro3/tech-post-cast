// filepath: /Users/sumihiro/projects/TechPostCast/tech-post-cast/apps/api-backend/src/controllers/personalized-feeds/dto/delete-personalized-feed.response.dto.ts
import { PersonalizedFeed } from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * パーソナライズフィード削除レスポンスDTO
 */
export class DeletePersonalizedFeedResponseDto {
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
    description: '有効かどうか（削除後はfalse）',
    example: false,
  })
  isActive: boolean;

  @ApiProperty({
    description: '削除日時',
    example: '2025-04-13T00:00:00.000Z',
  })
  updatedAt: Date;

  /**
   * エンティティからDTOを生成する
   * @param entity パーソナライズフィードエンティティ
   * @returns パーソナライズフィード削除レスポンスDTO
   */
  static fromEntity(
    entity: PersonalizedFeed,
  ): DeletePersonalizedFeedResponseDto {
    const dto = new DeletePersonalizedFeedResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.name = entity.name;
    dto.isActive = entity.isActive;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
