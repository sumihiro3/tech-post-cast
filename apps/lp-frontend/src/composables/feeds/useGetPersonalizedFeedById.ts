import type { NuxtApp } from '#app';
import type { GetPersonalizedFeedWithFiltersResponseDto } from '@/api';
import { ApiErrorHandler } from '@/utils/error-handler';
import { useGetPersonalizedFeedWithFilters } from './useGetPersonalizedFeedWithFilters';

/**
 * IDを指定してパーソナライズフィードを取得する
 * @param app NuxtApp
 * @param userId ユーザーID
 * @param feedId フィードID
 * @returns フィルター情報付きのパーソナライズフィード
 * @throws HttpError API呼び出しで発生したエラー（具体的なHTTPエラー型に変換済み）
 */
export const useGetPersonalizedFeedById = async (
  app: NuxtApp,
  userId: string,
  feedId: string,
): Promise<GetPersonalizedFeedWithFiltersResponseDto> => {
  console.log(`useGetPersonalizedFeedById called`, { feedId });

  try {
    // 既存のcomposableを利用してフィードを取得
    const result = await useGetPersonalizedFeedWithFilters(app, userId, feedId);
    console.log(`useGetPersonalizedFeedById result`, { result });
    return result;
  } catch (error: unknown) {
    console.error(`useGetPersonalizedFeedById error`, error);
    // エラーを適切なHTTPエラー型に変換して再スロー
    throw ApiErrorHandler.handleApiError(error);
  }
};
