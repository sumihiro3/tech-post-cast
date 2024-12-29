<template lang="pug">
div
  div(v-if='program')
    h1 {{ program?.title }}
    div
      ul(v-for='(post, index) in program.posts', :key='index')
        li {{ post.title }}
        li {{ post.authorName }}
    div {{ program.script.intro }}
      ul
        li(v-for='(post, index) in program.script.posts', :key='index')
          span {{ post.summary }}
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
</template>

<script setup lang="ts">
import type { HeadlineTopicProgramDto } from '@/api';
import { useGetHeadlineTopicProgram } from '@/composables/headline-topic-programs/useGetHeadlineTopicProgram';

const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

const { data: program } = await useAsyncData<HeadlineTopicProgramDto>(
  `headline-topic-program:${programId}`,
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
      throw showError({
        message: `指定のページが存在しません`,
        statusCode: 404,
        fatal: true,
      });
    }
  },
);
</script>
