import { QiitaPostsSearchResult } from '@domains/qiita-posts/qiita-posts.entity';
import { SearchQiitaPostsResponseDto } from './search-qiita-posts.response.dto';
import { QiitaPostFactory } from '../../../test/factories/qiita-post.factory';
import { suppressLogOutput, restoreLogOutput } from '../../../test/helpers/logger.helper';

describe('SearchQiitaPostsResponseDto', () => {
  let logSpies: jest.SpyInstance[];

  beforeEach(() => {
    logSpies = suppressLogOutput();
  });

  afterEach(() => {
    restoreLogOutput(logSpies);
  });

  it('fromEntityメソッドが正しくDTOに変換できること', () => {
    // ファクトリーを使用してモックエンティティを作成
    const mockEntity = QiitaPostFactory.createQiitaPostsSearchResult(
      1, // 記事数
      2, // ページ番号
      20, // 1ページあたりの件数
      42, // 総件数
      {
        id: 'post-1',
        title: 'テスト記事',
        tags: [
          { name: 'JavaScript', versions: ['1.0'] },
          { name: 'TypeScript', versions: [] },
        ]
      }
    );

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
    expect(post.user.id).toBeDefined();
    expect(post.tags).toHaveLength(2);
    expect(post.tags[0].name).toBe('JavaScript');
  });

  it('空の配列でも正しく処理できること', () => {
    // ファクトリーを使用して記事が0件のエンティティを作成
    const emptyEntity = QiitaPostFactory.createQiitaPostsSearchResult(
      0, // 記事数
      1, // ページ番号
      20, // 1ページあたりの件数
      0 // 総件数
    );

    // DTOに変換
    const dto = SearchQiitaPostsResponseDto.fromEntity(emptyEntity);

    // 検証
    expect(dto.posts).toHaveLength(0);
    expect(dto.totalCount).toBe(0);
  });
});
