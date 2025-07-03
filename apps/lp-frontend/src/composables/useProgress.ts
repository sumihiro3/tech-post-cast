import type { Ref } from 'vue';
import { ref } from 'vue';

/**
 * プログレスサークルの設定
 */
export interface ProgressOptions {
  text?: string;
  color?: string;
  size?: number;
  indeterminate?: boolean;
  overlay?: boolean;
}

/**
 * useProgressの戻り値型
 */
interface ProgressReturn {
  isVisible: Ref<boolean>;
  text: Ref<string | undefined>;
  color: Ref<string | undefined>;
  size: Ref<number | undefined>;
  indeterminate: Ref<boolean | undefined>;
  overlay: Ref<boolean | undefined>;
  show: (options?: ProgressOptions) => void;
  hide: () => void;
}

// デフォルト設定
const DEFAULT_OPTIONS: ProgressOptions = {
  text: '処理中...',
  color: 'primary',
  size: 70,
  indeterminate: true,
  overlay: true,
};

// クライアントサイドかどうかをチェック
const isClient = typeof window !== 'undefined';

/**
 * グローバルプログレスサークルを管理するcomposable
 */
export const useProgress = (): ProgressReturn => {
  // SSRとSSGでは空のオブジェクトを返す
  if (!isClient) {
    return {
      isVisible: ref(false),
      text: ref(DEFAULT_OPTIONS.text),
      color: ref(DEFAULT_OPTIONS.color),
      size: ref(DEFAULT_OPTIONS.size),
      indeterminate: ref(DEFAULT_OPTIONS.indeterminate),
      overlay: ref(DEFAULT_OPTIONS.overlay),
      show: (): void => {},
      hide: (): void => {},
    };
  }

  // 表示状態
  const isVisible = ref(false);
  // 表示テキスト
  const text = ref(DEFAULT_OPTIONS.text);
  // 色
  const color = ref(DEFAULT_OPTIONS.color);
  // サイズ
  const size = ref(DEFAULT_OPTIONS.size);
  // 不確定モード
  const indeterminate = ref(DEFAULT_OPTIONS.indeterminate);
  // オーバーレイ表示
  const overlay = ref(DEFAULT_OPTIONS.overlay);

  /**
   * プログレスサークルを表示する
   * @param options プログレスサークルのオプション
   */
  const show = (options: ProgressOptions = {}): void => {
    text.value = options.text ?? DEFAULT_OPTIONS.text;
    color.value = options.color ?? DEFAULT_OPTIONS.color;
    size.value = options.size ?? DEFAULT_OPTIONS.size;
    indeterminate.value = options.indeterminate ?? DEFAULT_OPTIONS.indeterminate;
    overlay.value = options.overlay ?? DEFAULT_OPTIONS.overlay;
    isVisible.value = true;
  };

  /**
   * プログレスサークルを非表示にする
   */
  const hide = (): void => {
    isVisible.value = false;
  };

  return {
    isVisible,
    text,
    color,
    size,
    indeterminate,
    overlay,
    show,
    hide,
  };
};

// グローバルな状態を作成
export const progress = useProgress();
