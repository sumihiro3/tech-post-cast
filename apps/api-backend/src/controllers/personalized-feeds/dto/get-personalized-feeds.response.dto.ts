import {
  PersonalizedFeed,
  PersonalizedFeedsResult,
} from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * パーソナライズフィードの情報DTO
 */
export class PersonalizedFeedDto {
  @ApiProperty({
    description: 'パーソナライズフィードのID',
    required: true,
    example: 'feed_1234567890',
    type: String,
  })
  @IsString({ message: 'IDは文字列である必要があります' })
  @IsNotEmpty({ message: 'IDは必須です' })
  id: string;

  @ApiProperty({
    description: 'パーソナライズフィードの名前',
    required: true,
    example: '技術ブログフィード',
    type: String,
  })
  @IsString({ message: '名前は文字列である必要があります' })
  @IsNotEmpty({ message: '名前は必須です' })
  name: string;

  @ApiProperty({
    description: 'データソース',
    required: true,
    example: 'qiita',
    type: String,
  })
  @IsString({ message: 'データソースは文字列である必要があります' })
  @IsNotEmpty({ message: 'データソースは必須です' })
  dataSource: string;

  @ApiProperty({
    description: 'フィルター設定',
    required: true,
    example: { tags: ['JavaScript', 'TypeScript'], minLikes: 10 },
    type: Object,
  })
  @IsObject({ message: 'フィルター設定はオブジェクトである必要があります' })
  filterConfig: Record<string, any>;

  @ApiProperty({
    description: '配信設定',
    required: true,
    example: { frequency: 'daily', time: '08:00' },
    type: Object,
  })
  @IsObject({ message: '配信設定はオブジェクトである必要があります' })
  deliveryConfig: Record<string, any>;

  @ApiProperty({
    description: '有効かどうか',
    required: true,
    example: true,
    type: Boolean,
  })
  @IsBoolean({ message: '有効状態は真偽値である必要があります' })
  isActive: boolean;

  @ApiProperty({
    description: '作成日時',
    required: true,
    example: '2025-04-08T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString(
    {},
    { message: '作成日時はISO形式の日付文字列である必要があります' },
  )
  createdAt: string;

  @ApiProperty({
    description: '更新日時',
    required: true,
    example: '2025-04-08T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString(
    {},
    { message: '更新日時はISO形式の日付文字列である必要があります' },
  )
  updatedAt: string;

  /**
   * エンティティからDTOを作成する
   * @param entity パーソナライズフィードエンティティ
   * @returns パーソナライズフィードDTO
   */
  static fromEntity(entity: PersonalizedFeed): PersonalizedFeedDto {
    const dto = new PersonalizedFeedDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.dataSource = entity.dataSource;
    dto.filterConfig = entity.filterConfig;
    dto.deliveryConfig = entity.deliveryConfig;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();

    return dto;
  }
}

/**
 * パーソナライズフィード一覧取得レスポンスDTO
 */
export class GetPersonalizedFeedsResponseDto {
  @ApiProperty({
    description: 'パーソナライズフィード一覧',
    required: true,
    type: PersonalizedFeedDto,
    isArray: true,
  })
  feeds: PersonalizedFeedDto[];

  @ApiProperty({
    description: '総件数',
    required: true,
    example: 42,
    type: Number,
    minimum: 0,
  })
  @IsPositive({ message: '総件数は0以上の数値である必要があります' })
  total: number;

  /**
   * エンティティからDTOを作成する
   * @param result パーソナライズフィード一覧取得結果
   * @returns パーソナライズフィード一覧取得レスポンスDTO
   */
  static fromEntity(
    result: PersonalizedFeedsResult,
  ): GetPersonalizedFeedsResponseDto {
    const dto = new GetPersonalizedFeedsResponseDto();
    dto.feeds = result.feeds.map((feed) =>
      PersonalizedFeedDto.fromEntity(feed),
    );
    dto.total = result.total;

    return dto;
  }
}
