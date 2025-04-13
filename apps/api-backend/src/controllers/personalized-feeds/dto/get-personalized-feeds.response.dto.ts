import {
  AuthorFilter,
  FilterGroup,
  PersonalizedFeed,
  PersonalizedFeedWithFilters,
  PersonalizedFeedsResult,
  PersonalizedFeedsWithFiltersResult,
  TagFilter,
} from '@/domains/personalized-feeds/personalized-feeds.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * タグフィルターレスポンスDTO
 */
export class ResponseTagFilterDto {
  @ApiProperty({
    description: 'タグフィルターID',
    required: true,
    example: 'tag-flt_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'フィルターグループID',
    required: true,
    example: 'feed-flt-gr_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({
    description: 'タグ名',
    required: true,
    example: 'JavaScript',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  tagName: string;

  @ApiProperty({
    description: '作成日時',
    required: true,
    example: '2025-04-13T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  createdAt: string;

  /**
   * エンティティからDTOを作成する
   */
  static fromEntity(entity: TagFilter): ResponseTagFilterDto {
    const dto = new ResponseTagFilterDto();
    dto.id = entity.id;
    dto.groupId = entity.groupId;
    dto.tagName = entity.tagName;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

/**
 * 著者フィルターレスポンスDTO
 */
export class ResponseAuthorFilterDto {
  @ApiProperty({
    description: '著者フィルターID',
    required: true,
    example: 'author-flt_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'フィルターグループID',
    required: true,
    example: 'feed-flt-gr_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({
    description: '著者ID',
    required: true,
    example: 'sumihiro3',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({
    description: '作成日時',
    required: true,
    example: '2025-04-13T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  createdAt: string;

  /**
   * エンティティからDTOを作成する
   */
  static fromEntity(entity: AuthorFilter): ResponseAuthorFilterDto {
    const dto = new ResponseAuthorFilterDto();
    dto.id = entity.id;
    dto.groupId = entity.groupId;
    dto.authorId = entity.authorId;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

/**
 * フィルターグループレスポンスDTO
 */
export class ResponseFilterGroupDto {
  @ApiProperty({
    description: 'フィルターグループID',
    required: true,
    example: 'feed-flt-gr_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'パーソナライズフィードID',
    required: true,
    example: 'feed_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  filterId: string;

  @ApiProperty({
    description: 'フィルターグループ名',
    required: true,
    example: 'フロントエンド技術',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '論理演算子タイプ (AND/OR)',
    required: true,
    example: 'OR',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  logicType: string;

  @ApiProperty({
    description: 'タグフィルター一覧',
    required: false,
    type: [ResponseTagFilterDto],
  })
  @IsArray()
  @IsOptional()
  tagFilters?: ResponseTagFilterDto[];

  @ApiProperty({
    description: '著者フィルター一覧',
    required: false,
    type: [ResponseAuthorFilterDto],
  })
  @IsArray()
  @IsOptional()
  authorFilters?: ResponseAuthorFilterDto[];

  @ApiProperty({
    description: '作成日時',
    required: true,
    example: '2025-04-13T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: '更新日時',
    required: true,
    example: '2025-04-13T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  updatedAt: string;

  /**
   * エンティティからDTOを作成する
   */
  static fromEntity(entity: FilterGroup): ResponseFilterGroupDto {
    const dto = new ResponseFilterGroupDto();
    dto.id = entity.id;
    dto.filterId = entity.filterId;
    dto.name = entity.name;
    dto.logicType = entity.logicType;

    if (entity.tagFilters && entity.tagFilters.length > 0) {
      dto.tagFilters = entity.tagFilters.map((tag) =>
        ResponseTagFilterDto.fromEntity(tag),
      );
    }

    if (entity.authorFilters && entity.authorFilters.length > 0) {
      dto.authorFilters = entity.authorFilters.map((author) =>
        ResponseAuthorFilterDto.fromEntity(author),
      );
    }

    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

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
 * フィルター情報を含むパーソナライズフィードのDTO
 */
export class PersonalizedFeedWithFiltersDto extends PersonalizedFeedDto {
  @ApiProperty({
    description: 'フィルターグループ一覧',
    required: false,
    type: [ResponseFilterGroupDto],
  })
  @IsArray()
  @IsOptional()
  filterGroups?: ResponseFilterGroupDto[];

  /**
   * エンティティからDTOを作成する
   * @param entity フィルター情報を含むパーソナライズフィードエンティティ
   * @returns フィルター情報を含むパーソナライズフィードDTO
   */
  static fromEntity(
    entity: PersonalizedFeedWithFilters,
  ): PersonalizedFeedWithFiltersDto {
    const dto = new PersonalizedFeedWithFiltersDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.dataSource = entity.dataSource;
    dto.filterConfig = entity.filterConfig;
    dto.deliveryConfig = entity.deliveryConfig;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();

    if (entity.filterGroups && entity.filterGroups.length > 0) {
      dto.filterGroups = entity.filterGroups.map((group) =>
        ResponseFilterGroupDto.fromEntity(group),
      );
    }

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

/**
 * フィルター情報を含むパーソナライズフィード一覧取得レスポンスDTO
 */
export class GetPersonalizedFeedsWithFiltersResponseDto {
  @ApiProperty({
    description: 'フィルター情報を含むパーソナライズフィード一覧',
    required: true,
    type: PersonalizedFeedWithFiltersDto,
    isArray: true,
  })
  feeds: PersonalizedFeedWithFiltersDto[];

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
   * @param result フィルター情報を含むパーソナライズフィード一覧取得結果
   * @returns フィルター情報を含むパーソナライズフィード一覧取得レスポンスDTO
   */
  static fromEntity(
    result: PersonalizedFeedsWithFiltersResult,
  ): GetPersonalizedFeedsWithFiltersResponseDto {
    const dto = new GetPersonalizedFeedsWithFiltersResponseDto();
    dto.feeds = result.feeds.map((feed) =>
      PersonalizedFeedWithFiltersDto.fromEntity(feed),
    );
    dto.total = result.total;

    return dto;
  }
}
