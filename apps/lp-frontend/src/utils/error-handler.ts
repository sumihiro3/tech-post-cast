import type { ApiError, ApiErrorResponse } from '@/types/errors';
import { HttpError, ValidationError, createErrorFromApiResponse } from '@/types/http-errors';

/**
 * API エラーを処理するクラス
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ApiErrorHandler {
  /**
   * API エラーを適切なHTTPエラーに変換する
   */
  static handleApiError(error: unknown): Error {
    // エラーがない場合は汎用エラー
    if (!error) {
      return new Error('不明なエラーが発生しました');
    }

    // すでにHTTPエラーの場合はそのまま返す
    if (error instanceof HttpError) {
      return error;
    }

    const apiError = error as ApiError;

    // Axiosエラーの場合
    if (apiError.isAxiosError && apiError.response) {
      const { status } = apiError.response;
      const errorData = apiError.response.data as ApiErrorResponse;

      // APIレスポンスからHTTPエラーを作成
      return createErrorFromApiResponse(status, errorData);
    }

    // 通常のエラーの場合はそのまま返す
    if (error instanceof Error) {
      return error;
    }

    // それ以外の場合は汎用エラー
    return new Error('不明なエラーが発生しました');
  }

  /**
   * エラーメッセージをユーザーフレンドリーな形式で取得する
   */
  static getErrorMessage(error: unknown): string {
    const processedError = this.handleApiError(error);

    // ValidationErrorの場合は全てのエラーメッセージを取得
    if (processedError instanceof ValidationError) {
      return processedError.getAllErrorMessages();
    }

    // 通常のエラーの場合はメッセージを返す
    return processedError.message;
  }
}
