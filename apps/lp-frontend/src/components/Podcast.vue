<template lang="pug">
//- Podcasts
v-card.mt-1.pt-1.pb-2(flat, width='100%', color='background')
  v-card-text.text-center.py-0.my-0
    .text-subtitle-1.font-weight-bold.text-grey-darken-1.mb-1
      | 各種 Podcast サービスで配信中！
    div
      v-btn.text-none.text-subtitle-2.text-grey-darken-1.footer-button(
        v-for='podcast in podcasts',
        :key='podcast.title',
        :href='podcast.link',
        color='background',
        flat,
        target='_blank'
      )
        v-icon.mr-2 {{ podcast.icon }}
        | {{ podcast.title }}
  </template>


<script lang="ts" setup>
import type { Podcast } from '@/types';

const app = useNuxtApp();
const podcasts = app.$config.public.podcastUrls as Podcast[];
</script>
