<template lang="pug">
v-container.max-width-container
  v-row(justify="center")
    v-col(cols="12")
      .text-center.text-h4.font-weight-bold.mb-6 パーソナライズ番組設定

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
          hide-details
          class="mb-8"
        )

      v-divider
      //- フィルターオプション
      .my-4
        .d-flex.align-center.justify-space-between.mb-4
          .text-subtitle-1.font-weight-bold 記事のフィルタリング設定

        //- 著者フィルター (コンボボックス)
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-account
            span.font-weight-medium 著者
          v-select(
            v-model="filters.authors"
            :items="allAuthors"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            label="著者を選択..."
            class="mb-4"
          )

        //- タグフィルター (コンボボックス)
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-tag
            span.font-weight-medium タグ
          v-select(
            v-model="filters.tags"
            :items="allTags"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="comfortable"
            label="タグを選択..."
            class="mb-4"
          )

        //- 配信日フィルター
        .mb-3
          .d-flex.align-center.mb-2
            v-icon(size="small" class="mr-1") mdi-calendar
            span.font-weight-medium 配信日
          v-chip-group(
            v-model="filters.dateRange"
            mandatory
            selected-class="primary"
          )
            v-chip(
              v-for="range in dateRanges"
              :key="range"
              :value="range"
              filter
              variant="elevated"
              size="small"
            ) {{ range }}

  //- フィルターされた記事のプレビューリスト
  div
    .d-flex.align-center.mb-4
      .text-h6.font-weight-medium 対象記事のプレビュ（{{ filteredQiitaPostsTotalCount }}件）

    div(v-if="filteredQiitaPosts && filteredQiitaPosts.length === 0")
      v-card.text-center.pa-4
        .text-body-1.text-medium-emphasis 条件に一致する記事が見つかりませんでした。
        v-btn(
          variant="text"
          color="primary"
          class="mt-2"
          @click="clearFilters"
        ) フィルターをクリア

    qiita-post-list-item(
      v-for="post in filteredQiitaPosts"
      :key="post.id"
      :post="post"
    )
</template>

<script setup lang="ts">
import type { QiitaPostDto } from '@/api';
import { useGetQiitaPosts } from '@/composables/qiita-api/useGetQiitaPosts';
import { reactive, ref } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

const app = useNuxtApp();

// 番組名
const programTitle = ref('');

// 絞り込み条件の型
interface IFilters {
  authors: string[];
  tags: string[];
  dateRange: string;
}

// 絞り込み条件
const filters = reactive<IFilters>({
  authors: [],
  tags: [],
  dateRange: 'すべて',
});

// 前回のフィルター条件
const previousFilters = ref<IFilters>({
  authors: [],
  tags: [],
  dateRange: 'すべて',
});

// 絞り込み条件に応じてAPIで取得した記事リスト
const filteredQiitaPosts = ref<QiitaPostDto[]>([]);

// フィルターを適用した記事の総数
const filteredQiitaPostsTotalCount = ref<number>(0);

/**
 * フィルター条件が変更されたことを検知して、Qiita API で記事を取得する
 */
watch(
  filters,
  () => {
    if (isFiltersChanged()) {
      fetchQiitaPosts();
      previousFilters.value = {
        authors: filters.authors,
        tags: filters.tags,
        dateRange: filters.dateRange,
      };
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
    previousFilters.value.authors !== filters.authors
    || previousFilters.value.tags !== filters.tags
    || previousFilters.value.dateRange !== filters.dateRange
  );
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
  programTitle.value = '';
  filters.authors = [];
  filters.tags = [];
  filters.dateRange = 'すべて';
};

// 著者のリスト
// TODO APIから取得する
const allAuthors = ['sumihiro3', 'Domao', 'MS-0610'];

// タグのリスト
// TODO APIから取得する
const allTags = ['nuxt3', 'typescript', 'vue3'];

// 日付範囲のリスト
const dateRanges = ['すべて', '今日', '今週', '今月', '今年'];
</script>

<style scoped>
.max-width-container {
  max-width: 900px;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
