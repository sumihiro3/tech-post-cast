<template lang="pug">
div(align='center', style='bg-color: #ffffff') 
  v-avatar(
    image='@/assets/logo_green.png',
    :size='mobile ? 80 : 160',
    alt='TechPostCast'
  )
  h1.text-h6.text-md-h4.font-weight-bold.mt-2.mb-4
    | Qiita人気記事をAIラジオで毎日お届け
  .text-body-1.text-md-subtitle-1.text-grey-darken-2.mb-4
    | Qiitaの人気記事をAIが10分程度で解説するラジオ番組を配信しています。
    br
    | 毎朝7時に最新の番組をお届けします。
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';

const { mobile } = useDisplay();
</script>
