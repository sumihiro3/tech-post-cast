import { ApiProperty } from '@nestjs/swagger';
import {
  getStartOfDay,
  subtractDays,
  TIME_ZONE_JST,
} from '@tech-post-cast/commons';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * アクティブなパーソナルフィードを表すDTO
 */
export class ActiveFeedDto {
  @ApiProperty({
    description: 'パーソナルフィードのID',
    example: 'sample-id',
    required: true,
  })
  @IsString()
  id: string;
}

/**
 * パーソナルフィードの生成要求DTO
 */
export class PersonalizedFeedCreateRequestDto {
  @ApiProperty({
    description: 'パーソナルフィードのID',
    example: 'sample-id',
    required: true,
  })
  @IsString()
  feedId: string;

  @ApiProperty({
    description: '作成する番組の対象日付。要求日からの過去日数を指定する',
    example: 4,
    default: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  daysAgo?: number;

  /**
   * 作成する番組の対象日付を取得する
   * @returns 作成する番組の対象日付（JST）
   */
  getProgramDate(): Date {
    const daysAgo = this.daysAgo ?? 0;
    const programDate = getStartOfDay(
      subtractDays(new Date(), daysAgo),
      TIME_ZONE_JST,
    );
    return programDate;
  }
}

/**
 * 番組生成結果DTO
 */
export class GenerateProgramResponseDto {
  @ApiProperty({
    description: '番組ID',
    example: 'sample-id',
    required: true,
  })
  @IsString()
  programId: string;

  @ApiProperty({
    description: 'Qiita APIのレートリミット残数',
    example: 100,
    required: true,
  })
  @IsNumber()
  qiitaApiRateRemaining: number;

  @ApiProperty({
    description: 'Qiita APIのレートリセット',
    example: 100,
    required: true,
  })
  @IsNumber()
  qiitaApiRateReset: number;

  @ApiProperty({
    description: '番組生成日時',
    example: '2024-01-01T00:00:00.000Z',
    required: true,
  })
  @IsString()
  generatedAt: string;
}

/**
 * RSS一括生成要求DTO
 */
export class RssBatchGenerateRequestDto {
  @ApiProperty({
    description: '強制実行フラグ（通常は不要）',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  force?: boolean;
}

/**
 * RSS一括生成結果DTO
 */
export class RssBatchGenerateResponseDto {
  @ApiProperty({
    description: '成功件数',
    example: 15,
    required: true,
  })
  @IsNumber()
  successCount: number;

  @ApiProperty({
    description: '失敗件数',
    example: 2,
    required: true,
  })
  @IsNumber()
  failureCount: number;

  @ApiProperty({
    description: '失敗したユーザーID一覧',
    example: ['user-1', 'user-2'],
    required: true,
  })
  @IsString({ each: true })
  failedUserIds: string[];

  @ApiProperty({
    description: '処理開始時刻（ISO文字列）',
    example: '2024-01-01T00:00:00.000Z',
    required: true,
  })
  @IsString()
  startedAt: string;

  @ApiProperty({
    description: '処理完了時刻（ISO文字列）',
    example: '2024-01-01T00:05:30.000Z',
    required: true,
  })
  @IsString()
  completedAt: string;

  @ApiProperty({
    description: '処理時間（ミリ秒）',
    example: 330000,
    required: true,
  })
  @IsNumber()
  durationMs: number;
}

/**
 * 個別ユーザーRSS生成要求DTO
 */
export class RssUserGenerateRequestDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: 'user-123',
    required: true,
  })
  @IsString()
  userId: string;
}

/**
 * 個別ユーザーRSS生成結果DTO
 */
export class RssUserGenerateResponseDto {
  @ApiProperty({
    description: 'ユーザーID',
    example: 'user-123',
    required: true,
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'アップロードされたRSS URL',
    example:
      'https://rss.techpostcast.com/u/550e8400-e29b-41d4-a716-446655440000/rss.xml',
    required: true,
  })
  @IsString()
  rssUrl: string;

  @ApiProperty({
    description: 'エピソード数',
    example: 25,
    required: true,
  })
  @IsNumber()
  episodeCount: number;

  @ApiProperty({
    description: '生成日時（ISO文字列）',
    example: '2024-01-01T00:00:00.000Z',
    required: true,
  })
  @IsString()
  generatedAt: string;
}

/**
 * 終了通知要求DTO
 */
export class FinalizeRequestDto {
  @ApiProperty({
    description: '作成する番組の対象日付。要求日からの過去日数を指定する',
    example: 0,
    default: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  daysAgo?: number;

  /**
   * 対象日付を取得する
   * @returns 対象日付（JST）
   */
  getTargetDate(): Date {
    const daysAgo = this.daysAgo ?? 0;
    const targetDate = getStartOfDay(
      subtractDays(new Date(), daysAgo),
      TIME_ZONE_JST,
    );
    return targetDate;
  }
}
