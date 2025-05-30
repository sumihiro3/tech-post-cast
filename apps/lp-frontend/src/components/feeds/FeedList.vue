<template lang="pug">
div
  //- ヘッダー部分
  .d-flex.align-center.justify-space-between.mb-6
    .d-flex.align-center
      h1.text-h4.mr-4 パーソナライズフィード設定
      v-chip(
        color="primary"
        variant="tonal"
        size="small"
      )
        v-icon(start size="x-small") mdi-counter
        | {{ feedsCount }}件

    //- 新規フィード作成ボタン
    v-btn(
      color="primary"
      variant="elevated"
      size="large"
      to="/app/feeds/create"
      prepend-icon="mdi-plus"
    ) 新規フィード作成

  //- フィード一覧
  div(v-if="feeds && feeds.length > 0")
    v-row(justify="start")
      v-col(
        v-for="feed in feeds"
        :key="feed.id"
        cols="12"
        sm="6"
        lg="4"
        xl="3"
      )
        FeedCard(:feed="feed")

  //- 空状態
  div(v-else)
    v-card.text-center.pa-8(variant="outlined")
      v-icon.mb-4(size="64" color="grey-lighten-1") mdi-television-off
      .text-h6.mb-2.text-medium-emphasis パーソナライズフィードがありません
      .text-body-2.mb-4.text-medium-emphasis
        | 新規作成ボタンから最初のフィードを作成してください。
        br
        | フィードを作成すると、指定した条件に基づいて自動的に記事が収集され、
        br
        | パーソナライズされた番組が生成されます。
      v-btn(
        color="primary"
        variant="elevated"
        to="/app/feeds/create"
        prepend-icon="mdi-plus"
      ) 最初のフィードを作成
</template>

<script setup lang="ts">
import type { PersonalizedFeedWithFiltersDto } from '@/api';
import FeedCard from '@/components/feeds/FeedCard.vue';

defineProps<{
  feeds: PersonalizedFeedWithFiltersDto[];
  feedsCount: number;
}>();
</script>

<style scoped>
/* カードのホバー効果を統一 */
:deep(.feed-card) {
  height: 100%;
}

/* レスポンシブ対応 */
@media (max-width: 600px) {
  .d-flex.align-center.justify-space-between {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .d-flex.align-center.mr-4 {
    justify-content: center;
  }
}
</style>
