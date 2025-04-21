import type { NuxtApp } from '#app';
import type { DeletePersonalizedFeedResponseDto } from '@/api';
import { ApiErrorHandler } from '@/utils/error-handler';

/**
 * パーソナライズフィードを削除する
 * @param app NuxtApp
 * @param feedId パーソナライズフィードID
 * @returns 削除されたパーソナライズフィード
 * @throws HttpError API呼び出しで発生したエラー（具体的なHTTPエラー型に変換済み）
 */
export const useDeletePersonalizedFeed = async (
  app: NuxtApp,
  feedId: string,
): Promise<DeletePersonalizedFeedResponseDto> => {
  console.log(`useDeletePersonalizedFeed called`, { feedId });
  try {
    // バックエンドAPIを呼び出す
    const response = await app.$personalizedFeedApi.deletePersonalizedFeed(feedId);
    const result = response.data;
    console.log(`deletePersonalizedFeed API response`, { result });
    return result;
  } catch (error: unknown) {
    console.error(`useDeletePersonalizedFeed error`, error);
    // エラーを適切なHTTPエラー型に変換して再スロー
    throw ApiErrorHandler.handleApiError(error);
  }
};
