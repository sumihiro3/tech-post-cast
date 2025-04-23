// filepath: /Users/sumihiro/projects/TechPostCast/tech-post-cast/apps/api-backend/src/controllers/personalized-feeds/dto/update-personalized-feed.request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryFrequency, SortPriority } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FilterGroupDto } from './create-personalized-feed.request.dto';

/**
 * パーソナライズフィード更新リクエストDTO
 */
export class UpdatePersonalizedFeedRequestDto {
  @ApiProperty({
    description: 'パーソナライズフィードの名前',
    required: false,
    example: '技術トレンド最新情報',
    type: String,
  })
  @IsString({ message: '名前は文字列である必要があります' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'データソース',
    required: false,
    example: 'qiita',
    type: String,
  })
  @IsString({ message: 'データソースは文字列である必要があります' })
  @IsOptional()
  dataSource?: string;

  @ApiProperty({
    description: 'フィルター設定',
    required: false,
    example: { tags: ['JavaScript', 'TypeScript'], minLikes: 10 },
    type: Object,
  })
  @IsObject({ message: 'フィルター設定はオブジェクトである必要があります' })
  @IsOptional()
  @Transform(({ value }) => {
    // 文字列で渡ってきた場合はJSONにパース
    return typeof value === 'string' ? JSON.parse(value) : value;
  })
  filterConfig?: Record<string, any>;

  @ApiProperty({
    description: '配信設定',
    required: false,
    example: { frequency: 'daily', time: '08:00' },
    type: Object,
  })
  @IsObject({ message: '配信設定はオブジェクトである必要があります' })
  @IsOptional()
  @Transform(({ value }) => {
    // 文字列で渡ってきた場合はJSONにパース
    return typeof value === 'string' ? JSON.parse(value) : value;
  })
  deliveryConfig?: Record<string, any>;

  @ApiProperty({
    description: '配信間隔',
    required: false,
    enum: DeliveryFrequency,
    example: DeliveryFrequency.WEEKLY,
  })
  @IsOptional()
  @IsEnum(DeliveryFrequency, {
    message: '配信間隔は有効な値である必要があります',
  })
  deliveryFrequency?: DeliveryFrequency;

  @ApiProperty({
    description: '記事の優先順位',
    required: false,
    enum: SortPriority,
    example: SortPriority.PUBLISHED_AT_DESC,
  })
  @IsOptional()
  @IsEnum(SortPriority, {
    message: '記事の優先順位は有効な値である必要があります',
  })
  sortPriority?: SortPriority;

  @ApiProperty({
    description: 'フィルターグループ一覧',
    required: false,
    type: [FilterGroupDto],
  })
  @IsArray({ message: 'フィルターグループは配列である必要があります' })
  @ValidateNested({ each: true })
  @Type(() => FilterGroupDto)
  @IsOptional()
  filterGroups?: FilterGroupDto[] = [];

  @ApiProperty({
    description: '有効かどうか',
    required: false,
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: '有効状態は真偽値である必要があります' })
  @Type(() => Boolean)
  isActive?: boolean;
}
