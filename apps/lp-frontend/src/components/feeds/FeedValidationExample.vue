<template lang="pug">
v-container
  v-row
    v-col(cols="12")
      h2 フィードバリデーション使用例

      //- プラン選択
      v-select(
        v-model="selectedPlan"
        :items="planOptions"
        label="プラン選択"
        item-title="name"
        item-value="value"
        @update:model-value="updateLimits"
      )

      //- 現在の制限値表示
      v-alert(type="info" class="mb-4")
        | 現在の制限: タグ最大{{ maxTags }}個、著者最大{{ maxAuthors }}人

      //- フィード設定フォーム
      v-form
        v-text-field(
          v-model="feedData.programTitle"
          label="番組タイトル"
          :error-messages="getFieldErrors('programTitle')"
          :hint="getFieldWarnings('programTitle').join(', ')"
          persistent-hint
        )

        v-combobox(
          v-model="feedData.filters.tags"
          label="タグフィルター"
          multiple
          chips
          :error-messages="getFieldErrors('tags')"
          :hint="getFieldWarnings('tags').join(', ')"
          persistent-hint
        )

        v-combobox(
          v-model="feedData.filters.authors"
          label="著者フィルター"
          multiple
          chips
          :error-messages="getFieldErrors('authors')"
          :hint="getFieldWarnings('authors').join(', ')"
          persistent-hint
        )

        v-slider(
          v-model="feedData.filters.likesCount"
          label="最小いいね数"
          min="0"
          max="1000"
          step="10"
          thumb-label
          :error-messages="getFieldErrors('likesCount')"
          :hint="getFieldWarnings('likesCount').join(', ')"
          persistent-hint
        )

        v-select(
          v-model="feedData.filters.dateRange"
          :items="dateRangeOptions"
          label="記事公開日範囲"
          :error-messages="getFieldErrors('dateRange')"
          :hint="getFieldWarnings('dateRange').join(', ')"
          persistent-hint
        )

      //- バリデーション結果表示
      v-card(class="mt-4")
        v-card-title バリデーション結果
        v-card-text
          v-chip(
            :color="isValid ? 'success' : 'error'"
            :prepend-icon="isValid ? 'mdi-check' : 'mdi-alert'"
          ) {{ isValid ? 'バリデーション通過' : 'バリデーションエラー' }}

          v-chip(
            v-if="hasWarnings"
            color="warning"
            prepend-icon="mdi-alert-outline"
            class="ml-2"
          ) 警告あり

          v-chip(
            v-if="isValidating"
            color="info"
            prepend-icon="mdi-loading"
            class="ml-2"
          ) バリデーション中...

          //- エラー詳細
          v-expansion-panels(v-if="!isValid" class="mt-4")
            v-expansion-panel(title="エラー詳細")
              v-expansion-panel-text
                div(v-for="(errors, field) in validationResult.errors" :key="field")
                  strong {{ getFieldLabel(field) }}:
                  ul
                    li(v-for="error in errors" :key="error") {{ error }}

          //- 警告詳細
          v-expansion-panels(v-if="hasWarnings" class="mt-4")
            v-expansion-panel(title="警告詳細")
              v-expansion-panel-text
                div(v-for="(warnings, field) in validationResult.warnings" :key="field")
                  strong {{ getFieldLabel(field) }}:
                  ul
                    li(v-for="warning in warnings" :key="warning") {{ warning }}
</template>

<script setup lang="ts">
import { useFeedValidation } from '@/composables/validation/useFeedValidation';
import type { InputPersonalizedFeedData } from '@/types/personalized-feed';
import { reactive, ref } from 'vue';

// プランオプション
const planOptions = [
  { name: 'フリープラン', value: 'free', maxTags: 3, maxAuthors: 2 },
  { name: 'ベーシックプラン', value: 'basic', maxTags: 10, maxAuthors: 5 },
  { name: 'プレミアムプラン', value: 'premium', maxTags: 20, maxAuthors: 10 },
];

// 選択されたプラン
const selectedPlan = ref('basic');

// 制限値
const maxTags = ref(10);
const maxAuthors = ref(5);

// 日付範囲オプション
const dateRangeOptions = [
  { title: '1日以内', value: 1 },
  { title: '3日以内', value: 3 },
  { title: '1週間以内', value: 7 },
  { title: '2週間以内', value: 14 },
  { title: '1ヶ月以内', value: 30 },
];

// フィードデータ
const feedData = reactive<InputPersonalizedFeedData>({
  programTitle: '',
  filters: {
    tags: [],
    authors: [],
    likesCount: 0,
    dateRange: 7,
  },
});

// バリデーション
const { validationResult, isValidating, getFieldErrors, getFieldWarnings, isValid, hasWarnings } =
  useFeedValidation(ref(feedData), {
    realtime: true,
    debounceDelay: 500,
    maxTags: maxTags.value,
    maxAuthors: maxAuthors.value,
  });

/**
 * プラン変更時の制限値更新
 */
const updateLimits = (planValue: string): void => {
  const plan = planOptions.find((p) => p.value === planValue);
  if (plan) {
    maxTags.value = plan.maxTags;
    maxAuthors.value = plan.maxAuthors;
  }
};

/**
 * フィールドラベル取得
 */
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    programTitle: '番組タイトル',
    tags: 'タグフィルター',
    authors: '著者フィルター',
    likesCount: 'いいね数フィルター',
    dateRange: '日付範囲フィルター',
    filterCombination: 'フィルター組み合わせ',
  };
  return labels[field] || field;
};
</script>
