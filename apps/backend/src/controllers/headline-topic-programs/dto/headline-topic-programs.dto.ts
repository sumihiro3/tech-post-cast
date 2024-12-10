import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

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
}
