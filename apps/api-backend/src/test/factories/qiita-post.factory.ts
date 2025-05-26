import { QiitaPostApiResponse, QiitaPostsSearchResult } from '@domains/qiita-posts/qiita-posts.entity';

/**
 * Qiita記事のモックデータを作成するファクトリークラス
 */
export class QiitaPostFactory {
  /**
   * 単一のQiita記事モックデータを作成する
   * @param overrides 上書きするプロパティ
   * @returns QiitaPostApiResponse
   */
  static createQiitaPost(overrides: Partial<QiitaPostApiResponse> = {}): QiitaPostApiResponse {
    return {
      id: 'test-post-id',
      title: 'テスト記事タイトル',
      rendered_body: '<p>テスト記事本文</p>',
      body: 'テスト記事本文',
      url: 'https://qiita.com/test/items/test-post-id',
      created_at: '2023-01-01T00:00:00+09:00',
      updated_at: '2023-01-01T00:00:00+09:00',
      user: {
        id: 'test-user-id',
        followees_count: 0,
        followers_count: 0,
        items_count: 1,
        permanent_id: 1,
        profile_image_url: 'https://qiita.com/test/profile.png',
        team_only: false,
      },
      comments_count: 0,
      likes_count: 10,
      reactions_count: 0,
      stocks_count: 5,
      private: false,
      tags: [
        {
          name: 'test-tag',
          versions: [],
        },
      ],
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
  }

  /**
   * 複数のQiita記事モックデータを作成する
   * @param count 作成する記事数
   * @param overrides 上書きするプロパティ
   * @returns QiitaPostApiResponse[]
   */
  static createQiitaPosts(
    count: number,
    overrides: Partial<QiitaPostApiResponse> = {},
  ): QiitaPostApiResponse[] {
    return Array.from({ length: count }, (_, index) =>
      this.createQiitaPost({
        id: `test-post-id-${index + 1}`,
        title: `テスト記事タイトル ${index + 1}`,
        ...overrides,
      }),
    );
  }

  /**
   * Qiita記事検索結果のモックデータを作成する
   * @param count 記事数
   * @param page ページ番号
   * @param perPage 1ページあたりの件数
   * @param totalCount 総件数
   * @param overrides 上書きするプロパティ
   * @returns QiitaPostsSearchResult
   */
  static createQiitaPostsSearchResult(
    count: number = 10,
    page: number = 1,
    perPage: number = 20,
    totalCount: number = 100,
    overrides: Partial<QiitaPostApiResponse> = {},
  ): QiitaPostsSearchResult {
    return {
      posts: this.createQiitaPosts(count, overrides),
      totalCount,
      page,
      perPage,
    };
  }
}
