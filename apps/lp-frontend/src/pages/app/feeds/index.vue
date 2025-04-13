<template lang="pug">
  v-container(class="max-width-container")
    v-row
      v-col(cols="12")
        h1.text-h4.mb-6
          | パーソナライズフィード設定（{{ feedsCount }}）
        v-row(v-if="feeds && feeds.length > 0" justify="center")
          v-col(v-for="feed in feeds" :key="feed.id" cols="12" md="6" lg="4")
            v-card(elevation="2" class="mb-4")
              v-card-title
                v-icon(left color="primary" class="mr-2") mdi-television-play
                | {{ feed.name }}
              //- v-card-text.text-h4.text-center 12
              v-card-actions
                v-spacer
                v-btn(
                  color="primary"
                  to="/app/feeds/edit"
                ) 編集
</template>

<script setup lang="ts">
import type { PersonalizedFeedDto } from '@/api';
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
  fetchUserFeeds();
});
</script>
