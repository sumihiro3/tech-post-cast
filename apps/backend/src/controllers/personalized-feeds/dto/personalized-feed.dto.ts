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
}
