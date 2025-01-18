import {
  ProgramRegenerationType,
  ProgramRegenerationTypeEnum,
} from '@domains/radio-program/headline-topic-program';
import { ApiProperty } from '@nestjs/swagger';
import {
  getStartOfDay,
  subtractDays,
  TIME_ZONE_JST,
} from '@tech-post-cast/commons';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * ヘッドライントピック番組の生成要求DTO
 */
export class HeadlineTopicCreateRequestDto {
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
 * ヘッドライントピック番組の再生成要求DTO
 */
export class HeadlineTopicRegenerateRequestDto {
  @ApiProperty({
    description: '再生成する番組のID',
    example: 'sample-id',
    required: true,
  })
  @IsString()
  programId: string;

  @ApiProperty({
    description: '番組の再生成種別',
    enum: ProgramRegenerationTypeEnum,
    example: 'AUDIO_ONLY',
    required: true,
  })
  @IsEnum(ProgramRegenerationTypeEnum)
  regenerationType: ProgramRegenerationType;
}
