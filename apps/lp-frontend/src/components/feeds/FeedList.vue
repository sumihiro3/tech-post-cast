<template lang="pug">
div
  h1.text-h4.mb-6
    | パーソナライズフィード設定（{{ feedsCount }}）
  //- 新規フィード作成ボタン
  v-row.mb-6
    v-spacer
    v-btn(
      color="primary"
      to="/app/feeds/create"
    ) 新規フィード作成
  v-row(v-if="feeds && feeds.length > 0" justify="center")
    v-col(v-for="feed in feeds" :key="feed.id" cols="12" md="6" lg="4")
      FeedCard(:feed="feed")
  div(v-else class="text-center pa-4")
    p.text-body-1 パーソナライズフィードがありません。新規作成ボタンから作成してください。
</template>

<script setup lang="ts">
import type { PersonalizedFeedDto } from '@/api';
import FeedCard from '@/components/feeds/FeedCard.vue';

defineProps<{
  feeds: PersonalizedFeedDto[];
  feedsCount: number;
}>();
</script>
