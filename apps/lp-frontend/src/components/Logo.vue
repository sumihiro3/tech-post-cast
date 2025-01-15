<template lang="pug">
span
  v-img(
    :width='mobile ? 200 : 260',
    src='@/assets/title_light.png',
    alt='TechPostCast'
  )
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';

const { mobile } = useDisplay();
</script>
