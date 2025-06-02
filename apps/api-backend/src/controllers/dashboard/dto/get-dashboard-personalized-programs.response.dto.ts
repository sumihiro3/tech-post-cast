import { ApiProperty } from '@nestjs/swagger';

export class PersonalizedProgramSummaryDto {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program_123',
  })
  id: string;

  @ApiProperty({
    description: 'プログラムタイトル',
    example: 'React最新情報 - 2025年3月25日',
  })
  title: string;

  @ApiProperty({
    description: 'フィードID',
    example: 'feed_123',
  })
  feedId: string;

  @ApiProperty({
    description: 'フィード名',
    example: 'React関連記事フィード',
  })
  feedName: string;

  @ApiProperty({
    description: '音声ファイルURL',
    example: 'https://example.com/audio/program_123.mp3',
  })
  audioUrl: string;

  @ApiProperty({
    description: '音声ファイルの長さ（ミリ秒）',
    example: 180000,
  })
  audioDuration: number;

  @ApiProperty({
    description: '画像URL',
    example: 'https://example.com/images/program_123.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: '紹介記事数',
    example: 5,
  })
  postsCount: number;

  @ApiProperty({
    description: '有効期限',
    example: '2025-04-25T10:00:00Z',
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: '有効期限切れフラグ',
    example: false,
  })
  isExpired: boolean;

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

export class GetDashboardPersonalizedProgramsResponseDto {
  @ApiProperty({
    description: 'パーソナルプログラム一覧',
    type: [PersonalizedProgramSummaryDto],
  })
  programs: PersonalizedProgramSummaryDto[];

  @ApiProperty({
    description: '総件数',
    example: 25,
  })
  totalCount: number;

  @ApiProperty({
    description: '取得件数',
    example: 10,
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
