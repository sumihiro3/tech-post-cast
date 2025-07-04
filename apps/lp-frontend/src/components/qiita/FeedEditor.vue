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
          :error-messages="getFieldErrors('programTitle')"
          :error="hasFieldError('programTitle')"
        )
        //- 警告メッセージ表示
        v-alert(
          v-if="hasFieldWarning('programTitle')"
          type="warning"
          density="compact"
          class="mt-2"
        )
          ul.mb-0
            li(v-for="warning in getFieldWarnings('programTitle')" :key="warning") {{ warning }}

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
            :error-messages="getFieldErrors('deliveryFrequency')"
            :error="hasFieldError('deliveryFrequency')"
          )
            v-radio(
              v-for="option in deliveryFrequencyOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            )

        //- 話者モード選択
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-account-voice
            span.font-weight-medium 話者モード
          v-radio-group(
            v-model="speakerMode"
            inline
            density="compact"
            :error-messages="getFieldErrors('speakerMode')"
            :error="hasFieldError('speakerMode')"
            :disabled="!canUseMultiSpeakerMode"
          )
            v-radio(
              v-for="option in speakerModeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              :disabled="option.value === SpeakerModeEnum.Multi && !canUseMultiSpeakerMode"
            )

          //- 複数話者モード無効時の説明
          v-alert(
            v-if="!canUseMultiSpeakerMode"
            type="info"
            density="compact"
            class="mt-2"
          )
            | 複数話者モード（対話形式）は現在ご利用いただけません。単一話者モード（ナレーション形式）で番組を作成します。

      v-divider
      //- フィルターオプション
      .my-4
        .d-flex.align-center.justify-space-between.mb-4
          .text-subtitle-1.font-weight-bold 記事のフィルタリング設定

        //- 著者フィルター (カスタムコンポーネント)
        .mb-3
          QiitaAuthorSelector(
            v-model="filters.authors"
            :max-authors="props.maxAuthors"
            :error-messages="getFieldErrors('authors')"
            :error="hasFieldError('authors')"
          )
          //- 警告メッセージ表示
          v-alert(
            v-if="hasFieldWarning('authors')"
            type="warning"
            density="compact"
            class="mt-2"
          )
            ul.mb-0
              li(v-for="warning in getFieldWarnings('authors')" :key="warning") {{ warning }}

        //- タグフィルター (カスタムコンポーネント)
        .mb-3
          QiitaTagSelector(
            v-model="filters.tags"
            :max-tags="props.maxTags"
            :error-messages="getFieldErrors('tags')"
            :error="hasFieldError('tags')"
          )
          //- 警告メッセージ表示
          v-alert(
            v-if="hasFieldWarning('tags')"
            type="warning"
            density="compact"
            class="mt-2"
          )
            ul.mb-0
              li(v-for="warning in getFieldWarnings('tags')" :key="warning") {{ warning }}

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
            :error="hasFieldError('likesCount')"
          )
          //- エラーメッセージ表示
          .text-error.text-caption.mt-1(v-if="hasFieldError('likesCount')")
            div(v-for="error in getFieldErrors('likesCount')" :key="error") {{ error }}
          //- 警告メッセージ表示
          v-alert(
            v-if="hasFieldWarning('likesCount')"
            type="warning"
            density="compact"
            class="mt-2"
          )
            ul.mb-0
              li(v-for="warning in getFieldWarnings('likesCount')" :key="warning") {{ warning }}

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
            :error="hasFieldError('dateRange')"
          )
            v-chip(
              v-for="range in dateRanges"
              :key="range.value"
              :value="range.value"
              filter
              variant="elevated"
              size="small"
            ) {{ range.label }}
          //- エラーメッセージ表示
          .text-error.text-caption.mt-1(v-if="hasFieldError('dateRange')")
            div(v-for="error in getFieldErrors('dateRange')" :key="error") {{ error }}
          //- 警告メッセージ表示
          v-alert(
            v-if="hasFieldWarning('dateRange')"
            type="warning"
            density="compact"
            class="mt-2"
          )
            ul.mb-0
              li(v-for="warning in getFieldWarnings('dateRange')" :key="warning") {{ warning }}

        //- フィルター組み合わせの警告
        v-alert(
          v-if="hasFieldWarning('filterCombination')"
          type="warning"
          density="compact"
          class="mt-4"
        )
          .font-weight-medium フィルター設定について
          ul.mb-0.mt-2
            li(v-for="warning in getFieldWarnings('filterCombination')" :key="warning") {{ warning }}

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
            :disabled="!isValidationPassed"
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

      //- バリデーション状態表示
      v-row(v-if="showValidationStatus" justify="center")
        v-col(cols="12" class="text-center")
          v-chip(
            :color="isValidationPassed ? 'success' : 'error'"
            :prepend-icon="isValidationPassed ? 'mdi-check-circle' : 'mdi-alert-circle'"
            size="small"
            class="mt-2"
          ) {{ isValidationPassed ? 'バリデーション通過' : 'バリデーションエラーあり' }}

          v-chip(
            v-if="hasValidationWarnings"
            color="warning"
            prepend-icon="mdi-alert-outline"
            size="small"
            class="mt-2 ml-2"
          ) 警告あり

  //- フィルターされた記事のプレビューリスト
  div
    .d-flex.align-center.mb-4
      .text-h6.font-weight-medium(v-if="filters.likesCount > 0")
        | 対象記事のプレビュー（いいね数{{ filters.likesCount }}以上）
        span.text-caption.text-medium-emphasis.ml-2(v-if="filteredQiitaPostsTotalCount === -1")
          | ※最大5件表示・さらに記事があります
        span.text-caption.text-medium-emphasis.ml-2(v-else-if="filteredQiitaPosts.length > 0")
          | ※最大5件表示・{{ filteredQiitaPosts.length }}件見つかりました
      .text-h6.font-weight-medium(v-else)
        | 対象記事のプレビュー（{{ filteredQiitaPostsTotalCount }}件）

    //- いいね数フィルター設定時の情報アラート
    v-alert(
      v-if="filters.likesCount > 0"
      type="info"
      density="compact"
      class="mb-4"
    )
      .d-flex.align-center
        v-icon(size="small" class="mr-2") mdi-information-outline
        .text-body-2
          | いいね数フィルター（{{ filters.likesCount }}以上）設定時は、条件に一致する記事を段階的に検索して表示しています。

    //- いいね数フィルタリング中のローディング表示
    div(v-if="filters.likesCount > 0 && isLikesFilterLoading")
      v-card(elevation="1" color="blue-grey-lighten-5")
        v-card-text.text-center.pa-6
          v-progress-circular(
            indeterminate
            color="primary"
            size="48"
            class="mb-3"
          )
          .text-h6.text-blue-grey.mb-2 記事を検索中...
          .text-body-1.text-medium-emphasis.mb-3
            | いいね数{{ filters.likesCount }}以上の記事を検索しています。
          .text-body-2.text-medium-emphasis
            | しばらくお待ちください。

    //- いいね数フィルター設定時で記事が見つからない場合（ローディング中は表示しない）
    div(v-else-if="filters.likesCount > 0 && !isLikesFilterLoading && filteredQiitaPosts.length === 0")
      v-card(elevation="1" color="orange-lighten-5")
        v-card-text.text-center.pa-6
          v-icon(size="48" color="orange" class="mb-3") mdi-alert-circle-outline
          .text-h6.text-orange.mb-2 条件に一致する記事が見つかりません
          .text-body-1.text-medium-emphasis.mb-3
            | いいね数{{ filters.likesCount }}以上の記事が見つかりませんでした。
          .text-body-2.text-medium-emphasis
            | いいね数の条件を下げるか、他のフィルター条件（著者・タグ・日付範囲）を調整してみてください。

    //- 通常フィルター時で記事が見つからない場合
    div(v-else-if="filters.likesCount === 0 && filteredQiitaPosts && filteredQiitaPosts.length === 0")
      v-card(elevation="1" color="orange-lighten-5")
        v-card-text.text-center.pa-6
          v-icon(size="48" color="orange" class="mb-3") mdi-alert-circle-outline
          .text-h6.text-orange.mb-2 該当する記事が見つかりません
          .text-body-1.text-medium-emphasis.mb-3
            | 現在の条件に一致する記事が見つかりませんでした。
          .text-body-2.text-medium-emphasis
            | フィルター条件（著者・タグ・日付範囲）を調整してみてください。

    //- 記事が見つかった場合の表示
    div(v-else-if="filteredQiitaPosts && filteredQiitaPosts.length > 0")
      qiita-post-list-item(
        v-for="post in filteredQiitaPosts"
        :key="post.id"
        :post="post"
      )
</template>

<script setup lang="ts">
import {
  PersonalizedFeedWithFiltersDtoDeliveryFrequencyEnum as DeliveryFrequencyEnum,
  PersonalizedFeedWithFiltersDtoSpeakerModeEnum as SpeakerModeEnum,
  type QiitaPostDto,
} from '@/api';
import { useUserSettings } from '@/composables/dashboard/useUserSettings';
import {
  useGetQiitaPosts,
  useGetQiitaPostsWithLikesFilter,
} from '@/composables/qiita-api/useGetQiitaPosts';
import { useFeedValidation } from '@/composables/validation/useFeedValidation';
import { computed, defineEmits, defineProps, onMounted, reactive, ref, watch } from 'vue';
import type { InputPersonalizedFeedData } from '~/types/personalized-feed';

/** 記事公開日の範囲のデフォルト値 */
const DEFAULT_DATE_RANGE: number = 7;

// 日付範囲のリスト（日数指定）
// 値は公開日から何日前までの記事を取得するかを表す数値
const dateRanges = [
  { value: 7, label: '1週間以内' },
  { value: 30, label: '1ヶ月以内' },
  { value: 90, label: '3ヶ月以内' },
  { value: 180, label: '6ヶ月以内' },
  { value: 365, label: '1年以内' },
];

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
  // フィールドエラーを追加（後方互換性のため残す）
  fieldErrors: {
    type: Object as () => Record<string, string[]>,
    default: () => ({}),
  },
  // バリデーション状態表示フラグ
  showValidationStatus: {
    type: Boolean,
    default: true,
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

// 話者モード選択
const speakerMode = ref<SpeakerModeEnum>(props.initialData.speakerMode || SpeakerModeEnum.Single);
const speakerModeOptions = [
  { value: SpeakerModeEnum.Single, label: '単一話者モード' },
  { value: SpeakerModeEnum.Multi, label: '複数話者モード' },
];

// ユーザー設定から複数話者モードの利用可否を取得
const { settings, fetchSettings } = useUserSettings();
const canUseMultiSpeakerMode = computed(() => settings.value.personalizedProgramDialogueEnabled);

// コンポーネント初期化時にユーザー設定を取得
onMounted(async () => {
  try {
    await fetchSettings();
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
  }

  // 初期値がある場合は、初期表示時に記事を取得
  if (isAuthorOrTagSelected()) {
    fetchQiitaPosts();
  }
});

// 絞り込み条件の型
interface IFilters {
  authors: string[];
  tags: string[];
  dateRange: number;
  likesCount: number;
}

// 絞り込み条件
const filters = reactive<IFilters>({
  authors: [...props.initialData.filters.authors],
  tags: [...props.initialData.filters.tags],
  dateRange:
    typeof props.initialData.filters.dateRange === 'number' &&
    dateRanges.some((range) => range.value === props.initialData.filters.dateRange)
      ? props.initialData.filters.dateRange
      : DEFAULT_DATE_RANGE,
  likesCount: props.initialData.filters.likesCount || 0,
});

// 前回 Qiita API で取得した記事リスト
const previousQiitaPosts = ref<QiitaPostDto[]>([]);

// 絞り込み条件に応じてAPIで取得した記事リスト
const filteredQiitaPosts = ref<QiitaPostDto[]>([]);

// フィルターを適用した記事の総数
const filteredQiitaPostsTotalCount = ref<number>(0);

// いいね数フィルタリング中のローディング状態
const isLikesFilterLoading = ref<boolean>(false);

// フィードデータをリアクティブに管理
const feedData = computed<InputPersonalizedFeedData>(() => ({
  programTitle: programTitle.value,
  filters: {
    authors: filters.authors,
    tags: filters.tags,
    dateRange: filters.dateRange,
    likesCount: filters.likesCount,
  },
  deliveryFrequency: deliveryFrequency.value,
  speakerMode: speakerMode.value,
  posts: filteredQiitaPosts.value,
  totalCount: filteredQiitaPostsTotalCount.value,
}));

// バリデーション機能を統合
const {
  validationResult: _validationResult,
  isValidating: _isValidating,
  getFieldErrors: getValidationFieldErrors,
  getFieldWarnings,
  hasFieldError: hasValidationFieldError,
  hasFieldWarning,
  isValid: isValidationValid,
  hasWarnings: hasValidationWarnings,
} = useFeedValidation(feedData, {
  realtime: true,
  debounceDelay: 500,
  maxTags: props.maxTags,
  maxAuthors: props.maxAuthors,
});

// バリデーション状態の計算プロパティ
const isValidationPassed = computed(() => {
  // 新しいバリデーション結果と従来のisValidプロパティの両方をチェック
  return isValidationValid.value && props.isValid;
});

// フィールドエラー取得（新しいバリデーションと従来のfieldErrorsを統合）
const getFieldErrors = (field: string): string[] => {
  const validationErrors = getValidationFieldErrors(field);
  const propsErrors = props.fieldErrors[field] || [];
  return [...validationErrors, ...propsErrors];
};

// フィールドエラー判定（新しいバリデーションと従来のfieldErrorsを統合）
const hasFieldError = (field: string): boolean => {
  return hasValidationFieldError(field) || !!props.fieldErrors[field]?.length;
};

// 前回のフィルター条件
const previousFilters = ref<IFilters>({
  authors: [...props.initialData.filters.authors],
  tags: [...props.initialData.filters.tags],
  dateRange:
    typeof props.initialData.filters.dateRange === 'number' &&
    dateRanges.some((range) => range.value === props.initialData.filters.dateRange)
      ? props.initialData.filters.dateRange
      : DEFAULT_DATE_RANGE,
  likesCount: props.initialData.filters.likesCount || 0,
});

// 著者またはタグが選択されているかどうか
const isAuthorOrTagSelected = (): boolean => {
  return filters.authors.length > 0 || filters.tags.length > 0;
};

// フィードのデータを親コンポーネントに通知
const emitFeedData = (): void => {
  emit('update:feedData', feedData.value);
};

/**
 * 2つの配列が等しいかどうかを比較
 */
const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
};

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
 * Qiita API で条件に応じた記事を取得する
 */
const fetchQiitaPosts = async (): Promise<void> => {
  try {
    if (filters.likesCount > 0) {
      // いいね数フィルターが設定されている場合
      isLikesFilterLoading.value = true;
      console.log('Fetching posts with likes filter:', filters.likesCount);
      const result = await useGetQiitaPostsWithLikesFilter(
        app,
        filters.authors,
        filters.tags,
        filters.dateRange,
        filters.likesCount,
        5, // 最大5件まで表示
      );

      filteredQiitaPosts.value = result.posts;
      // いいね数フィルター時は正確な総数が分からないため、特別な表示にする
      // hasMoreがtrueの場合は-1を設定して「さらに記事があります」表示用
      filteredQiitaPostsTotalCount.value = result.hasMore ? -1 : result.totalCount;

      console.log('Posts fetched with likes filter:', {
        postsCount: result.posts.length,
        hasMore: result.hasMore,
        reachedMaxPages: result.reachedMaxPages,
      });
      isLikesFilterLoading.value = false;
    } else {
      // 通常のフィルター処理（いいね数フィルターなし）
      console.log('Fetching posts without likes filter');
      const result = await useGetQiitaPosts(app, filters.authors, filters.tags, filters.dateRange);
      filteredQiitaPosts.value = result.posts;
      filteredQiitaPostsTotalCount.value = result.totalCount;

      console.log('Posts fetched:', {
        postsCount: result.posts.length,
        totalCount: result.totalCount,
      });
    }

    previousQiitaPosts.value = filteredQiitaPosts.value;
  } catch (error) {
    console.error('Failed to fetch Qiita posts:', error);
    filteredQiitaPosts.value = [];
    filteredQiitaPostsTotalCount.value = 0;
    // エラー時は空の配列を設定
    previousQiitaPosts.value = [];
    isLikesFilterLoading.value = false;
  }
};

// フィルターをクリアする関数
const clearFilters = (): void => {
  filters.authors = [];
  filters.tags = [];
  filters.dateRange = 7;
  filters.likesCount = 0;
};

// アクションボタンのクリックイベントハンドラー
const handleActionButtonClick = (): void => {
  emit('actionButtonClick');
};

// 複数話者モードの利用可否が変更された場合の処理
watch(canUseMultiSpeakerMode, (newCanUse) => {
  // 複数話者モードが無効になった場合は単一話者モードに強制変更
  if (!newCanUse && speakerMode.value === SpeakerModeEnum.Multi) {
    speakerMode.value = SpeakerModeEnum.Single;
  }
});

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

    // 話者モードを更新
    if (newInitialData.speakerMode) {
      speakerMode.value = newInitialData.speakerMode as SpeakerModeEnum;
    }

    // フィルター条件を更新
    filters.authors = [...newInitialData.filters.authors];
    filters.tags = [...newInitialData.filters.tags];
    filters.dateRange =
      typeof newInitialData.filters.dateRange === 'number' &&
      dateRanges.some((range) => range.value === newInitialData.filters.dateRange)
        ? newInitialData.filters.dateRange
        : DEFAULT_DATE_RANGE;
    filters.likesCount = newInitialData.filters.likesCount || 0;

    // 前回のフィルター条件も更新
    previousFilters.value = {
      authors: [...newInitialData.filters.authors],
      tags: [...newInitialData.filters.tags],
      dateRange:
        typeof newInitialData.filters.dateRange === 'number' &&
        dateRanges.some((range) => range.value === newInitialData.filters.dateRange)
          ? newInitialData.filters.dateRange
          : DEFAULT_DATE_RANGE,
      likesCount: newInitialData.filters.likesCount || 0,
    };

    // 初期値がある場合は記事を取得
    if (isAuthorOrTagSelected()) {
      fetchQiitaPosts();
    }
  },
  { deep: true, immediate: true },
);

// 番組名が変更されたときに独立して親コンポーネントへ通知
watch(programTitle, () => {
  emitFeedData();
});

// 配信間隔が変更されたときに親コンポーネントへ通知
watch(deliveryFrequency, () => {
  emitFeedData();
});

// 話者モードが変更されたときに親コンポーネントへ通知
watch(speakerMode, () => {
  emitFeedData();
});

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
