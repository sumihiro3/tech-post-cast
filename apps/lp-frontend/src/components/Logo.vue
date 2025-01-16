<template lang="pug">
span
  v-img(
    :width='mobile ? 200 : 260',
    src='@/assets/title_light.png',
    :alt='siteName'
  )
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';

const app = useNuxtApp();
const { mobile } = useDisplay();
const siteName = app.$config.public.siteName;
</script>
