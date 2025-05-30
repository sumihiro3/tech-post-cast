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

      //- 配信設定
      .my-4
        .d-flex.align-center.justify-space-between.mb-4
          .text-subtitle-1.font-weight-bold 配信設定

        //- 配信間隔
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-calendar-clock
            span.font-weight-medium 配信間隔
          v-radio-group(
            v-model="deliveryFrequency"
            inline
            density="compact"
            :error-messages="getFieldErrorMessages('deliveryFrequency')"
            :error="hasFieldError('deliveryFrequency')"
          )
            v-radio(
              v-for="option in deliveryFrequencyOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            )

      v-divider
      //- フィルターオプション
      .my-4
        .d-flex.align-center.justify-space-between.mb-4
          .text-subtitle-1.font-weight-bold 記事のフィルタリング設定

        //- 著者フィルター (カスタムコンポーネント)
        QiitaAuthorSelector(
          v-model="filters.authors"
          :max-authors="props.maxAuthors"
        )

        //- タグフィルター (カスタムコンポーネント)
        QiitaTagSelector(
          v-model="filters.tags"
          :max-tags="props.maxTags"
        )

        //- いいね数フィルター
        .mb-3
          .d-flex.align-center.mb-6
            v-icon(size="small" class="mr-1") mdi-thumb-up
            span.font-weight-medium いいね数
          v-slider(
            v-model="filters.likesCount"
            :min="0"
            :max="100"
            :step="5"
            show-ticks="always"
            thumb-label="always"
            color="primary"
          )

        //- 配信日フィルター
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-calendar
            span.font-weight-medium 記事公開日の範囲
            span.ml-1.error--text.text-caption (必須)
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
      .text-h6.font-weight-medium(v-if="filters.likesCount > 0")
        | 対象記事のプレビュー（いいね数フィルター設定中）
      .text-h6.font-weight-medium(v-else)
        | 対象記事のプレビュー（{{ filteredQiitaPostsTotalCount }}件）

    div(v-if="filters.likesCount > 0")
      v-card(elevation="1" color="blue-grey-lighten-5")
        v-card-text.text-center.pa-6
          v-icon(size="48" color="blue-grey" class="mb-3") mdi-information-outline
          .text-h6.text-blue-grey.mb-2 いいね数フィルター設定時のプレビューについて
          .text-body-1.text-medium-emphasis.mb-3
            | いいね数フィルター（{{ filters.likesCount }}以上）が設定されているため、
            br
            | プレビューは表示されません。
          .text-body-2.text-medium-emphasis
            | 実際の配信時には、設定された条件に一致する記事が自動的に選択されます。

    div(v-else-if="filteredQiitaPosts && filteredQiitaPosts.length === 0")
      v-card(elevation="1" color="orange-lighten-5")
        v-card-text.text-center.pa-6
          v-icon(size="48" color="orange" class="mb-3") mdi-alert-circle-outline
          .text-h6.text-orange.mb-2 該当する記事が見つかりません
          .text-body-1.text-medium-emphasis.mb-3
            | 現在の条件に一致する記事が見つかりませんでした。
          .text-body-2.text-medium-emphasis
            | フィルター条件（著者・タグ・日付範囲）を調整してみてください。

    div(v-else)
      qiita-post-list-item(
        v-for="post in filteredQiitaPosts"
        :key="post.id"
        :post="post"
      )
</template>

<script setup lang="ts">
import type { QiitaPostDto } from '@/api';
import { PersonalizedFeedWithFiltersDtoDeliveryFrequencyEnum as DeliveryFrequencyEnum } from '@/api';
import { useGetQiitaPosts } from '@/composables/qiita-api/useGetQiitaPosts';
import { defineEmits, defineProps, reactive, ref, watch } from 'vue';
import type { InputPersonalizedFeedData } from '~/types/personalized-feed';

/** 記事公開日の範囲のデフォルト値 */
const DEFAULT_DATE_RANGE: number = 7;

const props = defineProps({
  // 編集モードの場合、初期値を渡す
  initialData: {
    type: Object as () => InputPersonalizedFeedData,
    default: () => ({
      programTitle: '',
      filters: {
        authors: [],
        tags: [],
        dateRange: 7,
        likesCount: 0,
      },
      deliveryFrequency: DeliveryFrequencyEnum.Daily,
      posts: [],
      totalCount: 0,
    }),
  },
  showActionButton: {
    type: Boolean,
    default: false,
  },
  maxAuthors: {
    type: Number,
    default: 10,
  },
  maxTags: {
    type: Number,
    default: 10,
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

// 配信間隔
const deliveryFrequency = ref<DeliveryFrequencyEnum>(
  props.initialData.deliveryFrequency || DeliveryFrequencyEnum.Daily,
);
const deliveryFrequencyOptions = [{ value: DeliveryFrequencyEnum.Daily, label: '毎日' }];

// 絞り込み条件の型
interface IFilters {
  authors: string[];
  tags: string[];
  dateRange: number; // 文字列から数値に変更
  likesCount: number; // いいね数フィルターを追加
}

// 絞り込み条件
const filters = reactive<IFilters>({
  authors: [...props.initialData.filters.authors],
  tags: [...props.initialData.filters.tags],
  dateRange:
    typeof props.initialData.filters.dateRange === 'number'
      ? props.initialData.filters.dateRange
      : DEFAULT_DATE_RANGE, // 数値でない場合はデフォルト値を設定
  likesCount: props.initialData.filters.likesCount || 0, // いいね数の初期値を設定
});

// 前回のフィルター条件
const previousFilters = ref<IFilters>({
  authors: [...props.initialData.filters.authors],
  tags: [...props.initialData.filters.tags],
  dateRange:
    typeof props.initialData.filters.dateRange === 'number'
      ? props.initialData.filters.dateRange
      : DEFAULT_DATE_RANGE, // 数値でない場合はデフォルト値を設定
  likesCount: props.initialData.filters.likesCount || 0, // いいね数の前回値も設定
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
      likesCount: filters.likesCount, // いいね数フィルターを追加
    },
    posts: filteredQiitaPosts.value,
    totalCount: filteredQiitaPostsTotalCount.value,
    deliveryFrequency: deliveryFrequency.value,
  } satisfies InputPersonalizedFeedData);
};

// initialDataが変更されたときの監視処理を追加
watch(
  () => props.initialData,
  (newInitialData) => {
    console.log('initialData changed:', newInitialData);
    // 番組名を更新
    programTitle.value = newInitialData.programTitle;

    // 配信間隔を更新
    if (newInitialData.deliveryFrequency) {
      deliveryFrequency.value = newInitialData.deliveryFrequency as DeliveryFrequencyEnum;
    }

    // フィルター条件を更新
    filters.authors = [...newInitialData.filters.authors];
    filters.tags = [...newInitialData.filters.tags];
    filters.dateRange =
      typeof newInitialData.filters.dateRange === 'number'
        ? newInitialData.filters.dateRange
        : DEFAULT_DATE_RANGE;
    filters.likesCount = newInitialData.filters.likesCount || 0; // いいね数の更新

    // 前回のフィルター条件も更新
    previousFilters.value = {
      authors: [...newInitialData.filters.authors],
      tags: [...newInitialData.filters.tags],
      dateRange:
        typeof newInitialData.filters.dateRange === 'number'
          ? newInitialData.filters.dateRange
          : DEFAULT_DATE_RANGE,
      likesCount: newInitialData.filters.likesCount || 0, // いいね数の更新
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

// 配信間隔が変更されたときに親コンポーネントへ通知
watch(deliveryFrequency, (_newValue) => {
  emitFeedData();
});

// 前回 Qiita API で取得した記事リスト
const previousQiitaPosts = ref<QiitaPostDto[]>([]);

// 絞り込み条件に応じてAPIで取得した記事リスト
const filteredQiitaPosts = ref<QiitaPostDto[]>([]);

/**
 * フィルター条件が変更されたことを検知して、Qiita API で記事を取得する
 */
watch(
  [filters, programTitle, deliveryFrequency],
  () => {
    if (isFiltersChanged() && isAuthorOrTagSelected()) {
      // フィルター条件が変更された場合、Qiita API で記事を取得する
      // ただし、著者またはタグが選択されている場合のみ
      fetchQiitaPosts();
      previousFilters.value = {
        authors: [...filters.authors],
        tags: [...filters.tags],
        dateRange: filters.dateRange,
        likesCount: filters.likesCount,
      };
      emitFeedData();
    } else if (!isAuthorOrTagSelected()) {
      // 著者またはタグが選択されていない場合、フィルターをクリアする
      filteredQiitaPosts.value = [];
      previousQiitaPosts.value = [];
      filteredQiitaPostsTotalCount.value = 0;
      previousFilters.value = {
        authors: [],
        tags: [],
        dateRange: DEFAULT_DATE_RANGE,
        likesCount: 0,
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
    previousFilters.value.dateRange !== filters.dateRange ||
    previousFilters.value.likesCount !== filters.likesCount
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
  // いいね数が設定されている場合は API を呼び出さない
  if (filters.likesCount > 0) {
    filteredQiitaPosts.value = [];
    filteredQiitaPostsTotalCount.value = 0;
    return;
  }
  const result = await useGetQiitaPosts(app, filters.authors, filters.tags, filters.dateRange);
  previousQiitaPosts.value = result.posts;
  // if (filters.likesCount > 0) {
  //   // いいね数フィルターが設定されている場合、フィルタリングを行う
  //   filteredQiitaPosts.value = result.posts.filter(
  //     (post) => post.likes_count >= filters.likesCount,
  //   );
  //   filteredQiitaPostsTotalCount.value = filteredQiitaPosts.value.length;
  // } else {
  filteredQiitaPosts.value = result.posts;
  filteredQiitaPostsTotalCount.value = result.totalCount;
  // }
};

// フィルターをクリアする関数
const clearFilters = (): void => {
  filters.authors = [];
  filters.tags = [];
  filters.dateRange = 7;
  filters.likesCount = 0; // いいね数もリセット
};

// 日付範囲のリスト（日数指定）
// 値は公開日から何日前までの記事を取得するかを表す数値
const dateRanges = [
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
