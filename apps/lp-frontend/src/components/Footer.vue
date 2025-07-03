<template lang="pug">
v-footer(width='100%')
  v-card(flat width='100%' tile)
    v-container.text-center(cols='12')
      .d-inline-block
        logo
    //- Podcasts
    v-container.text-left.pl-6(cols='6')
      .text-subtitle-1.font-weight-bold.text-grey-darken-1
        | Podcast
      v-btn.text-none.text-subtitle-2.text-grey-darken-1.footer-button(
        v-for='podcast in podcasts',
        :key='podcast.title',
        :href='podcast.link',
        flat,
        target='_blank'
        :prepend-icon='podcast.icon'
      ) {{ podcast.title }}
    //- お便りフォーム
    v-container.text-left.pl-6(cols='6')
      .text-subtitle-1.font-weight-bold.text-grey-darken-1
        | 番組にお便りを送る
      v-btn.text-none.text-subtitle-2.text-grey-darken-1.footer-button(
        :href='listenerLetterFormUrl',
        target='_blank'
        flat,
        prepend-icon='mdi-email'
      ) お便りフォーム（LINE 公式アカウント）
    //- SNS
    v-container.text-left.pl-6(cols='6')
      .text-subtitle-1.font-weight-bold.text-grey-darken-1
        | SNS
      v-btn.text-none.text-subtitle-2.text-grey-darken-1.footer-button(
        v-for='sns in snsList',
        :key='sns.title',
        :href='sns.link',
        flat,
        target='_blank'
        :prepend-icon='sns.icon'
      ) {{ sns.title }}
    //- Special Thanks
    v-container.text-left.pl-6(cols='6')
      .text-subtitle-1.font-weight-bold.text-grey-darken-1
        | Special Thanks
      v-btn.text-none.text-subtitle-2.text-grey-darken-1.footer-button(
        v-for='thanks in specialThanks',
        :key='thanks.title',
        :href='thanks.link',
        flat,
        target='_blank'
        :prepend-icon='thanks.icon'
      ) {{ thanks.title }}
    //- 開発・運営
    v-container.text-left.pl-6(cols='6')
      .text-subtitle-1.font-weight-bold.text-grey-darken-1
        | 開発・運営
      v-btn.text-none.text-subtitle-2.text-grey-darken-1.footer-button(
        href='https://x.com/sumihiro3',
        flat,
        target='_blank'
        prepend-icon='mdi-web'
      ) TEP Lab & @sumihiro3
    //- 注意事項
    v-container.text-center(cols='12')
      .d-inline-block
      span.text-body-2.text-md-body-1.font-weight-medium.text-grey-darken-2
        | ※ AIがラジオ番組の台本生成や発声しているため、内容は間違っている可能性があります
    //- Copy Right
    v-container.text-left.pl-10(cols='10')
      .text-center.mt-4.text-subtitle-2.text-md-subtitle-1.text-grey-darken-1
        | All rights are reserved &copy; {{ new Date().getFullYear() }}, TEP Lab
</template>

<script lang="ts" setup>
import type { Podcast, Sns } from '@/types';

const app = useNuxtApp();
const podcasts = app.$config.public.podcastUrls as Podcast[];
const listenerLetterFormUrl = app.$config.public.listenerLetterFormUrl as string;
const snsList = app.$config.public.snsUrls as Sns[];
const specialThanks = [
  {
    title: 'BGM：MusMus',
    icon: 'mdi-music-box',
    link: 'https://musmus.main.jp',
  },
  {
    title: 'BGM：OtoLogic(CC BY 4.0)',
    icon: 'mdi-music-box-outline',
    link: 'https://otologic.jp',
  },
];
</script>

<style lang="css" scoped>
.footer-button:hover {
  text-decoration: none;
}
</style>
