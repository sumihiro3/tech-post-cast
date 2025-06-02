/**
 * 強化されたエラーハンドリング用composable
 */

import { useUIState } from '@/composables/useUIState';
import { HttpError, ValidationError } from '@/types/http-errors';
import { ref, type Ref } from 'vue';

export interface ErrorInfo {
  /** エラーの種類 */
  type: 'validation' | 'network' | 'server' | 'client' | 'unknown';
  /** エラーメッセージ */
  message: string;
  /** 詳細なエラー情報 */
  details?: string;
  /** エラーコード */
  code?: string | number;
  /** 回復可能かどうか */
  recoverable: boolean;
  /** 推奨される対処法 */
  suggestedAction?: string;
  /** 元のエラーオブジェクト */
  originalError: unknown;
  /** 発生時刻 */
  timestamp: Date;
}

export interface UseEnhancedErrorHandlerReturn {
  /** 現在のエラー情報 */
  currentError: Ref<ErrorInfo | null>;
  /** エラー履歴 */
  errorHistory: Ref<ErrorInfo[]>;
  /** エラーを処理する */
  handleError: (error: unknown, context?: string) => ErrorInfo;
  /** エラーをクリアする */
  clearError: () => void;
  /** エラー履歴をクリアする */
  clearErrorHistory: () => void;
  /** 回復処理を実行する */
  attemptRecovery: (errorInfo: ErrorInfo) => Promise<boolean>;
  /** ユーザーフレンドリーなエラーメッセージを取得 */
  getUserFriendlyMessage: (error: unknown) => string;
}

/**
 * 強化されたエラーハンドリング用composable
 */
export const useEnhancedErrorHandler = (): UseEnhancedErrorHandlerReturn => {
  const ui = useUIState();

  const currentError = ref<ErrorInfo | null>(null);
  const errorHistory = ref<ErrorInfo[]>([]);

  /**
   * エラーを分析してErrorInfoに変換
   */
  const analyzeError = (error: unknown, context?: string): ErrorInfo => {
    const timestamp = new Date();
    let type: ErrorInfo['type'] = 'unknown';
    let message = 'エラーが発生しました';
    let details: string | undefined;
    let code: string | number | undefined;
    let recoverable = false;
    let suggestedAction: string | undefined;

    if (error instanceof ValidationError) {
      type = 'validation';
      message = error.message;
      details = error.getAllErrorMessages();
      code = error.statusCode;
      recoverable = true;
      suggestedAction = '入力内容を確認して修正してください';
    } else if (error instanceof HttpError) {
      code = error.statusCode;

      switch (error.statusCode) {
        case 400:
          type = 'client';
          message = 'リクエストが不正です';
          recoverable = true;
          suggestedAction = '入力内容を確認してください';
          break;
        case 401:
          type = 'client';
          message = '認証エラーが発生しました';
          recoverable = true;
          suggestedAction = '再度ログインしてください';
          break;
        case 403:
          type = 'client';
          message = 'この操作を行う権限がありません';
          recoverable = false;
          suggestedAction = '管理者にお問い合わせください';
          break;
        case 404:
          type = 'client';
          message = 'リソースが見つかりませんでした';
          recoverable = true;
          suggestedAction = 'ページを更新するか、一覧画面から再度アクセスしてください';
          break;
        case 429:
          type = 'client';
          message = 'リクエストが多すぎます';
          recoverable = true;
          suggestedAction = 'しばらく時間をおいてから再試行してください';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          type = 'server';
          message = 'サーバーエラーが発生しました';
          recoverable = true;
          suggestedAction = 'しばらく時間をおいてから再試行してください';
          break;
        default:
          type = 'network';
          message = error.message;
          recoverable = true;
          suggestedAction = 'ネットワーク接続を確認してください';
      }
    } else if (error instanceof Error) {
      // ネットワークエラーの判定
      if (error.message.includes('fetch') || error.message.includes('network')) {
        type = 'network';
        message = 'ネットワークエラーが発生しました';
        recoverable = true;
        suggestedAction = 'インターネット接続を確認してください';
      } else {
        type = 'client';
        message = error.message;
        recoverable = true;
        suggestedAction = 'ページを更新してください';
      }
    } else if (typeof error === 'string') {
      type = 'client';
      message = error;
      recoverable = true;
    }

    // コンテキスト情報を追加
    if (context) {
      details = details ? `${context}: ${details}` : context;
    }

    return {
      type,
      message,
      details,
      code,
      recoverable,
      suggestedAction,
      originalError: error,
      timestamp,
    };
  };

  /**
   * エラーを処理する
   */
  const handleError = (error: unknown, context?: string): ErrorInfo => {
    const errorInfo = analyzeError(error, context);

    // 現在のエラーとして設定
    currentError.value = errorInfo;

    // 履歴に追加（最大50件まで保持）
    errorHistory.value.unshift(errorInfo);
    if (errorHistory.value.length > 50) {
      errorHistory.value = errorHistory.value.slice(0, 50);
    }

    // UIにエラーを表示
    const displayMessage = errorInfo.suggestedAction
      ? `${errorInfo.message}\n\n対処法: ${errorInfo.suggestedAction}`
      : errorInfo.message;

    ui.showError(displayMessage, {
      autoHideDelay: errorInfo.recoverable ? 8000 : 0, // 回復可能なエラーは8秒で自動消去
    });

    // コンソールにも詳細を出力
    console.error('Enhanced Error Handler:', {
      errorInfo,
      originalError: error,
      context,
    });

    return errorInfo;
  };

  /**
   * エラーをクリアする
   */
  const clearError = (): void => {
    currentError.value = null;
    ui.hideError();
  };

  /**
   * エラー履歴をクリアする
   */
  const clearErrorHistory = (): void => {
    errorHistory.value = [];
  };

  /**
   * 回復処理を実行する
   */
  const attemptRecovery = async (errorInfo: ErrorInfo): Promise<boolean> => {
    if (!errorInfo.recoverable) {
      return false;
    }

    try {
      switch (errorInfo.type) {
        case 'network':
          // ネットワーク接続テスト
          await fetch('/api/health', { method: 'HEAD' });
          ui.showSuccess('ネットワーク接続が回復しました');
          return true;

        case 'client':
          if (errorInfo.code === 401) {
            // 認証エラーの場合はログインページにリダイレクト
            await navigateTo('/login');
            return true;
          }
          break;

        case 'server':
          // サーバーエラーの場合は少し待ってから再試行
          await new Promise((resolve) => setTimeout(resolve, 2000));
          ui.showInfo('サーバーの回復を確認中...');
          return true;

        default:
          return false;
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }

    return false;
  };

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  const getUserFriendlyMessage = (error: unknown): string => {
    const errorInfo = analyzeError(error);
    return errorInfo.suggestedAction
      ? `${errorInfo.message} ${errorInfo.suggestedAction}`
      : errorInfo.message;
  };

  return {
    currentError,
    errorHistory,
    handleError,
    clearError,
    clearErrorHistory,
    attemptRecovery,
    getUserFriendlyMessage,
  };
};
