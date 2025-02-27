<template lang="pug">
v-card.mt-0.pt-0(flat, width='100%', color='background')
  v-card-text.text-center.pb-1
    v-avatar(
      image='@/assets/logo_green.png',
      :size='mobile ? 80 : 160',
      :alt='siteName'
    )
    h1.text-h6.text-md-h4.font-weight-bold.mt-2.mb-4
      | 話題のQiita記事をAIラジオで毎日配信
    .text-body-1.text-md-subtitle-1.text-grey-darken-2.mb-1
      | 毎朝7時に最新エピソードをお届け！
      br
      | AIのMC「ポステル」がQiitaの人気記事を10分でわかりやすく解説します
      br
      b
        a(
          :href="listenerLetterFormUrl" target="_blank") 📮番組へのお便り📮
      | もお待ちしています！
//- Podcasts
Podcast
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';

const app = useNuxtApp();
const { mobile } = useDisplay();
const siteName = app.$config.public.siteName;
const listenerLetterFormUrl = app.$config.public.listenerLetterFormUrl as string;
</script>
