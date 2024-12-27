<template lang="pug">
div
  div(v-if='program')
    h1 Program {{ program?.id }}: {{ program?.title }}
      div {{ program }}
  v-btn(
    append-icon='mdi-account-circle',
    prepend-icon='mdi-check-circle',
    to='/'
  )
    template(v-slot:prepend)
      v-icon(color='success')
    | Go to homepage Button
    template(v-slot:append)
      v-icon(color='warning')
  div(v-if='error') {{ error }}
</template>

<script setup lang="ts">
import type { HeadlineTopicProgramDto } from '@/api';
import { useGetHeadlineTopicProgram } from '@/composables/headline-topic-programs/useGetHeadlineTopicProgram';

const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

const { data: program, error } = await useAsyncData<HeadlineTopicProgramDto>(
  `program:${programId}`,
  async () => {
    try {
      const app = useNuxtApp();
      // 指定されたIDの番組情報を取得
      const dto = await useGetHeadlineTopicProgram(app, programId);
      return { ...dto };
    } catch (error) {
      console.error(`番組 [${programId}] の取得に失敗しました。`, error);
      if (error instanceof Error) {
        console.error(error.message, error.stack);
      }
      throw error;
    }
  },
);
</script>
