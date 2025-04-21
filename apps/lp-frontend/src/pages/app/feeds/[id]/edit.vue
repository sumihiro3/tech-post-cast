<template lang="pug">
v-container.max-width-container
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
      .text-center.text-h4.font-weight-bold.mb-6 番組設定の編集

  //- FeedEditorコンポーネントを使用
  FeedEditor(
    :initial-data="initialFeedData"
    :show-action-button="true"
    action-button-label="更新する"
    :loading="isSaving"
    :is-valid="isValidFeed"
    :field-errors="fieldErrors"
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
      ) {{ error }}

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
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import FeedEditor from '@/components/qiita/FeedEditor.vue';
import { useGetPersonalizedFeedById } from '@/composables/feeds/useGetPersonalizedFeedById';
import { useUpdatePersonalizedFeed } from '@/composables/feeds/useUpdatePersonalizedFeed';
import { progress } from '@/composables/useProgress';
import { snackbar } from '@/composables/useSnackbar';
import type { InputPersonalizedFeedData } from '@/types';
import { HttpError, ValidationError } from '@/types/http-errors';
import {
  convertApiResponseToInputData,
  convertInputDataToUpdateDto,
} from '@/types/personalized-feed';
import { computed, onMounted, reactive, ref } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

const { user } = useUser();

// 初期データ（編集の場合はAPIから取得する）
const initialFeedData = reactive<InputPersonalizedFeedData>({
  programTitle: '',
  filters: {
    tags: [],
    authors: [],
    dateRange: -1, // 文字列から数値に変更（日数指定）
  },
  posts: [],
  totalCount: 0,
});

// 現在のフィードデータ（FeedEditorから更新される）
const currentFeedData = ref<InputPersonalizedFeedData>({
  programTitle: '',
  filters: {
    tags: [],
    authors: [],
    dateRange: -1, // 文字列から数値に変更（日数指定）
  },
  posts: [],
  totalCount: 0,
});

// キャンセル確認ダイアログの表示状態
const showCancelDialog = ref(false);

// フォームに変更があったかを判断する関数
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

  return hasTitleChanged || hasTagsChanged || hasAuthorsChanged || hasDateRangeChanged;
});

// キャンセルボタンが押されたときのハンドラ
const handleCancel = (): void => {
  if (hasFormChanges.value) {
    // 変更があれば確認ダイアログを表示
    showCancelDialog.value = true;
  } else {
    // 変更がなければそのまま一覧に戻る
    navigateTo('/app/feeds');
  }
};

// フィードデータの更新ハンドラ
const handleInputPersonalizedFeedDataUpdate = (data: typeof currentFeedData.value): void => {
  currentFeedData.value = data;
};

// 保存中フラグ
const isSaving = ref(false);
// 読み込み中フラグ
const isLoading = ref(false);
// 編集対象のフィードID
const feedId = ref<string>('');
// エラーメッセージ
const error = ref<string | null>(null);

// フィールドごとのエラーメッセージを管理するためのオブジェクト
const fieldErrors = reactive<Record<string, string[]>>({});

// バリデーションエラーを処理する関数
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

// エラーメッセージをリセットする関数
const resetErrors = (): void => {
  error.value = null;
  Object.keys(fieldErrors).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete fieldErrors[key];
  });
};

// 特定のフィールドにエラーがあるかチェックする関数
// const hasFieldError = (field: string): boolean => {
//   return !!fieldErrors[field] && fieldErrors[field].length > 0;
// };

// // 特定のフィールドのエラーメッセージを取得する関数
// const getFieldErrorMessage = (field: string): string => {
//   if (!hasFieldError(field)) {
//     return '';
//   }
//   return fieldErrors[field].join(', ');
// };

// フィードが有効かどうか
const isValidFeed = computed(() => {
  return (
    currentFeedData.value.programTitle.trim() !== '' &&
    ((currentFeedData.value.filters.authors?.length || 0) > 0 ||
      (currentFeedData.value.filters.tags?.length || 0) > 0)
  );
});

// フィードを保存する
const saveFeed = async (): Promise<void> => {
  try {
    // 保存中フラグをON
    isSaving.value = true;
    // エラーメッセージをリセット
    resetErrors();
    // プログレスサークルを表示
    progress.show({ text: 'パーソナライズフィードを更新中...' });

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

    // 成功時にSnackbarで通知
    snackbar.showSuccess('パーソナライズフィードを更新しました');

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

    // エラー時にSnackbarで通知
    snackbar.showError(error.value || 'パーソナライズフィードの更新に失敗しました');
  } finally {
    // プログレスサークルを非表示
    progress.hide();
    // 保存中フラグをOFF
    isSaving.value = false;
  }
};

// パーソナライズフィードを取得する
const fetchPersonalizedFeed = async (id: string): Promise<void> => {
  try {
    isLoading.value = true;
    // エラーをリセット
    resetErrors();
    // プログレスサークルを表示
    progress.show({ text: 'パーソナライズフィードを読み込み中...' });

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
    initialFeedData.posts = [...inputData.posts];
    initialFeedData.totalCount = inputData.totalCount;

    // 現在のデータにも同じ値をセット（フォームに表示するため）
    currentFeedData.value = {
      programTitle: inputData.programTitle,
      filters: {
        tags: [...inputData.filters.tags],
        authors: [...inputData.filters.authors],
        dateRange: inputData.filters.dateRange,
      },
      posts: [...inputData.posts],
      totalCount: inputData.totalCount,
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
      error.value = err.message;
    } else if (err instanceof Error) {
      // 通常のエラーの場合
      error.value = err.message;
    } else {
      // それ以外の場合
      error.value = 'パーソナライズフィードの読み込みに失敗しました';
    }

    // エラー時にSnackbarで通知
    snackbar.showError(error.value || 'パーソナライズフィードの読み込みに失敗しました');
  } finally {
    isLoading.value = false;
    // プログレスサークルを非表示
    progress.hide();
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
