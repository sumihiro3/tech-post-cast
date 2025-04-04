import { ApiProperty } from '@nestjs/swagger';

/**
 * Qiita記事のユーザー情報DTO
 */
export class QiitaUserDto {
  @ApiProperty({
    description: 'ユーザーの一意なID',
    example: 'sumihiro3',
  })
  id: string;

  @ApiProperty({
    description: '自己紹介文',
    example: 'フロントエンド開発者です',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'ユーザー名',
    example: '住廣 陸',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: '設定しているプロフィール画像のURL',
    example:
      'https://qiita-image-store.s3.amazonaws.com/0/12345/profile-xxxx.png',
  })
  profile_image_url: string;
}

/**
 * Qiita記事のタグ情報DTO
 */
export class QiitaTagDto {
  @ApiProperty({
    description: 'タグ名',
    example: 'JavaScript',
  })
  name: string;

  @ApiProperty({
    description: 'バージョン情報',
    example: ['0.1', '1.0'],
    type: [String],
  })
  versions: string[];
}

/**
 * Qiita記事情報DTO
 */
export class QiitaPostDto {
  @ApiProperty({
    description: '記事の一意なID',
    example: '1234567890abcdef1234',
  })
  id: string;

  @ApiProperty({
    description: '記事のタイトル',
    example: 'TypeScriptで型安全なコードを書く方法',
  })
  title: string;

  @ApiProperty({
    description: '記事のURL',
    example: 'https://qiita.com/sumihiro3/items/1234567890abcdef1234',
  })
  url: string;

  @ApiProperty({
    description: '記事が作成された日時',
    example: '2023-01-01T00:00:00+09:00',
  })
  created_at: string;

  @ApiProperty({
    description: '記事の最終更新日時',
    example: '2023-01-02T00:00:00+09:00',
  })
  updated_at: string;

  @ApiProperty({
    description: '記事投稿者',
    type: QiitaUserDto,
  })
  user: QiitaUserDto;

  @ApiProperty({
    description: 'この記事へのコメントの数',
    example: 5,
  })
  comments_count: number;

  @ApiProperty({
    description: 'この記事へのいいねの数',
    example: 10,
  })
  likes_count: number;

  @ApiProperty({
    description: 'この記事がストックされた数',
    example: 20,
  })
  stocks_count: number;

  @ApiProperty({
    description: '記事に付いたタグ一覧',
    type: [QiitaTagDto],
  })
  tags: QiitaTagDto[];
}

/**
 * Qiita記事検索結果DTO
 */
export class SearchQiitaPostsResponseDto {
  @ApiProperty({
    description: '検索結果の記事一覧',
    type: [QiitaPostDto],
  })
  posts: QiitaPostDto[];

  @ApiProperty({
    description: '検索結果の総件数',
    example: 100,
  })
  totalCount: number;

  @ApiProperty({
    description: '現在のページ番号',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '1ページあたりの件数',
    example: 20,
  })
  perPage: number;

  /**
   * エンティティからDTOを作成
   * @param entity Qiita記事検索結果エンティティ
   * @returns Qiita記事検索結果DTO
   */
  static fromEntity(entity: any): SearchQiitaPostsResponseDto {
    const dto = new SearchQiitaPostsResponseDto();
    dto.posts = entity.posts;
    dto.totalCount = entity.totalCount;
    dto.page = entity.page;
    dto.perPage = entity.perPage;
    return dto;
  }
}
