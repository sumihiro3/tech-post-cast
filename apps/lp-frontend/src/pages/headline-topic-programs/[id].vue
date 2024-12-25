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
import useGetHeadlineTopicProgram from '@/composables/headline-topic-programs/useGetHeadlineTopicProgram';

definePageMeta({
  // validate: async (route) => {
  //   const id = Number(route.params.id);
  //   // Check if the id is made up of digits
  //   return !(id > 100);
  // },
});
const { $apiV1, $config } = useNuxtApp();
const apiAccessToken = $config.public.apiAccessToken;
const route = useRoute();
const { id } = route.params;
const programId = Array.isArray(id) ? id[0] : id;

const { data: program, error } = await useAsyncData<HeadlineTopicProgramDto>(
  `program:${programId}`,
  async () => {
    // 指定されたIDの番組情報を取得
    const dto = await useGetHeadlineTopicProgram(programId);
    return {
      id: programId,
      title: dto.title!,
    };
  },
);
</script>
