import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

/**
 * ダッシュボード統計情報レスポンスDTO
 */
export class GetDashboardStatsResponseDto {
  @ApiProperty({
    description: 'アクティブなフィード数',
    example: 8,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  activeFeedsCount: number;

  @ApiProperty({
    description: '今月の配信番組数',
    example: 24,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  monthlyEpisodesCount: number;

  @ApiProperty({
    description: '総番組時間（フォーマット済み）',
    example: '12.5h',
    pattern: '^\\d+(\\.\\d+)?[hm]$',
  })
  @IsString()
  totalProgramDuration: string;
}
