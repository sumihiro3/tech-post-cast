import { ApiProperty } from '@nestjs/swagger';
import { DeliveryFrequency, SortPriority } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
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
    // 定義されていない場合はOK
    if (!dateRangeFilters) return true;
    // 空配列の場合もOK
    if (dateRangeFilters.length === 0) return true;
    // 1つだけの場合はOK
    return dateRangeFilters.length === 1;
  }

  defaultMessage() {
    return '公開日フィルターは1つだけ設定できます';
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
  @Type(() => Number)
  daysAgo: number;
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
    required: false,
    type: [DateRangeFilterDto],
  })
  @IsArray({ message: '公開日フィルターは配列である必要があります' })
  @ValidateNested({ each: true })
  @Type(() => DateRangeFilterDto)
  @IsOptional()
  @Validate(SingleDateRangeFilterConstraint, {
    message: '公開日フィルターは1つだけ設定できます',
  })
  dateRangeFilters?: DateRangeFilterDto[] = [];
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
    description: '記事の優先順位',
    required: false,
    default: SortPriority.PUBLISHED_AT_DESC,
    enum: SortPriority,
    example: SortPriority.PUBLISHED_AT_DESC,
  })
  @IsOptional()
  @IsEnum(SortPriority, {
    message: '記事の優先順位は有効な値である必要があります',
  })
  sortPriority?: SortPriority = SortPriority.PUBLISHED_AT_DESC;

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
