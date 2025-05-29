/**
 * UI状態管理用のcomposable
 *
 * アプリケーション全体のUI状態（ローディング、メッセージ表示など）を
 * 既存のuseSnackbarとuseProgressを活用して一元管理します。
 */

import type { Ref } from 'vue';
import { useProgress, type ProgressOptions } from './useProgress';
import { snackbar, type SnackbarOptions } from './useSnackbar';

interface LoadingOptions {
  /** ローディングメッセージ */
  message?: string;
  /** スピナーのサイズ */
  size?: number;
  /** オーバーレイ表示するかどうか */
  overlay?: boolean;
  /** スピナーの色 */
  color?: string;
}

interface MessageOptions {
  /** メッセージタイトル */
  title?: string;
  /** 自動で消去するまでの時間（ミリ秒）。0の場合は自動消去しない */
  autoHideDelay?: number;
  /** 表示位置 */
  position?: string;
}

interface UIStateReturn {
  // 状態（読み取り専用）
  loadingState: {
    isVisible: Ref<boolean>;
    text: Ref<string | undefined>;
    size: Ref<number | undefined>;
    overlay: Ref<boolean | undefined>;
    color: Ref<string | undefined>;
  };
  messageState: {
    isVisible: Ref<boolean>;
    text: Ref<string>;
    type: Ref<'success' | 'error' | 'info' | 'warning'>;
    timeout: Ref<number | undefined>;
    position: Ref<string | undefined>;
  };

  // ローディング制御
  showLoading: (options?: LoadingOptions) => void;
  hideLoading: () => void;

  // メッセージ制御
  showError: (message: string, options?: MessageOptions) => void;
  hideError: () => void;
  showSuccess: (message: string, options?: MessageOptions) => void;
  hideSuccess: () => void;
  showInfo: (message: string, options?: MessageOptions) => void;
  hideInfo: () => void;
  showWarning: (message: string, options?: MessageOptions) => void;
  hideWarning: () => void;
  hideAllMessages: () => void;

  // リセット
  resetUIState: () => void;

  // 既存のcomposableへの直接アクセス（必要に応じて）
  snackbar: typeof snackbar;
  progress: ReturnType<typeof useProgress>;
}

export const useUIState = (): UIStateReturn => {
  // 既存のcomposableを使用（snackbarはグローバルインスタンスを使用）
  const progress = useProgress();

  /**
   * ローディング状態を表示
   */
  const showLoading = (options: LoadingOptions = {}): void => {
    const progressOptions: ProgressOptions = {
      text: options.message || '処理中...',
      size: options.size || 70,
      overlay: options.overlay !== undefined ? options.overlay : true,
      color: options.color || 'primary',
      indeterminate: true,
    };
    progress.show(progressOptions);
  };

  /**
   * ローディング状態を非表示
   */
  const hideLoading = (): void => {
    progress.hide();
  };

  /**
   * エラーメッセージを表示
   */
  const showError = (message: string, options: MessageOptions = {}): void => {
    const snackbarOptions: SnackbarOptions = {
      text: options.title ? `${options.title}: ${message}` : message,
      type: 'error',
      timeout: options.autoHideDelay || 0,
      position: options.position,
    };
    snackbar.show(snackbarOptions);
  };

  /**
   * エラーメッセージを非表示
   */
  const hideError = (): void => {
    snackbar.close();
  };

  /**
   * 成功メッセージを表示
   */
  const showSuccess = (message: string, options: MessageOptions = {}): void => {
    const snackbarOptions: SnackbarOptions = {
      text: options.title ? `${options.title}: ${message}` : message,
      type: 'success',
      timeout: options.autoHideDelay !== undefined ? options.autoHideDelay : 3000,
      position: options.position,
    };
    snackbar.show(snackbarOptions);
  };

  /**
   * 成功メッセージを非表示
   */
  const hideSuccess = (): void => {
    snackbar.close();
  };

  /**
   * 情報メッセージを表示
   */
  const showInfo = (message: string, options: MessageOptions = {}): void => {
    const snackbarOptions: SnackbarOptions = {
      text: options.title ? `${options.title}: ${message}` : message,
      type: 'info',
      timeout: options.autoHideDelay || 0,
      position: options.position,
    };
    snackbar.show(snackbarOptions);
  };

  /**
   * 情報メッセージを非表示
   */
  const hideInfo = (): void => {
    snackbar.close();
  };

  /**
   * 警告メッセージを表示
   */
  const showWarning = (message: string, options: MessageOptions = {}): void => {
    const snackbarOptions: SnackbarOptions = {
      text: options.title ? `${options.title}: ${message}` : message,
      type: 'warning',
      timeout: options.autoHideDelay || 0,
      position: options.position,
    };
    snackbar.show(snackbarOptions);
  };

  /**
   * 警告メッセージを非表示
   */
  const hideWarning = (): void => {
    snackbar.close();
  };

  /**
   * 全てのメッセージを非表示
   */
  const hideAllMessages = (): void => {
    snackbar.close();
  };

  /**
   * 全てのUI状態をリセット
   */
  const resetUIState = (): void => {
    hideLoading();
    hideAllMessages();
  };

  return {
    // 状態（読み取り専用）
    loadingState: {
      isVisible: progress.isVisible,
      text: progress.text,
      size: progress.size,
      overlay: progress.overlay,
      color: progress.color,
    },
    messageState: {
      isVisible: snackbar.isVisible,
      text: snackbar.text,
      type: snackbar.type,
      timeout: snackbar.timeout,
      position: snackbar.position,
    },

    // ローディング制御
    showLoading,
    hideLoading,

    // メッセージ制御
    showError,
    hideError,
    showSuccess,
    hideSuccess,
    showInfo,
    hideInfo,
    showWarning,
    hideWarning,
    hideAllMessages,

    // リセット
    resetUIState,

    // 既存のcomposableへの直接アクセス（必要に応じて）
    snackbar,
    progress,
  };
};
