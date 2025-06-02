import type { NuxtApp } from '#app';
import type { GetPersonalizedFeedsWithFiltersResponseDto } from '@/api';

/**
 * パーソナライズフィードを取得する
 * @param app NuxtApp
 * @param userId ユーザーID
 * @returns フィルター情報を含むパーソナライズフィードの配列
 */
export const useGetPersonalizedFeeds = async (
  app: NuxtApp,
  userId: string,
): Promise<GetPersonalizedFeedsWithFiltersResponseDto> => {
  console.log(`useGetPersonalizedFeeds called`, { userId });
  try {
    // バックエンドAPIを呼び出す（常にフィルター情報付き）
    const response = await app.$personalizedFeedApi.getPersonalizedFeeds(
      undefined, // page
      undefined, // perPage
    );
    const result = response.data;
    console.log(`getPersonalizedFeeds API response`, { result });
    return result;
  } catch (error) {
    console.error(`useGetPersonalizedFeeds error`, error);
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    throw error;
  }
};
