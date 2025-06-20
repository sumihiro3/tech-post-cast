import { QiitaPost } from '@prisma/client';
import {
  QiitaPostApiResponse,
  QiitaTagApiResponse,
  QiitaUserApiResponse,
} from '@/domains/qiita-posts/qiita-posts.entity';

/**
 * Qiita記事のモックデータを作成するファクトリークラス
 */
export class QiitaPostFactory {
  /**
   * 単一のQiita記事モックデータを作成する（Prismaモデル）
   * @param overrides 上書きするプロパティ
   * @returns QiitaPost
   */
  static createQiitaPostModel(overrides: Partial<QiitaPost> = {}): QiitaPost {
    return {
      id: 'test-post-id',
      title: 'テスト記事タイトル',
      body: 'テスト記事本文',
      url: 'https://qiita.com/test/items/test-post-id',
      createdAt: new Date('2023-01-01T00:00:00+09:00'),
      updatedAt: new Date('2023-01-01T00:00:00+09:00'),
      authorName: 'テストユーザー',
      authorId: 'test-user-id',
      likesCount: 10,
      stocksCount: 5,
      private: false,
      refreshedAt: new Date('2023-01-01T00:00:00+09:00'),
      summary: 'テスト記事の要約',
      headlineTopicProgramId: null,
      ...overrides,
    };
  }

  /**
   * 複数のQiita記事モックデータを作成する（Prismaモデル）
   * @param count 作成する記事数
   * @param overrides 上書きするプロパティ
   * @returns QiitaPost[]
   */
  static createQiitaPostModels(
    count: number,
    overrides: Partial<QiitaPost> = {},
  ): QiitaPost[] {
    return Array.from({ length: count }, (_, index) =>
      this.createQiitaPostModel({
        id: `test-post-id-${index + 1}`,
        title: `テスト記事タイトル ${index + 1}`,
        ...overrides,
      }),
    );
  }

  /**
   * Qiita APIレスポンスのユーザー情報を作成する
   * @param overrides 上書きするプロパティ
   * @returns QiitaUserApiResponse
   */
  static createQiitaUser(
    overrides: Partial<QiitaUserApiResponse> = {},
  ): QiitaUserApiResponse {
    return {
      id: 'test-user-id',
      followees_count: 0,
      followers_count: 0,
      items_count: 1,
      permanent_id: 1,
      profile_image_url: 'https://qiita.com/test/profile.png',
      team_only: false,
      ...overrides,
    };
  }

  /**
   * Qiita APIレスポンスのタグ情報を作成する
   * @param name タグ名
   * @param versions バージョン情報
   * @returns QiitaTagApiResponse
   */
  static createQiitaTag(
    name: string = 'test-tag',
    versions: string[] = [],
  ): QiitaTagApiResponse {
    return {
      name,
      versions,
    };
  }

  /**
   * 単一のQiita記事APIレスポンスモックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns QiitaPostApiResponse
   */
  static createQiitaPostApiResponse(
    overrides: Partial<QiitaPostApiResponse> = {},
  ): QiitaPostApiResponse {
    const response = {
      id: 'test-post-id',
      title: 'テスト記事タイトル',
      rendered_body: '<p>テスト記事本文</p>',
      body: 'テスト記事本文',
      url: 'https://qiita.com/test/items/test-post-id',
      created_at: '2023-01-01T00:00:00+09:00',
      updated_at: '2023-01-01T00:00:00+09:00',
      user: this.createQiitaUser(),
      comments_count: 0,
      likes_count: 10,
      reactions_count: 0,
      stocks_count: 5,
      private: false,
      tags: [this.createQiitaTag()],
      coediting: false,
      group: {
        created_at: '2023-01-01T00:00:00+09:00',
        description: 'テストグループ',
        name: 'テストグループ',
        private: false,
        updated_at: '2023-01-01T00:00:00+09:00',
        url_name: 'test-group',
      },
      team_membership: {
        name: 'テストユーザー',
      },
      slide: false,
      ...overrides,
    };

    return new QiitaPostApiResponse(response);
  }

  /**
   * 複数のQiita記事APIレスポンスモックデータを作成する
   * @param count 作成する記事数
   * @param overrides 上書きするプロパティ
   * @returns QiitaPostApiResponse[]
   */
  static createQiitaPostApiResponses(
    count: number,
    overrides: Partial<QiitaPostApiResponse> = {},
  ): QiitaPostApiResponse[] {
    return Array.from({ length: count }, (_, index) =>
      this.createQiitaPostApiResponse({
        id: `test-post-id-${index + 1}`,
        title: `テスト記事タイトル ${index + 1}`,
        ...overrides,
      }),
    );
  }
}
