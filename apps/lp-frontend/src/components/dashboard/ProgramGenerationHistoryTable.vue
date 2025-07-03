<template lang="pug">
//- eslint-disable vue/valid-v-slot
v-card
  v-card-title.d-flex.align-center.justify-space-between
    .d-flex.align-center
      v-icon.me-2(:size="$vuetify.display.mobile ? 'default' : 'large'") mdi-history
      span.text-subtitle-1.text-sm-h6 パーソナルプログラム生成履歴

  //- フィルター（パーソナルフィードが2件以上の場合のみ表示）
  v-card-text.pa-2.pa-sm-3.pa-md-4(v-if="shouldShowFilter")
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
    //- 実行日付（月/日形式）
    template(#item.createdAt="{ item }")
      span.text-body-2 {{ formatDate(item.createdAt) }}

    //- フィード名（アイコンなし、編集画面へのリンク付き）
    template(#item.feed="{ item }")
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

    //- タイトル（アイコンなし、エラー・スキップ時は理由を括弧書きで表示）
    template(#item.program="{ item }")
      div(v-if="item.program && item.status === 'SUCCESS'")
        //- 有効期限内の場合はリンクを表示
        div(v-if="isProgramLinkEnabled(item.program)")
          v-btn(
            :to="`/app/programs/${getProgramId(item.program)}`"
            variant="text"
            size="default"
            color="primary"
            class="pa-0"
            style="min-width: auto; text-transform: none; font-size: 0.875rem;"
          ) {{ getProgramTitle(item.program) }}
        //- 期限切れの場合は赤字で「（期限切れ）」を表示
        div(v-else)
          span.text-error （期限切れ）
          span.text-body-2(style="color: rgba(0, 0, 0, 0.87);") {{ getProgramTitle(item.program) }}
      div(v-else-if="item.status === 'FAILED' || item.status === 'SKIPPED'")
        span.text-body-2 {{ getFailureDisplayText(item) }}
      span.text-disabled(v-else) -

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
import type { ProgramGenerationHistoryDto } from '~/api';
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

// テーブルヘッダー（失敗理由と記事数を削除、幅を調整）
const headers = [
  {
    title: '日付',
    key: 'createdAt',
    sortable: false,
    width: '80px',
  },
  {
    title: 'フィード',
    key: 'feed',
    sortable: false,
    width: '150px',
  },
  {
    title: '結果',
    key: 'status',
    sortable: false,
    width: '100px',
  },
  {
    title: 'タイトル',
    key: 'program',
    sortable: false,
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

// 日付を月/日形式でフォーマット
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  });
};

// 理由を日本語表記に変換
const getReasonText = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    NOT_ENOUGH_POSTS: '記事数不足',
    UPLOAD_ERROR: 'アップロードエラー',
    PERSISTENCE_ERROR: '永続化エラー',
    NO_ACTIVE_SUBSCRIPTION: 'サブスクリプションが有効ではありません',
    OTHER: 'その他エラー',
  };

  return reasonMap[reason] || reason;
};

// 失敗・スキップ時の表示テキストを生成
const getFailureDisplayText = (item: ProgramGenerationHistoryDto): string => {
  return item.reason ? `（${getReasonText(item.reason)}）` : '';
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
