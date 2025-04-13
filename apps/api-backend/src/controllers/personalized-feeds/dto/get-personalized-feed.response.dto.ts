import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
} from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  PersonalizedFeedDto,
  PersonalizedFeedWithFiltersDto,
} from './get-personalized-feeds.response.dto';

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

/**
 * フィルター情報を含む単一パーソナライズフィード取得レスポンスDTO
 */
export class GetPersonalizedFeedWithFiltersResponseDto {
  @ApiProperty({
    description: 'フィルター情報を含むパーソナライズフィード情報',
    type: PersonalizedFeedWithFiltersDto,
    required: true,
  })
  feed: PersonalizedFeedWithFiltersDto;

  /**
   * エンティティからDTOを作成する
   * @param entity フィルター情報を含むパーソナライズフィードエンティティ
   * @returns フィルター情報を含む単一パーソナライズフィード取得レスポンスDTO
   */
  static fromEntity(
    entity: PersonalizedFeedWithFilters,
  ): GetPersonalizedFeedWithFiltersResponseDto {
    const dto = new GetPersonalizedFeedWithFiltersResponseDto();
    dto.feed = PersonalizedFeedWithFiltersDto.fromEntity(entity);
    return dto;
  }
}
