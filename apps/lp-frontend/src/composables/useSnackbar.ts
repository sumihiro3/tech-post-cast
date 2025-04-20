import { ref } from 'vue';

// Snackbarのタイプ
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

// Snackbarの設定
export interface SnackbarOptions {
  text: string;
  type: SnackbarType;
  timeout?: number;
  position?: string;
}

// デフォルト設定
const DEFAULT_OPTIONS: Partial<SnackbarOptions> = {
  timeout: 10 * 1000,
  position: 'top', // 上部に表示するよう変更
  type: 'info',
};

// クライアントサイドかどうかをチェック
const isClient = typeof window !== 'undefined';

// Snackbarの状態を管理する
export const useSnackbar = () => {
  // SSRとSSGでは空のオブジェクトを返す
  if (!isClient) {
    return {
      isVisible: ref(false),
      text: ref(''),
      type: ref<SnackbarType>('info'),
      timeout: ref(DEFAULT_OPTIONS.timeout),
      position: ref(DEFAULT_OPTIONS.position),
      show: () => {},
      close: () => {},
      showSuccess: () => {},
      showError: () => {},
      showInfo: () => {},
      showWarning: () => {},
    };
  }

  // 表示状態
  const isVisible = ref(false);
  // Snackbarのテキスト
  const text = ref('');
  // Snackbarのタイプ（success, error, info, warning）
  const type = ref<SnackbarType>('info');
  // 表示時間（ミリ秒）
  const timeout = ref(DEFAULT_OPTIONS.timeout);
  // 表示位置
  const position = ref(DEFAULT_OPTIONS.position);

  // Snackbarを表示する
  const show = (options: SnackbarOptions) => {
    text.value = options.text;
    type.value = options.type || (DEFAULT_OPTIONS.type as SnackbarType);
    timeout.value = options.timeout || DEFAULT_OPTIONS.timeout;
    position.value = options.position || DEFAULT_OPTIONS.position;
    isVisible.value = true;
  };

  // Snackbarを閉じる
  const close = () => {
    isVisible.value = false;
  };

  // 成功メッセージを表示
  const showSuccess = (message: string, options?: Partial<SnackbarOptions>) => {
    show({
      text: message,
      type: 'success',
      ...options,
    });
  };

  // エラーメッセージを表示
  const showError = (message: string, options?: Partial<SnackbarOptions>) => {
    show({
      text: message,
      type: 'error',
      ...options,
    });
  };

  // 情報メッセージを表示
  const showInfo = (message: string, options?: Partial<SnackbarOptions>) => {
    show({
      text: message,
      type: 'info',
      ...options,
    });
  };

  // 警告メッセージを表示
  const showWarning = (message: string, options?: Partial<SnackbarOptions>) => {
    show({
      text: message,
      type: 'warning',
      ...options,
    });
  };

  return {
    isVisible,
    text,
    type,
    timeout,
    position,
    show,
    close,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};

// グローバルな状態を作成
export const snackbar = useSnackbar();
