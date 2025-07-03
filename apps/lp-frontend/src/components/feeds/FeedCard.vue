<template lang="pug">
v-card.feed-card(elevation="2" class="mb-4" :class="{ 'feed-card--inactive': !feed.isActive }")
  //- バッジエリア（モバイル対応）
  .feed-card__badges.d-flex.d-sm-none.justify-space-between.pa-2
    v-chip(
      :color="getFeedStatusColor(feed.isActive)"
      size="x-small"
      variant="flat"
    )
      v-icon(start size="x-small") {{ feed.isActive ? 'mdi-check-circle' : 'mdi-pause-circle' }}
      | {{ getFeedStatusText(feed.isActive) }}

    v-chip(
      :color="getDeliveryFrequencyColor(feed.deliveryFrequency)"
      size="x-small"
      variant="tonal"
    )
      v-icon(start size="x-small") {{ getDeliveryFrequencyIcon(feed.deliveryFrequency) }}
      | {{ getDeliveryFrequencyLabel(feed.deliveryFrequency) }}

  //- ステータスバッジ（デスクトップ - 左上）
  v-chip.feed-card__status-badge.d-none.d-sm-flex(
    :color="getFeedStatusColor(feed.isActive)"
    size="x-small"
    variant="flat"
  )
    v-icon(start size="x-small") {{ feed.isActive ? 'mdi-check-circle' : 'mdi-pause-circle' }}
    | {{ getFeedStatusText(feed.isActive) }}

  //- 配信間隔バッジ（デスクトップ - 右上）
  v-chip.feed-card__frequency-badge.d-none.d-sm-flex(
    :color="getDeliveryFrequencyColor(feed.deliveryFrequency)"
    size="x-small"
    variant="tonal"
  )
    v-icon(start size="x-small") {{ getDeliveryFrequencyIcon(feed.deliveryFrequency) }}
    | {{ getDeliveryFrequencyLabel(feed.deliveryFrequency) }}

  v-card-title.pb-2(:class="{ 'pt-8': $vuetify.display.smAndUp, 'pt-2': $vuetify.display.xs }")
    .d-flex.align-center(:class="{ 'ml-16': $vuetify.display.smAndUp }")
      .feed-card__title {{ feed.name }}

  v-card-text.pt-0
    //- フィルター条件の概要
    .feed-card__filters.mb-3
      .text-caption.text-medium-emphasis.mb-1 フィルター条件
      .d-flex.flex-wrap.gap-1
        //- 1. 著者フィルター
        v-chip(
          v-if="filterSummary.authorCount > 0"
          size="x-small"
          variant="outlined"
          color="secondary"
        )
          v-icon(start size="x-small") mdi-account-multiple
          | 著者 {{ filterSummary.authorCount }}件

        //- 2. タグフィルター
        v-chip(
          v-if="filterSummary.tagCount > 0"
          size="x-small"
          variant="outlined"
          color="primary"
        )
          v-icon(start size="x-small") mdi-tag-multiple
          | タグ {{ filterSummary.tagCount }}件

        //- 3. いいね数フィルター
        v-chip(
          v-if="filterSummary.hasLikesFilter"
          size="x-small"
          variant="outlined"
          color="warning"
        )
          v-icon(start size="x-small") mdi-thumb-up
          | いいね数

        //- 4. 日付範囲フィルター
        v-chip(
          v-if="filterSummary.hasDateFilter"
          size="x-small"
          variant="outlined"
          color="info"
        )
          v-icon(start size="x-small") mdi-calendar-range
          | 日付範囲

        v-chip(
          v-if="filterSummary.totalFilters === 0"
          size="x-small"
          variant="outlined"
          color="grey"
        )
          v-icon(start size="x-small") mdi-filter-off
          | フィルターなし

    //- デバッグ情報（開発時のみ表示）
    .feed-card__debug.mb-2(v-if="$nuxt.isDev")
      .text-caption.text-grey
        | Debug: {{ JSON.stringify(filterSummary) }}
      .text-caption.text-grey
        | FilterConfig: {{ JSON.stringify(feed.filterConfig) }}
      .text-caption.text-grey
        | Feed Keys: {{ Object.keys(feed) }}

    //- 最終更新日時
    .feed-card__updated.mb-2
      .d-flex.align-center
        v-icon.mr-1(size="small" color="grey") mdi-clock-outline
        span.text-caption.text-medium-emphasis 最終更新: {{ formatRelativeTime(feed.updatedAt) }}

    //- 作成日時
    .feed-card__created
      .d-flex.align-center
        v-icon.mr-1(size="small" color="grey") mdi-calendar-plus
        span.text-caption.text-medium-emphasis 作成: {{ formatRelativeTime(feed.createdAt) }}

  v-card-actions.pt-0
    v-spacer

    //- 編集ボタン
    v-btn(
      color="primary"
      variant="elevated"
      size="small"
      @click="navigateToEdit"
    )
      v-icon(start size="small") mdi-pencil
      | 編集
</template>

<script setup lang="ts">
import type { PersonalizedFeedWithFiltersDto } from '@/api';
import {
  extractFilterSummary,
  formatRelativeTime,
  getDeliveryFrequencyColor,
  getDeliveryFrequencyIcon,
  getDeliveryFrequencyLabel,
  getFeedStatusColor,
  getFeedStatusText,
} from '@/utils/feed-utils';
import { computed } from 'vue';

const props = defineProps<{
  feed: PersonalizedFeedWithFiltersDto;
}>();

/**
 * フィルター条件の概要情報
 */
const filterSummary = computed(() => {
  // フィード全体を渡してfilterGroupsとfilterConfigの両方を解析
  return extractFilterSummary(props.feed);
});

/**
 * 編集ページに移動する
 */
const navigateToEdit = (): void => {
  navigateTo(`/app/feeds/${props.feed.id}/edit`);
};
</script>

<style scoped>
.feed-card {
  position: relative;
  transition: all 0.3s ease;
}

.feed-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.feed-card--inactive {
  opacity: 0.7;
}

.feed-card__badges {
  border-bottom: 1px solid #e0e0e0;
}

.feed-card__status-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.feed-card__frequency-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.feed-card__title {
  font-weight: 600;
  line-height: 1.2;
  word-break: break-word;
  flex: 1;
}

.feed-card__filters {
  border-left: 3px solid #e0e0e0;
  padding-left: 12px;
}

.feed-card__debug {
  font-size: 0.7rem;
  background-color: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.feed-card__updated,
.feed-card__created {
  font-size: 0.75rem;
}

.gap-1 {
  gap: 4px;
}
</style>
