import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetDashboardProgramGenerationHistoryRequestDto {
  @ApiPropertyOptional({
    description: 'フィードID（指定した場合、そのフィードの履歴のみを取得）',
    example: 'feed_123',
  })
  @IsOptional()
  @IsString()
  feedId?: string;

  @ApiPropertyOptional({
    description: '取得件数（デフォルト: 20, 最大: 100）',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'オフセット（デフォルト: 0）',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
