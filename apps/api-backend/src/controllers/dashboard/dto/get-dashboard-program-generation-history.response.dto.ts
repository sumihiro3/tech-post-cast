import { ApiProperty } from '@nestjs/swagger';

export class ProgramGenerationHistoryDto {
  @ApiProperty({
    description: '試行履歴ID',
    example: 'attempt_123',
  })
  id: string;

  @ApiProperty({
    description: '実行日時',
    example: '2025-03-25T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'フィード情報',
    example: {
      id: 'feed_123',
      name: 'Nuxt関連記事フィード',
    },
  })
  feed: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: '実行ステータス',
    example: 'SUCCESS',
    enum: ['SUCCESS', 'SKIPPED', 'FAILED'],
  })
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';

  @ApiProperty({
    description: '失敗・スキップの理由',
    example: '記事が不足しています',
    nullable: true,
  })
  reason: string | null;

  @ApiProperty({
    description: '対象記事数',
    example: 5,
  })
  postCount: number;

  @ApiProperty({
    description: '生成された番組情報',
    example: {
      id: 'program_123',
      title: 'React最新情報 - 2025年3月25日',
    },
    nullable: true,
  })
  program: {
    id: string;
    title: string;
  } | null;
}

export class GetDashboardProgramGenerationHistoryResponseDto {
  @ApiProperty({
    description: '番組生成履歴一覧',
    type: [ProgramGenerationHistoryDto],
  })
  history: ProgramGenerationHistoryDto[];

  @ApiProperty({
    description: '総件数',
    example: 50,
  })
  totalCount: number;

  @ApiProperty({
    description: '取得件数',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'オフセット',
    example: 0,
  })
  offset: number;

  @ApiProperty({
    description: '次のページが存在するか',
    example: true,
  })
  hasNext: boolean;
}
