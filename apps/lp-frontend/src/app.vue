<template lang="pug">
div
  // 既存のレイアウト
  NuxtLayout
    NuxtPage

  // アプリ全体で共有するSnackbar
  ClientOnly
    AppSnackbar

  // アプリ全体で共有するプログレスサークル
  ClientOnly
    AppProgress
</template>

<script setup lang="ts">
import AppProgress from '@/components/common/AppProgress.vue';
import AppSnackbar from '@/components/common/AppSnackbar.vue';
</script>
