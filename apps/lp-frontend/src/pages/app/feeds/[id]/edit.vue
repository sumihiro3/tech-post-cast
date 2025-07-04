<template lang="pug">
v-container.max-width-container.pa-2.pa-sm-4.pa-md-6
  //- キャンセルボタン
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
      .text-center.text-h5.text-sm-h4.font-weight-bold.mb-6 パーソナルフィード設定の編集

  //- FeedEditorコンポーネントを使用
  FeedEditor(
    :initial-data="initialFeedData"
    :show-action-button="true"
    action-button-label="更新する"
    :max-authors="maxAuthors"
    :max-tags="maxTags"
    :loading="isSaving"
    :is-valid="isValidFeed"
    :field-errors="fieldErrors"
    :show-validation-status="false"
    @update:feed-data="handleInputPersonalizedFeedDataUpdate"
    @action-button-click="saveFeed"
  )

  //- 削除ボタン
  v-row(justify="center" class="mt-10")
    v-col(cols="12" sm="8" md="6")
      v-btn(
        block
        color="error"
        variant="outlined"
        size="large"
        :disabled="isDeleting"
        @click="showDeleteDialog = true"
      )
        v-icon(start) mdi-delete
        | この番組設定を削除する

  //- エラーメッセージを表示
  v-row(v-if="error" justify="center" class="mt-4")
    v-col(cols="12" sm="8" md="6")
      v-alert(
        type="error"
        variant="tonal"
        closable
        border
        @click:close="error = null"
      )
        div {{ error }}
        div(v-if="error.includes('存在しないか、削除されている')" class="mt-3")
          v-btn(
            color="primary"
            variant="outlined"
            size="small"
            @click="navigateTo('/app/feeds')"
          )
            v-icon.mr-2 mdi-format-list-bulleted
            | フィード一覧に戻る

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

  //- キャンセル確認ダイアログ
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

  //- 削除確認ダイアログ
  ConfirmDialog(
    v-model="showDeleteDialog"
    title="番組設定を削除しますか？"
    message="この番組設定を削除します。この操作は取り消せません。本当に削除しますか？"
    confirm-button-text="削除する"
    cancel-button-text="キャンセル"
    confirm-button-color="error"
    cancel-button-color="primary"
    @confirm="deleteFeed"
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
import { useDeletePersonalizedFeed } from '@/composables/feeds/useDeletePersonalizedFeed';
import { useGetPersonalizedFeedById } from '@/composables/feeds/useGetPersonalizedFeedById';
import { useUpdatePersonalizedFeed } from '@/composables/feeds/useUpdatePersonalizedFeed';
import { useUIState } from '@/composables/useUIState';
import { useFeedValidation } from '@/composables/validation/useFeedValidation';
import type { InputPersonalizedFeedData } from '@/types';
import { HttpError, ValidationError } from '@/types/http-errors';
import {
  convertApiResponseToInputData,
  convertInputDataToUpdateDto,
} from '@/types/personalized-feed';
import { useUser } from '@clerk/vue';
import { computed, onMounted, reactive, ref } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

// UI状態管理
const ui = useUIState();

// ユーザー情報
const { user } = useUser();

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
 * APIから取得した値で初期化される
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
 * 現在のフィードデータ（編集中の状態）
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
 * 削除確認ダイアログの表示状態
 */
const showDeleteDialog = ref(false);

/**
 * フォームに変更があったかを判断するcomputed
 * 初期データと現在のデータを比較して変更があるかどうかを返す
 * @returns {boolean} 変更がある場合はtrue、ない場合はfalse
 */
const hasFormChanges = computed(() => {
  // タイトルに変更があるか
  const hasTitleChanged = currentFeedData.value.programTitle !== initialFeedData.programTitle;

  // タグに変更があるか
  const initialTags = initialFeedData.filters.tags || [];
  const currentTags = currentFeedData.value.filters.tags || [];
  const hasTagsChanged =
    initialTags.length !== currentTags.length ||
    initialTags.some((tag, index) => tag !== currentTags[index]);

  // 著者に変更があるか
  const initialAuthors = initialFeedData.filters.authors || [];
  const currentAuthors = currentFeedData.value.filters.authors || [];
  const hasAuthorsChanged =
    initialAuthors.length !== currentAuthors.length ||
    initialAuthors.some((author, index) => author !== currentAuthors[index]);

  // 日付範囲に変更があるか
  const hasDateRangeChanged =
    currentFeedData.value.filters.dateRange !== initialFeedData.filters.dateRange;

  // 配信間隔に変更があるか
  const hasDeliveryFrequencyChanged =
    currentFeedData.value.deliveryFrequency !== initialFeedData.deliveryFrequency;

  // 話者モードに変更があるか
  const hasSpeakerModeChanged = currentFeedData.value.speakerMode !== initialFeedData.speakerMode;

  return (
    hasTitleChanged ||
    hasTagsChanged ||
    hasAuthorsChanged ||
    hasDateRangeChanged ||
    hasDeliveryFrequencyChanged ||
    hasSpeakerModeChanged
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
 * 削除中フラグ
 * フィード削除処理中はtrueとなる
 */
const isDeleting = ref(false);

/**
 * 読み込み中フラグ
 * フィードデータ読み込み中はtrueとなる
 */
const isLoading = ref(false);

/**
 * 編集対象のフィードID
 * URLパラメータから取得される
 */
const feedId = ref<string>('');

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
 * @returns {boolean} フィードが有効な場合はtrue、そうでない場合はfalse
 */
const isValidFeed = computed(() => {
  return (
    currentFeedData.value.programTitle.trim() !== '' &&
    ((currentFeedData.value.filters.authors?.length || 0) > 0 ||
      (currentFeedData.value.filters.tags?.length || 0) > 0)
  );
});

/**
 * フィードを保存する関数
 * フォームデータをバリデーションし、APIを呼び出してフィードを更新する
 * @returns {Promise<void>}
 */
const saveFeed = async (): Promise<void> => {
  try {
    // 保存中フラグをON
    isSaving.value = true;
    // エラーメッセージをリセット
    resetErrors();
    // プログレスサークルを表示
    ui.showLoading({ message: 'パーソナライズフィードを更新中...' });

    // フロントエンドでのバリデーション
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
    const requestData = convertInputDataToUpdateDto(currentFeedData.value);

    // 作成したcomposableを使用してAPIを呼び出す
    const app = useNuxtApp();
    await useUpdatePersonalizedFeed(app, feedId.value, requestData);

    // 成功時にAppSnackbarで通知
    ui.showSuccess('パーソナライズフィードを更新しました');

    // 保存成功の場合、フィード一覧画面に遷移
    navigateTo('/app/feeds');
  } catch (err: unknown) {
    console.error('Failed to update feed:', err);

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
      error.value = 'パーソナライズフィードの更新に失敗しました';
    }

    // エラー時にAppSnackbarで通知
    ui.showError(error.value || 'パーソナライズフィードの更新に失敗しました');
  } finally {
    // プログレスサークルを非表示
    ui.hideLoading();
    // 保存中フラグをOFF
    isSaving.value = false;
  }
};

/**
 * フィードを削除する関数
 * 指定されたIDのフィードをAPIを呼び出して削除する
 * @returns {Promise<void>}
 */
const deleteFeed = async (): Promise<void> => {
  try {
    // 削除中フラグをON
    isDeleting.value = true;
    // エラーメッセージをリセット
    resetErrors();
    // プログレスサークルを表示
    ui.showLoading({ message: 'パーソナライズフィードを削除中...' });

    // 作成したcomposableを使用してAPIを呼び出す
    const app = useNuxtApp();
    await useDeletePersonalizedFeed(app, feedId.value);

    // 成功時にAppSnackbarで通知
    ui.showSuccess('パーソナライズフィードを削除しました');

    // 削除成功の場合、フィード一覧画面に遷移
    navigateTo('/app/feeds');
  } catch (err: unknown) {
    console.error('Failed to delete feed:', err);

    // エラーの型に応じた処理
    if (err instanceof HttpError) {
      // HTTPエラーの場合
      error.value = err.message;
    } else if (err instanceof Error) {
      // 通常のエラーの場合
      error.value = err.message;
    } else {
      // それ以外の場合
      error.value = 'パーソナライズフィードの削除に失敗しました';
    }

    // エラー時にAppSnackbarで通知
    ui.showError(error.value || 'パーソナライズフィードの削除に失敗しました');
  } finally {
    // プログレスサークルを非表示
    ui.hideLoading();
    // 削除中フラグをOFF
    isDeleting.value = false;
  }
};

/**
 * パーソナライズフィードを取得する関数
 * 指定されたIDのフィードデータをAPIから取得し、フォームデータに変換する
 * @param {string} id 取得するフィードのID
 * @returns {Promise<void>}
 */
const fetchPersonalizedFeed = async (id: string): Promise<void> => {
  try {
    isLoading.value = true;
    // エラーをリセット
    resetErrors();
    // プログレスサークルを表示
    ui.showLoading({ message: 'パーソナライズフィードを読み込み中...' });

    console.log('Fetching personalized feed with ID:', id);
    const app = useNuxtApp();
    // 作成したcomposableを使用してフィードを取得
    const result = await useGetPersonalizedFeedById(app, user.value!.id, id);

    // APIレスポンスから入力フォーム用のデータに変換
    const inputData = convertApiResponseToInputData(result);

    console.log('Converted input data:', inputData);

    // 初期データに設定（Object.assignではなく直接プロパティをセットする）
    initialFeedData.programTitle = inputData.programTitle;
    initialFeedData.filters.tags = [...inputData.filters.tags];
    initialFeedData.filters.authors = [...inputData.filters.authors];
    initialFeedData.filters.dateRange = inputData.filters.dateRange;
    initialFeedData.filters.likesCount = inputData.filters.likesCount;
    initialFeedData.deliveryFrequency = inputData.deliveryFrequency || DeliveryFrequencyEnum.Daily;
    initialFeedData.speakerMode = inputData.speakerMode || SpeakerModeEnum.Single;
    initialFeedData.posts = [...inputData.posts];
    initialFeedData.totalCount = inputData.totalCount;

    // 現在のデータにも同じ値をセット（フォームに表示するため）
    currentFeedData.value = {
      programTitle: inputData.programTitle,
      filters: {
        tags: [...inputData.filters.tags],
        authors: [...inputData.filters.authors],
        dateRange: inputData.filters.dateRange,
        likesCount: inputData.filters.likesCount,
      },
      posts: [...inputData.posts],
      totalCount: inputData.totalCount,
      deliveryFrequency: inputData.deliveryFrequency || DeliveryFrequencyEnum.Daily,
      speakerMode: inputData.speakerMode || SpeakerModeEnum.Single,
    };

    console.log('Loaded feed data:', result);
    console.log('Initial feed data set to:', initialFeedData);
    console.log('Current feed data set to:', currentFeedData.value);
  } catch (err: unknown) {
    console.error('Failed to fetch personalized feed:', err);

    // エラーの型に応じた処理
    if (err instanceof ValidationError) {
      // バリデーションエラーの場合、フィールドごとのエラーを処理
      handleValidationError(err);
    } else if (err instanceof HttpError) {
      // その他のHTTPエラーの場合
      if (err.statusCode === 404) {
        error.value = `フィードID「${id}」は存在しないか、削除されている可能性があります。パーソナルプログラムが古い場合、関連するフィードが削除されている可能性があります。`;
      } else {
        error.value = err.message;
      }
    } else if (err instanceof Error) {
      // 通常のエラーの場合
      error.value = err.message;
    } else {
      // それ以外の場合
      error.value = 'パーソナライズフィードの読み込みに失敗しました';
    }

    // エラー時にAppSnackbarで通知
    ui.showError(error.value || 'パーソナライズフィードの読み込みに失敗しました');
  } finally {
    isLoading.value = false;
    // プログレスサークルを非表示
    ui.hideLoading();
  }
};

// コンポーネントマウント時の処理
onMounted(async () => {
  // URLのパスからIDを取得
  const route = useRoute();
  // パスパラメータからIDを取得
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  feedId.value = id;
  await fetchPersonalizedFeed(id);
});
</script>

<style scoped>
.max-width-container {
  max-width: 900px;
}
</style>
