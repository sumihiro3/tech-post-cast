import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * パーソナライズフィード作成リクエストDTO
 */
export class CreatePersonalizedFeedRequestDto {
  @ApiProperty({
    description: 'パーソナライズフィードの名前',
    required: true,
    example: '技術トレンド最新情報',
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
  @Transform(({ value }) => {
    // 文字列で渡ってきた場合はJSONにパース
    return typeof value === 'string' ? JSON.parse(value) : value;
  })
  filterConfig: Record<string, any>;

  @ApiProperty({
    description: '配信設定',
    required: true,
    example: { frequency: 'daily', time: '08:00' },
    type: Object,
  })
  @IsObject({ message: '配信設定はオブジェクトである必要があります' })
  @Transform(({ value }) => {
    // 文字列で渡ってきた場合はJSONにパース
    return typeof value === 'string' ? JSON.parse(value) : value;
  })
  deliveryConfig: Record<string, any>;

  @ApiProperty({
    description: '有効かどうか',
    required: false,
    default: true,
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: '有効状態は真偽値である必要があります' })
  @Type(() => Boolean)
  isActive?: boolean = true;
}
