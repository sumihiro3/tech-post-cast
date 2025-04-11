import {
  QiitaGroupApiResponse,
  QiitaPostApiResponse,
  QiitaPostsSearchResult,
  QiitaTeamMembershipApiResponse,
  QiitaUserApiResponse,
} from '@domains/qiita-posts/qiita-posts.entity';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

/**
 * Qiita記事のユーザー情報DTO
 */
export class QiitaUserDto implements QiitaUserApiResponse {
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

  @ApiProperty({
    description: 'FacebookのID',
    example: 'facebook123',
    required: false,
  })
  facebook_id?: string;

  @ApiProperty({
    description: 'フォローしているユーザー数',
    example: 150,
  })
  followees_count: number;

  @ApiProperty({
    description: 'フォロワー数',
    example: 200,
  })
  followers_count: number;

  @ApiProperty({
    description: 'GitHubのログイン名',
    example: 'sumihiro3',
    required: false,
  })
  github_login_name?: string;

  @ApiProperty({
    description: '投稿した記事数',
    example: 42,
  })
  items_count: number;

  @ApiProperty({
    description: 'LinkedInのID',
    example: 'linkedin123',
    required: false,
  })
  linkedin_id?: string;

  @ApiProperty({
    description: '居住地',
    example: '東京',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: '所属組織',
    example: 'テック株式会社',
    required: false,
  })
  organization?: string;

  @ApiProperty({
    description: '永続的なID',
    example: 123456,
  })
  permanent_id: number;

  @ApiProperty({
    description: 'チーム限定かどうか',
    example: false,
  })
  team_only: boolean;

  @ApiProperty({
    description: 'Twitterのスクリーン名',
    example: 'sumihiro3',
    required: false,
  })
  twitter_screen_name?: string;

  @ApiProperty({
    description: 'ウェブサイトURL',
    example: 'https://example.com',
    required: false,
  })
  website_url?: string;
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
export class QiitaPostDto implements QiitaPostApiResponse {
  @ApiHideProperty()
  rendered_body: string;

  @ApiProperty({
    description: '記事本文（Markdown形式）',
    type: String,
    required: true,
    example: '記事の本文です',
  })
  body: string;

  @ApiProperty({
    description: 'リアクション数',
    type: Number,
    required: true,
    example: 15,
  })
  reactions_count: number;

  @ApiProperty({
    description: '非公開記事かどうか',
    type: Boolean,
    required: true,
    example: false,
  })
  private: boolean;

  @ApiProperty({
    description: '共同編集状態かどうか',
    type: Boolean,
    required: true,
    example: false,
  })
  coediting: boolean;

  @ApiProperty({
    description: 'グループ情報',
    type: Object,
    required: true,
  })
  group: QiitaGroupApiResponse;

  @ApiProperty({
    description: 'ページビュー数',
    type: Number,
    required: false,
    example: 1200,
  })
  page_views_count?: number;

  @ApiProperty({
    description: 'チームメンバーシップ情報',
    type: Object,
    required: true,
  })
  team_membership: QiitaTeamMembershipApiResponse;

  @ApiProperty({
    description: '組織のURL名',
    type: String,
    required: false,
    example: 'tech-company',
  })
  organization_url_name?: string;

  @ApiProperty({
    description: 'スライド形式の記事かどうか',
    type: Boolean,
    required: true,
    example: false,
  })
  slide: boolean;

  @ApiProperty({
    description: '記事の要約',
    type: String,
    required: false,
    example: 'この記事ではTypeScriptの基本的な使い方について解説します。',
  })
  summary?: string;

  @ApiProperty({
    description: '記事の一意なID',
    type: String,
    required: true,
    example: '1234567890abcdef1234',
  })
  id: string;

  @ApiProperty({
    description: '記事のタイトル',
    type: String,
    required: true,
    example: 'TypeScriptで型安全なコードを書く方法',
  })
  title: string;

  @ApiProperty({
    description: '記事のURL',
    type: String,
    required: true,
    example: 'https://qiita.com/sumihiro3/items/1234567890abcdef1234',
  })
  url: string;

  @ApiProperty({
    description: '記事が作成された日時',
    type: String,
    required: true,
    example: '2023-01-01T00:00:00+09:00',
  })
  created_at: string;

  @ApiProperty({
    description: '記事の最終更新日時',
    type: String,
    required: true,
    example: '2023-01-02T00:00:00+09:00',
  })
  updated_at: string;

  @ApiProperty({
    description: '記事投稿者',
    type: QiitaUserDto,
    required: true,
  })
  user: QiitaUserDto;

  @ApiProperty({
    description: 'この記事へのコメントの数',
    type: Number,
    required: true,
    example: 5,
  })
  comments_count: number;

  @ApiProperty({
    description: 'この記事へのいいねの数',
    type: Number,
    required: true,
    example: 10,
  })
  likes_count: number;

  @ApiProperty({
    description: 'この記事がストックされた数',
    type: Number,
    required: true,
    example: 20,
  })
  stocks_count: number;

  @ApiProperty({
    description: '記事に付いたタグ一覧',
    type: [QiitaTagDto],
    required: true,
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
  static fromEntity(
    entity: QiitaPostsSearchResult,
  ): SearchQiitaPostsResponseDto {
    const dto = new SearchQiitaPostsResponseDto();
    dto.posts = entity.posts;
    dto.totalCount = entity.totalCount;
    dto.page = entity.page;
    dto.perPage = entity.perPage;
    return dto;
  }
}
