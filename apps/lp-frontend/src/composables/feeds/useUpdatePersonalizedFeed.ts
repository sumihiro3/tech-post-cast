import type { NuxtApp } from '#app';
import type {
  UpdatePersonalizedFeedRequestDto,
  UpdatePersonalizedFeedWithFiltersResponseDto,
} from '@/api';
import { ApiErrorHandler } from '@/utils/error-handler';

/**
 * パーソナライズフィードを更新する
 * @param app NuxtApp
 * @param feedId パーソナライズフィードID
 * @param requestData 更新リクエストデータ
 * @returns 更新されたパーソナライズフィード
 * @throws HttpError API呼び出しで発生したエラー（具体的なHTTPエラー型に変換済み）
 */
export const useUpdatePersonalizedFeed = async (
  app: NuxtApp,
  feedId: string,
  requestData: UpdatePersonalizedFeedRequestDto,
): Promise<UpdatePersonalizedFeedWithFiltersResponseDto> => {
  console.log(`useUpdatePersonalizedFeed called`, { feedId, requestData });
  try {
    // バックエンドAPIを呼び出す
    const response = await app.$personalizedFeedApi.updatePersonalizedFeed(feedId, requestData);
    const result = response.data;
    console.log(`updatePersonalizedFeed API response`, { result });
    return result;
  } catch (error: unknown) {
    console.error(`useUpdatePersonalizedFeed error`, error);
    // エラーを適切なHTTPエラー型に変換して再スロー
    throw ApiErrorHandler.handleApiError(error);
  }
};
