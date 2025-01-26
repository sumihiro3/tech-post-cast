<template lang="pug">
//- Podcasts
v-card.mt-1.pt-1.pb-2(flat, width='100%', color='background')
  v-card-text.text-center.py-0.my-0
    .text-subtitle-1.font-weight-bold.text-grey-darken-1.mb-1
      | 各種 Podcast サービスでも配信中！
    div
      v-btn.text-none.text-subtitle-2.text-white.font-weight-bold.mr-2.mb-1.podcast-button(
        v-for='podcast in podcasts',
        :key='podcast.title',
        :href='podcast.link',
        color='secondary',
        flat,
        target='_blank'
        :prepend-icon='podcast.icon'
      ) {{ podcast.title }}
  </template>

<script lang="ts" setup>
import type { Podcast } from '@/types';

const app = useNuxtApp();
const podcasts = app.$config.public.podcastUrls as Podcast[];
</script>

<style lang="css" scoped>
.podcast-button:hover {
  text-decoration: none;
}
</style>
