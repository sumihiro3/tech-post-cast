<template lang="pug">
v-card.feed-list-card(elevation="2")
  v-card-title.d-flex.align-center.justify-space-between
    .d-flex.align-center
      v-icon.mr-2(color="primary") mdi-rss
      span パーソナルフィード
    v-chip(
      v-if="feeds.length > 0"
      color="primary"
      variant="flat"
      size="small"
    ) {{ feeds.length }}件

  v-card-text
    // ローディング状態
    v-skeleton-loader(
      v-if="loading && feeds.length === 0"
      type="list-item-avatar-two-line, divider, list-item-avatar-two-line, divider, list-item-avatar-two-line"
    )

    // エラー状態
    v-alert(
      v-else-if="error"
      type="error"
      variant="tonal"
      :text="error.message"
    )

    // フィード一覧表示
    div(v-else-if="feeds.length > 0")
      v-list.bg-transparent(density="compact")
        template(v-for="(feed, index) in feeds" :key="feed.id")
          v-list-item(
            :title="feed.name"
            :subtitle="formatFeedSubtitle(feed)"
            class="feed-item"
            @click="handleFeedClick(feed)"
          )
            template(#prepend)
              v-avatar(
                :color="feed.isActive ? 'success' : 'grey'"
                size="40"
              )
                v-icon(
                  :icon="feed.isActive ? 'mdi-rss' : 'mdi-rss-off'"
                  color="white"
                )

            template(#append)
              v-chip(
                :color="feed.isActive ? 'success' : 'grey'"
                variant="flat"
                size="x-small"
              ) {{ feed.isActive ? 'アクティブ' : '停止中' }}

          v-divider(v-if="index < feeds.length - 1")

    // データなし状態
    v-alert(
      v-else
      type="info"
      variant="tonal"
      text="まだパーソナルフィードが作成されていません。"
    )
      template(#append)
        v-btn(
          color="primary"
          variant="elevated"
          size="small"
          @click="handleCreateFeed"
        )
          v-icon.mr-2 mdi-plus
          | フィード作成

  // カードアクション
  v-card-actions(v-if="feeds.length > 0")
    v-spacer
    v-btn(
      color="primary"
      variant="text"
      @click="handleViewAll"
    )
      | パーソナルフィード設定
      v-icon.ml-2 mdi-rss
</template>

<script setup lang="ts">
import type { PersonalizedFeedWithFiltersDto } from '@/api';

interface Props {
  feeds: PersonalizedFeedWithFiltersDto[];
  loading: boolean;
  error: Error | null;
}

defineProps<Props>();

// フィードのサブタイトルをフォーマット
const formatFeedSubtitle = (feed: PersonalizedFeedWithFiltersDto): string => {
  const parts: string[] = [];

  // タグ数を計算
  const tagCount =
    feed.filterGroups?.reduce((sum: number, group: { tagFilters?: unknown[] }) => {
      return sum + (group.tagFilters?.length || 0);
    }, 0) || 0;

  if (tagCount > 0) {
    parts.push(`${tagCount}個のタグ`);
  }

  // 配信頻度（仮）
  parts.push('日次配信');

  return parts.join(' • ');
};

// フィードクリック処理
const handleFeedClick = (feed: PersonalizedFeedWithFiltersDto): void => {
  console.log('フィード編集画面へ遷移:', feed.id);
  navigateTo(`/app/feeds/${feed.id}/edit`);
};

// フィード作成処理
const handleCreateFeed = (): void => {
  console.log('フィード作成ページへ遷移');
  navigateTo('/app/feeds/create');
};

// すべて表示処理
const handleViewAll = (): void => {
  console.log('フィード管理ページへ遷移');
  navigateTo('/app/feeds');
};
</script>

<style scoped>
.feed-list-card {
  /* height: 100%を削除してコンテンツに応じた高さにする */
}

.feed-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.feed-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
</style>
