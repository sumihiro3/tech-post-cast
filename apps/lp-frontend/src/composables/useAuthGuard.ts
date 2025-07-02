/**
 * 認証ガード用のcomposable
 *
 * 統一された認証状態チェックとエラーハンドリングを提供します。
 * ローカル環境とCloudflare Pages環境での認証初期化遅延に対応します。
 */

import { useUIState } from './useUIState';

/**
 * 認証状態の結果を表すインターフェース
 */
export interface AuthResult {
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** ユーザーID（認証済みの場合） */
  userId: string | null;
  /** エラー情報（エラーが発生した場合） */
  error: AuthError | null;
  /** ローディング中かどうか */
  isLoading: boolean;
}

/**
 * 認証エラーの詳細情報を表すインターフェース
 */
export interface AuthError {
  /** エラーコード */
  code: 'INITIALIZATION_TIMEOUT' | 'INITIALIZATION_FAILED' | 'AUTHENTICATION_REQUIRED';
  /** エラーメッセージ */
  message: string;
  /** 元のエラーオブジェクト（存在する場合） */
  originalError?: unknown;
}

/**
 * 認証ガードのオプション設定を表すインターフェース
 */
export interface AuthGuardOptions {
  /** 認証初期化の最大待機時間（ミリ秒） */
  maxWaitTime?: number;
  /** ポーリング間隔（ミリ秒） */
  pollInterval?: number;
  /** ローディング表示を行うかどうか */
  showLoading?: boolean;
  /** タイムアウト時のエラーメッセージを表示するかどうか */
  showError?: boolean;
}

/**
 * 認証ガードの戻り値を表すインターフェース
 */
interface UseAuthGuardReturn {
  /** 認証状態が初期化されるまで待機 */
  waitForAuth: (options?: AuthGuardOptions) => Promise<AuthResult>;
  /** 認証が必要なページでの認証チェック */
  ensureAuthenticated: (options?: AuthGuardOptions) => Promise<AuthResult>;
  /** 現在の認証状態を即座に取得（初期化を待機しない） */
  getCurrentAuthState: () => AuthResult;
  /** 認証状態の変化を監視 */
  watchAuthState: (callback: (result: AuthResult) => void) => void;
}

export const useAuthGuard = (): UseAuthGuardReturn => {
  const { showLoading, hideLoading, showError } = useUIState();

  /**
   * 認証状態が初期化されるまで待機
   */
  const waitForAuth = async (options: AuthGuardOptions = {}): Promise<AuthResult> => {
    const {
      maxWaitTime = 10000, // 10秒に延長
      pollInterval = 100,
      showLoading: shouldShowLoading = false,
      showError: shouldShowError = true,
    } = options;

    const { userId, isLoaded } = useAuth();

    // 既に初期化されている場合は即座に結果を返す
    if (isLoaded.value) {
      return {
        isAuthenticated: !!userId.value,
        userId: userId.value,
        error: null,
        isLoading: false,
      };
    }

    // ローディング表示
    if (shouldShowLoading) {
      showLoading({
        message: '認証状態を確認中...',
        overlay: true,
      });
    }

    let attempts = 0;
    const maxAttempts = Math.floor(maxWaitTime / pollInterval);

    try {
      while (!isLoaded.value && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
      }

      // ローディング非表示
      if (shouldShowLoading) {
        hideLoading();
      }

      // 初期化がタイムアウトした場合
      if (!isLoaded.value) {
        const error: AuthError = {
          code: 'INITIALIZATION_TIMEOUT',
          message: `認証の初期化がタイムアウトしました (${maxWaitTime}ms)`,
        };

        if (shouldShowError) {
          showError(error.message, {
            title: '認証エラー',
            autoHideDelay: 5000,
          });
        }

        console.warn('Auth initialization timeout:', {
          attempts,
          maxAttempts,
          maxWaitTime,
          pollInterval,
        });

        return {
          isAuthenticated: false,
          userId: null,
          error,
          isLoading: false,
        };
      }

      // 初期化完了
      console.log('Auth initialization completed:', {
        isLoaded: isLoaded.value,
        userId: userId.value,
        attempts,
        timeElapsed: attempts * pollInterval,
      });

      return {
        isAuthenticated: !!userId.value,
        userId: userId.value,
        error: null,
        isLoading: false,
      };
    } catch (originalError) {
      // ローディング非表示
      if (shouldShowLoading) {
        hideLoading();
      }

      const error: AuthError = {
        code: 'INITIALIZATION_FAILED',
        message: '認証の初期化に失敗しました',
        originalError,
      };

      if (shouldShowError) {
        showError(error.message, {
          title: '認証エラー',
          autoHideDelay: 5000,
        });
      }

      console.error('Auth initialization failed:', originalError);

      return {
        isAuthenticated: false,
        userId: null,
        error,
        isLoading: false,
      };
    }
  };

  /**
   * 認証が必要なページでの認証チェック
   */
  const ensureAuthenticated = async (options: AuthGuardOptions = {}): Promise<AuthResult> => {
    const result = await waitForAuth(options);

    if (result.error) {
      return result;
    }

    if (!result.isAuthenticated) {
      const error: AuthError = {
        code: 'AUTHENTICATION_REQUIRED',
        message: '認証が必要です',
      };

      if (options.showError !== false) {
        showError(error.message, {
          title: 'アクセス拒否',
          autoHideDelay: 3000,
        });
      }

      return {
        ...result,
        error,
      };
    }

    return result;
  };

  /**
   * 現在の認証状態を即座に取得（初期化を待機しない）
   */
  const getCurrentAuthState = (): AuthResult => {
    const { userId, isLoaded } = useAuth();

    if (!isLoaded.value) {
      return {
        isAuthenticated: false,
        userId: null,
        error: null,
        isLoading: true,
      };
    }

    return {
      isAuthenticated: !!userId.value,
      userId: userId.value,
      error: null,
      isLoading: false,
    };
  };

  /**
   * 認証状態の変化を監視
   */
  const watchAuthState = (callback: (result: AuthResult) => void): void => {
    const { userId, isLoaded } = useAuth();

    watch([userId, isLoaded], () => {
      callback(getCurrentAuthState());
    }, { immediate: true });
  };

  return {
    waitForAuth,
    ensureAuthenticated,
    getCurrentAuthState,
    watchAuthState,
  };
};
