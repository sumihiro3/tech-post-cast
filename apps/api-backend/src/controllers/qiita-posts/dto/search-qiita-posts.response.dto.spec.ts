import { QiitaPostsSearchResult } from '@domains/qiita-posts/qiita-posts.entity';
import { SearchQiitaPostsResponseDto } from './search-qiita-posts.response.dto';

describe('SearchQiitaPostsResponseDto', () => {
  it('fromEntityメソッドが正しくDTOに変換できること', () => {
    // モックエンティティを作成
    const mockEntity: QiitaPostsSearchResult = {
      posts: [
        {
          id: 'post-1',
          title: 'テスト記事',
          url: 'https://qiita.com/test/items/post-1',
          created_at: '2023-01-01T00:00:00+09:00',
          updated_at: '2023-01-01T12:00:00+09:00',
          user: {
            id: 'user-1',
            name: 'テストユーザー',
            profile_image_url: 'https://example.com/image.png',
            followees_count: 20,
            followers_count: 30,
            items_count: 5,
            permanent_id: 12345,
            team_only: false,
          },
          comments_count: 5,
          likes_count: 10,
          stocks_count: 15,
          tags: [
            { name: 'JavaScript', versions: ['1.0'] },
            { name: 'TypeScript', versions: [] },
          ],
          rendered_body: '<p>テスト記事の本文</p>',
          body: 'テスト記事の本文',
          reactions_count: 3,
          private: false,
          coediting: false,
          group: null,
          team_membership: null,
          slide: false,
        },
      ],
      totalCount: 42,
      page: 2,
      perPage: 20,
    };

    // DTOに変換
    const dto = SearchQiitaPostsResponseDto.fromEntity(mockEntity);

    // 検証
    expect(dto).toBeInstanceOf(SearchQiitaPostsResponseDto);
    expect(dto.posts).toHaveLength(1);
    expect(dto.totalCount).toBe(42);
    expect(dto.page).toBe(2);
    expect(dto.perPage).toBe(20);

    // 記事の内容も確認
    const post = dto.posts[0];
    expect(post.id).toBe('post-1');
    expect(post.title).toBe('テスト記事');
    expect(post.user.id).toBe('user-1');
    expect(post.tags).toHaveLength(2);
    expect(post.tags[0].name).toBe('JavaScript');
  });

  it('空の配列でも正しく処理できること', () => {
    // 記事が0件のエンティティ
    const emptyEntity: QiitaPostsSearchResult = {
      posts: [],
      totalCount: 0,
      page: 1,
      perPage: 20,
    };

    // DTOに変換
    const dto = SearchQiitaPostsResponseDto.fromEntity(emptyEntity);

    // 検証
    expect(dto.posts).toHaveLength(0);
    expect(dto.totalCount).toBe(0);
  });
});
