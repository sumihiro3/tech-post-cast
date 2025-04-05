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

  // URLSearchParamsを使用してクエリパラメータを構築
  // const params = new URLSearchParams();
  // if (authors && authors.length > 0) {
  //   authors.forEach((author) => params.append('authors', author));
  // }
  // if (tags && tags.length > 0) {
  //   tags.forEach((tag) => params.append('tags', tag));
  // }
  // if (minPublishedAt) {
  //   params.append('minPublishedAt', minPublishedAt);
  // }
  const authorsList = authors ? [authors.join(',')] : [];
  const tagsList = tags ? [tags.join(',')] : [];

  // バックエンドAPIを呼び出す
  const response = await app.$qiitaPostApi.searchQiitaPosts(authorsList, tagsList, undefined);
  const result = response.data;
  console.log(`Qiita API response`, { result });
  return result;

  //   await $fetch<{ posts: IQiitaPostApiResponse[] }>(
  //   `http://localhost:3001/qiita-posts/search?${params.toString()}`,
  //   {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   },
  // );
};
