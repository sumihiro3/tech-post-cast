import type { NuxtApp } from '#app';
import type { GetPersonalizedFeedWithFiltersResponseDto } from '@/api';

/**
 * フィルター情報付きのパーソナライズフィードを取得する
 * @param app NuxtApp
 * @param userId ユーザーID
 * @param feedId フィードID
 * @returns フィルター情報付きのパーソナライズフィード
 */
export const useGetPersonalizedFeedWithFilters = async (
  app: NuxtApp,
  userId: string,
  feedId: string,
): Promise<GetPersonalizedFeedWithFiltersResponseDto> => {
  console.log(`useGetPersonalizedFeedWithFilters called`, { userId, feedId });

  try {
    // バックエンドAPIを呼び出す
    const response = await app.$personalizedFeedApi.getPersonalizedFeed(feedId);
    const result = response.data;
    console.log(`getPersonalizedFeed API response`, { result });
    return result;
  } catch (error) {
    console.error(`useGetPersonalizedFeedWithFilters error`, error);
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    throw error;
  }
};
