<template lang="pug">
v-card(elevation="2" class="mb-4")
  v-card-title
    v-icon(left color="primary" class="mr-2") mdi-television-play
    | {{ feed.name }}
  v-card-actions
    v-spacer
    v-btn(
      color="primary"
      :to="`/app/feeds/${feed.id}/edit`"
    ) 編集
</template>

<script setup lang="ts">
import type { PersonalizedFeedDto } from '@/api';

defineProps<{
  feed: PersonalizedFeedDto;
}>();
</script>
