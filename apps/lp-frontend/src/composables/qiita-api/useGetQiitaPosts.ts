import type { NuxtApp } from '#app';
import type { SearchQiitaPostsResponseDto } from '@/api';

/**
 * Qiita API で記事を取得する
 * @param authors 著者名の配列
 * @param tags タグの配列
 * @param minPublishedAt 公開日の最小値
 */
export const useGetQiitaPosts = async (
  app: NuxtApp,
  authors?: string[],
  tags?: string[],
  minPublishedAt?: string,
): Promise<SearchQiitaPostsResponseDto> => {
  console.log(`useGetQiitaPosts called`, { authors, tags, minPublishedAt });
  try {
    // 引数が未指定の場合は空の配列を渡す
    // authorsとtagsは配列なので、join(',')で文字列に変換して渡す
    const authorsList = authors ? [authors.join(',')] : [];
    const tagsList = tags ? [tags.join(',')] : [];

    // バックエンドAPIを呼び出す
    const response = await app.$qiitaPostApi.searchQiitaPosts(authorsList, tagsList, undefined);
    const result = response.data;
    console.log(`Qiita API response`, { result });
    return result;
  } catch (error) {
    console.error(`useGetQiitaPosts error`, error);
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    throw error;
  }
};
