import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchQiitaPostsRequestDto } from './search-qiita-posts.request.dto';

describe('SearchQiitaPostsRequestDto', () => {
  it('有効なDTOはバリデーションエラーがないこと', async () => {
    // 有効なオブジェクトを作成
    const data = {
      authors: 'user1,user2',
      tags: 'tag1,tag2',
      minPublishedAt: '2023-01-01',
      page: '2',
      perPage: '30',
    };

    // オブジェクトをDTOインスタンスに変換
    const dto = plainToInstance(SearchQiitaPostsRequestDto, data);

    // バリデーション実行
    const errors = await validate(dto);

    // 検証
    expect(errors.length).toBe(0);
    expect(dto.authors).toEqual(['user1', 'user2']);
    expect(dto.tags).toEqual(['tag1', 'tag2']);
    expect(dto.minPublishedAt).toBeInstanceOf(Date);
    expect(dto.page).toBe(2);
    expect(dto.perPage).toBe(30);
  });

  it('各フィールドのデフォルト値が正しくセットされること', async () => {
    // 空のオブジェクトを作成
    const data = {};

    // オブジェクトをDTOインスタンスに変換
    const dto = plainToInstance(SearchQiitaPostsRequestDto, data);

    // バリデーション実行
    const errors = await validate(dto);

    // 検証
    expect(errors.length).toBe(0);
    expect(dto.authors).toBeUndefined();
    expect(dto.tags).toBeUndefined();
    expect(dto.minPublishedAt).toBeUndefined();
    expect(dto.page).toBe(1);
    expect(dto.perPage).toBe(20);
  });

  it('perPageの最大値を超えるとデフォルト最大値にセットされること', async () => {
    // perPageが上限を超えるオブジェクトを作成
    const data = {
      perPage: '200',
    };

    // オブジェクトをDTOインスタンスに変換
    const dto = plainToInstance(SearchQiitaPostsRequestDto, data);

    // バリデーション実行
    const errors = await validate(dto);

    // 検証
    expect(errors.length).toBe(0);
    expect(dto.perPage).toBe(100); // 最大値は100
  });

  it('無効な日付形式の場合はバリデーションエラーが発生すること', async () => {
    // 無効な日付を含むオブジェクトを作成
    const data = {
      minPublishedAt: 'invalid-date',
    };

    // オブジェクトをDTOインスタンスに変換
    const dto = plainToInstance(SearchQiitaPostsRequestDto, data);

    // バリデーション実行
    const errors = await validate(dto);

    // 検証
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('minPublishedAt');
  });
});
