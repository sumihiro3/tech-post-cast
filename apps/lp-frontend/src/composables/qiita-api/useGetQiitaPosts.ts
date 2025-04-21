import type { NuxtApp } from '#app';
import type { SearchQiitaPostsResponseDto } from '@/api';
import { addDays } from 'date-fns';

/**
 * Qiita API で記事を取得する
 * @param authors 著者名の配列
 * @param tags タグの配列
 * @param daysAgo 何日前までの記事を取得するか（-1はすべて）
 */
export const useGetQiitaPosts = async (
  app: NuxtApp,
  authors?: string[],
  tags?: string[],
  daysAgo?: number,
): Promise<SearchQiitaPostsResponseDto> => {
  console.log(`useGetQiitaPosts called`, { authors, tags, daysAgo });
  try {
    // 引数が未指定の場合は空の配列を渡す
    // authorsとtagsは配列なので、join(',')で文字列に変換して渡す
    const authorsList = authors ? [authors.join(',')] : [];
    const tagsList = tags ? [tags.join(',')] : [];

    // daysAgoから日付文字列を生成（YYYY-MM-DD形式）
    // -1は「すべて」なのでundefinedにする
    let minPublishedAt: string | undefined = undefined;
    if (daysAgo !== undefined && daysAgo > 0) {
      const date = addDays(new Date(), -daysAgo);
      minPublishedAt = date.toISOString().split('T')[0]; // YYYY-MM-DD形式に変換
    }

    // バックエンドAPIを呼び出す
    const response = await app.$qiitaPostApi.searchQiitaPosts(
      authorsList,
      tagsList,
      minPublishedAt,
    );
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
