<template lang="pug">
  v-container(class="max-width-container")
    v-row
      v-col(cols="12")
        FeedList(:feeds="feeds" :feeds-count="feedsCount")
</template>

<script setup lang="ts">
import type { PersonalizedFeedDto } from '@/api';
import FeedList from '@/components/feeds/FeedList.vue';
import { useGetPersonalizedFeeds } from '@/composables/feeds/useGetPersonalizedFeeds';
import { useUser } from '@clerk/vue';

const { user } = useUser();

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

const app = useNuxtApp();

// パーソナライズフィード一覧
const feeds = ref<PersonalizedFeedDto[]>([]);

// パーソナライズフィードの件数
const feedsCount = ref<number>(0);

/**
 * ログインユーザーのフィード設定一覧を取得する
 */
const fetchUserFeeds = async (): Promise<void> => {
  const result = await useGetPersonalizedFeeds(app, user.value!.id!);
  feeds.value = result.feeds;
  feedsCount.value = result.total;
};

useAsyncData(async () => {
  try {
    // プログレスサークルを表示
    progress.show({ text: 'パーソナライズフィードを取得中...' });
    // ユーザーのフィード設定一覧を取得
    await fetchUserFeeds();
  } catch (error) {
    // エラーハンドリング
    console.error('Error fetching user feeds:', error);
  } finally {
    // プログレスサークルを非表示
    progress.hide();
  }
});
</script>
