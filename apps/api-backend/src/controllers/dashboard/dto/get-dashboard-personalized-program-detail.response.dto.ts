import { ApiProperty } from '@nestjs/swagger';

/**
 * パーソナルプログラムのチャプター情報
 */
export class ProgramChapterDto {
  @ApiProperty({
    description: 'チャプターのタイトル',
    example: 'オープニング',
  })
  title: string;

  @ApiProperty({
    description: 'チャプターの開始時間（ミリ秒）',
    example: 0,
  })
  startTime: number;

  @ApiProperty({
    description: 'チャプターの終了時間（ミリ秒）',
    example: 30000,
  })
  endTime: number;
}

/**
 * パーソナルプログラムで紹介される記事情報
 */
export class ProgramPostDto {
  @ApiProperty({
    description: '記事ID',
    example: 'post-123',
  })
  id: string;

  @ApiProperty({
    description: '記事タイトル',
    example: 'React 18の新機能について',
  })
  title: string;

  @ApiProperty({
    description: '記事URL',
    example: 'https://qiita.com/example/items/123',
  })
  url: string;

  @ApiProperty({
    description: '記事の投稿者名',
    example: 'tech_user',
  })
  authorName: string;

  @ApiProperty({
    description: '記事の投稿者ID',
    example: 'author-123',
  })
  authorId: string;

  @ApiProperty({
    description: 'いいね数',
    example: 42,
  })
  likesCount: number;

  @ApiProperty({
    description: 'ストック数',
    example: 15,
  })
  stocksCount: number;

  @ApiProperty({
    description: '記事の要約',
    example: 'React 18で追加された新機能について詳しく解説します。',
    nullable: true,
  })
  summary: string | null;

  @ApiProperty({
    description: '記事の作成日時',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '記事の更新日時',
    example: '2024-01-16T14:20:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '限定共有記事かどうか',
    example: false,
  })
  private: boolean;
}

/**
 * パーソナルプログラムの詳細情報レスポンス
 */
export class GetDashboardPersonalizedProgramDetailResponseDto {
  @ApiProperty({
    description: 'プログラムID',
    example: 'program-123',
  })
  id: string;

  @ApiProperty({
    description: 'プログラムタイトル',
    example: '今週のReact関連記事まとめ',
  })
  title: string;

  @ApiProperty({
    description: 'フィードID',
    example: 'feed-123',
  })
  feedId: string;

  @ApiProperty({
    description: 'フィード名',
    example: 'React技術記事フィード',
  })
  feedName: string;

  @ApiProperty({
    description: 'データソース',
    example: 'qiita',
  })
  dataSource: string;

  @ApiProperty({
    description: '音声ファイルURL',
    example: 'https://example.com/audio/program-123.mp3',
  })
  audioUrl: string;

  @ApiProperty({
    description: '音声ファイルの長さ（ミリ秒）',
    example: 180000,
  })
  audioDuration: number;

  @ApiProperty({
    description: '画像URL',
    example: 'https://example.com/images/program-123.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: '番組台本（JSON形式）',
    example: {
      opening: 'こんにちは、今週のReact関連記事をお届けします。',
      sections: [
        {
          title: 'React 18の新機能',
          content: 'React 18で追加された新機能について...',
        },
      ],
      closing: '以上、今週のReact関連記事でした。',
    },
  })
  script: Record<string, any>;

  @ApiProperty({
    description: 'チャプター情報',
    type: [ProgramChapterDto],
  })
  chapters: ProgramChapterDto[];

  @ApiProperty({
    description: '紹介記事一覧',
    type: [ProgramPostDto],
  })
  posts: ProgramPostDto[];

  @ApiProperty({
    description: '番組の有効期限',
    example: '2024-02-15T23:59:59Z',
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: '番組が期限切れかどうか',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'プログラムの作成日時',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'プログラムの更新日時',
    example: '2024-01-16T14:20:00Z',
  })
  updatedAt: Date;
}
