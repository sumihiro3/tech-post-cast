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
    )
      v-icon.mr-2 {{ podcast.icon }}
      | {{ podcast.title }}
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
    )
      v-icon.mr-2 {{ thanks.icon }}
      | {{ thanks.title }}
  v-container.text-left.pl-10(cols='10')
    .text-center.mt-4.text-subtitle-2.text-md-subtitle-1.text-grey-darken-1
      | All rights are reserved &copy; {{ new Date().getFullYear() }}, TEP Lab
</template>

<script lang="ts" setup>
const podcasts = [
  {
    title: 'Spotify',
    icon: 'mdi-spotify',
    link: 'https://open.spotify.com/show/5RpulDOnvdqKdZc5rZ9jzD?si=c1qN4IknSVeLZYZRUGVz_A',
  },
  {
    title: 'Amazon Music',
    icon: 'mdi-music',
    link: 'https://music.amazon.co.jp/podcasts/edd04dca-b387-41a3-9bb2-fbd183f01f5d/techpostcast',
  },
  {
    title: 'Apple Music',
    icon: 'mdi-apple',
    link: 'https://podcasts.apple.com/us/podcast/tech-post-cast/id1790035669',
  },
  {
    title: 'YouTube',
    icon: 'mdi-youtube',
    link: 'https://www.youtube.com/playlist?list=PLtafUFEHRNL_yFrmYht9Bw1Sec2T8m2Sv',
  },
];
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
