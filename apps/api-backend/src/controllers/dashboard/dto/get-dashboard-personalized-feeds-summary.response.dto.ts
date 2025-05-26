import { ApiProperty } from '@nestjs/swagger';

export class PersonalizedFeedSummaryDto {
  @ApiProperty({
    description: 'フィードID',
    example: 'feed_123',
  })
  id: string;

  @ApiProperty({
    description: 'フィード名',
    example: 'React関連記事フィード',
  })
  name: string;

  @ApiProperty({
    description: 'フィード説明',
    example: 'React.jsに関する最新記事を収集するフィード',
  })
  description: string;

  @ApiProperty({
    description: 'アクティブ状態',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'タグフィルター数',
    example: 3,
  })
  tagFiltersCount: number;

  @ApiProperty({
    description: '著者フィルター数',
    example: 2,
  })
  authorFiltersCount: number;

  @ApiProperty({
    description: 'フィルター条件総数',
    example: 5,
  })
  totalFiltersCount: number;

  @ApiProperty({
    description: '作成日時',
    example: '2025-03-25T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '最終更新日時',
    example: '2025-03-25T15:30:00Z',
  })
  updatedAt: Date;
}

export class GetDashboardPersonalizedFeedsSummaryResponseDto {
  @ApiProperty({
    description: 'アクティブなフィード数',
    example: 5,
  })
  activeFeedsCount: number;

  @ApiProperty({
    description: '総フィード数',
    example: 8,
  })
  totalFeedsCount: number;

  @ApiProperty({
    description: '最近作成されたフィード（最新5件）',
    type: [PersonalizedFeedSummaryDto],
  })
  recentFeeds: PersonalizedFeedSummaryDto[];

  @ApiProperty({
    description: '総フィルター条件数',
    example: 25,
  })
  totalFiltersCount: number;
}
