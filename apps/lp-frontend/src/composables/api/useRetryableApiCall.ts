/**
 * リトライ機能付きAPI呼び出し用composable
 */

import { useEnhancedErrorHandler } from '@/composables/error-handling/useEnhancedErrorHandler';
import { ref, type Ref } from 'vue';

export interface RetryOptions {
  /** 最大リトライ回数 */
  maxRetries?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** 指数バックオフを使用するか */
  exponentialBackoff?: boolean;
  /** リトライ対象のエラーコード */
  retryableStatusCodes?: number[];
  /** リトライ前のコールバック */
  onRetry?: (attempt: number, error: unknown) => void;
}

export interface UseRetryableApiCallReturn<T> {
  /** API呼び出し実行中フラグ */
  isLoading: Ref<boolean>;
  /** 現在のリトライ回数 */
  retryCount: Ref<number>;
  /** エラー情報 */
  error: Ref<unknown>;
  /** API呼び出し実行 */
  execute: (apiCall: () => Promise<T>, options?: RetryOptions) => Promise<T>;
  /** 実行をキャンセル */
  cancel: () => void;
  /** 状態をリセット */
  reset: () => void;
}

/**
 * リトライ機能付きAPI呼び出し用composable
 */
export const useRetryableApiCall = <T>(): UseRetryableApiCallReturn<T> => {
  const errorHandler = useEnhancedErrorHandler();

  const isLoading = ref(false);
  const retryCount = ref(0);
  const error = ref<unknown>(null);

  let abortController: AbortController | null = null;

  /**
   * デフォルトのリトライオプション
   */
  const defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    onRetry: () => {},
  };

  /**
   * エラーがリトライ対象かどうかを判定
   */
  const isRetryableError = (err: unknown, retryableStatusCodes: number[]): boolean => {
    // ネットワークエラー
    if (
      err instanceof Error &&
      (err.message.includes('fetch') ||
        err.message.includes('network') ||
        err.message.includes('timeout'))
    ) {
      return true;
    }

    // HTTPエラー
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { status?: number } }).response;
      if (response?.status && retryableStatusCodes.includes(response.status)) {
        return true;
      }
    }

    return false;
  };

  /**
   * リトライ間隔を計算
   */
  const calculateDelay = (
    attempt: number,
    baseDelay: number,
    exponentialBackoff: boolean,
  ): number => {
    if (exponentialBackoff) {
      return baseDelay * Math.pow(2, attempt - 1);
    }
    return baseDelay;
  };

  /**
   * 待機処理（キャンセル可能）
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, ms);

      if (abortController) {
        abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Operation cancelled'));
        });
      }
    });
  };

  /**
   * API呼び出し実行
   */
  const execute = async (apiCall: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
    const opts = { ...defaultOptions, ...options };

    // 状態をリセット
    isLoading.value = true;
    retryCount.value = 0;
    error.value = null;

    // AbortControllerを作成
    abortController = new AbortController();

    let lastError: unknown;

    for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
      try {
        // キャンセルチェック
        if (abortController.signal.aborted) {
          throw new Error('Operation cancelled');
        }

        const result = await apiCall();

        // 成功した場合
        isLoading.value = false;
        return result;
      } catch (err) {
        lastError = err;
        retryCount.value = attempt - 1;

        // 最後の試行の場合はエラーを投げる
        if (attempt > opts.maxRetries) {
          break;
        }

        // リトライ対象のエラーかチェック
        if (!isRetryableError(err, opts.retryableStatusCodes)) {
          break;
        }

        // リトライコールバック実行
        opts.onRetry(attempt, err);

        // 待機
        const delayMs = calculateDelay(attempt, opts.retryDelay, opts.exponentialBackoff);
        await delay(delayMs);
      }
    }

    // エラーを設定
    error.value = lastError;
    isLoading.value = false;

    // エラーハンドラーで処理
    errorHandler.handleError(lastError, 'API呼び出し');

    throw lastError;
  };

  /**
   * 実行をキャンセル
   */
  const cancel = (): void => {
    if (abortController) {
      abortController.abort();
    }
    isLoading.value = false;
  };

  /**
   * 状態をリセット
   */
  const reset = (): void => {
    isLoading.value = false;
    retryCount.value = 0;
    error.value = null;
    abortController = null;
  };

  return {
    isLoading,
    retryCount,
    error,
    execute,
    cancel,
    reset,
  };
};
