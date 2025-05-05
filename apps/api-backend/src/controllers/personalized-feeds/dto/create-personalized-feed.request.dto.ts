import { ApiProperty } from '@nestjs/swagger';
import { DeliveryFrequency } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * 公開日フィルターが1つだけであることを検証するカスタムバリデーター
 */
@ValidatorConstraint({ name: 'singleDateRangeFilter', async: false })
export class SingleDateRangeFilterConstraint
  implements ValidatorConstraintInterface
{
  validate(dateRangeFilters: DateRangeFilterDto[] | undefined) {
    // 定義されていない場合はNG
    if (!dateRangeFilters) return false;
    // 空配列の場合もNG
    if (dateRangeFilters.length === 0) return false;
    // 1つだけの場合はOK
    return dateRangeFilters.length === 1;
  }

  defaultMessage() {
    return '公開日フィルターは1つだけ設定する必要があります';
  }
}

/**
 * いいね数フィルターが1つだけであることを検証するカスタムバリデーター
 */
@ValidatorConstraint({ name: 'singleLikesCountFilter', async: false })
export class SingleLikesCountFilterConstraint
  implements ValidatorConstraintInterface
{
  validate(likesCountFilters: LikesCountFilterDto[] | undefined) {
    // 定義されていない場合はNG
    if (!likesCountFilters) return false;
    // 空配列の場合もNG
    if (likesCountFilters.length === 0) return false;
    // 1つだけの場合はOK
    return likesCountFilters.length === 1;
  }

  defaultMessage() {
    return 'いいね数フィルターは1つだけ設定する必要があります';
  }
}

/**
 * タグフィルターのDTO
 */
export class TagFilterDto {
  @ApiProperty({
    description: 'タグ名',
    required: true,
    example: 'JavaScript',
    type: String,
  })
  @IsString({ message: 'タグ名は文字列である必要があります' })
  @IsNotEmpty({ message: 'タグ名は必須です' })
  tagName: string;
}

/**
 * 著者フィルターのDTO
 */
export class AuthorFilterDto {
  @ApiProperty({
    description: '著者ID',
    required: true,
    example: 'author123',
    type: String,
  })
  @IsString({ message: '著者IDは文字列である必要があります' })
  @IsNotEmpty({ message: '著者IDは必須です' })
  authorId: string;
}

/**
 * 公開日フィルターのDTO
 */
export class DateRangeFilterDto {
  @ApiProperty({
    description: '何日以内の記事を対象とするか（10, 30, 60, 90, 180, 365など）',
    required: true,
    example: 30,
    type: Number,
  })
  @IsNotEmpty({ message: '日数は必須です' })
  @Min(1, { message: '日数は1以上である必要があります' })
  @Type(() => Number)
  daysAgo: number;
}

/**
 * いいね数フィルターのDTO
 */
export class LikesCountFilterDto {
  @ApiProperty({
    description: '最小いいね数 (指定した数以上のいいねがある記事を対象とする)',
    required: true,
    example: 10,
    type: Number,
  })
  @IsNotEmpty({ message: 'いいね数は必須です' })
  @Min(0, { message: 'いいね数は0以上である必要があります' })
  @Type(() => Number)
  minLikes: number;
}

/**
 * フィルターグループのDTO
 */
export class FilterGroupDto {
  @ApiProperty({
    description: 'フィルターグループの名前',
    required: true,
    example: 'フロントエンド関連',
    type: String,
  })
  @IsString({ message: 'フィルターグループ名は文字列である必要があります' })
  @IsNotEmpty({ message: 'フィルターグループ名は必須です' })
  name: string;

  @ApiProperty({
    description: 'ロジック種別 (AND/OR)',
    required: true,
    default: 'OR',
    example: 'OR',
    type: String,
  })
  @IsString({ message: 'ロジック種別は文字列である必要があります' })
  @IsOptional()
  logicType?: string = 'OR';

  @ApiProperty({
    description: 'タグフィルター一覧',
    required: false,
    type: [TagFilterDto],
  })
  @IsArray({ message: 'タグフィルターは配列である必要があります' })
  @ValidateNested({ each: true })
  @Type(() => TagFilterDto)
  @IsOptional()
  tagFilters?: TagFilterDto[] = [];

  @ApiProperty({
    description: '著者フィルター一覧',
    required: false,
    type: [AuthorFilterDto],
  })
  @IsArray({ message: '著者フィルターは配列である必要があります' })
  @ValidateNested({ each: true })
  @Type(() => AuthorFilterDto)
  @IsOptional()
  authorFilters?: AuthorFilterDto[] = [];

  @ApiProperty({
    description: '公開日フィルター一覧',
    required: true,
    type: [DateRangeFilterDto],
  })
  @IsArray({ message: '公開日フィルターは配列である必要があります' })
  @ValidateNested({ each: true })
  @Type(() => DateRangeFilterDto)
  @Validate(SingleDateRangeFilterConstraint, {
    message: '公開日フィルターは1つだけ設定する必要があります',
  })
  dateRangeFilters: DateRangeFilterDto[] = [];

  @ApiProperty({
    description: 'いいね数フィルター一覧',
    required: true,
    type: [LikesCountFilterDto],
  })
  @IsArray({ message: 'いいね数フィルターは配列である必要があります' })
  @ValidateNested({ each: true })
  @Type(() => LikesCountFilterDto)
  @Validate(SingleLikesCountFilterConstraint, {
    message: 'いいね数フィルターは1つだけ設定する必要があります',
  })
  likesCountFilters: LikesCountFilterDto[] = [];
}

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
    description: '配信間隔',
    required: false,
    default: DeliveryFrequency.WEEKLY,
    enum: DeliveryFrequency,
    example: DeliveryFrequency.WEEKLY,
  })
  @IsOptional()
  @IsEnum(DeliveryFrequency, {
    message: '配信間隔は有効な値である必要があります',
  })
  deliveryFrequency?: DeliveryFrequency = DeliveryFrequency.WEEKLY;

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
    default: true,
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: '有効状態は真偽値である必要があります' })
  @Type(() => Boolean)
  isActive?: boolean = true;
}
