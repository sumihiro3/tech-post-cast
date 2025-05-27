import { ApiProperty } from '@nestjs/swagger';
import { PersonalizedProgramAttempt } from '@prisma/client';
import { PersonalizedProgramAttemptStatus } from '@tech-post-cast/database';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

/**
 * 番組生成試行履歴DTO
 */
export class PersonalizedProgramAttemptDto {
  @ApiProperty({
    description: '試行履歴ID',
    required: true,
    example: 'attempt_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'ユーザーID',
    required: true,
    example: 'user_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'フィードID',
    required: true,
    example: 'feed_1234567890',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  feedId: string;

  @ApiProperty({
    description: '生成された番組ID（成功時のみ）',
    required: false,
    example: 'program_1234567890',
    type: String,
  })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiProperty({
    description: '試行ステータス',
    required: true,
    enum: PersonalizedProgramAttemptStatus,
    example: PersonalizedProgramAttemptStatus.SUCCESS,
  })
  @IsEnum(PersonalizedProgramAttemptStatus)
  status: PersonalizedProgramAttemptStatus;

  @ApiProperty({
    description: '失敗理由（失敗・スキップ時のみ）',
    required: false,
    example: 'NOT_ENOUGH_POSTS',
    type: String,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: '記事数',
    required: true,
    example: 5,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  postCount: number;

  @ApiProperty({
    description: '試行日時',
    required: true,
    example: '2024-01-01T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString()
  createdAt: string;

  /**
   * エンティティからDTOを作成する
   */
  static fromEntity(
    entity: PersonalizedProgramAttempt,
  ): PersonalizedProgramAttemptDto {
    const dto = new PersonalizedProgramAttemptDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.feedId = entity.feedId;
    dto.programId = entity.programId || undefined;
    dto.status = entity.status as PersonalizedProgramAttemptStatus;
    dto.reason = entity.reason || undefined;
    dto.postCount = entity.postCount;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

/**
 * フィード別番組生成履歴取得レスポンスDTO
 */
export class GetProgramAttemptsResponseDto {
  @ApiProperty({
    description: '番組生成試行履歴一覧',
    required: true,
    type: [PersonalizedProgramAttemptDto],
  })
  @IsArray()
  attempts: PersonalizedProgramAttemptDto[];

  @ApiProperty({
    description: '総件数',
    required: true,
    example: 42,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalCount: number;

  @ApiProperty({
    description: '現在のページ番号',
    required: true,
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  currentPage: number;

  @ApiProperty({
    description: '総ページ数',
    required: true,
    example: 3,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalPages: number;

  @ApiProperty({
    description: '次のページが存在するか',
    required: true,
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  hasNextPage: boolean;

  @ApiProperty({
    description: '前のページが存在するか',
    required: true,
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  hasPreviousPage: boolean;
}

/**
 * フィード別番組生成履歴統計情報レスポンスDTO
 */
export class GetProgramAttemptsStatisticsResponseDto {
  @ApiProperty({
    description: '総試行回数',
    required: true,
    example: 10,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalAttempts: number;

  @ApiProperty({
    description: '成功回数',
    required: true,
    example: 7,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  successCount: number;

  @ApiProperty({
    description: 'スキップ回数',
    required: true,
    example: 2,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  skippedCount: number;

  @ApiProperty({
    description: '失敗回数',
    required: true,
    example: 1,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  failedCount: number;

  @ApiProperty({
    description: '成功率（%）',
    required: true,
    example: 70.0,
    type: Number,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  successRate: number;

  @ApiProperty({
    description: '最新試行日時',
    required: false,
    example: '2024-01-03T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  lastAttemptDate?: string;

  @ApiProperty({
    description: '最新成功日時',
    required: false,
    example: '2024-01-03T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  lastSuccessDate?: string;
}

/**
 * フィード別番組生成履歴件数取得レスポンスDTO
 */
export class GetProgramAttemptsCountResponseDto {
  @ApiProperty({
    description: '試行履歴件数',
    required: true,
    example: 42,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @IsPositive()
  count: number;
}
