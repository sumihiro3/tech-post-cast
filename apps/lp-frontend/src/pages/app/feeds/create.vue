<template lang="pug">
v-container.max-width-container
  //-キャンセルボタン
  v-row(justify="start")
    v-col(cols="12" sm="6" md="4")
      v-btn(
        variant="text"
        color="secondary"
        size="large"
        @click="handleCancel"
      ) < キャンセル
  //- タイトル
  v-row(justify="center")
    v-col(cols="12")
      .text-center.text-h4.font-weight-bold.mb-6 パーソナルフィード設定の新規作成

  //- FeedEditorコンポーネントを使用
  FeedEditor(
    :initial-data="initialFeedData"
    :show-action-button="true"
    action-button-label="作成する"
    :loading="isSaving"
    :is-valid="isValidFeed"
    :field-errors="fieldErrors"
    :max-authors="maxAuthors"
    :max-tags="maxTags"
    :show-validation-status="true"
    @update:feed-data="handleInputPersonalizedFeedDataUpdate"
    @action-button-click="saveFeed"
  )

  //- エラーメッセージを表示
  v-row(v-if="error" justify="center" class="mt-4")
    v-col(cols="12" sm="8" md="6")
      v-alert(
        type="error"
        variant="tonal"
        closable
        border
        @click:close="error = null"
      ) {{ error }}

  //- バリデーション詳細表示（開発・デバッグ用）
  v-row(v-if="showValidationDetails" justify="center" class="mt-4")
    v-col(cols="12")
      v-expansion-panels
        v-expansion-panel(title="バリデーション詳細（開発用）")
          v-expansion-panel-text
            .mb-3
              strong バリデーション状態:
              v-chip(
                :color="isValidationPassed ? 'success' : 'error'"
                size="small"
                class="ml-2"
              ) {{ isValidationPassed ? '通過' : 'エラー' }}
              v-chip(
                v-if="hasValidationWarnings"
                color="warning"
                size="small"
                class="ml-2"
              ) 警告あり

            div(v-if="validationErrors && Object.keys(validationErrors).length > 0")
              strong.text-error エラー:
              pre.text-caption {{ JSON.stringify(validationErrors, null, 2) }}

            div(v-if="validationWarnings && Object.keys(validationWarnings).length > 0")
              strong.text-warning 警告:
              pre.text-caption {{ JSON.stringify(validationWarnings, null, 2) }}

  //- キャンセル確認ダイアログ（共通コンポーネントを使用）
  ConfirmDialog(
    v-model="showCancelDialog"
    title="変更内容が保存されていません"
    message="変更内容が保存されていません。キャンセルすると入力した内容は失われます。キャンセルしますか？"
    confirm-button-text="キャンセルする"
    cancel-button-text="編集を続ける"
    confirm-button-color="error"
    cancel-button-color="primary"
    @confirm="navigateTo('/app/feeds')"
  )
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app';
import {
  PersonalizedFeedWithFiltersDtoDeliveryFrequencyEnum as DeliveryFrequencyEnum,
  PersonalizedFeedWithFiltersDtoSpeakerModeEnum as SpeakerModeEnum,
} from '@/api';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import FeedEditor from '@/components/qiita/FeedEditor.vue';
import { useCreatePersonalizedFeed } from '@/composables/feeds/useCreatePersonalizedFeed';
import { useUIState } from '@/composables/useUIState';
import { useFeedValidation } from '@/composables/validation/useFeedValidation';
import type { InputPersonalizedFeedData } from '@/types';
import { HttpError, ValidationError } from '@/types/http-errors';
import { convertInputDataToCreateDto } from '@/types/personalized-feed';
import { computed, reactive, ref } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

// UI状態管理
const ui = useUIState();

/** 記事公開日の範囲のデフォルト値 */
const DEFAULT_DATE_RANGE: number = 7;

/** いいね数のデフォルト値 */
const DEFAULT_LIKES_COUNT: number = 0;

// 制限値
const maxTags = ref(10);
const maxAuthors = ref(5);

// バリデーション詳細表示フラグ（開発用）
const showValidationDetails = ref(false);

/**
 * フィードの初期データ
 * 新規作成ではデフォルト値を設定
 */
const initialFeedData = reactive<InputPersonalizedFeedData>({
  programTitle: '',
  filters: {
    tags: [],
    authors: [],
    dateRange: DEFAULT_DATE_RANGE,
    likesCount: DEFAULT_LIKES_COUNT,
  },
  posts: [],
  totalCount: 0,
  deliveryFrequency: DeliveryFrequencyEnum.Daily,
  speakerMode: SpeakerModeEnum.Single,
});

/**
 * 現在のフィードデータ
 * FeedEditorコンポーネントから更新される
 */
const currentFeedData = ref<InputPersonalizedFeedData>({
  programTitle: '',
  filters: {
    tags: [],
    authors: [],
    dateRange: DEFAULT_DATE_RANGE,
    likesCount: DEFAULT_LIKES_COUNT,
  },
  posts: [],
  totalCount: 0,
  deliveryFrequency: DeliveryFrequencyEnum.Daily,
  speakerMode: SpeakerModeEnum.Single,
});

// バリデーション機能を統合
const {
  validationResult,
  isValidating: _isValidating,
  getFieldErrors: _getValidationFieldErrors,
  getFieldWarnings: _getFieldWarnings,
  hasFieldError: _hasValidationFieldError,
  hasFieldWarning: _hasFieldWarning,
  isValid: isValidationValid,
  hasWarnings: hasValidationWarnings,
} = useFeedValidation(currentFeedData, {
  realtime: true,
  debounceDelay: 500,
  maxTags: maxTags.value,
  maxAuthors: maxAuthors.value,
});

// バリデーション状態の計算プロパティ
const isValidationPassed = computed(() => isValidationValid.value);
const validationErrors = computed(() => validationResult.value.errors);
const validationWarnings = computed(() => validationResult.value.warnings);

/**
 * キャンセル確認ダイアログの表示状態
 */
const showCancelDialog = ref(false);

/**
 * フォームに変更があったかを判断するcomputed
 * 初期値と比較して変更があるかどうかを返す
 * @returns {boolean} 変更がある場合はtrue、ない場合はfalse
 */
const hasFormChanges = computed(() => {
  // タイトルが入力されているか
  const hasTitleChanged = currentFeedData.value.programTitle.trim() !== '';
  // タグが選択されているか
  const hasTagsSelected = (currentFeedData.value.filters.tags?.length || 0) > 0;
  // 著者が選択されているか
  const hasAuthorsSelected = (currentFeedData.value.filters.authors?.length || 0) > 0;
  // 日付範囲が初期値と異なるか
  const hasDateRangeChanged = currentFeedData.value.filters.dateRange !== -1;
  // 配信間隔が初期値と異なるか
  const hasDeliveryFrequencyChanged =
    currentFeedData.value.deliveryFrequency !== DeliveryFrequencyEnum.Daily;

  return (
    hasTitleChanged ||
    hasTagsSelected ||
    hasAuthorsSelected ||
    hasDateRangeChanged ||
    hasDeliveryFrequencyChanged
  );
});

/**
 * キャンセルボタンが押されたときのハンドラ
 * 変更がある場合は確認ダイアログを表示し、ない場合は直接一覧ページに戻る
 */
const handleCancel = (): void => {
  if (hasFormChanges.value) {
    // 変更があれば確認ダイアログを表示
    showCancelDialog.value = true;
  } else {
    // 変更がなければそのまま一覧に戻る
    navigateTo('/app/feeds');
  }
};

/**
 * フィードデータの更新ハンドラ
 * FeedEditorコンポーネントからのデータ更新を処理する
 * @param {InputPersonalizedFeedData} data 更新されたフィードデータ
 */
const handleInputPersonalizedFeedDataUpdate = (data: typeof currentFeedData.value): void => {
  currentFeedData.value = data;
};

/**
 * 保存中フラグ
 * フィード保存処理中はtrueとなる
 */
const isSaving = ref(false);

/**
 * エラーメッセージ
 * APIエラーや入力エラー発生時に設定される
 */
const error = ref<string | null>(null);

/**
 * フィールドごとのエラーメッセージを管理するオブジェクト
 * バリデーションエラー発生時に各フィールドのエラーメッセージが格納される
 */
const fieldErrors = reactive<Record<string, string[]>>({});

/**
 * バリデーションエラーを処理する関数
 * エラーオブジェクトからフィールドごとのエラーメッセージを抽出して設定する
 * @param {ValidationError} ve バリデーションエラーオブジェクト
 */
const handleValidationError = (ve: ValidationError): void => {
  // フィールド別のエラーメッセージをセット
  Object.keys(fieldErrors).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete fieldErrors[key];
  });

  // エラーオブジェクトからフィールドごとのエラーをコピー
  Object.entries(ve.errors).forEach(([field, messages]) => {
    fieldErrors[field] = [...messages];
  });

  // 全体のエラーメッセージもセット
  error.value = ve.message;
};

/**
 * エラーメッセージをリセットする関数
 * 全体のエラーメッセージとフィールドごとのエラーメッセージをクリアする
 */
const resetErrors = (): void => {
  error.value = null;
  Object.keys(fieldErrors).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete fieldErrors[key];
  });
};

/**
 * フィードが有効かどうかを判定するcomputed
 * 新しいバリデーション結果と従来のロジックを統合
 * @returns {boolean} フィードが有効な場合はtrue、そうでない場合はfalse
 */
const isValidFeed = computed(() => {
  // 新しいバリデーション結果をチェック
  if (!isValidationPassed.value) {
    return false;
  }

  // 従来のロジックも維持
  const hasTitle = currentFeedData.value.programTitle.trim() !== '';
  const hasTags = (currentFeedData.value.filters.tags?.length || 0) > 0;
  const hasAuthors = (currentFeedData.value.filters.authors?.length || 0) > 0;

  // タイトルは必須
  if (!hasTitle) return false;

  // タグか著者のいずれかが必要（日付範囲だけでは不可）
  return hasTags || hasAuthors;
});

/**
 * フィードを保存する関数
 * フォームデータをバリデーションし、APIを呼び出してフィードを作成する
 * @returns {Promise<void>}
 */
const saveFeed = async (): Promise<void> => {
  try {
    // 保存中フラグをON
    isSaving.value = true;
    // エラーメッセージをリセット
    resetErrors();
    // プログレスサークルを表示
    ui.showLoading({ message: 'パーソナライズフィードを作成中...' });

    // 新しいバリデーション機能でのチェック
    if (!isValidationPassed.value) {
      error.value = 'フォームに入力エラーがあります。内容を確認してください。';
      return;
    }

    // フロントエンドでのバリデーション（従来のロジックも維持）
    if (!currentFeedData.value.programTitle) {
      error.value = 'タイトルを入力してください';
      fieldErrors['programTitle'] = ['タイトルを入力してください'];
      return;
    }

    if (
      !currentFeedData.value.filters.tags?.length &&
      !currentFeedData.value.filters.authors?.length
    ) {
      error.value = 'タグまたは著者のいずれかのフィルターを設定してください';
      return;
    }

    // 型定義済みの変換関数を使用してAPIリクエストデータを作成
    const requestData = convertInputDataToCreateDto(currentFeedData.value);

    // 作成したcomposableを使用してAPIを呼び出す
    const app = useNuxtApp();
    await useCreatePersonalizedFeed(app, requestData);

    // 成功時にSnackbarで通知
    ui.showSuccess('パーソナライズフィードを作成しました');

    // 保存成功の場合、フィード一覧画面に遷移
    navigateTo('/app/feeds');
  } catch (err: unknown) {
    console.error('Failed to create feed:', err);

    // エラーの型に応じた処理
    if (err instanceof ValidationError) {
      // バリデーションエラーの場合、フィールドごとのエラーを処理
      handleValidationError(err);
    } else if (err instanceof HttpError) {
      // その他のHTTPエラーの場合
      error.value = err.message;
    } else if (err instanceof Error) {
      // 通常のエラーの場合
      error.value = err.message;
    } else {
      // それ以外の場合
      error.value = 'パーソナライズフィードの作成に失敗しました';
    }

    // エラー時にSnackbarで通知
    ui.showError(error.value || 'パーソナライズフィードの作成に失敗しました');
  } finally {
    // プログレスサークルを非表示
    ui.hideLoading();
    // 保存中フラグをOFF
    isSaving.value = false;
  }
};
</script>

<style scoped>
.max-width-container {
  max-width: 900px;
}
</style>
