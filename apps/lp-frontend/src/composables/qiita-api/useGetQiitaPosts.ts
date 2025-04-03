import type { IQiitaPostApiResponse } from '@/types';

/**
 * Qiita API で記事を取得する
 * @param authors 著者名の配列
 * @param tags タグの配列
 * @param minPublishedAt 公開日の最小値
*/
export const useGetQiitaPosts = async (authors?: string[], tags?: string[], minPublishedAt?: string): Promise<IQiitaPostApiResponse[]> => {
  console.log(`useGetQiitaPosts called`, { authors, tags, minPublishedAt });
  const queryUsers = authors && authors.length > 0 ? `user:${authors.join(',')}` : null;
  const queryTags = tags && tags.length > 0 ? `tag:${tags.join(',')}` : null;
  // const queryMinPublishedAt = minPublishedAt ?? null;
  // クエリを作成する（設定された条件があれば、それらを組み合わせる）
  const query = [queryUsers, queryTags].filter(Boolean).join('+');
  // TODO 公開日の最小値を追加する
  // TODO Backend API から Qiita API の結果を返すようにする（フロントから直接 Qiita API を実行しない）
  const url = `https://qiita.com/api/v2/items?page=1&per_page=100&query=${query}`;
  console.debug(`api request url: ${url}`);
  const response = await $fetch<IQiitaPostApiResponse[]>(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response ?? [];
};
