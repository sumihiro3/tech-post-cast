<template lang="pug">
v-card.mx-auto.pa-4.pa-md-8.ma-4.bg-blue-grey-lighten-4(
  flat,
  rounded='xl',
  :subtitle='program.createdAt'
)
  h1.mx-auto.mb-4.text-h5.font-weight-black
    a(:href='`/headline-topic-programs/${program.id}`')
      | {{ program.title }}
  audio(controls, :src='program.audioUrl')
</template>

<script lang="ts" setup>
import type { HeadlineTopicProgramDto } from '@/api';

const props = defineProps<{
  program: HeadlineTopicProgramDto;
}>();
//
</script>
