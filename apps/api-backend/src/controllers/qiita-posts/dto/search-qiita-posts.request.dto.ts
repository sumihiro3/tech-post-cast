import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

/**
 * Qiita記事検索のリクエストDTO
 */
export class SearchQiitaPostsRequestDto {
  @ApiProperty({
    description: '著者（カンマ区切りで複数指定可能）',
    example: 'sumihiro3,qiita',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return value.split(',');
  })
  @IsArray()
  authors?: string[];

  @ApiProperty({
    description: 'タグ（カンマ区切りで複数指定可能）',
    example: 'JavaScript,TypeScript',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return value.split(',');
  })
  @IsArray()
  tags?: string[];

  @ApiProperty({
    description: '公開日の最小値（YYYY-MM-DD形式）',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value);
  })
  @IsDate()
  minPublishedAt?: Date;

  @ApiProperty({
    description: 'ページ番号（1から始まる、デフォルト: 1）',
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return 1;
    const num = Number(value);
    return isNaN(num) || num < 1 ? 1 : num;
  })
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '1ページあたりの件数（デフォルト: 20、最大: 100）',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return 20;
    const num = Number(value);
    if (isNaN(num) || num < 1) return 20;
    return num > 100 ? 100 : num;
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  perPage?: number = 20;
}
