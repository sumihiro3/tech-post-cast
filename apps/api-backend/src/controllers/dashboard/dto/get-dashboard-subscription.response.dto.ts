import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlanName } from '@tech-post-cast/commons';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
/**
 * サブスクリプション機能情報DTO
 */
export class SubscriptionFeatureDto {
  @ApiProperty({
    description: '機能名',
    example: '基本的なフィード作成',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '機能が利用可能かどうか',
    example: true,
  })
  @IsBoolean()
  available: boolean;
}

/**
 * 使用量情報DTO
 */
export class UsageItemDto {
  @ApiProperty({
    description: '使用量項目のラベル',
    example: 'フィード数',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: '現在の使用量',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  current: number;

  @ApiProperty({
    description: '制限値',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  limit: number;

  @ApiProperty({
    description: 'パーセンテージ表示するかどうか',
    example: true,
  })
  @IsBoolean()
  showPercentage: boolean;

  @ApiProperty({
    description: '警告しきい値（パーセンテージ）',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  warningThreshold: number;

  @ApiProperty({
    description: '危険しきい値（パーセンテージ）',
    example: 90,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  dangerThreshold: number;
}

/**
 * ダッシュボードサブスクリプション情報レスポンスDTO
 */
export class GetDashboardSubscriptionResponseDto {
  @ApiProperty({
    description: 'プラン名',
    example: 'Free',
    enum: ['Free', 'Basic', 'Pro', 'Enterprise'],
  })
  @IsString()
  planName: SubscriptionPlanName;

  @ApiProperty({
    description: 'プランの表示色',
    example: 'grey',
  })
  @IsString()
  planColor: string;

  @ApiProperty({
    description: 'プランの機能一覧',
    type: [SubscriptionFeatureDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionFeatureDto)
  features: SubscriptionFeatureDto[];

  @ApiProperty({
    description: '使用量情報一覧',
    type: [UsageItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsageItemDto)
  usageItems: UsageItemDto[];

  @ApiProperty({
    description: 'アップグレードボタンを表示するかどうか',
    example: true,
  })
  @IsBoolean()
  showUpgradeButton: boolean;
}
