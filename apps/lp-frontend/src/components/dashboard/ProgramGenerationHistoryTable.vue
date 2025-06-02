<template lang="pug">
//- eslint-disable vue/valid-v-slot
v-card
  v-card-title.d-flex.align-center.justify-space-between
    .d-flex.align-center
      v-icon.me-2 mdi-history
      | 番組生成履歴

  //- フィルター（パーソナルフィードが2件以上の場合のみ表示）
  v-card-text(v-if="shouldShowFilter")
    v-row
      v-col(cols="12" md="6")
        v-select(
          v-model="selectedFeedId"
          :items="feedOptions"
          item-title="name"
          item-value="id"
          label="フィードでフィルター"
          clearable
          variant="outlined"
          density="compact"
          @update:model-value="setFeedFilter"
        )
          template(#prepend-inner)
            v-icon mdi-filter
      v-col.d-flex.align-center(cols="12" md="6")
        v-btn(
          v-if="selectedFeedId"
          variant="outlined"
          size="small"
          @click="clearFilters"
        )
          v-icon(start) mdi-filter-remove
          | フィルタークリア
        v-spacer
        v-chip(
          v-if="totalCount > 0"
          variant="outlined"
          size="small"
        ) 総件数: {{ totalCount }}

  //- テーブル
  v-data-table(
    :headers="headers"
    :items="history"
    :loading="isLoading"
    :items-per-page="itemsPerPage"
    :page="currentPage"
    hide-default-footer
    class="elevation-0"
  )
    //- 実行日付
    template(#item.createdAt="{ item }")
      span.text-body-2 {{ formatDate(item.createdAt) }}

    //- フィード名（編集画面へのリンク付き）
    template(#item.feed="{ item }")
      .d-flex.align-center
        v-icon.me-2(size="small") mdi-rss
        v-btn(
          :to="`/app/feeds/${getFeedId(item.feed)}/edit`"
          variant="text"
          size="small"
          color="primary"
          class="pa-0"
          style="min-width: auto; text-transform: none;"
        ) {{ getFeedName(item.feed) }}

    //- ステータス
    template(#item.status="{ item }")
      v-chip(
        :color="getStatusColor(item.status)"
        size="small"
        variant="flat"
      ) {{ getStatusText(item.status) }}

    //- 理由（日本語表記）
    template(#item.reason="{ item }")
      span.text-body-2.text-medium-emphasis(v-if="item.reason") {{ getReasonText(item.reason) }}
      span.text-disabled(v-else) -

    //- 番組
    template(#item.program="{ item }")
      div(v-if="item.program && item.status === 'SUCCESS'")
        //- 有効期限内の場合はリンクを表示
        v-btn(
          v-if="isProgramLinkEnabled(item.program)"
          :to="`/app/programs/${getProgramId(item.program)}`"
          variant="text"
          size="default"
          color="primary"
          style="text-transform: none; font-size: 0.875rem;"
        )
          v-icon(start size="small") mdi-play
          | {{ getProgramTitle(item.program) }}
        //- 期限切れの場合は黒色で表示
        div(v-else)
          v-btn(
            variant="text"
            size="default"
            disabled
            style="color: rgba(0, 0, 0, 0.87) !important; text-transform: none; font-size: 0.875rem;"
          )
            v-icon(start size="small") mdi-play-disabled
            | {{ getProgramTitle(item.program) }}
          .text-caption.text-error.mt-1.text-right {{ formatExpirationDate(getProgramExpiresAt(item.program)) }}
      span.text-disabled(v-else) -

    //- 記事数（最後の列）
    template(#item.postCount="{ item }")
      .d-flex.align-center.justify-end
        v-icon.me-1(size="small") mdi-file-document-multiple
        span.text-body-2 {{ item.postCount }}

    //- 空の状態
    template(#no-data)
      .text-center.py-8
        v-icon(size="64" color="grey-lighten-2") mdi-history
        .text-h6.mt-4.text-medium-emphasis 履歴がありません
        .text-body-2.text-medium-emphasis 番組生成が実行されると、ここに履歴が表示されます

    //- ローディング状態
    template(#loading)
      .text-center.py-8
        v-progress-circular(indeterminate color="primary" size="48")
        .text-body-2.mt-4.text-medium-emphasis 履歴を読み込み中...

  //- ページネーション
  v-card-actions.justify-center(v-if="totalCount > 0")
    v-pagination(
      v-model="currentPage"
      :length="totalPages"
      :total-visible="7"
      @update:model-value="changePage"
    )
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { computed, onMounted } from 'vue';
import { useDashboardFeeds } from '~/composables/dashboard/useDashboardFeeds';
import { useDashboardProgramGenerationHistory } from '~/composables/dashboard/useDashboardProgramGenerationHistory';

// コンポーザブル関数
const {
  isLoading,
  history,
  totalCount,
  currentPage,
  itemsPerPage,
  selectedFeedId,
  totalPages,
  fetchHistory,
  changePage,
  setFeedFilter,
  clearFilters,
  getStatusColor,
  getStatusText,
  formatDateTime,
  isProgramLinkEnabled,
  formatExpirationDate,
  getProgramExpiresAt,
} = useDashboardProgramGenerationHistory();

const { feeds } = useDashboardFeeds();

// テーブルヘッダー（記事数を最後に移動）
const headers = [
  {
    title: '実行日付',
    key: 'createdAt',
    sortable: false,
    width: '120px',
  },
  {
    title: 'フィード',
    key: 'feed',
    sortable: false,
    width: '200px',
  },
  {
    title: 'ステータス',
    key: 'status',
    sortable: false,
    width: '120px',
  },
  {
    title: '理由',
    key: 'reason',
    sortable: false,
    width: '200px',
  },
  {
    title: '番組',
    key: 'program',
    sortable: false,
  },
  {
    title: '記事数',
    key: 'postCount',
    sortable: false,
    width: '100px',
    align: 'end' as const,
  },
];

// フィルター表示判定（パーソナルフィードが2件以上の場合のみ表示）
const shouldShowFilter = computed(() => feeds.value.length >= 2);

// フィードオプション
const feedOptions = computed(() => {
  return feeds.value.map((feed) => ({
    id: feed.id,
    name: feed.name,
  }));
});

// ヘルパー関数
const getFeedName = (feed: unknown): string => {
  return (feed as { name?: string })?.name || '不明なフィード';
};

const getFeedId = (feed: unknown): string => {
  return (feed as { id?: string })?.id || '';
};

const getProgramId = (program: unknown): string => {
  return (program as { id?: string })?.id || '';
};

const getProgramTitle = (program: unknown): string => {
  return (program as { title?: string })?.title || '番組タイトル';
};

// 日付のみをフォーマット（時刻は除く）
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 理由を日本語表記に変換
const getReasonText = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    NOT_ENOUGH_POSTS: '記事数不足',
    NO_POSTS_FOUND: '記事が見つかりません',
    GENERATION_FAILED: '生成に失敗しました',
    INVALID_FEED_CONFIG: 'フィード設定が無効です',
    API_ERROR: 'API エラー',
    TIMEOUT: 'タイムアウト',
    UNKNOWN_ERROR: '不明なエラー',
    OTHER: 'その他エラー',
  };

  return reasonMap[reason] || reason;
};

// 初期化
onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
:deep(.v-data-table__wrapper) {
  border-radius: 0;
}

:deep(.v-data-table-header) {
  background-color: rgb(var(--v-theme-surface-variant));
}

:deep(.v-data-table-header th) {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
}

:deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
