<template lang="pug">
  v-card(flat, rounded='lg').ma-1.pa-1.pa-md-2.mb-4.mb-md-8.bg-white
    v-card-subtitle.text-caption.text-md-subtitle-2.font-weight-bold
      | {{ utcToJstDateString(program.createdAt) }} のヘッドライントピック
    v-card-text.text-subtitle-1.text-md-h6.font-weight-black
      a(:href='`/headline-topic-programs/${program.id}`')
        | {{ program.title }}
</template>

<script lang="ts" setup>
import type { HeadlineTopicProgramDto } from '@/api';
const { utcToJstDateString } = useDateUtil();

defineProps<{
  program: HeadlineTopicProgramDto;
}>();
</script>
