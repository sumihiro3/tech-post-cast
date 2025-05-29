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
import { useUIState } from '@/composables/useUIState';
import { useUser } from '@clerk/vue';

const { user } = useUser();

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

// UI状態管理
const ui = useUIState();

const app = useNuxtApp();

/**
 * パーソナライズフィード一覧
 * APIから取得したフィード情報を格納する
 */
const feeds = ref<PersonalizedFeedDto[]>([]);

/**
 * パーソナライズフィードの総件数
 * ページネーションや表示に使用する
 */
const feedsCount = ref<number>(0);

/**
 * ログインユーザーのフィード設定一覧を取得する
 * ユーザーIDを指定して関連するフィードをAPIから取得する
 * @returns {Promise<void>}
 */
const fetchUserFeeds = async (): Promise<void> => {
  const result = await useGetPersonalizedFeeds(app, user.value!.id!);
  feeds.value = result.feeds;
  feedsCount.value = result.total;
};

/**
 * 初期表示時にAPIからフィード設定一覧を取得する
 */
useAsyncData(async () => {
  try {
    // プログレスサークルを表示
    ui.showLoading({ message: 'パーソナライズフィードを取得中...' });
    // ユーザーのフィード設定一覧を取得
    await fetchUserFeeds();
  } catch (error) {
    // エラーハンドリング
    console.error('Error fetching user feeds:', error);
    ui.showError('フィードの取得に失敗しました');
  } finally {
    // プログレスサークルを非表示
    ui.hideLoading();
  }
});
</script>
