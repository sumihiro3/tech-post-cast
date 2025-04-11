import { PersonalizedFeed } from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PersonalizedFeedDto } from './get-personalized-feeds.response.dto';

/**
 * パーソナライズフィード作成レスポンスDTO
 */
export class CreatePersonalizedFeedResponseDto {
  @ApiProperty({
    description: '作成されたパーソナライズフィード',
    type: PersonalizedFeedDto,
  })
  feed: PersonalizedFeedDto;

  /**
   * エンティティからDTOを作成する
   * @param entity パーソナライズフィードエンティティ
   * @returns パーソナライズフィード作成レスポンスDTO
   */
  static fromEntity(
    entity: PersonalizedFeed,
  ): CreatePersonalizedFeedResponseDto {
    const dto = new CreatePersonalizedFeedResponseDto();
    dto.feed = PersonalizedFeedDto.fromEntity(entity);
    return dto;
  }
}
