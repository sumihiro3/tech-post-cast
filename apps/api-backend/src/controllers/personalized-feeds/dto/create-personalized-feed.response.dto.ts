import {
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
} from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PersonalizedFeedDto } from './get-personalized-feeds.response.dto';
import { UpdatePersonalizedFeedWithFiltersResponseDto } from './update-personalized-feed-with-filters.response.dto';

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

/**
 * フィルター情報を含むパーソナライズフィード作成レスポンスDTO
 */
export class CreatePersonalizedFeedWithFiltersResponseDto {
  @ApiProperty({
    description: '作成されたパーソナライズフィード（フィルター情報含む）',
    type: UpdatePersonalizedFeedWithFiltersResponseDto,
  })
  feed: UpdatePersonalizedFeedWithFiltersResponseDto;

  /**
   * エンティティからDTOを作成する
   * @param entity フィルター情報を含むパーソナライズフィードエンティティ
   * @returns フィルター情報を含むパーソナライズフィード作成レスポンスDTO
   */
  static fromEntity(
    entity: PersonalizedFeedWithFilters,
  ): CreatePersonalizedFeedWithFiltersResponseDto {
    const dto = new CreatePersonalizedFeedWithFiltersResponseDto();
    dto.feed = UpdatePersonalizedFeedWithFiltersResponseDto.fromEntity(entity);
    return dto;
  }
}
