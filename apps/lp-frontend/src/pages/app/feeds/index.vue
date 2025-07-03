<template lang="pug">
  v-container(class="max-width-container")
    v-row
      v-col(cols="12")
        //- ローディング状態
        div(v-if="isLoading")
          .d-flex.align-center.justify-space-between.mb-6
            .d-flex.align-center
              v-skeleton-loader(type="heading" width="300")
              v-skeleton-loader.ml-4(type="chip" width="60")
            v-skeleton-loader(type="button" width="150")

          v-row(justify="start")
            v-col(
              v-for="n in 6"
              :key="n"
              cols="12"
              sm="6"
              lg="4"
              xl="3"
            )
              v-skeleton-loader(type="card" height="280")

        //- データ表示
        FeedList(
          v-else
          :feeds="feeds"
          :feeds-count="feedsCount"
        )
</template>

<script setup lang="ts">
import type { PersonalizedFeedWithFiltersDto } from '@/api';
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
const feeds = ref<PersonalizedFeedWithFiltersDto[]>([]);

/**
 * パーソナライズフィードの総件数
 * ページネーションや表示に使用する
 */
const feedsCount = ref<number>(0);

/**
 * ローディング状態
 * データ取得中はtrueとなる
 */
const isLoading = ref<boolean>(true);

/**
 * ログインユーザーのフィード設定一覧を取得する
 * ユーザーIDを指定して関連するフィードをAPIから取得する
 * @returns {Promise<void>}
 */
const fetchUserFeeds = async (): Promise<void> => {
  // フィルター情報付きでフィードを取得
  const result = await useGetPersonalizedFeeds(app, user.value!.id!);
  feeds.value = result.feeds;
  feedsCount.value = result.total;

  // デバッグ: 実際のAPIレスポンス構造を確認
  if (import.meta.dev && result.feeds.length > 0) {
    console.log('=== Feed API Response Debug ===');
    console.log('First feed:', result.feeds[0]);
    console.log('FilterConfig structure:', result.feeds[0].filterConfig);
    console.log('FilterConfig type:', typeof result.feeds[0].filterConfig);
    console.log('FilterConfig keys:', Object.keys(result.feeds[0].filterConfig || {}));
    // フィルター情報付きの場合はfilterGroupsも確認
    if (result.feeds[0].filterGroups) {
      console.log('FilterGroups:', result.feeds[0].filterGroups);
    }
    console.log('===============================');
  }
};

/**
 * 初期表示時にAPIからフィード設定一覧を取得する
 */
useAsyncData(async () => {
  try {
    // ローディング状態を開始
    isLoading.value = true;
    // ユーザーのフィード設定一覧を取得
    await fetchUserFeeds();
  } catch (error) {
    // エラーハンドリング
    console.error('Error fetching user feeds:', error);
    ui.showError('フィードの取得に失敗しました');
  } finally {
    // ローディング状態を終了
    isLoading.value = false;
  }
});
</script>
