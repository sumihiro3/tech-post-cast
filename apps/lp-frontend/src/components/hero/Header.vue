<template lang="pug">
v-card.mt-0.pt-0(flat, width='100%', color='background')
  v-card-text.text-center.pb-1
    v-avatar(
      image='@/assets/logo_green.png',
      :size='mobile ? 80 : 160',
      :alt='siteName'
    )
    h1.text-h6.text-md-h4.font-weight-bold.mt-2.mb-4
      | Qiita人気記事をAIラジオで毎日お届け
    .text-body-1.text-md-subtitle-1.text-grey-darken-2.mb-1
      | Qiitaの人気記事をAIが10分程度で解説するラジオ番組を配信しています。
      br
      | 毎朝7時に最新の番組をお届けします。
//- Podcasts
Podcast
</template>

<script lang="ts" setup>
import type { Podcast } from '@/types';
import { useDisplay } from 'vuetify';

const app = useNuxtApp();
const { mobile } = useDisplay();
const siteName = app.$config.public.siteName;
const podcasts = app.$config.public.podcastUrls as Podcast[];
</script>
