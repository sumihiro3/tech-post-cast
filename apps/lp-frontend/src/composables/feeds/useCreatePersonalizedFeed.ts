import type { NuxtApp } from '#app';
import type {
  CreatePersonalizedFeedRequestDto,
  CreatePersonalizedFeedWithFiltersResponseDto,
} from '@/api';
import { ApiErrorHandler } from '@/utils/error-handler';

/**
 * パーソナライズフィードを作成する
 * @param app NuxtApp
 * @param requestData 作成リクエストデータ
 * @returns 作成されたパーソナライズフィード
 */
export const useCreatePersonalizedFeed = async (
  app: NuxtApp,
  requestData: CreatePersonalizedFeedRequestDto,
): Promise<CreatePersonalizedFeedWithFiltersResponseDto> => {
  console.log(`useCreatePersonalizedFeed called`, { requestData });
  try {
    // バックエンドAPIを呼び出す
    const response = await app.$personalizedFeedApi.createPersonalizedFeed(requestData);
    const result = response.data;
    console.log(`createPersonalizedFeed API response`, { result });
    return result;
  } catch (error) {
    console.error(`useCreatePersonalizedFeed error`, error);
    // エラーを適切なHTTPエラー型に変換して再スロー
    throw ApiErrorHandler.handleApiError(error);
  }
};
