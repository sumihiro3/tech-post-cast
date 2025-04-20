<template lang="pug">
v-container.max-width-container
  v-row(justify="center")
    v-col(cols="12")
      .text-center.text-h4.font-weight-bold.mb-6 パーソナライズ番組を新規作成

  //- 一覧に戻るボタン
  v-row(justify="center")
    v-col(cols="12" sm="6" md="4")
      v-btn(
        block
        color="secondary"
        size="large"
        @click="$router.push('/app/feeds')"
      ) 一覧に戻る

  //- FeedEditorコンポーネントを使用
  FeedEditor(
    :initial-data="initialFeedData"
    :show-action-button="true"
    action-button-label="作成する"
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
</template>

<script setup lang="ts">
import { useNuxtApp } from '#app';
import FeedEditor from '@/components/qiita/FeedEditor.vue';
import { useCreatePersonalizedFeed } from '@/composables/feeds/useCreatePersonalizedFeed';
import { progress } from '@/composables/useProgress';
import { snackbar } from '@/composables/useSnackbar';
import type { InputPersonalizedFeedData } from '@/types';
import { HttpError, ValidationError } from '@/types/http-errors';
import { convertInputDataToCreateDto } from '@/types/personalized-feed';
import { computed, reactive, ref } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

// 初期データ（新規作成ではデフォルト値を設定）
const initialFeedData = reactive<InputPersonalizedFeedData>({
  programTitle: '',
  filters: {
    tags: [],
    authors: [],
    dateRange: -1,
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
    dateRange: -1,
  },
  posts: [],
  totalCount: 0,
});

// フィードデータの更新ハンドラ
const handleInputPersonalizedFeedDataUpdate = (data: typeof currentFeedData.value): void => {
  currentFeedData.value = data;
};

/** 保存中フラグ */
const isSaving = ref(false);
/** エラーメッセージ */
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

/** フィードが有効かどうかを判定する  */
const isValidFeed = computed(() => {
  const hasTitle = currentFeedData.value.programTitle.trim() !== '';
  const hasTags = (currentFeedData.value.filters.tags?.length || 0) > 0;
  const hasAuthors = (currentFeedData.value.filters.authors?.length || 0) > 0;

  // タイトルは必須
  if (!hasTitle) return false;

  // タグか著者のいずれかが必要（日付範囲だけでは不可）
  return hasTags || hasAuthors;
});

/** フィードを保存する */
const saveFeed = async (): Promise<void> => {
  try {
    // 保存中フラグをON
    isSaving.value = true;
    // エラーメッセージをリセット
    resetErrors();
    // プログレスサークルを表示
    progress.show({ text: 'パーソナライズフィードを作成中...' });

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
    const requestData = convertInputDataToCreateDto(currentFeedData.value);

    // 作成したcomposableを使用してAPIを呼び出す
    const app = useNuxtApp();
    await useCreatePersonalizedFeed(app, requestData);

    // 成功時にSnackbarで通知
    snackbar.showSuccess('パーソナライズフィードを作成しました');

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
    snackbar.showError(error.value || 'パーソナライズフィードの作成に失敗しました');
  } finally {
    // プログレスサークルを非表示
    progress.hide();
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
