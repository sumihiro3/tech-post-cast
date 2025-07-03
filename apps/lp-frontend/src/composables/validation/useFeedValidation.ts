/**
 * フィードバリデーション用composable
 */

import type { InputPersonalizedFeedData } from '@/types/personalized-feed';
import {
  createDebouncedValidator,
  validateFeedData,
  type ValidationResult,
} from '@/utils/validation/feed-validation';
import { computed, ref, watch, type Ref } from 'vue';

export interface UseFeedValidationReturn {
  /** バリデーション結果 */
  validationResult: Ref<ValidationResult>;
  /** バリデーション実行中フラグ */
  isValidating: Ref<boolean>;
  /** フィールドエラーメッセージ取得関数 */
  getFieldErrors: (field: string) => string[];
  /** フィールド警告メッセージ取得関数 */
  getFieldWarnings: (field: string) => string[];
  /** フィールドにエラーがあるかチェック */
  hasFieldError: (field: string) => boolean;
  /** フィールドに警告があるかチェック */
  hasFieldWarning: (field: string) => boolean;
  /** 全体的にバリデーションが通っているかチェック */
  isValid: Ref<boolean>;
  /** 警告があるかチェック */
  hasWarnings: Ref<boolean>;
  /** 手動バリデーション実行 */
  validateNow: (data: InputPersonalizedFeedData) => ValidationResult;
  /** バリデーション結果をクリア */
  clearValidation: () => void;
  /** 特定フィールドのエラーをクリア */
  clearFieldErrors: (field: string) => void;
}

/**
 * フィードバリデーション用composable
 */
export const useFeedValidation = (
  feedData: Ref<InputPersonalizedFeedData>,
  options: {
    /** リアルタイムバリデーションを有効にするか */
    realtime?: boolean;
    /** デバウンス遅延時間（ミリ秒） */
    debounceDelay?: number;
    /** タグの最大数 */
    maxTags?: number;
    /** 著者の最大数 */
    maxAuthors?: number;
  } = {},
): UseFeedValidationReturn => {
  const { realtime = true, debounceDelay = 500, maxTags = 10, maxAuthors = 10 } = options;

  // バリデーション結果
  const validationResult = ref<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {},
  });

  // バリデーション実行中フラグ
  const isValidating = ref(false);

  // 全体的にバリデーションが通っているか
  const isValid = computed(() => validationResult.value.isValid);

  // 警告があるか
  const hasWarnings = computed(() => Object.keys(validationResult.value.warnings).length > 0);

  /**
   * フィールドエラーメッセージ取得
   */
  const getFieldErrors = (field: string): string[] => {
    return validationResult.value.errors[field] || [];
  };

  /**
   * フィールド警告メッセージ取得
   */
  const getFieldWarnings = (field: string): string[] => {
    return validationResult.value.warnings[field] || [];
  };

  /**
   * フィールドにエラーがあるかチェック
   */
  const hasFieldError = (field: string): boolean => {
    return getFieldErrors(field).length > 0;
  };

  /**
   * フィールドに警告があるかチェック
   */
  const hasFieldWarning = (field: string): boolean => {
    return getFieldWarnings(field).length > 0;
  };

  /**
   * 手動バリデーション実行
   */
  const validateNow = (data: InputPersonalizedFeedData): ValidationResult => {
    isValidating.value = true;
    const result = validateFeedData(data, { maxTags, maxAuthors });
    validationResult.value = result;
    isValidating.value = false;
    return result;
  };

  /**
   * バリデーション結果をクリア
   */
  const clearValidation = (): void => {
    validationResult.value = {
      isValid: true,
      errors: {},
      warnings: {},
    };
  };

  /**
   * 特定フィールドのエラーをクリア
   */
  const clearFieldErrors = (field: string): void => {
    if (validationResult.value.errors[field]) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete validationResult.value.errors[field];
    }
    if (validationResult.value.warnings[field]) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete validationResult.value.warnings[field];
    }

    // エラーがなくなった場合はisValidを更新
    validationResult.value.isValid = Object.keys(validationResult.value.errors).length === 0;
  };

  // リアルタイムバリデーション
  if (realtime) {
    const debouncedValidator = createDebouncedValidator(validateFeedData, debounceDelay);

    watch(
      feedData,
      (newData) => {
        isValidating.value = true;
        debouncedValidator(
          newData,
          (result) => {
            validationResult.value = result;
            isValidating.value = false;
          },
          { maxTags, maxAuthors },
        );
      },
      { deep: true },
    );
  }

  return {
    validationResult,
    isValidating,
    getFieldErrors,
    getFieldWarnings,
    hasFieldError,
    hasFieldWarning,
    isValid,
    hasWarnings,
    validateNow,
    clearValidation,
    clearFieldErrors,
  };
};
