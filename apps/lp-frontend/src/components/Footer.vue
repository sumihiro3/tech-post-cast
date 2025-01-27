<template lang="pug">
v-card.mt-6(flat, width='100%')
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
  v-container.text-left.pl-10(cols='10')
    .text-center.mt-4.text-subtitle-2.text-md-subtitle-1.text-grey-darken-1
      | All rights are reserved &copy; {{ new Date().getFullYear() }}, TEP Lab
</template>

<script lang="ts" setup>
import type { Podcast, Sns } from '@/types';

const app = useNuxtApp();
const podcasts = app.$config.public.podcastUrls as Podcast[];
const snsList = app.$config.public.snsUrls as Sns[];
const specialThanks = [
  {
    title: 'BGM：MusMus',
    icon: 'mdi-music-box',
    link: 'https://musmus.main.jp',
  },
];
</script>

<style lang="css" scoped>
.footer-button:hover {
  text-decoration: none;
}
</style>
