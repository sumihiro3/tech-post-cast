import type { NuxtApp } from '#app';
import type { GetPersonalizedFeedsResponseDto } from '@/api';

/**
 * パーソナライズフィードを取得する
 * @param app NuxtApp
 * @param userId ユーザーID
 * @returns パーソナライズフィードの配列
 */
export const useGetPersonalizedFeeds = async (
  app: NuxtApp,
  userId: string,
): Promise<GetPersonalizedFeedsResponseDto> => {
  console.log(`useGetPersonalizedFeeds called`, { userId });
  try {
    // バックエンドAPIを呼び出す
    const response = await app.$personalizedFeedApi.getPersonalizedFeeds();
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
