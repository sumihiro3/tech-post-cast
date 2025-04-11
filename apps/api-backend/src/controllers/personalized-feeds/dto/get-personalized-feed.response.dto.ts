import { PersonalizedFeed } from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PersonalizedFeedDto } from './get-personalized-feeds.response.dto';

/**
 * 単一パーソナライズフィード取得レスポンスDTO
 */
export class GetPersonalizedFeedResponseDto {
  @ApiProperty({
    description: 'パーソナライズフィード情報',
    type: PersonalizedFeedDto,
    required: true,
  })
  feed: PersonalizedFeedDto;

  /**
   * エンティティからDTOを作成する
   * @param entity パーソナライズフィードエンティティ
   * @returns 単一パーソナライズフィード取得レスポンスDTO
   */
  static fromEntity(entity: PersonalizedFeed): GetPersonalizedFeedResponseDto {
    const dto = new GetPersonalizedFeedResponseDto();
    dto.feed = PersonalizedFeedDto.fromEntity(entity);
    return dto;
  }
}
