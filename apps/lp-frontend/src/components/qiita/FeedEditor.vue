<template lang="pug">
div
  //- フィード設定部分
  v-card.mb-6(elevation="2")
    v-card-text
      //- 番組名
      .mb-3
        .d-flex.align-center.mb-2
          v-icon(size="small" class="mr-1") mdi-radio
          span.font-weight-medium 番組名
        v-text-field(
          v-model="programTitle"
          density="comfortable"
          variant="outlined"
          placeholder="番組名を入力"
          :error-messages="getFieldErrorMessages('programTitle')"
          :error="hasFieldError('programTitle')"
        )

      v-divider
      //- フィルターオプション
      .my-4
        .d-flex.align-center.justify-space-between.mb-4
          .text-subtitle-1.font-weight-bold 記事のフィルタリング設定

        //- 著者フィルター (カスタムコンポーネント)
        QiitaAuthorSelector(
          v-model="filters.authors"
          :max-authors="10"
        )

        //- タグフィルター (カスタムコンポーネント)
        QiitaTagSelector(
          v-model="filters.tags"
          :max-tags="10"
        )

        //- 配信日フィルター
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-calendar
            span.font-weight-medium 記事公開日の範囲
          v-chip-group(
            v-model="filters.dateRange"
            mandatory
            selected-class="primary"
          )
            v-chip(
              v-for="range in dateRanges"
              :key="range.value"
              :value="range.value"
              filter
              variant="elevated"
              size="small"
            ) {{ range.label }}

    //- カードの下部にボタンを配置
    v-card-actions(v-if="showActionButton")
      v-row(justify="center")
        v-col(cols="12" sm="6" md="10" class="text-center")
          v-btn(
            color="primary"
            size="large"
            variant="elevated"
            block
            :loading="loading"
            :disabled="!isValid"
            @click="handleActionButtonClick"
          ) {{ actionButtonLabel }}
        //- フィルター条件をクリアするボタン
        v-col(cols="12" sm="6" md="10" class="text-center")
          v-btn(
            variant="text"
            color="primary"
            class="mt-2"
            @click="clearFilters"
          ) フィルター条件をクリア

  //- フィルターされた記事のプレビューリスト
  div
    .d-flex.align-center.mb-4
      .text-h6.font-weight-medium 対象記事のプレビュ（{{ filteredQiitaPostsTotalCount }}件）

    div(v-if="filteredQiitaPosts && filteredQiitaPosts.length === 0")
      v-card
        v-card-text.text-center.pa-4
          .text-body-1.text-medium-emphasis 条件に一致する記事が見つかりませんでした。

    qiita-post-list-item(
      v-for="post in filteredQiitaPosts"
      :key="post.id"
      :post="post"
    )
</template>

<script setup lang="ts">
import type { QiitaPostDto } from '@/api';
import { useGetQiitaPosts } from '@/composables/qiita-api/useGetQiitaPosts';
import { defineEmits, defineProps, reactive, ref, watch } from 'vue';
import type { InputPersonalizedFeedData } from '~/types/personalized-feed';

const props = defineProps({
  // 編集モードの場合、初期値を渡す
  initialData: {
    type: Object as () => InputPersonalizedFeedData,
    default: () => ({
      programTitle: '',
      filters: {
        authors: [],
        tags: [],
        dateRange: -1,
      },
      posts: [],
      totalCount: 0,
    }),
  },
  showActionButton: {
    type: Boolean,
    default: false,
  },
  actionButtonLabel: {
    type: String,
    default: '保存',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  // フィールドエラーを追加
  fieldErrors: {
    type: Object as () => Record<string, string[]>,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:feedData', 'actionButtonClick']);

const app = useNuxtApp();

// 番組名
const programTitle = ref(props.initialData.programTitle);

// 絞り込み条件の型
interface IFilters {
  authors: string[];
  tags: string[];
  dateRange: number; // 文字列から数値に変更
}

// 絞り込み条件
const filters = reactive<IFilters>({
  authors: [...props.initialData.filters.authors],
  tags: [...props.initialData.filters.tags],
  dateRange:
    typeof props.initialData.filters.dateRange === 'number'
      ? props.initialData.filters.dateRange
      : -1, // 数値でない場合はデフォルト値の-1（すべて）を設定
});

// 前回のフィルター条件
const previousFilters = ref<IFilters>({
  authors: [...props.initialData.filters.authors],
  tags: [...props.initialData.filters.tags],
  dateRange:
    typeof props.initialData.filters.dateRange === 'number'
      ? props.initialData.filters.dateRange
      : -1, // 数値でない場合はデフォルト値の-1（すべて）を設定
});

// フィルターを適用した記事の総数
const filteredQiitaPostsTotalCount = ref<number>(0);

// 著者またはタグが選択されているかどうか
const isAuthorOrTagSelected = (): boolean => {
  return filters.authors.length > 0 || filters.tags.length > 0;
};

// フィードのデータを親コンポーネントに通知
const emitFeedData = (): void => {
  // フィードのデータを親コンポーネントに通知
  emit('update:feedData', {
    programTitle: programTitle.value,
    filters: {
      authors: filters.authors,
      tags: filters.tags,
      dateRange: filters.dateRange,
    },
    posts: filteredQiitaPosts.value,
    totalCount: filteredQiitaPostsTotalCount.value,
  } satisfies InputPersonalizedFeedData);
};

// initialDataが変更されたときの監視処理を追加
watch(
  () => props.initialData,
  (newInitialData) => {
    console.log('initialData changed:', newInitialData);
    // 番組名を更新
    programTitle.value = newInitialData.programTitle;

    // フィルター条件を更新
    filters.authors = [...newInitialData.filters.authors];
    filters.tags = [...newInitialData.filters.tags];
    filters.dateRange =
      typeof newInitialData.filters.dateRange === 'number' ? newInitialData.filters.dateRange : -1;

    // 前回のフィルター条件も更新
    previousFilters.value = {
      authors: [...newInitialData.filters.authors],
      tags: [...newInitialData.filters.tags],
      dateRange:
        typeof newInitialData.filters.dateRange === 'number'
          ? newInitialData.filters.dateRange
          : -1,
    };

    // 初期値がある場合は記事を取得
    if (isAuthorOrTagSelected()) {
      fetchQiitaPosts();
    }
  },
  { deep: true, immediate: true },
);

// 番組名が変更されたときに独立して親コンポーネントへ通知
watch(programTitle, (_newValue) => {
  // 番組名だけでも変更を通知するため、emitFeedDataを呼び出す
  emitFeedData();
});

// 絞り込み条件に応じてAPIで取得した記事リスト
const filteredQiitaPosts = ref<QiitaPostDto[]>([]);

/**
 * フィルター条件が変更されたことを検知して、Qiita API で記事を取得する
 */
watch(
  [filters, programTitle],
  () => {
    if (isFiltersChanged() && isAuthorOrTagSelected()) {
      // フィルター条件が変更された場合、Qiita API で記事を取得する
      // ただし、著者またはタグが選択されている場合のみ
      fetchQiitaPosts();
      previousFilters.value = {
        authors: [...filters.authors],
        tags: [...filters.tags],
        dateRange: filters.dateRange,
      };
      emitFeedData();
    } else if (!isAuthorOrTagSelected()) {
      // 著者またはタグが選択されていない場合、フィルターをクリアする
      filteredQiitaPosts.value = [];
      filteredQiitaPostsTotalCount.value = 0;
      previousFilters.value = {
        authors: [],
        tags: [],
        dateRange: -1, // 「すべて」を表す値として-1を使用
      };
      emitFeedData();
    }
  },
  { deep: true },
);

/**
 * 前回のフィルター条件と現在のフィルター条件を比較して、変更があったかどうかを返す
 * @returns 変更があった場合は true, 変更がない場合は false
 */
const isFiltersChanged = (): boolean => {
  return (
    !arraysEqual(previousFilters.value.authors, filters.authors) ||
    !arraysEqual(previousFilters.value.tags, filters.tags) ||
    previousFilters.value.dateRange !== filters.dateRange
  );
};

/**
 * 2つの配列が等しいかどうかを比較
 */
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
};

/**
 * Qiita API で条件に応じた記事を取得する
 */
const fetchQiitaPosts = async (): Promise<void> => {
  const result = await useGetQiitaPosts(app, filters.authors, filters.tags, filters.dateRange);
  filteredQiitaPosts.value = result.posts;
  filteredQiitaPostsTotalCount.value = result.totalCount;
};

// フィルターをクリアする関数
const clearFilters = (): void => {
  filters.authors = [];
  filters.tags = [];
  filters.dateRange = -1; // 「すべて」を表す値として-1を使用
};

// 日付範囲のリスト（日数指定）
// 値は公開日から何日前までの記事を取得するかを表す数値
// -1は「すべて」を意味する特殊な値
const dateRanges = [
  { value: -1, label: 'すべて' },
  { value: 7, label: '1週間以内' },
  { value: 30, label: '1ヶ月以内' },
  { value: 90, label: '3ヶ月以内' },
  { value: 180, label: '6ヶ月以内' },
  { value: 365, label: '1年以内' },
];

// 初期値がある場合は、初期表示時に記事を取得
if (isAuthorOrTagSelected()) {
  fetchQiitaPosts();
}

// アクションボタンのクリックイベントハンドラー
const handleActionButtonClick = (): void => {
  emit('actionButtonClick');
};

// フィールドエラーを取得する関数
const getFieldErrorMessages = (field: string): string[] => {
  return props.fieldErrors[field] || [];
};

// フィールドにエラーがあるかどうかを判定する関数
const hasFieldError = (field: string): boolean => {
  return !!props.fieldErrors[field]?.length;
};
</script>

<style scoped>
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
